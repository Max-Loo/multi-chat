/**
 * 代码高亮性能行为测试
 *
 * 验证 HighlightLanguageManager 并发 Promise 共享、已加载语言快速路径、
 * 失败语言防重试等行为，以及 codeBlockUpdater 重试计数在并发场景下的精确性。
 *
 * 策略：
 * - mock loadLanguageModule 追踪 doLoadLanguage 调用次数（1:1 对应）
 * - 通过 testInternals 状态属性（loadingPromises、loadedLanguages、failedLanguages）断言
 * - codeBlockUpdater 通过 spy document.querySelectorAll 追踪重试次数
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HighlightLanguageManager } from '@/utils/highlightLanguageManager';
import { loadLanguageModule } from '@/utils/highlightLanguageIndex';
import {
  updateCodeBlockDOM,
  cleanupPendingUpdates,
  getPendingUpdatesCount,
} from '@/utils/codeBlockUpdater';

// ========================================
// Mock 模块配置（HighlightLanguageManager）
// ========================================

vi.mock('highlight.js/lib/core', () => ({
  default: {
    highlight: vi.fn(() => ({
      value: '<span class="hljs-keyword">highlighted</span> code',
      language: 'test',
    })),
    highlightAuto: vi.fn(() => ({
      value: 'auto-highlighted code',
      language: 'auto',
    })),
    registerLanguage: vi.fn(),
    getLanguage: vi.fn(() => true),
  },
}));

vi.mock('@/utils/highlightLanguageIndex', () => ({
  loadLanguageModule: vi.fn().mockResolvedValue({
    default: () => ({ contains: [] }),
  }),
}));

// ========================================
// 2.1 - beforeEach 重置单例
// ========================================

describe('HighlightLanguageManager 并发加载行为', () => {
  let manager: HighlightLanguageManager;

  beforeEach(() => {
    HighlightLanguageManager._resetInstance();
    manager = HighlightLanguageManager.getInstance();

    vi.mocked(loadLanguageModule).mockResolvedValue({
      default: () => ({ contains: [] }),
    });
  });

  // ========================================
  // 2.2 并发加载 doLoadLanguage 调用次数测试
  // ========================================

  it('同一语言 3 次并发加载：loadingPromises 仅 1 个条目，loadLanguageModule 仅调用 1 次', async () => {
    const p1 = manager.loadLanguageAsync('javascript');
    const p2 = manager.loadLanguageAsync('javascript');
    const p3 = manager.loadLanguageAsync('javascript');

    // 并发期间：loadingPromises 仅 1 个条目
    expect(manager.testInternals.loadingPromises.size).toBe(1);

    // 3 个调用返回同一 Promise（async wrapper 创建新 Promise，用 toStrictEqual 验证）
    expect(p1).toStrictEqual(p2);
    expect(p2).toStrictEqual(p3);

    await Promise.all([p1, p2, p3]);

    // loadLanguageModule（= doLoadLanguage）仅调用 1 次
    expect(loadLanguageModule).toHaveBeenCalledTimes(1);
    expect(manager.isLoaded('javascript')).toBe(true);
  });

  it('同一语言先并发后串行：串行走快速路径不触发 loadLanguageModule', async () => {
    // 并发阶段
    const p1 = manager.loadLanguageAsync('python');
    const p2 = manager.loadLanguageAsync('python');

    expect(manager.testInternals.loadingPromises.size).toBe(1);

    await Promise.all([p1, p2]);
    expect(loadLanguageModule).toHaveBeenCalledTimes(1);

    // 串行阶段：已加载，走快速路径
    await manager.loadLanguageAsync('python');

    // 总共仍为 1 次调用
    expect(loadLanguageModule).toHaveBeenCalledTimes(1);
  });

  it('不同语言并发加载各自独立', async () => {
    await Promise.all([
      manager.loadLanguageAsync('javascript'),
      manager.loadLanguageAsync('python'),
      manager.loadLanguageAsync('rust'),
    ]);

    // loadLanguageModule 每种语言各 1 次
    expect(loadLanguageModule).toHaveBeenCalledTimes(3);
    expect(manager.testInternals.loadedLanguages.has('javascript')).toBe(true);
    expect(manager.testInternals.loadedLanguages.has('python')).toBe(true);
    expect(manager.testInternals.loadedLanguages.has('rust')).toBe(true);
  });

  // ========================================
  // 2.3 已加载语言快速路径测试
  // ========================================

  it('已加载语言重复调用不触发 loadLanguageModule', async () => {
    await manager.loadLanguageAsync('go');
    expect(loadLanguageModule).toHaveBeenCalledTimes(1);

    vi.mocked(loadLanguageModule).mockClear();

    // 连续调用 10 次
    for (let i = 0; i < 10; i++) {
      await manager.loadLanguageAsync('go');
    }

    // 不应触发新的 loadLanguageModule 调用
    expect(loadLanguageModule).toHaveBeenCalledTimes(0);
  });

  // ========================================
  // 2.4 失败语言防重试测试
  // ========================================

  it('失败后重试被阻止：loadLanguageModule 仅调用 1 次', async () => {
    vi.mocked(loadLanguageModule).mockRejectedValue(new Error('Unsupported language'));

    // 第一次尝试：失败
    await expect(manager.loadLanguageAsync('cobol')).rejects.toThrow();

    // 验证失败状态
    expect(manager.testInternals.failedLanguages.has('cobol')).toBe(true);
    expect(loadLanguageModule).toHaveBeenCalledTimes(1);

    // 第二次尝试：直接抛出错误（不调用 loadLanguageModule）
    await expect(manager.loadLanguageAsync('cobol')).rejects.toThrow();
    expect(loadLanguageModule).toHaveBeenCalledTimes(1);
  });

  it('失败语言不影响其他语言加载', async () => {
    vi.mocked(loadLanguageModule).mockImplementation(async (lang: string) => {
      if (lang === 'cobol') {
        throw new Error('Unsupported language');
      }
      return { default: () => ({ contains: [] }) };
    });

    // cobol 失败
    await expect(manager.loadLanguageAsync('cobol')).rejects.toThrow();
    expect(manager.testInternals.failedLanguages.has('cobol')).toBe(true);

    // javascript 正常加载
    await manager.loadLanguageAsync('javascript');
    expect(manager.testInternals.loadedLanguages.has('javascript')).toBe(true);

    // cobol 仍然是失败状态
    expect(manager.testInternals.failedLanguages.has('cobol')).toBe(true);
  });
});

// ========================================
// 2.5 codeBlockUpdater 并发重试计数测试
// ========================================

/** 跟踪测试创建的 DOM 元素 */
const createdElements: HTMLElement[] = [];

