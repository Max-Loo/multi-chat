import { useEffect, useRef, useState } from "react";

/**
 * useAutoResizeTextarea Hook 配置选项
 */
export interface UseAutoResizeTextareaOptions {
  /** 最大高度（像素），默认 192 */
  maxHeight?: number;
  /** 最小高度（像素），默认 60 */
  minHeight?: number;
}

/**
 * useAutoResizeTextarea Hook 返回值
 */
export interface UseAutoResizeTextareaReturn {
  /** 绑定到 textarea 元素的 ref */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** 是否需要显示滚动条 */
  isScrollable: boolean;
}

/**
 * 自动调整 textarea 高度的 Hook
 * 
 * 根据 textarea 的内容自动调整高度，在最小高度和最大高度之间动态变化。
 * 超过最大高度后显示滚动条。
 * 
 * @param value - textarea 的值
 * @param options - 配置选项
 * @returns textareaRef 和 isScrollable 状态
 * 
 * @example
 * ```tsx
 * const [text, setText] = useState("");
 * const { textareaRef, isScrollable } = useAutoResizeTextarea(text, {
 *   minHeight: 60,
 *   maxHeight: 192,
 * });
 * 
 * return (
 *   <textarea
 *     ref={textareaRef}
 *     value={text}
 *     onChange={(e) => setText(e.target.value)}
 *     style={{ overflowY: isScrollable ? 'auto' : 'hidden' }}
 *   />
 * );
 * ```
 */
export function useAutoResizeTextarea(
  value: string,
  options?: UseAutoResizeTextareaOptions
): UseAutoResizeTextareaReturn {
  const { maxHeight = 192, minHeight = 60 } = options || {};
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const textarea = textareaRef.current;
    
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
    setIsScrollable(scrollHeight > maxHeight);
  }, [value, minHeight, maxHeight]);

  return {
    textareaRef,
    isScrollable,
  };
}
