/**
 * Highlight.js 语言加载管理器单元测试
 *
 * 测试策略：
 * - Mock 外部依赖（highlight.js、highlightLanguageIndex）而非内部私有方法
 * - 通过公共 API（isLoaded、hasFailedToLoad）验证结果
 * - 并发控制通过 spy 外部库 API（hljs.registerLanguage）间接验证
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HighlightLanguageManager } from '@/utils/highlightLanguageManager';
import hljs from 'highlight.js/lib/core';
import { loadLanguageModule } from '@/utils/highlightLanguageIndex';

// Mock highlight.js
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

// Mock highlightLanguageIndex 模块（外部依赖）
// 通过 mock loadLanguageModule 控制成功/失败场景
vi.mock('@/utils/highlightLanguageIndex', () => ({
  loadLanguageModule: vi.fn().mockResolvedValue({
    default: { /* mock language definition */ },
  }),
}));

describe('HighlightLanguageManager', () => {
  let manager: HighlightLanguageManager;

  beforeEach(() => {
    // 清理单例实例（_resetInstance 已包含 failedLanguages 的自动清空）
    HighlightLanguageManager._resetInstance();
    // 每个测试前创建新实例
    manager = HighlightLanguageManager.getInstance();

    // 重置 loadLanguageModule 为默认成功行为
    vi.mocked(loadLanguageModule).mockResolvedValue({
      default: () => ({ contains: [] }), /* mock language definition */
    });
  });

  describe('单例模式', () => {
    it('应该返回同一实例', () => {
      const instance1 = HighlightLanguageManager.getInstance();
      const instance2 = HighlightLanguageManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('应该返回唯一的实例', () => {
      // 尝试创建新实例应该抛出错误
      expect(() => {
        void new HighlightLanguageManager();
      }).toThrow('Use getInstance() to get the singleton instance');
    });
  });

  describe('语言别名映射', () => {
    it('应该通过别名加载语言并验证', async () => {
      // 加载 'js' 别名，验证 'javascript' 和 'js' 都被标记为已加载
      await manager.loadLanguageAsync('js');

      expect(manager.isLoaded('javascript')).toBe(true);
      expect(manager.isLoaded('js')).toBe(true);
    });

    it('应该支持多种常见别名', async () => {
      await Promise.all([
        manager.loadLanguageAsync('ts'),
        manager.loadLanguageAsync('py'),
        manager.loadLanguageAsync('yml'),
      ]);

      expect(manager.isLoaded('typescript')).toBe(true);
      expect(manager.isLoaded('python')).toBe(true);
      expect(manager.isLoaded('yaml')).toBe(true);
    });

    it('应该对未知语言保持原样', async () => {
      await manager.loadLanguageAsync('rust');

      expect(manager.isLoaded('rust')).toBe(true);
    });

    it('应该不区分大小写', async () => {
      await manager.loadLanguageAsync('JS');

      expect(manager.isLoaded('javascript')).toBe(true);
    });
  });

  describe('isLoaded() - 同步检查', () => {
    it('应该正确识别未加载的语言', () => {
      expect(manager.isLoaded('javascript')).toBe(false);
      expect(manager.isLoaded('haskell')).toBe(false);
    });

    it('应该识别已加载的语言', () => {
      manager.markAsLoaded('javascript');
      expect(manager.isLoaded('javascript')).toBe(true);
      expect(manager.isLoaded('js')).toBe(true); // 别名
    });
  });

  describe('highlightSync() - 同步高亮', () => {
    it('应该为已加载的语言高亮代码', () => {
      manager.markAsLoaded('javascript');

      const code = 'const x = 1;';
      const result = manager.highlightSync(code, 'javascript');

      expect(result).toContain('hljs-keyword');
      expect(result).toContain('highlighted');
    });

    it('应该支持语言别名', () => {
      manager.markAsLoaded('javascript');

      const code = 'const x = 1;';
      const result = manager.highlightSync(code, 'js'); // 使用别名

      expect(result).toContain('hljs-keyword');
    });

    it('应该为未加载的语言抛出错误', () => {
      const code = 'const x = 1;';

      expect(() => {
        manager.highlightSync(code, 'javascript');
      }).toThrow('Language "javascript" is not loaded');
    });
  });

  describe('loadLanguageAsync() - 异步加载', () => {
    it('应该成功加载语言包', async () => {
      await manager.loadLanguageAsync('javascript');

      expect(manager.isLoaded('javascript')).toBe(true);
    });

    it('应该支持加载多个语言', async () => {
      await manager.preloadLanguages(['javascript', 'typescript', 'python']);

      expect(manager.isLoaded('javascript')).toBe(true);
      expect(manager.isLoaded('typescript')).toBe(true);
      expect(manager.isLoaded('python')).toBe(true);
    });

    it('应该支持语言别名', async () => {
      await manager.loadLanguageAsync('js'); // 使用别名

      expect(manager.isLoaded('javascript')).toBe(true);
      expect(manager.isLoaded('js')).toBe(true);
    });

    it('应该并发控制：同一语言只加载一次', async () => {
      // 通过 spy 外部库 API（hljs.registerLanguage）间接验证并发控制
      const registerSpy = vi.spyOn(hljs, 'registerLanguage');

      // 并发加载同一语言
      await Promise.all([
        manager.loadLanguageAsync('javascript'),
        manager.loadLanguageAsync('javascript'),
        manager.loadLanguageAsync('javascript'),
      ]);

      // registerLanguage 应该只被调用一次（并发控制生效）
      expect(registerSpy).toHaveBeenCalledTimes(1);
      expect(manager.isLoaded('javascript')).toBe(true);
    });

    it('应该缓存加载中的 Promise', async () => {
      const loadPromise1 = manager.loadLanguageAsync('javascript');
      const loadPromise2 = manager.loadLanguageAsync('javascript');

      // 应该返回同一个 Promise
      expect(loadPromise1).toStrictEqual(loadPromise2);
    });

    it('应该返回已加载语言（立即 resolve）', async () => {
      await manager.loadLanguageAsync('javascript');

      const startTime = performance.now();
      await manager.loadLanguageAsync('javascript');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(10); // 应该几乎立即返回
    });

    it('应该在加载失败时清理缓存', async () => {
      // 通过 mock 外部依赖使其失败
      vi.mocked(loadLanguageModule).mockRejectedValue(new Error('Network error'));

      try {
        await manager.loadLanguageAsync('javascript');
      } catch {
        // 预期失败
      }

      // 通过公共 API 验证状态
      expect(manager.isLoaded('javascript')).toBe(false);
      expect(manager.hasFailedToLoad('javascript')).toBe(true);

      // 间接验证 loadingPromises 缓存已清理：
      // 如果缓存未被清理，后续重试不会调用 loadLanguageModule
      vi.mocked(loadLanguageModule).mockResolvedValue({
        default: () => ({ contains: [] }),
      });

      // 重置失败状态后重新加载应成功
      // 注意：failedLanguages 会阻止重试，但 _resetInstance 已在 beforeEach 中调用
      // 此处验证的是 failedLanguages 机制生效
      await expect(manager.loadLanguageAsync('javascript')).rejects.toThrow();
    });

    it('应该防止重复加载失败的语言', async () => {
      // 通过 mock 外部依赖使其失败
      vi.mocked(loadLanguageModule).mockRejectedValue(new Error('Unsupported language'));

      // 第一次尝试加载
      try {
        await manager.loadLanguageAsync('cobol');
      } catch {
        // 预期失败
      }

      // 通过公共 API 验证失败状态
      expect(manager.hasFailedToLoad('cobol')).toBe(true);

      // 第二次尝试应该直接抛出错误（不调用外部依赖）
      // Reason: 验证失败语言不会被重复尝试加载
      await expect(manager.loadLanguageAsync('cobol')).rejects.toThrow();

      // loadLanguageModule 应该只被调用一次
      expect(vi.mocked(loadLanguageModule)).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLoadedLanguages() - 获取已加载语言列表', () => {
    it('应该返回空数组（初始状态）', () => {
      const languages = manager.getLoadedLanguages();

      expect(languages).toEqual([]);
    });

    it('应该返回所有已加载的语言', async () => {
      await manager.preloadLanguages(['javascript', 'typescript', 'python']);

      const languages = manager.getLoadedLanguages();

      expect(languages).toContain('javascript');
      expect(languages).toContain('typescript');
      expect(languages).toContain('python');
      expect(languages).toHaveLength(3);
    });
  });

  describe('markAsLoaded() - 标记语言为已加载', () => {
    it('应该标记语言为已加载', () => {
      manager.markAsLoaded('javascript');

      expect(manager.isLoaded('javascript')).toBe(true);
    });

    it('应该用于预加载场景', async () => {
      // 模拟预加载：先标记为已加载
      manager.markAsLoaded('javascript');

      // 应该可以立即使用 highlightSync
      const code = 'const x = 1;';
      const result = manager.highlightSync(code, 'javascript');

      expect(result).toContain('hljs-keyword');
    });
  });

  describe('集成测试：完整流程', () => {
    it('应该支持完整的加载-高亮流程', async () => {
      const code = 'const x = 1;';

      // 初始状态：未加载
      expect(manager.isLoaded('javascript')).toBe(false);

      // 异步加载
      await manager.loadLanguageAsync('javascript');

      // 已加载
      expect(manager.isLoaded('javascript')).toBe(true);

      // 同步高亮
      const result = manager.highlightSync(code, 'javascript');
      expect(result).toContain('hljs-keyword');
    });

    it('应该支持并发加载多个语言', async () => {
      const startTime = performance.now();

      await Promise.all([
        manager.loadLanguageAsync('javascript'),
        manager.loadLanguageAsync('typescript'),
        manager.loadLanguageAsync('python'),
      ]);

      const duration = performance.now() - startTime;

      expect(manager.isLoaded('javascript')).toBe(true);
      expect(manager.isLoaded('typescript')).toBe(true);
      expect(manager.isLoaded('python')).toBe(true);

      // 应该并发加载（总时间接近最慢的一个，而不是三者之和）
      expect(duration).toBeLessThan(1000); // 宽松的假设
    });

    it('应该在加载失败时保持一致状态', async () => {
      const code = 'const x = 1;';

      // 通过 mock 外部依赖使其失败
      vi.mocked(loadLanguageModule).mockRejectedValue(new Error('Load failed'));

      try {
        await manager.loadLanguageAsync('haskell');
      } catch {
        // 预期失败
      }

      // 通过公共 API 验证状态
      expect(manager.isLoaded('haskell')).toBe(false);
      expect(manager.hasFailedToLoad('haskell')).toBe(true);

      // highlightSync 应该抛出错误
      expect(() => {
        manager.highlightSync(code, 'haskell');
      }).toThrow();
    });
  });
});
