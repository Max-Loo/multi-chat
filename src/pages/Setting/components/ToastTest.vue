<script setup lang="ts">
/**
 * Toast 测试页面（Vue 版 ToastTest，仅开发环境）
 * 提供完整的 Toast 功能测试界面，用于验证各种场景
 */
import { Button } from '@/components/ui-vue/button';
import { toastQueue, rawToast } from '@/services/toast';
import { useScrollContainer } from '@/composables/useScrollContainer';

// 生产环境保护：不渲染任何内容
const isProd = import.meta.env.PROD;

const { scrollContainerRef, scrollbarClassname } = useScrollContainer();

// ========== toastQueue 方法测试 ==========

const handleSuccess = () => {
  toastQueue.success('操作成功');
};

const handleError = () => {
  toastQueue.error('操作失败');
};

const handleWarning = () => {
  toastQueue.warning('警告信息');
};

const handleInfo = () => {
  toastQueue.info('提示信息');
};

const handleLoading = () => {
  toastQueue.loading('加载中...', { duration: 3000 });
};

// ========== rawToast 位置测试 ==========

const handleTopLeft = () => {
  rawToast.success('Top Left', { position: 'top-left' });
};

const handleTopCenter = () => {
  rawToast.success('Top Center', { position: 'top-center' });
};

const handleTopRight = () => {
  rawToast.success('Top Right', { position: 'top-right' });
};

const handleBottomLeft = () => {
  rawToast.success('Bottom Left', { position: 'bottom-left' });
};

const handleBottomCenter = () => {
  rawToast.success('Bottom Center', { position: 'bottom-center' });
};

const handleBottomRight = () => {
  rawToast.success('Bottom Right', { position: 'bottom-right' });
};

// ========== 队列机制测试 ==========

const handleQueueTest = async () => {
  const ids: Array<string | number> = [];

  for (let i = 1; i <= 5; i++) {
    const id = await toastQueue.success(`消息 ${i}`);
    ids.push(id);
  }

  console.log('Toast IDs:', ids);
};

const handleDismissLatest = async () => {
  // 显示一个新的 toast，然后立即关闭它
  const id = await toastQueue.success('将被关闭的 Toast');
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
    setTimeout(() => resolve('数据加载成功'), 2000);
  });

  toastQueue.promise(promise, {
    loading: '加载中...',
    success: (data) => data,
    error: '加载失败',
  });
};

const handlePromiseError = () => {
  const promise = new Promise<string>((_, reject) => {
    setTimeout(() => reject(new Error('网络错误')), 2000);
  });

  toastQueue.promise(promise, {
    loading: '加载中...',
    success: '加载成功',
    error: '加载失败',
  });
};

const handlePromiseLoading = () => {
  const promise = new Promise<string>((resolve) => {
    setTimeout(() => resolve('完成'), 3000);
  });

  toastQueue.promise(promise, {
    loading: '正在处理...',
    success: '处理完成',
    error: '处理失败',
  });
};
</script>

<template>
  <div
    v-if="!isProd"
    :ref="(el) => { scrollContainerRef = el as HTMLElement | null }"
    :class="`flex h-full w-full flex-col items-center justify-start overflow-y-auto bg-gray-100 px-4 ${scrollbarClassname}`"
  >
    <!-- 第 1 组: toastQueue 方法测试 -->
    <div class="my-4 flex w-full flex-col items-start rounded-xl bg-white p-3">
      <h3 class="mb-3 text-lg font-semibold">toastQueue 方法测试</h3>
      <div class="grid w-full grid-cols-2 gap-2">
        <Button variant="default" @click="handleSuccess">
          Success
        </Button>
        <Button variant="destructive" @click="handleError">
          Error
        </Button>
        <Button variant="outline" @click="handleWarning">
          Warning
        </Button>
        <Button variant="secondary" @click="handleInfo">
          Info
        </Button>
        <Button variant="ghost" class="col-span-2" @click="handleLoading">
          Loading（3 秒后自动关闭）
        </Button>
      </div>
    </div>

    <!-- 第 2 组: rawToast 位置测试 -->
    <div class="my-4 flex w-full flex-col items-start rounded-xl bg-white p-3">
      <h3 class="mb-3 text-lg font-semibold">rawToast 位置测试</h3>
      <div class="grid w-full grid-cols-2 gap-2">
        <Button variant="outline" @click="handleTopLeft">
          Top Left
        </Button>
        <Button variant="outline" @click="handleTopCenter">
          Top Center
        </Button>
        <Button variant="outline" @click="handleTopRight">
          Top Right
        </Button>
        <Button variant="outline" @click="handleBottomLeft">
          Bottom Left
        </Button>
        <Button variant="outline" @click="handleBottomCenter">
          Bottom Center
        </Button>
        <Button variant="outline" @click="handleBottomRight">
          Bottom Right
        </Button>
      </div>
    </div>

    <!-- 第 3 组: 队列机制测试 -->
    <div class="my-4 flex w-full flex-col items-start rounded-xl bg-white p-3">
      <h3 class="mb-3 text-lg font-semibold">队列机制测试</h3>
      <div class="grid w-full grid-cols-1 gap-2">
        <Button variant="default" @click="handleQueueTest">
          快速连续触发 5 个 toast（查看控制台获取 ID）
        </Button>
        <Button variant="secondary" @click="handleDismissLatest">
          显示 Toast 后 1 秒关闭
        </Button>
        <Button variant="destructive" @click="handleDismissAll">
          关闭所有 Toast
        </Button>
      </div>
    </div>

    <!-- 第 4 组: Promise 测试 -->
    <div class="my-4 flex w-full flex-col items-start rounded-xl bg-white p-3">
      <h3 class="mb-3 text-lg font-semibold">Promise 测试</h3>
      <div class="grid w-full grid-cols-1 gap-2">
        <Button variant="default" @click="handlePromiseSuccess">
          Promise Success（2 秒延迟）
        </Button>
        <Button variant="destructive" @click="handlePromiseError">
          Promise Error（2 秒延迟）
        </Button>
        <Button variant="secondary" @click="handlePromiseLoading">
          Promise Loading（3 秒加载）
        </Button>
      </div>
    </div>
  </div>
</template>
