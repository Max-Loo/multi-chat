/**
 * codeBlockUpdater 测试
 *
 * 测试代码块 DOM 更新逻辑、重试机制、内容匹配和待更新管理
 *
 * 测试策略：使用 happy-dom 真实 DOM 环境，创建真实 DOM 元素进行操作，
 * 不 spy document 原生方法
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  updateCodeBlockDOM,
  cleanupPendingUpdates,
  getPendingUpdatesCount,
} from '@/utils/codeBlockUpdater';

/** 跟踪测试创建的 DOM 元素，用于精确清理 */
const createdElements: HTMLElement[] = [];

/**
 * 创建真实的 code DOM 元素并添加到 document.body
 * @param textContent 代码文本内容
 * @param language 语言名称
 * @returns 创建的 code 元素
 */
function createCodeElement(textContent: string, language: string): HTMLElement {
  const codeEl = document.createElement('code');
  codeEl.className = `language-${language}`;
  codeEl.textContent = textContent;
  document.body.appendChild(codeEl);
  createdElements.push(codeEl);
  return codeEl;
}

describe('codeBlockUpdater', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cleanupPendingUpdates();
  });

  afterEach(() => {
    createdElements.forEach((el) => el.remove());
    createdElements.length = 0;
    cleanupPendingUpdates();
    vi.useRealTimers();
  });

  describe('DOM 元素成功更新', () => {
    it('应该在目标元素存在时更新 innerHTML', () => {
      const codeEl = createCodeElement('const x = 1;', 'javascript');

      updateCodeBlockDOM('const x = 1;', 'javascript', '<span>const</span> x = 1;');

      vi.runOnlyPendingTimers();

      expect(codeEl.innerHTML).toBe('<span>const</span> x = 1;');
      expect(getPendingUpdatesCount()).toBe(1);
    });
  });

  describe('重试机制', () => {
    it('应该在元素不存在时触发重试并在最终停止', () => {
      // 不创建任何元素，让查询返回空结果
      updateCodeBlockDOM('code', 'python', '<highlighted>', 0, 2);

      // 推进所有延迟：初始(0) + 重试1(16) + 重试2(50)
      vi.runOnlyPendingTimers();
      vi.advanceTimersByTime(16);
      vi.advanceTimersByTime(50);

      // 额外推进确保没有更多调用
      vi.advanceTimersByTime(500);

      // 验证最终停止：pending count 为 0（没有成功更新）
      expect(getPendingUpdatesCount()).toBe(0);
    });

    it('应该在重试过程中元素出现后成功更新', () => {
      updateCodeBlockDOM('def hello():', 'python', '<span>def</span> hello():');

      // 第一次尝试（delay=0）- 元素不存在
      vi.runOnlyPendingTimers();

      // 现在添加元素
      const codeEl = createCodeElement('def hello():', 'python');

      // 第二次重试（delay=16）- 元素出现
      vi.advanceTimersByTime(16);
      expect(codeEl.innerHTML).toBe('<span>def</span> hello():');
    });
  });

  describe('内容匹配', () => {
    it('应该在内容不匹配时跳过更新', () => {
      const codeEl = createCodeElement('different code', 'javascript');
      codeEl.innerHTML = 'original';

      updateCodeBlockDOM('expected code', 'javascript', '<highlighted>');

      vi.runOnlyPendingTimers();

      expect(codeEl.innerHTML).toBe('original');
    });

    it('应该在元素从 DOM 树移除时跳过更新', () => {
      const codeEl = createCodeElement('const x = 1;', 'javascript');
      // 从 DOM 移除但对象仍存在
      codeEl.remove();

      updateCodeBlockDOM('const x = 1;', 'javascript', '<span>const</span> x = 1;');

      vi.runOnlyPendingTimers();

      // innerHTML 未被更新为高亮内容（保持原始文本）
      expect(codeEl.innerHTML).toBe('const x = 1;');
    });
  });

  describe('待更新管理', () => {
    it('应该返回正确的待更新数量', () => {
      expect(getPendingUpdatesCount()).toBe(0);

      createCodeElement('code1', 'js');

      updateCodeBlockDOM('code1', 'js', '<hl>');

      vi.runOnlyPendingTimers();

      expect(getPendingUpdatesCount()).toBe(1);
    });

    it('应该在清理后返回 0', () => {
      createCodeElement('code', 'js');

      updateCodeBlockDOM('code', 'js', '<hl>');
      vi.runOnlyPendingTimers();

      cleanupPendingUpdates();
      expect(getPendingUpdatesCount()).toBe(0);
    });

    it('应该在 5 秒后自动清理记录', () => {
      createCodeElement('code', 'js');

      updateCodeBlockDOM('code', 'js', '<hl>');
      vi.runOnlyPendingTimers();

      expect(getPendingUpdatesCount()).toBe(1);

      // 推进 5 秒触发自动清理
      vi.advanceTimersByTime(5000);

      expect(getPendingUpdatesCount()).toBe(0);
    });
  });
});
