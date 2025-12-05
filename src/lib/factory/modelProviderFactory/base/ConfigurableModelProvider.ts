import { ModelProvider, ApiAddress, FetchApi } from "../index"
import { ModelDetail } from "@/types/model"
import { ModelProviderKeyEnum } from "@/utils/enums"

/**
 * @description 可配置的模型提供商抽象基类
 * 提供懒加载机制和通用的配置管理逻辑
 * 子类只需关注具体的配置和实现细节
 */
export abstract class ConfigurableModelProvider implements ModelProvider {
  // 子类必须实现的属性
  abstract readonly key: ModelProviderKeyEnum
  abstract readonly name: string
  abstract readonly modelList: ModelDetail[]

  // 子类可选择性实现的属性
  abstract readonly logoUrl?: string
  abstract readonly officialSite?: string

  // 懒加载的实例缓存
  private _apiAddress?: ApiAddress
  private _fetchApi?: FetchApi

  /**
   * 创建 API 地址处理器，子类必须实现
   * @returns ApiAddress 实例
   */
  protected abstract createApiAddress(): ApiAddress

  /**
   * 创建 Fetch API 处理器，子类必须实现
   * @returns FetchApi 实例
   */
  protected abstract createFetchApi(): FetchApi

  /**
   * 获取 API 地址处理器（懒加载）
   */
  get apiAddress(): ApiAddress {
    if (!this._apiAddress) {
      this._apiAddress = this.createApiAddress()
    }
    return this._apiAddress
  }

  /**
   * 获取 Fetch API 处理器（懒加载）
   */
  get fetchApi(): FetchApi {
    if (!this._fetchApi) {
      this._fetchApi = this.createFetchApi()
    }
    return this._fetchApi
  }

  /**
   * 重置缓存的实例（用于测试或重新配置）
   */
  resetCache(): void {
    this._apiAddress = undefined
    this._fetchApi = undefined
  }

}