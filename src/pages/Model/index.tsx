import React from 'react';
import { Outlet } from 'react-router-dom';

// 模型管理页面
const ModelPage: React.FC = () => {
  return (
    <div className="h-full w-full">
      <Outlet />
    </div>
  );
};

export default ModelPage;