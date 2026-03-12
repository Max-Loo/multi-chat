import React, { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toastQueue } from './toastQueue';
import { useResponsive } from '@/hooks/useResponsive';

/**
 * Toaster 包装组件
 * - 同步响应式状态到 toastQueue 单例
 * - 确保 isMobile 初始化后再标记就绪，避免竞态条件
 */
export const ToasterWrapper: React.FC = () => {
  const { isMobile } = useResponsive();
  const [isReady, setIsReady] = useState(false);

  // 同步 isMobile 到 toastQueue，并确定是否就绪
  useEffect(() => {
    toastQueue.setIsMobile(isMobile);
    // 只在 isMobile 确定后才标记就绪
    if (isMobile !== undefined) {
      setIsReady(true);
    }
  }, [isMobile]);

  // 就绪后触发队列刷新
  useEffect(() => {
    if (isReady) {
      toastQueue.markReady();
    }
  }, [isReady]);

  return <Toaster />;
};
