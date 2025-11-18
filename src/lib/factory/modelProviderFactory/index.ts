import { ModelDetail } from "@/types/model";
import { ModelProviderKeyEnum } from "@/utils/enums"
import { isUndefined } from "es-toolkit";


export interface ApiAddress {
  // 默认的请求地址（不完整）
  readonly defaultApiAddress: string;
  // 获取在表单展示的请求地址
  getOpenaiDisplayAddress: (url: string) => string;
  // 获取向 Openai 插件请求时候的地址
  getOpenaiFetchAddress: (url: string) => string;
}
export interface FetchApi {
  // 获取请求方法
  fetch: (message: string, configOptions?: { signal?: AbortSignal }) => AsyncIterable<string>;
}

export interface ModelProvider {
  // 大模型服务商唯一标识
  readonly key: ModelProviderKeyEnum;
  // 大模型服务商显示名称
  readonly name: string;
  // 大模型服务商logo URL（可选）
  readonly logoUrl?: string;
  // 官网地址
  readonly officialSite?: string;
  // 请求地址
  readonly apiAddress: ApiAddress
  // 可选择的模型
  readonly modelList: ModelDetail[];
}

/**
 * @description 单例模式的工厂
 */
export interface ModelProviderFactory {
  getModelProvider: () => ModelProvider;
  getFetchApi: () => FetchApi;
}


// 总的工厂函数出口
export class ModelProviderFactoryCreator {
  private static factories: Map<ModelProviderKeyEnum, ModelProviderFactory> = new Map();

  // 根据 key 获取对应的大模型服务商创建工程
  static getFactory = (key: ModelProviderKeyEnum): ModelProviderFactory => {
    const factory = this.factories.get(key)

    if (isUndefined(factory)) {
      throw new Error(`还不支持当前的大模型服务商类型：${key}`)
    }

    return factory
  }

  // 获取现有的已经注册的工厂 Map （键值对）
  static getFactoryMap = (): [ModelProviderKeyEnum, ModelProviderFactory][] => {
    return [...this.factories]
  }

  // 获取现有的已经注册的工程列表
  static getFactoryList = (): ModelProviderFactory[] => {
    return [...this.factories.values()]
  }

  // 注册新的大模型工厂
  static registerFactory = (key: ModelProviderKeyEnum, factory: ModelProviderFactory): void => {
    // 避免重复注册
    if (!this.factories.has(key)) {
      this.factories.set(key, factory)
    }
  }
}