/**
 * 创建真实的 code DOM 元素
 */
function createCodeElement(textContent: string, language: string): HTMLElement {
  const codeEl = document.createElement('code');
  codeEl.className = `language-${language}`;
  codeEl.textContent = textContent;
  document.body.appendChild(codeEl);
  createdElements.push(codeEl);
  return codeEl;
}

describe('codeBlockUpdater 重试计数行为', () => {
  let querySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    cleanupPendingUpdates();
    querySpy = vi.spyOn(document, 'querySelectorAll');
  });

  afterEach(() => {
    createdElements.forEach(el => el.remove());
    createdElements.length = 0;
    cleanupPendingUpdates();
    querySpy.mockRestore();
    vi.useRealTimers();
  });

  it('单次调用精确重试 maxRetries 次后停止', () => {
    updateCodeBlockDOM('code', 'python', '<hl>', 0, 3);

    // 推进所有延迟：初始(0) → 重试1(16) → 重试2(50) → 重试3(100)
    vi.runOnlyPendingTimers(); // 初始
    vi.advanceTimersByTime(16); // 重试 1
    vi.advanceTimersByTime(50); // 重试 2
    vi.advanceTimersByTime(100); // 重试 3

    // 统计 querySelectorAll 调用次数
    const pythonQueries = querySpy.mock.calls.filter(
      (call: [string]) => call[0] === 'code[class*="language-python"]',
    );
    expect(pythonQueries.length).toBe(4); // 1 初始 + 3 重试

    // 额外推进时间，验证不再有新调用
    vi.advanceTimersByTime(1000);
    const updatedQueries = querySpy.mock.calls.filter(
      (call: [string]) => call[0] === 'code[class*="language-python"]',
    );
    expect(updatedQueries.length).toBe(4);

    // 无成功更新
    expect(getPendingUpdatesCount()).toBe(0);
  });

  it('同一语言两个不同代码块并发更新互不干扰', () => {
    // DOM 中有 code-a 元素，没有 code-b 元素
    const codeElA = createCodeElement('code-a', 'python');

    // 并发调用
    updateCodeBlockDOM('code-a', 'python', '<span>hl-a</span>');
    updateCodeBlockDOM('code-b', 'python', '<span>hl-b</span>');

    // 初始尝试 (delay=0)：runOnlyPendingTimers 仅触发初始队列中的定时器
    vi.runOnlyPendingTimers();

    // code-a 应立即更新成功
    expect(codeElA.innerHTML).toBe('<span>hl-a</span>');

    // 重试 code-b：逐步推进延迟
    vi.advanceTimersByTime(16);
    vi.advanceTimersByTime(50);
    vi.advanceTimersByTime(100);
    vi.advanceTimersByTime(200);
    vi.advanceTimersByTime(300);

    // code-a 仍保持成功更新，未被 code-b 的重试干扰
    expect(codeElA.innerHTML).toBe('<span>hl-a</span>');
  });

  it('元素在重试过程中出现后成功更新', () => {
    updateCodeBlockDOM('code', 'js', '<span>hl-js</span>');

    // 初始尝试 (delay=0) - 元素不存在
    vi.runOnlyPendingTimers();

    // 在第 1 次重试前插入元素
    const codeEl = createCodeElement('code', 'js');

    // 第 1 次重试 (delay=16) - 元素出现
    vi.advanceTimersByTime(16);

    // 验证成功更新
    expect(codeEl.innerHTML).toBe('<span>hl-js</span>');
    expect(getPendingUpdatesCount()).toBe(1);

    // 推进更多时间，验证不再重试
    vi.advanceTimersByTime(100);
    expect(getPendingUpdatesCount()).toBe(1);
  });
});
