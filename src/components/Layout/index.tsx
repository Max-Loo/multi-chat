import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import routes from '@/routes';

interface LayoutProps {
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ className = '' }) => {
  return (
    <div className={`flex h-screen bg-white ${className}`}>
      {/* 左侧导航栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">加载中...</div>
            </div>
          }
        >
          <Routes>
            {routes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={route.component}
              />
            ))}
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};

export default Layout;