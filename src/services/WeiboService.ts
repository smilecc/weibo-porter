import { Service } from "./Service";
import { IWebDriverOptionsCookie, By, until, Key } from 'selenium-webdriver';
import * as fs from 'fs';

export class WeiboService extends Service {

  /**
   * 登录账户
   * @param username 用户名
   * @param password 密码
   */
  public async login(username: string, password: string, cookieSavePath: string) {
    const driver = this.getDriver();
    await driver.get('https://m.weibo.cn/?jumpfrom=weibocom&sudaref=login.sina.com.cn');
    await driver.findElement(By.className('lite-iconf-releas')).click();

    // 等待登录页面加载
    await driver.wait(until.titleContains('登录'), 20 * 1000);
    const waitLoginButton = await driver.wait(until.elementLocated(By.id('loginName')), 20 * 1000);
    await driver.wait(until.elementIsVisible(waitLoginButton), 20 * 1000);

    // 填写用户名密码
    await driver.findElement(By.id('loginName')).sendKeys(username);
    await driver.findElement(By.id('loginPassword')).sendKeys(password);
    await driver.findElement(By.id('loginAction')).click();

    // 等待页面跳转
    await driver.wait(until.titleIs('微博'), 20 * 1000);
    const waitCreateButton = await driver.wait(until.elementLocated(By.className('lite-iconf-releas')), 20 * 1000);
    await driver.wait(until.elementIsVisible(waitCreateButton), 20 * 1000);

    // 保存 cookies
    let cookies = await driver.manage().getCookies()
    fs.writeFileSync(cookieSavePath, JSON.stringify(cookies));
  }

  /**
   * 从本地加载 cookie 缓存
   * @param cachePath cookie 所缓存的路径
   */
  public async loadCookies(cachePath: string): Promise<boolean> {
    try {
      const cookies = JSON.parse(fs.readFileSync(cachePath).toString()) as IWebDriverOptionsCookie[];
      await this.getDriver().get('https://m.weibo.cn/404');
      for (const cookie of cookies) {
        await this.getDriver().manage().addCookie(cookie);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 判断用户是否已经登录
   */
  public async isLogged(): Promise<boolean> {
    try {
      await this.getDriver().get('https://m.weibo.cn/?jumpfrom=weibocom&sudaref=login.sina.com.cn');
      await this.getDriver().findElement(By.className('lite-iconf-msg'))
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 发布微博
   * @param content 要发布的内容
   * @param imgList 图片列表
   */
  public async sendPost(content: string, imgList: string[] = []) {
    const driver = this.getDriver();
    await driver.get('https://m.weibo.cn/?jumpfrom=weibocom&sudaref=login.sina.com.cn');

    await driver.executeScript('window.localStorage.clear()');
    await driver.findElement(By.className('lite-iconf-releas')).click();

    // 等待界面加载完毕
    const textarea = await driver.wait(until.elementLocated(By.xpath('//*[@id="app"]/div[1]/div/main/div[1]/div/span/textarea[1]')), 20 * 1000);

    content = content.replace(/@/g, '&');
    content = content.replace(/`/g, "'");

    // 设置要发布的内容
    driver.executeScript(`
      var textarea = document.querySelector('#app > div.m-wrapper.m-wbox > div > main > div.m-box-model.m-pos-r > div > span > textarea:nth-child(1)');
      textarea.value = \`${content}\`;
    `);

    await textarea.sendKeys(' ');
    await textarea.sendKeys(Key.BACK_SPACE);
    await driver.sleep(1000);

    // 上传图片
    const uploadInput = await driver.findElement(By.id('selectphoto'));
    for (const imgPath of imgList) {
      await uploadInput.sendKeys(imgPath);
      await driver.sleep(1500);
    }

    await driver.sleep(2000);
    await driver.findElement(By.className('m-send-btn')).click();
  }
}
