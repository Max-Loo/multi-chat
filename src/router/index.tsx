import Layout from '@/components/Layout';
import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// 懒加载页面组件
const ChatPage = lazy(() => import('@/pages/Chat'));
const ModelPage = lazy(() => import('@/pages/Model'));
const ModelTable = lazy(() => import('@/pages/Model/ModelTable'));
const CreateModel = lazy(() => import('@/pages/Model/CreateModel'));
const SettingPage = lazy(() => import('@/pages/Setting'));
const GeneralSetting = lazy(() => import('@/pages/Setting/components/GeneralSetting'));
const NotFound = lazy(() => import('@/pages/NotFound'));


// import.meta.env.BASE_URL 会自动读取 vite.config.ts 中的 base 配置
// 注意：它会包含末尾的斜杠，比如 '/my-repo/'
const basename = import.meta.env.BASE_URL

// 如果需要移除末尾的斜杠（createBrowserRouter 的 basename 不需要末尾斜杠）
const routerBasename = basename.endsWith('/') 
  ? basename.slice(0, -1)  // 移除末尾的斜杠
  : basename

  
const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          index: true,
          element: <Navigate to="chat" replace />,
        },
        {
          path: 'chat',
          element: <ChatPage />,
        },
        {
          path: 'model',
          element: <ModelPage />,
          children: [
            {
              index: true,
              element: <Navigate to="table" replace />,
            },
            {
              path: 'table',
              element: <ModelTable />,
            },
            {
              path: 'add',
              element: <CreateModel />,
            },
          ],
        },
        {
          path: 'setting',
          element: <SettingPage />,
          children: [
            {
              index: true,
              element: <Navigate to="common" replace />,
            },
            {
              path: 'common',
              element: <GeneralSetting />,
            },
          ],
        },
        // 兜底路由，匹配所有未定义的路径
        {
          path: '*',
          element: <Navigate to="/404" replace />,
        },
        {
          path: '404',
          element: <NotFound />,
        },
      ],
    },
  ],
  {
    // GitHub Pages 子路径部署支持
    basename: routerBasename,
  }
);

export default router;
