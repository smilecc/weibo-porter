import * as fs from 'fs';
import axios from 'axios';
import { WebDriver, By, until } from 'selenium-webdriver';
import { RedisUtil } from './Redis';

export class ProxyUtil {

  public static RedisBlockedSet: string = 'bilibili_blocked_proxy';
  public static RedisProxySet: string = 'proxies';
  public static RedisProxyCreatedTime: string = 'proxies_created_time';

  public static async getHttpProxy(driver: WebDriver, forceReload: boolean = false): Promise<IProxy> {

    const redisClient = await RedisUtil.getRedis();

    // 判断上次加载代理的时间
    const lastLoaded = await redisClient.get(this.RedisProxyCreatedTime) as number;
    if (forceReload || (lastLoaded && lastLoaded - (new Date()).getTime() > 43200 * 1000)) {
      await this.getNewProxy(driver);
    }

    // 开始获取代理
    let proxy: IProxy = null;

    while (await redisClient.scard(this.RedisProxySet) > 0) {
      // 检查IP是否可用
      const unchekedProxy: IProxy = JSON.parse(await redisClient.spop(this.RedisProxySet));
      if (await redisClient.sismember(this.RedisBlockedSet, unchekedProxy.ip)) {
        continue;
      }
      // 确认IP可用
      proxy = unchekedProxy;
      break;
    }

    // 如果没有获取到 则重新加载一次代理列表
    if (proxy === null) {
      // 如果已经是强制刷新则抛出失败异常
      if (forceReload) {
        throw new Error('没有获取到可用的代理');
      }
      proxy = await this.getHttpProxy(driver, true);
    }

    redisClient.close();
    return proxy;
  }

  /**
   * 获取一批新的代理
   * @param driver WebDriver
   */
  protected static async getNewProxy(driver: WebDriver): Promise<void> {
    await driver.get(`https://www.xicidaili.com/nn/${Math.ceil(Math.random() * 10)}`);
    const ipListTable = await driver.wait(until.elementLocated(By.id('ip_list')));
    const trList = await ipListTable.findElements(By.tagName('tr'));
    const trListLength = trList.length;

    const redisClient = await RedisUtil.getRedis();
    for (let i = 0; i < trListLength - 1; i++) {
      const tr = trList.pop();
      const tdList = await tr.findElements(By.tagName('td'));
      let ip = await tdList[1].getText();
      let port = await tdList[2].getText();

      redisClient.sadd(this.RedisProxySet, JSON.stringify({
        ip: ip.trim(),
        port: parseInt(port),
      }));
    }
    redisClient.set(this.RedisProxyCreatedTime, (new Date()).getTime().toString());
    redisClient.close();
  }
}

export interface IProxy {
  ip: string;
  port: number;
}

export interface IProxyCache {
  createdTime: number;
  proxyList: IProxy[];
}
