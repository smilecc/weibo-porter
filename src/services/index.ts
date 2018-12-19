import { ServiceInstance } from './ServiceInstance';
import { WebDriver } from 'selenium-webdriver';

export { Service } from './Service';

export function getServices(driver: WebDriver): ServiceInstance {
  return new ServiceInstance(driver);
}
