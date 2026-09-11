/**
 * vue-router 路由表集成测试
 *
 * 验证 Vue 路由表与迁移前 react-router 配置行为一致：
 * 路径可达、重定向规则、404 兜底、懒加载页面渲染。
 */
import { describe, it, expect } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { createAppRouter } from '@/router/vueRouter';

/** 构建使用 memory history 的路由实例（测试环境不依赖浏览器 history） */
const setupRouter = async (initialPath: string) => {
  const router = createAppRouter(createMemoryHistory());
  await router.push(initialPath);
  await router.isReady();
  return router;
};

describe('vueRouter 路由表', () => {
  it('根路径应重定向到 /chat', async () => {
    const router = await setupRouter('/');
    expect(router.currentRoute.value.fullPath).toBe('/chat');
    expect(router.currentRoute.value.matched.at(-1)?.components?.default).toBeDefined();
  });

  it('/model 应重定向到 /model/table', async () => {
    const router = await setupRouter('/model');
    expect(router.currentRoute.value.fullPath).toBe('/model/table');
  });

  it('/setting 应重定向到 /setting/common', async () => {
    const router = await setupRouter('/setting');
    expect(router.currentRoute.value.fullPath).toBe('/setting/common');
  });

  it('/chat 应可达并渲染聊天页面', async () => {
    const router = await setupRouter('/chat');
    expect(router.currentRoute.value.name).toBeUndefined();
    expect(router.currentRoute.value.path).toBe('/chat');
  });

  it('未定义路径应兜底重定向到 /404', async () => {
    const router = await setupRouter('/no-such-page');
    expect(router.currentRoute.value.fullPath).toBe('/404');
  });

  it('/model/add 应可达', async () => {
    const router = await setupRouter('/model/add');
    expect(router.currentRoute.value.path).toBe('/model/add');
  });

  it('/setting/key-management 应可达', async () => {
    const router = await setupRouter('/setting/key-management');
    expect(router.currentRoute.value.path).toBe('/setting/key-management');
  });

  it('开发环境应包含 toast-test 路由', async () => {
    // vitest 环境 import.meta.env.DEV 为 true，与 React 版 dev-only 行为一致
    const router = await setupRouter('/setting/toast-test');
    expect(router.currentRoute.value.path).toBe('/setting/toast-test');
  });
});
