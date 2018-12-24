import { Service } from './Service';
import * as chrome from 'selenium-webdriver/chrome';
import axios from 'axios';
import { RedisUtil } from '../utils/Redis';
import { Builder, until, By } from 'selenium-webdriver';
import * as fs from 'fs';
import { DownloaderUtil } from '../utils/Downloader';
import { Config } from '../config';


export class BilibiliService extends Service {
  /**
   * 开始监听用户动态
   * @param uid 要监听的用户ID
   * @param newDynamicHandler 当监听到新动态时的处理器
   */
  public async startListenDynamic(uid: number, newDynamicHandler: DynamicHandler) {
    await this.removeLock();
    setInterval(async () => {
      if (await this.checkLock()) {
        return;
      }
      await this.createLock();
      this.printLog('正在检查动态');
      try {
        await this.getDynamics(uid, newDynamicHandler);
        this.printLog('动态完毕');
      } catch (error) {
        this.printLog('出现异常：' + error.message);
      }
      await this.removeLock();
    }, Config.bilibili.checkCycle * 1000)
  }

  public async getDynamics(uid: number, newDynamicHandler: DynamicHandler): Promise<void> {
    let response = await axios.get(`https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/space_history?visitor_uid=927290&host_uid=${uid}`, {
      transformResponse: (data) => {
        return JSON.parse((data as string).replace(/"dynamic_id":(\d+?),/g, (content) => {
          return content.replace(/([\d]+)/g, (id) => `"${id}"`);
        }));
      },
      responseType: 'json',
      proxy: {
        host: '121.40.138.161',
        port: 8000,
      }
    });
    let responseData: IBilibiliDynamicResponse = response.data;
    let dynamicList: ILocalDynamic[] = [];

    if (responseData.code === 0) {
      // 将动态push进列表
      for (const card of responseData.data.cards.reverse()) {
        // console.log(card)
        const dynamic: IBilibiliDynamic = JSON.parse(card.card);
        // 判断动态类型 并处理为本地动态类型
        if ('content' in dynamic.item) {
          dynamicList.push({
            type: DynamicTypes.Text,
            id: `text_${card.desc.dynamic_id}`,
            dynamicId: card.desc.dynamic_id,
            title: '',
            content: dynamic.item.content,
            imgs: [],
            timestamp: card.desc.timestamp,
            hasOrigin: 'origin' in dynamic,
          })
        } else if ('description' in dynamic.item) {
          dynamicList.push({
            type: DynamicTypes.Article,
            id: `article_${card.desc.dynamic_id}`,
            dynamicId: card.desc.dynamic_id,
            title: dynamic.item.title,
            content: dynamic.item.description,
            imgs: dynamic.item.pictures ? dynamic.item.pictures.map((pic) => ({ src: pic.img_src })) : [],
            timestamp: card.desc.timestamp,
            hasOrigin: false,
          })
        }
      }

      const redisClient = await RedisUtil.getRedis();

      // 分析是否有新动态
      for (const dynamic of dynamicList) {
        const redisSetKey: string = `bBo_${uid}`;
        const idCount = await redisClient.sismember(redisSetKey, dynamic.id);
        if (dynamic.timestamp > Config.bilibili.beforeTimestamp && idCount === 0) {
          this.printLog(`新动态：${dynamic.content}`);
          await newDynamicHandler(dynamic);
          await redisClient.sadd(redisSetKey, dynamic.id);
          await this.getDriver().sleep(1000);
        }
      }
      redisClient.close();
    }
  }

  public async takeScreenshot(dynamic: ILocalDynamic): Promise<string> {
    const driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(new chrome.Options().headless().addArguments('window-size=1980,1080'))
      .build();
    await driver.get(`https://t.bilibili.com/${dynamic.dynamicId}`);
    await driver.wait(until.elementLocated(By.className('main-content')));
    await driver.sleep(2 * 1000);

    await driver.executeScript(`
      var forwAreaList = document.getElementsByClassName('forw-area');
      if (forwAreaList.length > 0) {
        forwAreaList[0].remove();
      }
    `);
    await driver.sleep(500);
    const imgData = await driver.findElement(By.className('detail-card')).takeScreenshot(true);
    const savePath = `${DownloaderUtil.getTempPath()}/screenshot_${dynamic.id}.png`;
    await fs.writeFileSync(savePath, imgData, 'base64');
    await driver.quit();
    return savePath;
  }

  protected async checkLock(): Promise<boolean> {
    const redisClient = await RedisUtil.getRedis();
    const lockCount = await redisClient.exists('dynamic_lock');
    redisClient.close();
    return lockCount === 1;
  }

  protected async createLock() {
    const redisClient = await RedisUtil.getRedis();
    redisClient.set('dynamic_lock', '1');
    redisClient.close();
  }

  protected async removeLock() {
    const redisClient = await RedisUtil.getRedis();
    redisClient.del('dynamic_lock');
    redisClient.close();
  }

  protected printLog(log: string | number) {
    console.log(`[${(new Date()).toLocaleString('cn')}] ${log}`);
  }
}

export interface IBilibiliDynamicResponse {
  code: number;
  msg: string;
  message: string;
  data: {
    has_more: number;
    cards: {
      desc: {
        uid: number;
        dynamic_id: string;
        timestamp: number;
      },
      card: string;
    }[]
  }
}

export interface IBilibiliDynamic {
  item: {
    id?: number;
    rp_id?: number;
    title?: string;
    description?: string;
    content?: string;
    pictures?: {
      img_src: string;
    }[],
    upload_time: number;
    timestamp: number;
  },
  origin?: string;
}

export enum DynamicTypes {
  Article,
  Text,
}

export interface ILocalDynamic {
  type: DynamicTypes;
  id: string;
  dynamicId: string;
  title: string;
  content: string;
  imgs: {
    src: string;
  }[];
  timestamp: number;
  hasOrigin: boolean;
}

type DynamicHandler = (dynamic: ILocalDynamic) => Promise<any>;
