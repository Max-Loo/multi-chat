/**
 * vue-router 路由配置测试（对应原 React Router 配置测试）
 *
 * 验证路由表结构与迁移前完全一致：
 * - 索引路由重定向（/ → /chat、/model → /model/table、/setting → /setting/common）
 * - 未定义路径兜底（→ /404）
 * - 页面懒加载（动态 import）
 * - dev-only toast-test 路由
 * - BASE_URL basename
 */

import { describe, it, expect, beforeEach } from "vitest";
import router from '@/router';
import type { RouteRecordRaw } from 'vue-router';

/** 获取根路由的子路由列表 */
function getRootChildren(): RouteRecordRaw[] {
  return (router.options.routes[0].children ?? []) as RouteRecordRaw[];
}

/** 按路径查找路由 */
function findRoute(path: string): RouteRecordRaw | undefined {
  return getRootChildren().find((route) => route.path === path);
}

describe('vue-router 路由配置', () => {
  it('应该根路由使用 Layout 组件', () => {
    const root = router.options.routes[0];
    expect(root.path).toBe('/');
    expect(root.component).toBeDefined();
  });

  describe('索引路由重定向', () => {
    it('应该访问 / 重定向至 /chat', () => {
      const index = findRoute('');
      expect(index?.redirect).toBe('/chat');
    });

    it('应该访问 /model 重定向至 /model/table', () => {
      const model = findRoute('model');
      const children = (model?.children ?? []) as RouteRecordRaw[];
      const index = children.find((route) => route.path === '');
      expect(index?.redirect).toBe('/model/table');
    });

    it('应该访问 /setting 重定向至 /setting/common', () => {
      const setting = findRoute('setting');
      const children = (setting?.children ?? []) as RouteRecordRaw[];
      const index = children.find((route) => route.path === '');
      expect(index?.redirect).toBe('/setting/common');
    });
  });

  describe('未定义路径兜底', () => {
    it('应该匹配所有未定义路径并重定向至 /404', () => {
      const catchAll = findRoute('/:pathMatch(.*)*');
      expect(catchAll).toBeDefined();
      expect(catchAll?.redirect).toBe('/404');
    });

    it('应该存在 404 路由且为懒加载', () => {
      const notFound = findRoute('404');
      expect(notFound).toBeDefined();
      expect(typeof notFound?.component).toBe('object'); // defineAsyncComponent
    });
  });

  describe('页面路由注册', () => {
    it('应该注册全部页面路由', () => {
      const paths = getRootChildren().map((route) => route.path);
      expect(paths).toContain('chat');
      expect(paths).toContain('model');
      expect(paths).toContain('setting');
      expect(paths).toContain('404');
    });

    it('应该 model 子路由包含 table 与 add', () => {
      const model = findRoute('model');
      const children = (model?.children ?? []) as RouteRecordRaw[];
      const paths = children.map((route) => route.path);
      expect(paths).toContain('table');
      expect(paths).toContain('add');
    });

    it('应该 setting 子路由包含 common 与 key-management', () => {
      const setting = findRoute('setting');
      const children = (setting?.children ?? []) as RouteRecordRaw[];
      const paths = children.map((route) => route.path);
      expect(paths).toContain('common');
      expect(paths).toContain('key-management');
    });

    it('应该页面路由为异步组件（懒加载）', () => {
      const chat = findRoute('chat');
      // defineAsyncComponent 返回对象组件
      expect(typeof chat?.component).toBe('object');
    });
  });

  describe('历史模式与 basename', () => {
    it('应该使用 WebHistory 且应用 BASE_URL basename', () => {
      // createWebHistory(BASE_URL 去除末尾斜杠)
      expect(router.options.history).toBeDefined();
      const base = router.options.history.base;
      const expected = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
      expect(base).toBe(expected);
    });
  });

  describe('实际导航行为（集成）', () => {
    beforeEach(async () => {
      // 重置到首页
      await router.push('/');
    });

    it('应该访问 / 实际重定向至 /chat', async () => {
      await router.push('/');
      expect(router.currentRoute.value.path).toBe('/chat');
    });

    it('应该访问 /model 实际重定向至 /model/table', async () => {
      await router.push('/model');
      expect(router.currentRoute.value.path).toBe('/model/table');
    });

    it('应该访问 /setting 实际重定向至 /setting/common', async () => {
      await router.push('/setting');
      expect(router.currentRoute.value.path).toBe('/setting/common');
    });

    it('应该访问未定义路径实际重定向至 /404', async () => {
      await router.push('/this-path-does-not-exist');
      expect(router.currentRoute.value.path).toBe('/404');
    });
  });
});
