import React, { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toastQueue } from './toastQueue';

/**
 * Toaster 包装组件，在挂载后通知 toastQueue
 */
export const ToasterWrapper: React.FC = () => {
  useEffect(() => {
    // Toaster 挂载后标记为就绪，触发消息队列刷新
    toastQueue.markReady();
  }, []);

  return <Toaster />;
};
