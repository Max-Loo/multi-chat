import { toast } from 'sonner';

/**
 * 排队中的 Toast 消息接口
 */
export interface QueuedToast {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  description?: string;
}

/**
 * Toast 消息队列管理类
 * 用于解决初始化时 Toaster 组件未挂载导致的 Toast 静默失败问题
 */
class ToastQueue {
  private queue: QueuedToast[] = [];
  private toastReady: boolean = false;
  private isFlushing: boolean = false;

  /**
   * 标记 Toaster 组件已就绪，触发消息队列刷新
   */
  markReady() {
    this.toastReady = true;
    this.flush();
  }

  /**
   * 将消息加入队列
   * @param toastMsg Toast 消息对象
   */
  enqueue(toastMsg: QueuedToast) {
    if (this.toastReady && !this.isFlushing) {
      this.show(toastMsg);  // 仅当不在 flush 时才立即显示
    } else {
      this.queue.push(toastMsg);
      // 如果 Toaster 已就绪但未在 flush，触发 flush
      if (this.toastReady && !this.isFlushing) {
        this.flush();
      }
    }
  }

  /**
   * 刷新消息队列（顺序显示所有消息）
   */
  private async flush() {
    if (this.isFlushing) return;  // 防止重复调用
    this.isFlushing = true;
    try {
      while (this.queue.length > 0) {
        const toastMsg = this.queue.shift();
        if (toastMsg) {
          await this.show(toastMsg);
          // 等待 500ms，确保用户有时间阅读每个消息
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * 显示单个 Toast 消息
   * @param toastMsg Toast 消息对象
   */
  private async show(toastMsg: QueuedToast) {
    // 根据类型显示对应的 toast
    switch (toastMsg.type) {
      case 'info':
        toast.info(toastMsg.message, { description: toastMsg.description });
        break;
      case 'success':
        toast.success(toastMsg.message, { description: toastMsg.description });
        break;
      case 'warning':
        toast.warning(toastMsg.message, { description: toastMsg.description });
        break;
      case 'error':
        toast.error(toastMsg.message, { description: toastMsg.description });
        break;
    }
  }
}

/**
 * Toast 队列单例
 */
export const toastQueue = new ToastQueue();
