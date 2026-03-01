import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import InitializationScreen from '@/components/InitializationScreen';

interface LayoutProps {
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ className = '' }) => {
  return (
    <div className={`flex h-screen bg-white ${className}`}>
      {/* 左侧导航栏 */}
      <Sidebar />
      {/* 主内容区域 */}
      <div className="flex-1 h-full">
        <Suspense fallback={<InitializationScreen />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};

export default Layout;