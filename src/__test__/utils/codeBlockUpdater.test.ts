/**
 * codeBlockUpdater 测试
 *
 * 测试代码块 DOM 更新逻辑、重试机制、内容匹配和待更新管理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  updateCodeBlockDOM,
  cleanupPendingUpdates,
  getPendingUpdatesCount,
} from '@/utils/codeBlockUpdater';

/** 将数组包装为 NodeListOf<Element> 类型 */
function asNodeList(elements: any[]): NodeListOf<Element> {
  return elements as unknown as NodeListOf<Element>;
}

describe('codeBlockUpdater', () => {
  let querySelectorAllSpy: ReturnType<typeof vi.spyOn>;
  let containsSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    cleanupPendingUpdates();
  });

  afterEach(() => {
    querySelectorAllSpy?.mockRestore();
    containsSpy?.mockRestore();
    cleanupPendingUpdates();
    vi.useRealTimers();
  });

  describe('DOM 元素成功更新', () => {
    it('应该在目标元素存在时更新 innerHTML', () => {
      const mockElement = {
        textContent: 'const x = 1;',
        innerHTML: '',
      };
      querySelectorAllSpy = vi.spyOn(document, 'querySelectorAll').mockReturnValue(asNodeList([mockElement as any]));
      containsSpy = vi.spyOn(document, 'contains').mockReturnValue(true);

      updateCodeBlockDOM('const x = 1;', 'javascript', '<span>const</span> x = 1;');

      vi.runOnlyPendingTimers();

      expect(mockElement.innerHTML).toBe('<span>const</span> x = 1;');
      expect(getPendingUpdatesCount()).toBe(1);
    });
  });

  describe('重试机制', () => {
    it('应该在元素不存在时触发重试', () => {
      querySelectorAllSpy = vi.spyOn(document, 'querySelectorAll').mockReturnValue(asNodeList([]));

      updateCodeBlockDOM('code', 'python', '<highlighted>');

      // 触发初始 setTimeout(0)
      vi.runOnlyPendingTimers();
      // 触发重试的 setTimeout(16)
      vi.advanceTimersByTime(16);

      expect(querySelectorAllSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('应该在达到最大重试次数后停止', () => {
      querySelectorAllSpy = vi.spyOn(document, 'querySelectorAll').mockReturnValue(asNodeList([]));

      updateCodeBlockDOM('code', 'rust', '<highlighted>', 0, 2);

      // 初始 + 2 次重试 = 3 次调用，依次推进延迟
      vi.runOnlyPendingTimers();   // 第 1 次 (delay=0)
      vi.advanceTimersByTime(16);  // 第 2 次 (delay=16)
      vi.advanceTimersByTime(50);  // 第 3 次 (delay=50)

      // 额外推进确保没有更多调用
      vi.advanceTimersByTime(500);

      const rustCalls = querySelectorAllSpy.mock.calls.filter(
        (call: [string]) => call[0].includes('rust')
      );
      // 初始 + 2 次重试 = 3 次
      expect(rustCalls.length).toBe(3);
    });

    it('应该在重试过程中元素出现后成功更新', () => {
      const mockElement = {
        textContent: 'def hello():',
        innerHTML: '',
      };

      let callCount = 0;
      querySelectorAllSpy = vi.spyOn(document, 'querySelectorAll').mockImplementation((): NodeListOf<Element> => {
        callCount++;
        if (callCount >= 2) {
          return asNodeList([mockElement as any]);
        }
        return asNodeList([]);
      });
      containsSpy = vi.spyOn(document, 'contains').mockReturnValue(true);

      updateCodeBlockDOM('def hello():', 'python', '<span>def</span> hello():');

      // 第一次尝试（delay=0）- 元素不存在
      vi.runOnlyPendingTimers();
      expect(mockElement.innerHTML).toBe('');

      // 第二次重试（delay=16）- 元素出现
      vi.advanceTimersByTime(16);
      expect(mockElement.innerHTML).toBe('<span>def</span> hello():');
    });
  });

  describe('内容匹配', () => {
    it('应该在内容不匹配时跳过更新', () => {
      const mockElement = {
        textContent: 'different code',
        innerHTML: 'original',
      };
      querySelectorAllSpy = vi.spyOn(document, 'querySelectorAll').mockReturnValue(asNodeList([mockElement as any]));
      containsSpy = vi.spyOn(document, 'contains').mockReturnValue(true);

      updateCodeBlockDOM('expected code', 'javascript', '<highlighted>');

      vi.runOnlyPendingTimers();

      expect(mockElement.innerHTML).toBe('original');
    });

    it('应该在元素从 DOM 树移除时跳过更新', () => {
      const mockElement = {
        textContent: 'const x = 1;',
        innerHTML: '',
      };
      querySelectorAllSpy = vi.spyOn(document, 'querySelectorAll').mockReturnValue(asNodeList([mockElement as any]));
      containsSpy = vi.spyOn(document, 'contains').mockReturnValue(false);

      updateCodeBlockDOM('const x = 1;', 'javascript', '<span>const</span> x = 1;');

      vi.runOnlyPendingTimers();

      expect(mockElement.innerHTML).toBe('');
    });
  });

  describe('待更新管理', () => {
    it('应该返回正确的待更新数量', () => {
      expect(getPendingUpdatesCount()).toBe(0);

      const mockElement = {
        textContent: 'code1',
        innerHTML: '',
      };
      querySelectorAllSpy = vi.spyOn(document, 'querySelectorAll').mockReturnValue(asNodeList([mockElement as any]));
      containsSpy = vi.spyOn(document, 'contains').mockReturnValue(true);

      updateCodeBlockDOM('code1', 'js', '<hl>');

      vi.runOnlyPendingTimers();

      expect(getPendingUpdatesCount()).toBe(1);
    });

    it('应该在清理后返回 0', () => {
      const mockElement = {
        textContent: 'code',
        innerHTML: '',
      };
      querySelectorAllSpy = vi.spyOn(document, 'querySelectorAll').mockReturnValue(asNodeList([mockElement as any]));
      containsSpy = vi.spyOn(document, 'contains').mockReturnValue(true);

      updateCodeBlockDOM('code', 'js', '<hl>');
      vi.runOnlyPendingTimers();

      cleanupPendingUpdates();
      expect(getPendingUpdatesCount()).toBe(0);
    });

    it('应该在 5 秒后自动清理记录', () => {
      const mockElement = {
        textContent: 'code',
        innerHTML: '',
      };
      querySelectorAllSpy = vi.spyOn(document, 'querySelectorAll').mockReturnValue(asNodeList([mockElement as any]));
      containsSpy = vi.spyOn(document, 'contains').mockReturnValue(true);

      updateCodeBlockDOM('code', 'js', '<hl>');
      vi.runOnlyPendingTimers();

      expect(getPendingUpdatesCount()).toBe(1);

      // 推进 5 秒触发自动清理
      vi.advanceTimersByTime(5000);
      expect(getPendingUpdatesCount()).toBe(0);
    });
  });
});
