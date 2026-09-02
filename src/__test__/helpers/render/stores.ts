/**
 * Pinia 测试渲染辅助工具（对应原 render/redux.tsx）
 *
 * 提供带有 Pinia store、Router 和 ConfirmProvider 的组件渲染函数
 */

import type { Component } from "vue";
import { render, type RenderOptions } from "@testing-library/vue";
import { RouterView } from "vue-router";
import {
  createPinia,
  setActivePinia,
  type Pinia,
} from "pinia";
import {
  createRouter,
  createMemoryHistory,
  type Router,
  type RouteRecordRaw,
} from "vue-router";
import ConfirmProvider from "@/components/ConfirmProvider.vue";

/**
 * 创建测试用 Pinia 实例并激活
 *
 * 真实 store（非 mock action），行为与生产环境一致；
 * 需要预加载状态时，直接在测试中修改 `pinia.state.value[storeId]`。
 *
 * @returns 未安装的 Pinia 实例（已设为 active）
 */
export function createTestPinia(): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

/**
 * 创建测试用内存路由
 *
 * 使用 createMemoryHistory，避免污染真实浏览器历史；
 * 未提供 routes 时注册兜底路由，任何路径都可渲染。
 *
 * @param options 路由配置
 * @param options.route 初始路径
 * @param options.routes 路由表（可选）
 */
export function createTestRouter(options?: {
  route?: string;
  routes?: RouteRecordRaw[];
}): Router {
  const router = createRouter({
    history: createMemoryHistory(),
    routes:
      options?.routes ?? [{ path: "/:pathMatch(.*)*", component: RouterView }],
  });
  if (options?.route) {
    void router.push(options.route);
  }
  return router;
}

/**
 * 渲染选项
 */
interface RenderWithProvidersOptions
  extends Omit<RenderOptions<Component>, "component"> {
  /** 自定义 Pinia 实例（默认创建新的测试实例） */
  pinia?: Pinia;
  /** 自定义 Router 实例（默认创建内存路由） */
  router?: Router;
  /** 初始路由路径 */
  route?: string;
}

/**
 * 带有 Pinia、Router 和 ConfirmProvider 的渲染函数
 *
 * @param component 要渲染的 Vue 组件
 * @param options 渲染选项
 * @returns 渲染结果（含 pinia 与 router 实例）
 */
export const renderWithProviders = (
  component: Component,
  options: RenderWithProvidersOptions = {},
) => {
  const { pinia = createTestPinia(), router, route, ...renderOptions } = options;

  const testRouter = router ?? createTestRouter({ route });

  return {
    pinia,
    router: testRouter,
    ...render(component, {
      global: {
        plugins: [pinia, testRouter],
        components: { ConfirmProvider },
      },
      ...renderOptions,
    }),
  };
};
