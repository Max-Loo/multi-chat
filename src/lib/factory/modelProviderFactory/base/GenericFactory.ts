import { ModelProvider, ModelProviderFactory } from "../index"

/**
 * @description 通用工厂实现，适用于所有遵循 ConfigurableModelProvider 接口的提供商
 * 遵循依赖倒置原则：依赖抽象而非具体实现
 */
export class GenericFactory implements ModelProviderFactory {
  private readonly provider: ModelProvider

  /**
   * 创建通用工厂实例
   * @param provider 模型提供商实例
   */
  constructor(provider: ModelProvider) {
    this.provider = provider
  }

  /**
   * 获取模型提供商
   * @returns 模型提供商实例
   */
  getModelProvider = (): ModelProvider => {
    return this.provider
  }
}