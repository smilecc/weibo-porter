import { Builder } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import { getServices } from './services';
import { DownloaderUtil } from './utils/Downloader';
import * as fs from 'fs';
import { Config } from './config';

const CookiesCachePath = './cache/weibo.json';

export async function main() {
  // 构建浏览器驱动器
  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options().headless())
    .build();
  // 构建本地服务
  const services = getServices(driver);

  // 接收程序退出的信号来关闭浏览器
  process.on('SIGINT', () => {
    driver.quit();
    process.exit();
  });

  try {
    // 尝试加载 cookies
    await services.weiboService.loadCookies(CookiesCachePath);
    let isLogged = await services.weiboService.isLogged();
    // 判断是否需要登录
    if (!isLogged) {
      console.log('Start login.')
      await services.weiboService.login(Config.weibo.account, Config.weibo.password, CookiesCachePath)
    }

    // 开始监听动态
    services.bilibiliService.startListenDynamic(81976, async (dynamic) => {
      // 处理动态的图片
      let localImgList: string[] = [];
      // 如果是转发 则把原博截图
      if (dynamic.hasOrigin && dynamic.imgs.length < 9) {
        localImgList.push(await services.bilibiliService.takeScreenshot(dynamic));
      }
      // 处理图片列表
      for (const img of dynamic.imgs) {
        const localImg = await DownloaderUtil.download(img.src);
        localImgList.push(localImg);
      }
      // 发送微博
      await services.weiboService.sendPost(dynamic.content, localImgList);
      // 删除temp中的在本次使用到的图片
      for (const imgPath of localImgList) {
        fs.unlinkSync(imgPath);
      }
      // 防抖
      await driver.sleep(20 * 1000);
    });
  } finally {
    // driver.quit();
  }
}
