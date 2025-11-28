import { ModelProvider, ModelProviderFactoryCreator } from "./index"
import { GenericFactory } from "./base/GenericFactory"
import { DeepseekProvider } from "./providers/DeepseekProvider"
import { KimiProvider } from "./providers/KimiProvider"
import { BigModelProvider } from "./providers/BigModelProvider"

/**
 * @description 提供商注册管理器
 * 集中管理所有模型提供商的注册和查询
 * 遵循单一职责原则：只负责提供商的注册管理
 */
export class ProviderRegistry {
  /**
   * 批量注册所有提供商
   * 这是主要的注册入口点
   */
  static registerAll(): void {

    // 注册所有提供商
    const allProviders: ModelProvider[] = [
      new DeepseekProvider(),
      new KimiProvider(),
      new BigModelProvider(),
    ]

    allProviders.forEach(provider => {
      ModelProviderFactoryCreator.registerFactory(provider.key, new GenericFactory(provider))
    })

    console.log(`Successfully registered ${allProviders.length} model providers`)
  }
}