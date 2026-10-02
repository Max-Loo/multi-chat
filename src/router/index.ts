/**
 * 应用路由（vue-router 版，对应旧版 router/index.tsx）
 *
 * 路由结构与既有版本对等：chat / model(table,add) / setting(common,key-management) / 404。
 * 页面组件全部懒加载，配合 Layout 的 Suspense 显示骨架屏。
 */
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router';
import Layout from '@/components/Layout';

// 仅开发环境添加 toast-test 路由
const toastTestRoutes: RouteRecordRaw[] = import.meta.env.DEV
  ? [
      {
        path: 'toast-test',
        component: () =>
          import('@/pages/Setting/components/ToastTest/index.vue'),
      },
    ]
  : [];

/**
 * 路由表
 * 注意：懒加载路径显式带 .vue 扩展名，避免与未迁移的 .tsx 产生解析歧义
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        redirect: '/chat',
      },
      {
        path: 'chat',
        component: () => import('@/pages/Chat/index.vue'),
      },
      {
        path: 'model',
        component: () => import('@/pages/Model/index.vue'),
        children: [
          {
            path: '',
            redirect: '/model/table',
          },
          {
            path: 'table',
            component: () => import('@/pages/Model/ModelTable/index.vue'),
          },
          {
            path: 'add',
            component: () => import('@/pages/Model/CreateModel/index.vue'),
          },
        ],
      },
      {
        path: 'setting',
        component: () => import('@/pages/Setting/index.vue'),
        children: [
          {
            path: '',
            redirect: '/setting/common',
          },
          {
            path: 'common',
            component: () =>
              import('@/pages/Setting/components/GeneralSetting/index.vue'),
          },
          {
            path: 'key-management',
            component: () =>
              import('@/pages/Setting/components/KeyManagementSetting/index.vue'),
          },
          ...toastTestRoutes,
        ],
      },
      // 兜底路由，匹配所有未定义的路径
      {
        path: '/:pathMatch(.*)*',
        redirect: '/404',
      },
      {
        path: '404',
        component: () => import('@/pages/NotFound/index.vue'),
      },
    ],
  },
];

/**
 * 创建路由实例
 * import.meta.env.BASE_URL 读取 vite base 配置，支持 GitHub Pages 子路径部署；
 * createWebHistory 内部会规范化末尾斜杠，聊天选中状态经 URL query（chatId）恢复。
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
