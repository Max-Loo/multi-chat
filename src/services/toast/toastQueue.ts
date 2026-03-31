import { toast, type ExternalToast } from "sonner";

/**
 * 队列中的 Toast 执行动作
 */
interface QueuedToastAction {
  execute: () => void;
}

/**
 * Toast 消息队列管理类
 * 提供统一的异步 API，自动处理初始化阶段的队列
 */
class ToastQueue {
  private queue: QueuedToastAction[] = [];
  private toastReady: boolean = false;
  private isMobile: boolean | undefined = undefined;

  /**
   * 统一入口：立即显示或加入队列
   * @param action 执行 toast 调用的函数
   * @returns Promise，在 action 执行时 resolve
   * 注意：如果 Toaster 已就绪，action 会同步执行，但仍返回 Promise
   */
  private enqueueOrShow<T>(action: () => T): Promise<T> {
    return new Promise((resolve) => {
      const wrappedAction = () => {
        try {
          const result = action();
          resolve(result);
        } catch (error) {
          console.error("Toast execution error:", error);
          resolve(undefined as T);
        }
      };

      if (this.toastReady) {
        wrappedAction();
      } else {
        this.queue.push({ execute: wrappedAction });
      }
    });
  }

  /**
   * 标记 Toaster 组件已就绪，触发队列刷新
   */
  markReady() {
    this.toastReady = true;
    this.flush();
  }

  /**
   * 刷新队列，按顺序执行所有待执行的 action
   * 每个动作间隔 500ms
   * 注意：执行期间的新消息会立即显示（因为 toastReady 已为 true）
   */
  private async flush() {
    if (this.queue.length === 0) return;

    const actions = [...this.queue];
    this.queue = [];

    for (const action of actions) {
      action.execute();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  /**
   * 确保 Toast 配置具有响应式 position
   *
   * 规则：
   * - 移动端：强制使用 'top-center'（即使用户传入 position 也忽略）
   * - 桌面端：保留用户传入的 position，未传入时使用 'bottom-right'
   *
   * @param options Toast 选项对象
   * @returns 处理后的选项对象，确保包含正确的 position
   */
  private ensureResponsivePosition(options?: ExternalToast): ExternalToast {
    type PositonType = "top-center" | "bottom-right";
    const isMobile = this.getIsMobile();
    const defaultPosition: PositonType = isMobile
      ? "top-center"
      : "bottom-right";

    if (!options) {
      return { position: defaultPosition };
    }

    if (isMobile) {
      return { ...options, position: defaultPosition };
    }

    if (!("position" in options)) {
      return { ...options, position: defaultPosition };
    }

    return options;
  }

  /**
   * 显示成功消息
   * @param message 消息内容
   * @param options 选项（移动端强制使用 top-center，桌面端支持自定义 position）
   * @returns Promise，在 toast 显示时 resolve toast ID
   */
  success(message: string, options?: ExternalToast): Promise<string | number> {
    return this.enqueueOrShow(() =>
      toast.success(message, this.ensureResponsivePosition(options)),
    );
  }

  /**
   * 显示错误消息
   * @param message 消息内容
   * @param options 选项（移动端强制使用 top-center，桌面端支持自定义 position）
   * @returns Promise，在 toast 显示时 resolve toast ID
   */
  error(message: string, options?: ExternalToast): Promise<string | number> {
    return this.enqueueOrShow(() =>
      toast.error(message, this.ensureResponsivePosition(options)),
    );
  }

  /**
   * 显示警告消息
   * @param message 消息内容
   * @param options 选项（移动端强制使用 top-center，桌面端支持自定义 position）
   * @returns Promise，在 toast 显示时 resolve toast ID
   */
  warning(message: string, options?: ExternalToast): Promise<string | number> {
    return this.enqueueOrShow(() =>
      toast.warning(message, this.ensureResponsivePosition(options)),
    );
  }

  /**
   * 显示信息消息
   * @param message 消息内容
   * @param options 选项（移动端强制使用 top-center，桌面端支持自定义 position）
   * @returns Promise，在 toast 显示时 resolve toast ID
   */
  info(message: string, options?: ExternalToast): Promise<string | number> {
    return this.enqueueOrShow(() =>
      toast.info(message, this.ensureResponsivePosition(options)),
    );
  }

  /**
   * 显示加载消息
   * @param message 消息内容
   * @param options 选项（移动端强制使用 top-center，桌面端支持自定义 position）
   * @returns Promise，在 toast 显示时 resolve toast ID
   */
  loading(message: string, options?: ExternalToast): Promise<string | number> {
    return this.enqueueOrShow(() =>
      toast.loading(message, this.ensureResponsivePosition(options)),
    );
  }

  /**
   * 关闭指定 ID 的 Toast，或关闭所有 Toast
   * 注意：此方法不加入队列，立即执行
   * @param id Toast ID（可选）
   */
  dismiss(id?: string | number): void {
    toast.dismiss(id);
  }

  /**
   * 显示 Promise 相关的 Toast（加载 -> 成功/失败）
   * 注意：此方法不加入队列，立即执行
   * @param promise Promise 对象
   * @param options 选项
   */
  promise<T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
  ): void {
    toast.promise(promise, options);
  }

  /**
   * 设置移动端状态
   * @param isMobile 是否为移动端
   */
  setIsMobile(isMobile: boolean): void {
    this.isMobile = isMobile;
  }

  /**
   * 获取移动端状态
   * @returns 如果未初始化，返回 false（桌面端，保守策略）；如果已初始化，返回实际值
   */
  getIsMobile(): boolean {
    return this.isMobile ?? false;
  }
}

/**
 * Toast 队列单例
 */
export const toastQueue = new ToastQueue();

/**
 * 原始 sonner API，供特殊场景使用（需要完全控制 position）
 *
 * 使用场景：
 * - 需要在特定位置显示 Toast（如底部通知、中心弹窗）
 * - 需要动态位置（根据业务逻辑决定位置）
 * - 需要在移动端也自定义位置（完全自由控制）
 * - 需要测试 Toast 的不同位置效果
 *
 * 禁止使用场景：
 * - 普通的成功/失败提示（应使用 toastQueue）
 * - 需要响应式位置的 Toast（应使用 toastQueue，系统自动适配移动端/桌面端）
 * - 移动端的标准业务提示（应使用 toastQueue，位置由系统自动管理为 top-center）
 */
export const rawToast = toast;
