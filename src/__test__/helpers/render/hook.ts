/**
 * Composable 测试渲染辅助工具
 *
 * 使用 @vue/test-utils 的 mount 在真实组件上下文中执行 composable
 */

import { defineComponent, h, computed, type Ref } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia, type Pinia } from "pinia";

/**
 * Hook 测试渲染选项
 */
interface RenderHookOptions {
  /** 自定义 Pinia 实例（默认创建新的测试实例） */
  pinia?: Pinia;
  /** 提供给组件的 provide（可选） */
  provide?: Record<string, unknown>;
}

/**
 * renderHook 结果
 */
export interface RenderHookResult<T> {
  /** composable 的返回值（渲染期间捕获） */
  result: Ref<T | undefined>;
  /** 卸载 wrapper */
  unmount: () => void;
}

/**
 * 在组件上下文中执行 composable（对应原 renderHookWithProviders）
 *
 * @param hook 要执行的 composable
 * @param options 渲染选项
 * @returns 捕获的结果与卸载函数
 */
export function renderHook<T>(
  hook: () => T,
  options: RenderHookOptions = {},
): RenderHookResult<T> {
  const pinia = options.pinia ?? createPinia();
  setActivePinia(pinia);

  const result = computed<T | undefined>(() => undefined) as Ref<T | undefined>;

  const TestComponent = defineComponent({
    name: "RenderHookHost",
    setup() {
      result.value = hook();
      return () => h("div");
    },
  });

  const wrapper = mount(TestComponent, {
    global: {
      plugins: [pinia],
      provide: options.provide,
    },
  });

  return {
    result,
    unmount: () => wrapper.unmount(),
  };
}
