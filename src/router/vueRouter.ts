import { createRouter, createWebHistory, type RouterHistory } from 'vue-router';

/**
 * 应用路由表（Vue 版）
 *
 * 与迁移前 react-router 配置一一对应：路径、重定向、懒加载行为保持一致。
 * 页面组件以显式 .vue 扩展名导入，避免与共存期的 React 页面产生解析歧义。
 *
 * @param history 路由历史实现，默认 createWebHistory（测试可注入 memory history）
 */
export const createAppRouter = (history: RouterHistory = createWebHistory(import.meta.env.BASE_URL)) =>
  createRouter({
    history,
    routes: [
      {
        path: '/',
        component: () => import('@/components/Layout.vue'),
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
                component: () => import('@/pages/Model/ModelTable.vue'),
              },
              {
                path: 'add',
                component: () => import('@/pages/Model/CreateModel.vue'),
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
                component: () => import('@/pages/Setting/components/GeneralSetting.vue'),
              },
              {
                path: 'key-management',
                component: () => import('@/pages/Setting/components/KeyManagementSetting.vue'),
              },
              // 仅开发环境添加 toast-test 路由（与 React 版行为一致）
              ...(import.meta.env.DEV
                ? [
                    {
                      path: 'toast-test',
                      component: () => import('@/pages/Setting/components/ToastTest.vue'),
                    },
                  ]
                : []),
            ],
          },
          // 兜底路由，匹配所有未定义的路径
          {
            path: '/:pathMatch(.*)*',
            redirect: '/404',
          },
          {
            path: '404',
            component: () => import('@/pages/NotFound.vue'),
          },
        ],
      },
    ],
  });

/** 默认路由实例（应用入口使用） */
export default createAppRouter();
