import { registerBigModelFactory } from "./modelProviderFactory/bigModelFactory"
import { registerDeepseekFactory } from "./modelProviderFactory/deepseekFactory"
import { registerKimiFactory } from "./modelProviderFactory/kimiFactory"

/**
 * @description 注册所有用到的工厂函数
 */
export const registerAllFactory = () => {
  // 模型供应商相关工厂
  registerBigModelFactory()
  registerDeepseekFactory()
  registerKimiFactory()
}