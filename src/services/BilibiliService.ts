import { Service } from './Service';
import axios from 'axios';
import { RedisUtil } from '../utils/Redis';

export class BilibiliService extends Service {
  public startListenDynamic(uid: number, newDynamicHandler: DynamicHandler) {
    setInterval(() => {
      this.getDynamics(uid, newDynamicHandler);
    }, 10 * 1000)
  }

  public async getDynamics(uid: number, newDynamicHandler: DynamicHandler): Promise<void> {
    let response = await axios.get(`https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/space_history?visitor_uid=927290&host_uid=${uid}`);
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
            id: `text_${dynamic.item.rp_id}`,
            title: '',
            content: dynamic.item.content,
            imgs: [],
            timestamp: dynamic.item.timestamp,
          })
        } else if ('description' in dynamic.item) {
          dynamicList.push({
            type: DynamicTypes.Article,
            id: `article_${dynamic.item.id}`,
            title: dynamic.item.title,
            content: dynamic.item.description,
            imgs: dynamic.item.pictures ? dynamic.item.pictures.map((pic) => ({ src: pic.img_src })) : [],
            timestamp: dynamic.item.upload_time,
          })
        }
      }
      
      const redisClient = await RedisUtil.getRedis();

      // 分析是否有新动态
      for (const dynamic of dynamicList) {
        const redisSetKey: string = `bBo_${uid}`;
        const idCount = await redisClient.sismember(redisSetKey, dynamic.id);
        if (idCount === 0) {
          console.log(dynamic.content);
          await newDynamicHandler(dynamic);
          await redisClient.sadd(redisSetKey, dynamic.id);
          await this.getDriver().sleep(1000);
        }
      }
      redisClient.close();
    }
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
        dynamic_id: number;
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
  title: string;
  content: string;
  imgs: {
    src: string;
  }[];
  timestamp: number;
}

type DynamicHandler = (dynamic: ILocalDynamic) => Promise<any>;
