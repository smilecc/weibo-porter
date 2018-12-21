# 微博搬运姬

基于Firefox Headless，实现自动监听某位用户的B博（Bilibili动态），当有新动态发布时，自动将该条动态搬运至微博。

- 7 * 24小时全自动无人值守
- 自动转发图片与文字
- 自动截屏转发内容上下文
- 自动清除图片缓存
- 使用原子锁防止重复搬运
- 使用TypeScript编写

## 目录

- [Demo](#demo)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [获取帮助](#获取帮助)
- [已知问题](#已知问题)
- [贡献代码](#贡献代码)
- [鸣谢](#鸣谢)
- [License](#License)

## Demo

- [孙渣搬运bot](https://weibo.com/6697757382)（欢迎关注）

## 环境要求

- Redis
- Node.js
- [Yarn](https://yarnpkg.com)
- Firefox & [geckodriver](https://github.com/mozilla/geckodriver/releases)
- Chrome & [chromedriver](http://chromedriver.chromium.org/)

## 快速开始

请确认Redis监听的端口为6379，否则请自行修改`src/utils/Redis.ts`中的连接地址。

准备好如上环境后，安装项目依赖。

```bash
$ yarn install
```

随后在`src/config.ts`中填写微博的账户与密码，首次运行建议开启`stopSend`，否则将会把被监听用户的最新一页动态全部搬运过来，耗时可能较长。

执行如下命令启动项目。

```bash
$ yarn start
```

## 获取帮助

如果您有疑问或者建议，或是反馈Bug，建议您在本项目的[Github issues](https://github.com/smilecc/weibo-porter/issues)中进行发布。

## 已知问题

- 由于Firefox Headless的`element.taskScreenshot`无法单独截取该元素的图片，所以仍然使用了Chrome Headless作为元素截取工具。

## 贡献代码

欢迎提交PR。

## 鸣谢

- [孙渣](https://space.bilibili.com/81976/dynamic)（本项目为孙老板而生）
- [璨desu](https://weibo.com/smilexc8)（我 谢 我 自 己）

## License

[MIT License](https://opensource.org/licenses/MIT)
