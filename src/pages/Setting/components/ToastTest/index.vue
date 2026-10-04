<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { Button } from '@/components/ui/button';
import { toastQueue } from '@/services/toast';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';

/**
 * Toast 测试页面（仅开发环境路由可达）
 *
 * 覆盖各类型、各位置、队列与关闭能力的验证入口
 */
const { t } = useTranslation();
const { scrollbarClassname, onScrollEvent } = useAdaptiveScrollbar();

/** 成功提示 */
function handleSuccess(): void {
  toastQueue.success('操作成功');
}

/** 错误提示 */
function handleError(): void {
  toastQueue.error('操作失败');
}

/** 警告提示 */
function handleWarning(): void {
  toastQueue.warning('警告信息');
}

/** 信息提示 */
function handleInfo(): void {
  toastQueue.info('提示信息');
}

/** 加载提示 */
function handleLoading(): void {
  toastQueue.loading('加载中...', { duration: 3000 });
}

/** 六个位置的位置提示 */
function handlePosition(position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'): void {
  toastQueue.info(`位置：${position}`, { position });
}

/** 队列顺序测试：连续入栈多条并记录 ID */
async function handleQueueTest(): Promise<void> {
  const ids: Array<string | number> = [];
  for (let i = 1; i <= 5; i++) {
    const id = await toastQueue.success(`消息 ${i}`);
    if (id !== undefined) ids.push(id);
  }
  console.log('[toast-test] 入队 ID：', ids);
}

/** 关闭最新一条 */
async function handleDismissLatest(): Promise<void> {
  const id = await toastQueue.success('将被关闭的 Toast');
  setTimeout(() => {
    if (id !== undefined) toastQueue.dismiss(id);
  }, 1000);
}

/** 关闭全部 */
function handleDismissAll(): void {
  toastQueue.dismiss();
}

/** Promise 成功流程 */
function handlePromiseSuccess(): void {
  const promise = new Promise<string>((resolve) => {
    setTimeout(() => resolve('数据加载完成'), 1000);
  });
  toastQueue.promise(promise, {
    loading: '加载数据中...',
    success: (data: string) => data,
    error: '加载失败',
  });
}

/** Promise 失败流程 */
function handlePromiseError(): void {
  const promise = new Promise<string>((_resolve, reject) => {
    setTimeout(() => reject(new Error('网络错误')), 1000);
  });
  toastQueue.promise(promise, {
    loading: '提交中...',
    success: '提交成功',
    error: (err: unknown) => `提交失败：${err instanceof Error ? err.message : String(err)}`,
  });
}
</script>

<!-- Toast 测试页面 -->
<template>
  <div
    :class="['w-full h-full p-4 overflow-y-auto', scrollbarClassname]"
    data-testid="toast-test-page"
    @scroll="onScrollEvent"
  >
    <h2 class="text-lg font-semibold mb-4">Toast 测试工具（仅开发环境）</h2>

    <section class="mb-6">
      <h3 class="text-sm font-medium mb-2 text-muted-foreground">基础类型</h3>
      <div class="flex flex-wrap gap-2">
        <Button size="sm" @click="handleSuccess">Success</Button>
        <Button size="sm" variant="destructive" @click="handleError">Error</Button>
        <Button size="sm" variant="outline" @click="handleWarning">Warning</Button>
        <Button size="sm" variant="outline" @click="handleInfo">Info</Button>
        <Button size="sm" variant="outline" @click="handleLoading">Loading</Button>
      </div>
    </section>

    <section class="mb-6">
      <h3 class="text-sm font-medium mb-2 text-muted-foreground">显示位置</h3>
      <div class="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" @click="handlePosition('top-left')">左上</Button>
        <Button size="sm" variant="outline" @click="handlePosition('top-center')">上中</Button>
        <Button size="sm" variant="outline" @click="handlePosition('top-right')">右上</Button>
        <Button size="sm" variant="outline" @click="handlePosition('bottom-left')">左下</Button>
        <Button size="sm" variant="outline" @click="handlePosition('bottom-center')">下中</Button>
        <Button size="sm" variant="outline" @click="handlePosition('bottom-right')">右下</Button>
      </div>
    </section>

    <section class="mb-6">
      <h3 class="text-sm font-medium mb-2 text-muted-foreground">队列与关闭</h3>
      <div class="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" @click="handleQueueTest">连续入队 5 条</Button>
        <Button size="sm" variant="outline" @click="handleDismissLatest">1 秒后关闭最新</Button>
        <Button size="sm" variant="outline" @click="handleDismissAll">关闭全部</Button>
      </div>
    </section>

    <section class="mb-6">
      <h3 class="text-sm font-medium mb-2 text-muted-foreground">Promise 流程</h3>
      <div class="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" @click="handlePromiseSuccess">成功流程</Button>
        <Button size="sm" variant="outline" @click="handlePromiseError">失败流程</Button>
      </div>
    </section>

    <p class="text-xs text-muted-foreground">{{ t('setting.toastTest') }}</p>
  </div>
</template>
