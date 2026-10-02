/**
 * 自动调整 textarea 高度组合式函数（对应旧版 hooks/useAutoResizeTextarea.ts）
 *
 * 根据内容自动调整高度，在最小/最大高度之间动态变化，超过后显示滚动条。
 */
import {
  ref,
  computed,
  watch,
  type Ref,
  type ComputedRef,
} from 'vue';

/** 配置选项 */
export interface UseAutoResizeTextareaOptions {
  /** 最大高度（像素），默认 192 */
  maxHeight?: number;
  /** 最小高度（像素），默认 60 */
  minHeight?: number;
}

/** 返回值 */
export interface UseAutoResizeTextareaResult {
  /** 绑定到 textarea 元素（或其包装组件）的 ref */
  textareaRef: Ref<HTMLTextAreaElement | null>;
  /** 是否需要显示滚动条 */
  isScrollable: ComputedRef<boolean>;
  /** 聚焦 textarea 并将光标移至末尾 */
  focusTextarea: () => void;
}

/**
 * 从 ref 值解析原生 textarea 元素
 * ref 可能绑定到包装组件（如 Textarea.vue，值为组件实例）或原生元素
 */
const resolveTextarea = (raw: unknown): HTMLTextAreaElement | null => {
  if (!raw) return null;
  const candidate = (raw as { $el?: unknown }).$el ?? raw;
  return candidate instanceof HTMLTextAreaElement ? candidate : null;
};

/**
 * 自动调整 textarea 高度
 *
 * @param value textarea 的值（响应式）
 * @param options 配置选项
 */
export function useAutoResizeTextarea(
  value: Ref<string>,
  options?: UseAutoResizeTextareaOptions,
): UseAutoResizeTextareaResult {
  const { maxHeight = 192, minHeight = 60 } = options || {};

  const textareaRef = ref<HTMLTextAreaElement | null>(null);
  const isScrollable = ref(false);

  /**
   * 聚焦 textarea 并将光标移至末尾（供编辑场景使用）
   */
  const focusTextarea = (): void => {
    const textarea = resolveTextarea(textareaRef.value);
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  };

  watch(
    [value, textareaRef],
    () => {
      const textarea = resolveTextarea(textareaRef.value);

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
    isScrollable: computed(() => isScrollable.value),
    focusTextarea,
  };
}
