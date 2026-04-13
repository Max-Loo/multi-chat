/**
 * Highlight.js 语言加载管理器
 *
 * 功能：
 * - 单例模式管理语言加载状态
 * - 同步检查语言是否已加载
 * - 同步高亮代码（语言必须已加载）
 * - 异步加载语言包
 * - 语言别名映射（js → javascript）
 * - 并发控制（同一语言只加载一次）
 */

import hljs from "highlight.js/lib/core";
import { loadLanguageModule } from "./highlightLanguageIndex";

/**
 * 语言别名映射表
 */
const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  cplusplus: "cpp",
  "c#": "csharp",
  csharp: "csharp",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  html: "xml",
};

/**
 * Highlight.js 语言加载管理器（单例）
 */
class HighlightLanguageManager {
  private static instance: HighlightLanguageManager;

  /** 已加载的语言集合 */
  private loadedLanguages = new Set<string>();

  /** 正在加载中的语言 Promise 缓存 */
  private loadingPromises = new Map<string, Promise<void>>();

  /** 加载失败的语言集合（防止重复尝试） */
  private failedLanguages = new Set<string>();

  /** 语言别名映射表 */
  private languageAliases = new Map<string, string>(
    Object.entries(LANGUAGE_ALIASES).map(([key, value]) => [key.toLowerCase(), value])
  );

  /**
   * 构造函数（单例模式，应使用 getInstance()）
   * @internal 仅用于测试
   */
  constructor() {
    if (HighlightLanguageManager.instance) {
      throw new Error('Use getInstance() to get the singleton instance');
    }
  }

  /**
   * 重置单例实例（仅用于测试）
   * @internal
   */
  static _resetInstance(): void {
    HighlightLanguageManager.instance = undefined as unknown as HighlightLanguageManager;
  }

  /**
   * 清除失败语言记录（用于测试）
   * @internal
   */
  static _clearFailedLanguages(): void {
    const instance = HighlightLanguageManager.getInstance();
    instance.testInternals.failedLanguages.clear();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): HighlightLanguageManager {
    if (!HighlightLanguageManager.instance) {
      HighlightLanguageManager.instance = new HighlightLanguageManager();
    }
    return HighlightLanguageManager.instance;
  }

  /**
   * 解析语言别名
   * @param lang - 语言名称或别名
   * @returns 解析后的语言名称
   */
  private resolveAlias(lang: string): string {
    const normalized = lang.toLowerCase();
    return this.languageAliases.get(normalized) || lang;
  }

  /**
   * 同步检查：语言是否已加载
   * @param lang - 语言名称或别名
   * @returns 是否已加载
   */
  isLoaded(lang: string): boolean {
    const resolvedLang = this.resolveAlias(lang);
    return this.loadedLanguages.has(resolvedLang);
  }

  /**
   * 同步高亮：语言必须已加载
   * @param code - 代码字符串
   * @param lang - 语言名称或别名
   * @returns 高亮后的 HTML 字符串
   * @throws 如果语言未加载
   */
  highlightSync(code: string, lang: string): string {
    const resolvedLang = this.resolveAlias(lang);

    if (!this.loadedLanguages.has(resolvedLang)) {
      throw new Error(`Language "${resolvedLang}" is not loaded. Call loadLanguageAsync() first.`);
    }

    return hljs.highlight(code, { language: resolvedLang }).value;
  }

  /**
   * 异步加载语言包
   * @param lang - 语言名称或别名
   * @returns Promise，加载完成时 resolve
   */
  async loadLanguageAsync(lang: string): Promise<void> {
    const resolvedLang = this.resolveAlias(lang);

    // 已加载 → 直接返回
    if (this.loadedLanguages.has(resolvedLang)) {
      return;
    }

    // 之前加载失败过 → 直接抛出错误（防止无限重试）
    if (this.failedLanguages.has(resolvedLang)) {
      throw new Error(`Language "${resolvedLang}" is not supported and was previously failed to load.`);
    }

    // 正在加载中 → 返回现有 Promise
    if (this.loadingPromises.has(resolvedLang)) {
      return this.loadingPromises.get(resolvedLang);
    }

    // 首次加载
    const promise = this.doLoadLanguage(resolvedLang);
    this.loadingPromises.set(resolvedLang, promise);

    try {
      await promise;
      this.loadedLanguages.add(resolvedLang);
    } catch (error) {
      // 加载失败 → 清理缓存，记录失败，防止重试
      this.loadingPromises.delete(resolvedLang);
      this.failedLanguages.add(resolvedLang);
      throw error;
    }
  }

