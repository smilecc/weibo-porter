import { Builder } from 'selenium-webdriver';
import { getServices } from './services';

const CookiesCachePath = './cache/weibo.json';

(async function main() {
  // 构建浏览器驱动器
  let driver = await new Builder().forBrowser('chrome').build();
  // 构建本地服务
  const services = getServices(driver);
  try {
    // 尝试加载 cookies
    await services.weiboService.loadCookies(CookiesCachePath);
    let isLogged = await services.weiboService.isLogged();
    // 判断是否需要登录
    if (!isLogged) {
      console.log('Start login.')
      await services.weiboService.login('mobile', 'password', CookiesCachePath)
    }

    services.bilibiliService.startListenDynamic(81976, async (dynamic) => {
      services.weiboService.sendPost(dynamic.content);
    });
  } finally {
    // driver.quit();
  }
})()
