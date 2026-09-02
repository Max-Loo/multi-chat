/**
 * 主应用工厂（对应原 MainApp.tsx 的 createMainApp）
 *
 * 包含重型依赖（Router、Toast、Pinia stores 等），通过动态导入实现按需加载；
 * 工厂将初始化结果注入 MainApp.vue，维持「初始化完成后才加载重型依赖」的策略
 */
import { defineComponent, h } from "vue";
import MainApp from "./MainApp.vue";
import type { InitResult } from "@/services/initialization";

/**
 * 创建主应用组件的工厂函数
 * @param result 初始化结果
 * @returns 主应用组件定义
 */
export function createMainApp(result: InitResult) {
  return defineComponent({
    name: "MainAppRoot",
    setup() {
      return () => h(MainApp, { result });
    },
  });
}
