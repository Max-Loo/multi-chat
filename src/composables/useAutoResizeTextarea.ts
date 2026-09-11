import { ref, watch, type Ref } from 'vue';

/**
 * useAutoResizeTextarea 组合式函数配置选项
 */
export interface UseAutoResizeTextareaOptions {
  /** 最大高度（像素），默认 192 */
  maxHeight?: number;
  /** 最小高度（像素），默认 60 */
  minHeight?: number;
}

/**
 * 自动调整 textarea 高度的组合式函数（Vue 版）
 *
 * 根据 textarea 的内容自动调整高度，在最小高度和最大高度之间动态变化。
 * 超过最大高度后显示滚动条。
 *
 * @param value - textarea 的值（响应式引用或普通值）
 * @param options - 配置选项
 * @returns textareaRef 和 isScrollable 状态
 */
export function useAutoResizeTextarea(
  value: Ref<string> | string,
  options?: UseAutoResizeTextareaOptions,
) {
  const { maxHeight = 192, minHeight = 60 } = options || {};

  const textareaRef = ref<HTMLTextAreaElement | null>(null);
  const isScrollable = ref(false);

  watch(
    () => (typeof value === 'object' ? value.value : value),
    () => {
      const textarea = textareaRef.value;

      // 如果 textarea 未挂载，直接返回
      if (!textarea) {
        return;
      }

      // 关键：先重置高度为 auto，才能正确计算 scrollHeight
      textarea.style.height = 'auto';

      // 计算 scrollHeight 并限制在最小和最大高度之间
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

      // 设置新高度
      textarea.style.height = `${newHeight}px`;

      // 判断是否需要显示滚动条
      isScrollable.value = scrollHeight > maxHeight;
    },
    { immediate: true, flush: 'post' },
  );

  return {
    textareaRef,
    isScrollable,
  };
}
