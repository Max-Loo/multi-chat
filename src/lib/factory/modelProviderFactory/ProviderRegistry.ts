import { registerProviderFactory } from "./index"
import { GenericFactory } from "./base/GenericFactory"
import { DeepseekProvider } from "./providers/DeepseekProvider"
import { KimiProvider } from "./providers/KimiProvider"
import { BigModelProvider } from "./providers/BigModelProvider"

/**
 * @description 批量注册所有模型提供商
 * 这是主要的注册入口点
 * @param providers 要注册的提供商列表，默认为所有内置提供商
 */
export function registerAllProviders(): void {
  const allProviders = [
    new DeepseekProvider(),
    new KimiProvider(),
    new BigModelProvider(),
  ]

  allProviders.forEach(provider => {
    registerProviderFactory(provider.key, new GenericFactory(provider))
  })

  console.log(`Successfully registered ${allProviders.length} model providers`)
}
