import React from 'react';
import { useSelector } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { NoProvidersAvailable } from '@/components/NoProvidersAvailable';
import { RootState } from '@/store';
import router from '@/router';

/**
 * 应用根组件
 * 负责在严重错误时显示错误提示，否则正常渲染应用
 */
const AppRoot: React.FC = () => {
  const { error, loading } = useSelector(
    (state: RootState) => state.modelProvider
  );

  /**
   * 判断是否应该显示"无可用的模型供应商"错误提示
   *
   * 条件：
   * 1. 存在错误信息
   * 2. 错误信息表明无法获取数据且无缓存可用
   * 3. 不处于加载状态（避免在初始化期间误触发）
   */
  const shouldShowNoProvidersError = React.useMemo(() => {
    if (loading) {
      return false;
    }

    // 检查是否为严重错误（无缓存且网络失败）
    // 这个错误消息来自 modelProviderSlice.ts:67
    const isCriticalError = error === '无法获取模型供应商数据，请检查网络连接';

    return isCriticalError;
  }, [error, loading]);

  // 显示全屏错误提示
  if (shouldShowNoProvidersError) {
    return <NoProvidersAvailable />;
  }

  // 正常渲染应用
  return <RouterProvider router={router} />;
};

export default AppRoot;
