import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// 懒加载页面组件
const ChatPage = lazy(() => import('@/pages/Chat'));
const ModelPage = lazy(() => import('@/pages/Model'));

export const routes = [
  {
    path: '/',
    component: <Navigate to="/chat" replace />,
  },
  {
    path: '/chat',
    component: <ChatPage />,
  },
  {
    path: '/model',
    component: <ModelPage />,
    children: ''
  },
];

export default routes;