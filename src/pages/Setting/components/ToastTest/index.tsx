import { useRef, useEffect } from "react";
import { toastQueue, rawToast } from "@/services/toast";
import { Button } from "@/components/ui/button";
import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar";

/**
 * Toast 测试页面（仅开发环境）
 * @description 提供完整的 Toast 功能测试界面，用于验证各种场景
 */
const ToastTest: React.FC = () => {
  // 生产环境保护：返回空组件
  if (import.meta.env.PROD) {
    return null;
  }
  const { scrollbarClassname, onScrollEvent } = useAdaptiveScrollbar();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 添加 passive 监听器
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", onScrollEvent, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScrollEvent);
    };
  }, [onScrollEvent]);

  // ========== toastQueue 方法测试 ==========

  const handleSuccess = () => {
    toastQueue.success("操作成功");
  };

  const handleError = () => {
    toastQueue.error("操作失败");
  };

  const handleWarning = () => {
    toastQueue.warning("警告信息");
  };

  const handleInfo = () => {
    toastQueue.info("提示信息");
  };

  const handleLoading = () => {
    toastQueue.loading("加载中...", { duration: 3000 });
  };

  // ========== rawToast 位置测试 ==========

  const handleTopLeft = () => {
    rawToast.success("Top Left", { position: "top-left" });
  };

  const handleTopCenter = () => {
    rawToast.success("Top Center", { position: "top-center" });
  };

  const handleTopRight = () => {
    rawToast.success("Top Right", { position: "top-right" });
  };

  const handleBottomLeft = () => {
    rawToast.success("Bottom Left", { position: "bottom-left" });
  };

  const handleBottomCenter = () => {
    rawToast.success("Bottom Center", { position: "bottom-center" });
  };

  const handleBottomRight = () => {
    rawToast.success("Bottom Right", { position: "bottom-right" });
  };

  // ========== 队列机制测试 ==========

  const handleQueueTest = async () => {
    const ids: Array<string | number> = [];

    for (let i = 1; i <= 5; i++) {
      const id = await toastQueue.success(`消息 ${i}`);
      ids.push(id);
    }

    console.log("Toast IDs:", ids);
  };

  const handleDismissLatest = async () => {
    // 显示一个新的 toast，然后立即关闭它
    const id = await toastQueue.success("将被关闭的 Toast");
    setTimeout(() => {
      toastQueue.dismiss(id);
    }, 1000);
  };

  const handleDismissAll = () => {
    toastQueue.dismiss();
  };

  // ========== Promise 测试 ==========

  const handlePromiseSuccess = () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("数据加载成功"), 2000);
    });

    toastQueue.promise(promise, {
      loading: "加载中...",
      success: (data) => data,
      error: "加载失败",
    });
  };

  const handlePromiseError = () => {
    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("网络错误")), 2000);
    });

    toastQueue.promise(promise, {
      loading: "加载中...",
      success: "加载成功",
      error: "加载失败",
    });
  };

  const handlePromiseLoading = () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("完成"), 3000);
    });

    toastQueue.promise(promise, {
      loading: "正在处理...",
      success: "处理完成",
      error: "处理失败",
    });
  };

  return (
    <div
      ref={scrollContainerRef}
      className={`flex flex-col items-center justify-start
      w-full h-full px-4
      overflow-y-auto bg-muted
      ${scrollbarClassname}
    `}
    >
      {/* 第 1 组: toastQueue 方法测试 */}
      <div className="w-full p-3 my-4 bg-card rounded-xl flex flex-col items-start">
        <h3 className="text-lg font-semibold mb-3">toastQueue 方法测试</h3>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button variant="default" onClick={handleSuccess}>
            Success
          </Button>
          <Button variant="destructive" onClick={handleError}>
            Error
          </Button>
          <Button variant="outline" onClick={handleWarning}>
            Warning
          </Button>
          <Button variant="secondary" onClick={handleInfo}>
            Info
          </Button>
          <Button variant="ghost" onClick={handleLoading} className="col-span-2">
            Loading（3 秒后自动关闭）
          </Button>
        </div>
      </div>

      {/* 第 2 组: rawToast 位置测试 */}
      <div className="w-full p-3 my-4 bg-card rounded-xl flex flex-col items-start">
        <h3 className="text-lg font-semibold mb-3">rawToast 位置测试</h3>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button variant="outline" onClick={handleTopLeft}>
            Top Left
          </Button>
          <Button variant="outline" onClick={handleTopCenter}>
            Top Center
          </Button>
          <Button variant="outline" onClick={handleTopRight}>
            Top Right
          </Button>
          <Button variant="outline" onClick={handleBottomLeft}>
            Bottom Left
          </Button>
          <Button variant="outline" onClick={handleBottomCenter}>
            Bottom Center
          </Button>
          <Button variant="outline" onClick={handleBottomRight}>
            Bottom Right
          </Button>
        </div>
      </div>

      {/* 第 3 组: 队列机制测试 */}
      <div className="w-full p-3 my-4 bg-card rounded-xl flex flex-col items-start">
        <h3 className="text-lg font-semibold mb-3">队列机制测试</h3>
        <div className="grid grid-cols-1 gap-2 w-full">
          <Button variant="default" onClick={handleQueueTest}>
            快速连续触发 5 个 toast（查看控制台获取 ID）
          </Button>
          <Button variant="secondary" onClick={handleDismissLatest}>
            显示 Toast 后 1 秒关闭
          </Button>
          <Button variant="destructive" onClick={handleDismissAll}>
            关闭所有 Toast
          </Button>
        </div>
      </div>

      {/* 第 4 组: Promise 测试 */}
      <div className="w-full p-3 my-4 bg-card rounded-xl flex flex-col items-start">
        <h3 className="text-lg font-semibold mb-3">Promise 测试</h3>
        <div className="grid grid-cols-1 gap-2 w-full">
          <Button variant="default" onClick={handlePromiseSuccess}>
            Promise Success（2 秒延迟）
          </Button>
          <Button variant="destructive" onClick={handlePromiseError}>
            Promise Error（2 秒延迟）
          </Button>
          <Button variant="secondary" onClick={handlePromiseLoading}>
            Promise Loading（3 秒加载）
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ToastTest;
