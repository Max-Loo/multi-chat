/**
 * useAutoResizeTextarea Hook 单元测试
 *
 * 注意：JSDOM 测试环境限制
 * - JSDOM 不会真实计算 scrollHeight 属性
 * - 测试中通过 Object.defineProperty mock scrollHeight 值
 * - 部分 test case 依赖 rerender 后的 scrollHeight 更新，可能在 JSDOM 中表现不稳定
 * - 真实浏览器中 scrollHeight 会被正确计算，功能正常工作
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';

/**
 * 测试辅助组件：创建一个使用 useAutoResizeTextarea hook 的 textarea
 */
const TestTextarea: React.FC<{
  value: string;
  options?: { minHeight?: number; maxHeight?: number };
  onHeightChange?: (height: string) => void;
  onScrollableChange?: (isScrollable: boolean) => void;
}> = ({ value, options, onHeightChange, onScrollableChange }) => {
  const { textareaRef, isScrollable } = useAutoResizeTextarea(value, options);

  React.useEffect(() => {
    if (textareaRef.current && onHeightChange) {
      onHeightChange(textareaRef.current.style.height);
    }
  }, [value, textareaRef, onHeightChange]);

  React.useEffect(() => {
    if (onScrollableChange) {
      onScrollableChange(isScrollable);
    }
  }, [isScrollable, onScrollableChange]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={() => {}}
      style={{ overflowY: isScrollable ? 'auto' : 'hidden' }}
      data-testid="test-textarea"
    />
  );
};

describe('useAutoResizeTextarea', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // 创建容器并添加到 DOM
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // 清理 DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  describe('基础功能测试', () => {
    it('4.2 应该保持最小高度 60px 当单行输入', () => {
      let currentHeight = '';
      
      const { rerender } = render(
        <TestTextarea
          value="单行文本"
          options={{ minHeight: 60, maxHeight: 240 }}
          onHeightChange={(height) => {
            currentHeight = height;
          }}
        />,
        { container }
      );

      const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement;
      
      // Mock scrollHeight
      Object.defineProperty(textarea, 'scrollHeight', {
        writable: true,
        value: 40,
      });

      // 触发重新计算
      rerender(
        <TestTextarea
          value="单行文本"
          options={{ minHeight: 60, maxHeight: 240 }}
          onHeightChange={(height) => {
            currentHeight = height;
          }}
        />
      );

      expect(currentHeight).toBe('60px');
    });

    it('4.6 应该隐藏滚动条 当内容低于最大高度', () => {
      let isScrollable = true;

      const { rerender } = render(
        <TestTextarea
          value="中等长度内容"
          options={{ minHeight: 60, maxHeight: 240 }}
          onScrollableChange={(scrollable) => {
            isScrollable = scrollable;
          }}
        />,
        { container }
      );

      const textarea = screen.getByTestId('test-textarea') as HTMLTextAreaElement;

      // Mock scrollHeight 低于最大高度
      Object.defineProperty(textarea, 'scrollHeight', {
        writable: true,
        value: 150,
      });

      rerender(
        <TestTextarea
          value="中等长度内容"
          options={{ minHeight: 60, maxHeight: 240 }}
          onScrollableChange={(scrollable) => {
            isScrollable = scrollable;
          }}
        />
      );

      expect(isScrollable).toBe(false);
    });

    it('4.8 应该不抛出错误 当 textareaRef 为 null', () => {
      // 这个测试验证 hook 在 ref 为 null 时不会崩溃
      expect(() => {
        render(
          <TestTextarea
            value="测试文本"
            options={{ minHeight: 60, maxHeight: 240 }}
          />
        );
      }).not.toThrow();
    });
  });

});
