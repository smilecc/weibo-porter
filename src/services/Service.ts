import { WebDriver } from "selenium-webdriver";
import { ServiceInstance } from "./ServiceInstance";
export class Service {
  private _driver: WebDriver;
  constructor(driver: WebDriver) {
    this.setDriver(driver);
  }
  public getDriver(): WebDriver {
    return this._driver;
  }
  public setDriver(driver: WebDriver): void {
    this._driver = driver;
  }
}
