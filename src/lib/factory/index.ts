import { ProviderRegistry } from "./modelProviderFactory/ProviderRegistry"

/**
 * @description 注册所有用到的工厂函数
 * 使用新的 ProviderRegistry 方式，遵循 DRY 原则
 */
export const registerAllFactory = () => {
  // 使用新的注册管理器，自动注册所有提供商
  ProviderRegistry.registerAll()
}