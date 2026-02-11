import { registerProviderFactory } from "./index"
import { GenericFactory } from "./base/GenericFactory"
import { DeepseekProvider } from "./providers/DeepseekProvider"
import { KimiProvider } from "./providers/KimiProvider"
import { BigModelProvider } from "./providers/BigModelProvider"

/**
 * @description 批量注册所有模型提供商
 * ⚠️ 已废弃：此函数不再被使用
 * 应用启动时现在使用 `initializeModelProvider` Redux Thunk 从远程 API 动态注册 Provider
 * 保留此函数仅用于向后兼容或紧急回滚
 * @deprecated 使用 `initializeModelProvider` 代替
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

  console.log(`Successfully registered ${allProviders.length} model providers (fallback mode)`)
}
