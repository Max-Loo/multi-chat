import Layout from '@/components/Layout';
import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// 懒加载页面组件
const ChatPage = lazy(() => import('@/pages/Chat'));
const ModelPage = lazy(() => import('@/pages/Model'));
const SettingPage = lazy(() => import('@/pages/Setting'));
const GeneralSetting = lazy(() => import('@/pages/Setting/components/GeneralSetting'));

const router = createBrowserRouter([
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
]);

export default router;