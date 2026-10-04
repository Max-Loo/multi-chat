/**
 * vue-router 路由表
 *
 * 路由结构与 URL 与迁移前完全一致；全部页面懒加载；
 * 通过 import.meta.env.BASE_URL 支持子路径（GitHub Pages /multi-chat/）部署
 */
import {
  createRouter,
  createWebHistory,
  type RouterHistory,
  type RouteRecordRaw,
} from 'vue-router';
import { Layout } from '@/components/Layout';

// 懒加载页面组件
const ChatPage = () => import('@/pages/Chat/index.vue');
const ModelPage = () => import('@/pages/Model/index.vue');
const ModelTable = () => import('@/pages/Model/ModelTable/index.vue');
const CreateModel = () => import('@/pages/Model/CreateModel/index.vue');
const SettingPage = () => import('@/pages/Setting/index.vue');
const GeneralSetting = () =>
  import('@/pages/Setting/components/GeneralSetting/index.vue');
const KeyManagementSetting = () =>
  import('@/pages/Setting/components/KeyManagementSetting/index.vue');
const ToastTest = () => import('@/pages/Setting/components/ToastTest/index.vue');
const NotFound = () => import('@/pages/NotFound/index.vue');

/**
 * 构建路由记录（与迁移前 react-router 结构一一对应）
 */
function buildRoutes(): RouteRecordRaw[] {
  // 仅开发环境添加 toast-test 路由
  const toastTestRoute: RouteRecordRaw[] = import.meta.env.DEV
    ? [{ path: 'toast-test', component: ToastTest }]
    : [];

  return [
    {
      path: '/',
      component: Layout,
      children: [
        { path: '', redirect: '/chat' },
        { path: 'chat', component: ChatPage },
        {
          path: 'model',
          component: ModelPage,
          children: [
            { path: '', redirect: '/model/table' },
            { path: 'table', component: ModelTable },
            { path: 'add', component: CreateModel },
          ],
        },
        {
          path: 'setting',
          component: SettingPage,
          children: [
            { path: '', redirect: '/setting/common' },
            { path: 'common', component: GeneralSetting },
            { path: 'key-management', component: KeyManagementSetting },
            ...toastTestRoute,
          ],
        },
        // 兜底路由，匹配所有未定义的路径
        { path: '/:pathMatch(.*)*', redirect: '/404' },
        { path: '404', component: NotFound },
      ],
    },
  ];
}

/**
 * 创建应用路由器（测试可注入 memory history）
 * @param history 路由历史实现，默认使用 BASE_URL 的 Web History
 */
export function createAppRouter(history?: RouterHistory) {
  return createRouter({
    history:
      history ??
      createWebHistory(
        import.meta.env.BASE_URL.endsWith('/')
          ? import.meta.env.BASE_URL
          : `${import.meta.env.BASE_URL}/`,
      ),
    routes: buildRoutes(),
  });
}

/** 应用路由器单例 */
const router = createAppRouter();

export default router;