  /**
   * 实际加载语言包（使用语言索引）
   * @param lang - 语言名称（已解析别名）
   * @returns Promise
   */
  private async doLoadLanguage(lang: string): Promise<void> {
    // 使用语言索引加载模块
    const module = await loadLanguageModule(lang);

    // 注册语言到 highlight.js
    hljs.registerLanguage(lang, module.default);
  }

  /**
   * 预加载多个语言
   * @param languages - 语言名称数组
   * @returns Promise，所有语言加载完成时 resolve
   */
  async preloadLanguages(languages: string[]): Promise<void> {
    await Promise.all(
      languages.map(lang => this.loadLanguageAsync(lang))
    );
  }

  /**
   * 获取已加载的语言列表
   * @returns 语言名称数组
   */
  getLoadedLanguages(): string[] {
    return Array.from(this.loadedLanguages);
  }

  /**
   * 检查语言是否加载失败过
   * @param lang - 语言名称或别名
   * @returns 是否加载失败过
   */
  hasFailedToLoad(lang: string): boolean {
    const resolvedLang = this.resolveAlias(lang);
    return this.failedLanguages.has(resolvedLang);
  }

  /**
   * 检查语言是否支持（在语言索引中）
   * @param lang - 语言名称或别名
   * @returns 是否支持
   */
  isSupportedLanguage(lang: string): boolean {
    const resolvedLang = this.resolveAlias(lang);

    // 检查是否在支持的语言列表中（与 highlightLanguageIndex.ts 的 switch 语句保持一致）
    const supportedLanguages = [
      'javascript', 'typescript', 'python', 'java', 'cpp', 'xml', 'css', 'bash',
      'json', 'markdown', 'sql', 'go', 'rust', 'yaml', 'csharp', 'ruby', 'php',
      'swift', 'kotlin', 'scala', 'objectivec', 'haskell', 'lua', 'perl', 'r',
      'matlab', 'dart', 'elixir', 'erlang', 'clojure', 'fsharp', 'groovy',
      'julia', 'powershell', 'dockerfile', 'nginx', 'apache', 'diff', 'plaintext'
    ];

    return supportedLanguages.includes(resolvedLang);
  }

  /**
   * 标记语言为已加载（用于预加载场景）
   * @param lang - 语言名称
   * @deprecated 应该使用 loadLanguageAsync()，此方法仅用于特殊场景
   */
  markAsLoaded(lang: string): void {
    this.loadedLanguages.add(lang);
  }

  /** 缓存的测试内部访问对象（惰性初始化） */
  private _testInternalsCache: {
    loadedLanguages: Set<string>;
    resolveAlias: (lang: string) => string;
    loadingPromises: Map<string, Promise<void>>;
    failedLanguages: Set<string>;
    doLoadLanguage: (lang: string) => Promise<void>;
  } | null = null;

  /**
   * 测试内部状态访问器
   *
   * 暴露私有成员供单元测试使用，替代 `(manager as any).xxx` 模式。
   * **仅供测试使用，不属于公共 API。**
   * 返回对象在实例生命周期内保持稳定，支持 vi.spyOn。
   *
   * @internal
   */
  get testInternals() {
    if (!this._testInternalsCache) {
      this._testInternalsCache = {
        /** 已加载的语言集合 */
        loadedLanguages: this.loadedLanguages,
        /** 解析语言别名 */
        resolveAlias: this.resolveAlias.bind(this),
        /** 正在加载中的语言 Promise 缓存 */
        loadingPromises: this.loadingPromises,
        /** 加载失败的语言集合 */
        failedLanguages: this.failedLanguages,
        /** 实际加载语言包的方法 */
        doLoadLanguage: this.doLoadLanguage.bind(this),
      };
    }
    return this._testInternalsCache;
  }
}

// 导出单例获取函数
export const getHighlightLanguageManager = () => HighlightLanguageManager.getInstance();

// 导出类（用于测试）
export { HighlightLanguageManager };
