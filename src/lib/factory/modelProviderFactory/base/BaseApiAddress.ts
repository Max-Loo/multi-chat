import { isString } from "es-toolkit"
import { ApiAddress } from "../index"

/**
 * @description API 地址处理的抽象基类，提供通用的地址处理逻辑
 * 遵循 OCP 原则：对扩展开放，对修改封闭
 */
export abstract class BaseApiAddress implements ApiAddress {
  /** 默认的请求地址，子类必须实现 */
  abstract readonly defaultApiAddress: string;

  /**
   * 获取在表单展示的请求地址
   * 统一实现，子类可选择性重写
   */
  getOpenaiDisplayAddress = (url: string): string => {
    if (url?.endsWith('#')) {
      return url.slice(0, url.length - 1)
    }
    return this.getOpenaiFetchAddress(url) + '/chat/completions'
  }

  /**
   * 获取向 OpenAI 插件请求时候的地址
   * 统一实现，调用可重写的标准化方法
   */
  getOpenaiFetchAddress = (url: string): string => {
    let actualUrl = url

    // 默认会填充预设的地址
    if (!isString(actualUrl)) {
      actualUrl = this.defaultApiAddress
    }

    return this.normalizeUrl(actualUrl)
  }

  /**
   * URL 标准化处理，子类可重写实现自定义逻辑
   * @param url 原始 URL
   * @returns 标准化后的 URL
   */
  protected normalizeUrl(url: string): string {
    if (['#', '/'].some(char => url.endsWith(char))) {
      return url.slice(0, url.length - 1)
    }
    return url
  }

  /**
   * 获取表单中关于地址描述的文案，子类可选择性实现
   */
  getAddressFormDescription?: () => string;
}