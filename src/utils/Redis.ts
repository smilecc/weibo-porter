import { Tedis, TedisPool } from 'tedis';

export class RedisUtil {
  public static _pool: TedisPool = new TedisPool({
    port: 6379,
    host: "127.0.0.1"
  });

  public static getRedis(): Promise<Tedis> {
    return this._pool.getTedis();
  }
}
