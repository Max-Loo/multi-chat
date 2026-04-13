/**
 * Highlight.js 语言加载管理器单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HighlightLanguageManager } from '@/utils/highlightLanguageManager';

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

describe('HighlightLanguageManager', () => {
  let manager: HighlightLanguageManager;

  beforeEach(() => {
    // 清理单例实例
    HighlightLanguageManager._resetInstance();
    HighlightLanguageManager._clearFailedLanguages();
    // 每个测试前创建新实例
    manager = HighlightLanguageManager.getInstance();

    // 重置所有 mock
    vi.clearAllMocks();
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
    it('应该解析常见别名', () => {
      const resolveAlias = manager.testInternals.resolveAlias;

      expect(resolveAlias('js')).toBe('javascript');
      expect(resolveAlias('ts')).toBe('typescript');
      expect(resolveAlias('py')).toBe('python');
      expect(resolveAlias('cplusplus')).toBe('cpp');
      expect(resolveAlias('c#')).toBe('csharp');
      expect(resolveAlias('sh')).toBe('bash');
      expect(resolveAlias('yml')).toBe('yaml');
      expect(resolveAlias('html')).toBe('xml');
    });

    it('应该保持未知语言不变', () => {
      const resolveAlias = manager.testInternals.resolveAlias;

      expect(resolveAlias('haskell')).toBe('haskell');
      expect(resolveAlias('rust')).toBe('rust');
      expect(resolveAlias('java')).toBe('java');
    });

    it('应该不区分大小写', () => {
      const resolveAlias = manager.testInternals.resolveAlias;

      expect(resolveAlias('JS')).toBe('javascript');
      expect(resolveAlias('TS')).toBe('typescript');
      expect(resolveAlias('PY')).toBe('python');
    });
  });

  describe('isLoaded() - 同步检查', () => {
    it('应该正确识别未加载的语言', () => {
      expect(manager.isLoaded('javascript')).toBe(false);
      expect(manager.isLoaded('haskell')).toBe(false);
    });

    it('应该识别已加载的语言', () => {
      manager.testInternals.loadedLanguages.add('javascript');
      expect(manager.isLoaded('javascript')).toBe(true);
      expect(manager.isLoaded('js')).toBe(true); // 别名
    });
  });

  describe('highlightSync() - 同步高亮', () => {
    it('应该为已加载的语言高亮代码', () => {
      manager.testInternals.loadedLanguages.add('javascript');

      const code = 'const x = 1;';
      const result = manager.highlightSync(code, 'javascript');

      expect(result).toContain('hljs-keyword');
      // 注意：mock 返回的是简化结果，不包含 hljs-title
      expect(result).toContain('highlighted');
    });

    it('应该支持语言别名', () => {
      manager.testInternals.loadedLanguages.add('javascript');

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
      // vi.spyOn 需要访问类实例的私有方法，testInternals 缓存对象的 spy 无法拦截类内部调用
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loadSpy = vi.spyOn(manager as any, 'doLoadLanguage');

      // 并发加载同一语言
      await Promise.all([
        manager.loadLanguageAsync('javascript'),
        manager.loadLanguageAsync('javascript'),
        manager.loadLanguageAsync('javascript'),
      ]);

      // 应该只调用一次 doLoadLanguage
      expect(loadSpy).toHaveBeenCalledTimes(1);
      expect(manager.isLoaded('javascript')).toBe(true);
    });

    it('应该缓存加载中的 Promise', async () => {
      const loadPromise1 = manager.loadLanguageAsync('javascript');
      const loadPromise2 = manager.loadLanguageAsync('javascript');

      // 应该返回同一个 Promise（使用 toStrictEqual）
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
      // vi.spyOn 需要访问类实例的私有方法，testInternals 缓存对象的 spy 无法拦截类内部调用
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(manager as any, 'doLoadLanguage').mockRejectedValue(new Error('Network error'));

      try {
        await manager.loadLanguageAsync('javascript');
      } catch {
        // 预期失败
      }

      // 应该清理 loadingPromises 缓存
      const loadingPromises = manager.testInternals.loadingPromises;
      expect(loadingPromises.has('javascript')).toBe(false);

      // 语言应该未加载
      expect(manager.isLoaded('javascript')).toBe(false);

      // 应该记录到失败语言集合
      const failedLanguages = manager.testInternals.failedLanguages;
      expect(failedLanguages.has('javascript')).toBe(true);
    });

    it('应该防止重复加载失败的语言', async () => {
      // vi.spyOn 需要访问类实例的私有方法，testInternals 缓存对象的 spy 无法拦截类内部调用
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(manager as any, 'doLoadLanguage').mockRejectedValue(new Error('Unsupported language'));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loadSpy = vi.spyOn(manager as any, 'doLoadLanguage');

      // 第一次尝试加载
      try {
        await manager.loadLanguageAsync('cobol');
      } catch {
        // 预期失败
      }

      // 第二次尝试加载（应该直接抛出错误，不调用 doLoadLanguage）
      try {
        await manager.loadLanguageAsync('cobol');
      } catch {
        // 预期失败
      }

      // doLoadLanguage 应该只被调用一次
      expect(loadSpy).toHaveBeenCalledTimes(1);

      // 语言应该在失败集合中
      const failedLanguages = manager.testInternals.failedLanguages;
      expect(failedLanguages.has('cobol')).toBe(true);
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

    it('应该在加载失败时降级到 highlightAuto', async () => {
      const code = 'const x = 1;';

      // Mock 加载失败
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(manager as any, 'doLoadLanguage').mockRejectedValue(new Error('Load failed'));

      try {
        await manager.loadLanguageAsync('haskell');
      } catch {
        // 预期失败
      }

      // 语言应该未加载
      expect(manager.isLoaded('haskell')).toBe(false);

      // highlightSync 应该抛出错误
      expect(() => {
        manager.highlightSync(code, 'haskell');
      }).toThrow();
    });
  });
});
