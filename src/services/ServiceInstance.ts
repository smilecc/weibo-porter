import { WebDriver } from "selenium-webdriver";
import { BilibiliService } from './BilibiliService';
import { WeiboService } from './WeiboService';
import * as fs from 'fs';

export class ServiceInstance {
  private _weiboService: WeiboService;
  private _bilibiliService: BilibiliService;
  constructor(driver: WebDriver) {
    this._weiboService = new WeiboService(driver);
    this._bilibiliService = new BilibiliService(driver);
  }
  public get weiboService(): WeiboService {
    return this._weiboService;
  }
  public get bilibiliService(): BilibiliService {
    return this._bilibiliService;
  }

  public init() {
    // fs.existsSync('./cache/init.json');
  }
}
