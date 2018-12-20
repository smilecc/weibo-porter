import * as fs from 'fs';
import * as path from 'path';
import * as download from 'download';

export class DownloaderUtil {
  /**
   * 下载文件到temp文件夹中
   * @param url 要下载文件的链接
   */
  public static async download(url: string): Promise<string> {
    const saveName = `${(new Date()).getTime()}_${path.basename(url)}`;
    const savePath = `${this.getTempPath()}/${saveName}`;
    const fileData = await download(url);
    fs.writeFileSync(savePath, fileData);
    return savePath;
  }

  public static getTempPath() {
    return `${path.dirname(require.main.filename)}/temp`;
  }
}
