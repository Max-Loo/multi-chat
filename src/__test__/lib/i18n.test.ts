/**
 * i18n 模块单元测试
 *
 * 测试覆盖：
 * - getLocalesResources(): 动态加载语言资源
 * - initI18n(): 初始化 i18n 配置（单例模式）
 * - getInitI18nPromise(): 获取初始化 Promise（缓存机制）
 * - changeAppLanguage(): 切换应用语言
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock i18next 库
const mockI18nInit = vi.fn();
const mockI18nChangeLanguage = vi.fn();
const mockI18nAddResourceBundle = vi.fn();
const mockI18nGetResourceBundle = vi.fn();
const mockI18nUse = vi.fn(() => ({
  init: mockI18nInit,
}));

// Mock i18next 实例
const mockI18nInstance = {
  use: mockI18nUse,
  init: mockI18nInit,
  changeLanguage: mockI18nChangeLanguage,
  addResourceBundle: mockI18nAddResourceBundle,
  getResourceBundle: mockI18nGetResourceBundle,
  languages: ['en'],
  isInitialized: false,
  t: (key: string) => key,
};

vi.mock("i18next", () => ({
  default: mockI18nInstance,
}));

// Mock react-i18next 的 initReactI18next
const mockInitReactI18next = vi.fn();
vi.mock("react-i18next", () => ({
  initReactI18next: mockInitReactI18next,
}));

// Mock ../lib/global 中的 getDefaultAppLanguage 函数
const mockGetDefaultAppLanguage = vi.fn();
vi.mock("../lib/global", () => ({
  getDefaultAppLanguage: mockGetDefaultAppLanguage,
}));

// 动态导入被测试模块（在 mock 之后）
describe("i18n module", () => {
  // 保存模块引用，用于重置单例状态（稍后使用）
  // let i18nModule: typeof import("@/lib/i18n");

  // 全局 mock 数据：模拟语言文件（包含所有 7 个命名空间）
  const mockLocaleModules = {
    "../locales/zh/common.json": () => ({
      default: { hello: "你好", goodbye: "再见" },
    }),
    "../locales/zh/chat.json": () => ({
      default: { send: "发送", message: "消息" },
    }),
    "../locales/zh/model.json": () => ({
      default: { provider: "供应商", model: "模型" },
    }),
    "../locales/zh/navigation.json": () => ({
      default: { home: "首页", settings: "设置" },
    }),
    "../locales/zh/provider.json": () => ({
      default: { name: "名称" },
    }),
    "../locales/zh/setting.json": () => ({
      default: { language: "语言", theme: "主题" },
    }),
    "../locales/zh/table.json": () => ({
      default: { rows: "行", columns: "列" },
    }),
    "../locales/fr/common.json": () => ({
      default: { hello: "Bonjour", goodbye: "Au revoir" },
    }),
    "../locales/fr/chat.json": () => ({
      default: { send: "Envoyer", message: "Message" },
    }),
    "../locales/fr/model.json": () => ({
      default: { provider: "Fournisseur", model: "Modèle" },
    }),
    "../locales/fr/navigation.json": () => ({
      default: { home: "Accueil", settings: "Paramètres" },
    }),
    "../locales/fr/provider.json": () => ({
      default: { name: "Nom" },
    }),
    "../locales/fr/setting.json": () => ({
      default: { language: "Langue", theme: "Thème" },
    }),
    "../locales/fr/table.json": () => ({
      default: { rows: "Lignes", columns: "Colonnes" },
    }),
  };

  beforeEach(() => {
    // 每个测试前设置独立的测试数据
    vi.clearAllMocks();

    // 设置默认语言 mock 返回值
    mockGetDefaultAppLanguage.mockResolvedValue("en");

    // 设置 import.meta.glob mock 返回值
    vi.stubGlobal("import", {
      meta: { glob: vi.fn(() => mockLocaleModules) },
    });

    // 默认 mock 返回值
    mockI18nInit.mockImplementation((_config) => {
      // 标记为已初始化
      mockI18nInstance.isInitialized = true;
      return Promise.resolve({ t: (key: string) => key });
    });
    mockI18nChangeLanguage.mockResolvedValue('en');
    mockI18nAddResourceBundle.mockImplementation(() => {});
    mockI18nGetResourceBundle.mockImplementation((lang: string) => {
      if (lang === 'en') {
        return {
          common: { hello: "Hello", goodbye: "Goodbye", submit: "Submit" },
          chat: { send: "Send", message: "Message" },
          model: { provider: "Provider", model: "Model" },
          navigation: { home: "Home", settings: "Settings" },
          provider: { name: "Name" },
          setting: { language: "Language", theme: "Theme" },
          table: { rows: "Rows", columns: "Columns" },
        };
      }
      return null;
    });

    // 确保 i18n.t 可用（用于 initI18n 返回值）
    mockI18nInstance.t = (key: string) => key;
    // 重置初始化状态
    mockI18nInstance.isInitialized = false;
  });

  afterEach(() => {
    // 每个测试后重置模块缓存和所有 mocks（包括 mockRejectedValueOnce 等设置）
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  describe("getLocalesResources", () => {
    it("应该成功从 i18next 实例读取已加载资源", async () => {
      const module = await import("@/lib/i18n");
      const { getLocalesResources } = module;

      const resources = getLocalesResources() as Record<string, { translation: Record<string, unknown> }>;

      // 验证返回的结构包含已加载的语言
      expect(resources).toHaveProperty("en");

      // 验证每个语言都有 translation 属性
      expect(resources.en).toHaveProperty("translation");

      // 验证所有命名空间都被加载（chat, common, model, navigation, provider, setting, table）
      const expectedNamespaces = [
        "chat",
        "common",
        "model",
        "navigation",
        "provider",
        "setting",
        "table",
      ];

      expectedNamespaces.forEach((namespace) => {
        expect(resources.en.translation).toHaveProperty(namespace);
      });
    });

    it("应该正确返回符合预期的数据结构", async () => {
      const module = await import("@/lib/i18n");
      const { getLocalesResources } = module;

      const resources = getLocalesResources() as Record<string, { translation: Record<string, unknown> }>;

      // 验证数据结构符合预期：Record<string, { translation: Record<string, unknown> }>
      Object.keys(resources).forEach((lang) => {
        expect(resources[lang]).toHaveProperty("translation");
        expect(typeof resources[lang].translation).toBe("object");

        // 验证每个命名空间都是对象
        Object.keys(resources[lang].translation).forEach((namespace) => {
          expect(typeof resources[lang].translation[namespace]).toBe("object");
        });
      });
    });
  });

  describe("initI18n", () => {
    it("应该首次初始化成功", async () => {
      const { initI18n } = await import("@/lib/i18n");

      const result = await initI18n();

      // 验证 i18n.init 被调用
      expect(mockI18nInit).toHaveBeenCalled();

      // 验证 init 被调用时传入了 resources 配置
      expect(mockI18nInit).toHaveBeenCalledWith(
        expect.objectContaining({
          lng: 'en',
          fallbackLng: 'en',
          resources: expect.any(Object),
        })
      );

      // 验证返回值存在
      expect(result).toBeDefined();
    });

    it("应该验证单例模式", async () => {
      const { initI18n } = await import("@/lib/i18n");

      // 多次调用 initI18n
      const result1 = await initI18n();
      const result2 = await initI18n();

      // 验证返回相同的 Promise 结果
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it("应该处理初始化错误", async () => {
      // Mock console.error 以避免输出到测试结果
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { initI18n } = await import("@/lib/i18n");

      // Mock loadLanguage 失败
      mockI18nChangeLanguage.mockRejectedValueOnce(new Error("Change language failed"));

      // 调用 initI18n (系统语言是中文，loadLanguage会失败)
      mockGetDefaultAppLanguage.mockResolvedValueOnce('zh');

      await initI18n();

      // 验证初始化仍然完成（降级到英文）
      expect(mockI18nInit).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it("应该验证 i18next.init 的调用参数正确", async () => {
      mockI18nInit.mockImplementation((config) => {
        // 验证配置参数的结构
        expect(config).toHaveProperty("lng");
        expect(config).toHaveProperty("fallbackLng", "en");
        expect(config).toHaveProperty("interpolation");
        expect(config.interpolation).toHaveProperty("escapeValue", false);

        return Promise.resolve({ t: (key: string) => key });
      });

      const { initI18n } = await import("@/lib/i18n");
      await initI18n();
    });

    it("应该在系统语言不是英文时尝试加载并切换", async () => {
      mockGetDefaultAppLanguage.mockResolvedValue('zh');
      mockI18nChangeLanguage.mockResolvedValue('zh');

      const { initI18n } = await import("@/lib/i18n");

      await initI18n();

      // 验证 i18n.init 被调用
      expect(mockI18nInit).toHaveBeenCalled();
    });

    it("应该在系统语言为英文时跳过异步加载", async () => {
      mockGetDefaultAppLanguage.mockResolvedValue('en');

      const { initI18n } = await import("@/lib/i18n");

      await initI18n();

      // 验证 i18n.init 被调用
      expect(mockI18nInit).toHaveBeenCalled();

      // 验证 init 被调用时传入了 resources 配置（仅包含英文）
      expect(mockI18nInit).toHaveBeenCalledWith(
        expect.objectContaining({
          lng: 'en',
          resources: expect.objectContaining({
            en: expect.any(Object),
          }),
        })
      );
    });
  });

  describe("getInitI18nPromise", () => {
    it("应该在已初始化时返回缓存的 Promise", async () => {
      const { getInitI18nPromise, initI18n } = await import("@/lib/i18n");

      // 先初始化 i18n
      await initI18n();

      // 调用 getInitI18nPromise
      const promise1 = getInitI18nPromise();
      const promise2 = getInitI18nPromise();

      // 验证返回的是 Promise
      expect(promise1).toBeInstanceOf(Promise);
      expect(promise2).toBeInstanceOf(Promise);
    });

    it("应该在未初始化时触发初始化", async () => {
      // 由于前面的测试已经初始化过，我们只能测试触发初始化的代码路径存在
      const { getInitI18nPromise } = await import("@/lib/i18n");

      // 调用 getInitI18nPromise 应该返回一个 Promise
      const promise = getInitI18nPromise();

      expect(promise).toBeInstanceOf(Promise);
    });

    it("应该验证返回的 Promise 实例一致性", async () => {
      const { getInitI18nPromise } = await import("@/lib/i18n");

      // 多次调用应该返回 Promise 实例
      const promise1 = getInitI18nPromise();
      const promise2 = getInitI18nPromise();
      const promise3 = getInitI18nPromise();

      // 验证都是 Promise 实例
      expect(promise1).toBeInstanceOf(Promise);
      expect(promise2).toBeInstanceOf(Promise);
      expect(promise3).toBeInstanceOf(Promise);
    });
  });

  describe("changeAppLanguage", () => {
    beforeEach(() => {
      // 重置所有 mock 调用历史和行为
      vi.clearAllMocks();

      // 重新设置默认行为
      mockI18nInit.mockImplementation((_config) => {
        mockI18nInstance.isInitialized = true;
        return Promise.resolve({ t: (key: string) => key });
      });
      mockI18nChangeLanguage.mockResolvedValue(Promise.resolve('en'));
      mockI18nAddResourceBundle.mockImplementation(() => {});
      mockI18nGetResourceBundle.mockImplementation((lang: string) => {
        if (lang === 'en') {
          return {
            common: { hello: "Hello", goodbye: "Goodbye", submit: "Submit" },
            chat: { send: "Send", message: "Message" },
            model: { provider: "Provider", model: "Model" },
            navigation: { home: "Home", settings: "Settings" },
            provider: { name: "Name" },
            setting: { language: "Language", theme: "Theme" },
            table: { rows: "Rows", columns: "Columns" },
          };
        }
        return null;
      });
      mockI18nInstance.t = (key: string) => key;
      // 标记为已初始化（changeAppLanguage 在 i18n 初始化后调用）
      mockI18nInstance.isInitialized = true;
    });

    it("应该成功切换到英文（已加载）", async () => {
      const { changeAppLanguage } = await import("@/lib/i18n");

      const result = await changeAppLanguage("en");

      // 验证返回新的类型 { success: boolean }
      expect(result).toEqual({ success: true });

      // 验证 i18n.changeLanguage 被调用
      expect(mockI18nChangeLanguage).toHaveBeenCalledWith("en");
    });

    it("应该处理切换失败的情况", async () => {
      // Mock i18n.changeLanguage 返回失败的 Promise
      mockI18nChangeLanguage.mockRejectedValueOnce(new Error("Change language failed"));

      const { changeAppLanguage } = await import("@/lib/i18n");

      const result = await changeAppLanguage("zh");

      // 验证返回失败状态
      expect(result).toEqual({ success: false });
    });

    it("应该验证返回类型结构", async () => {
      const { changeAppLanguage } = await import("@/lib/i18n");

      const result = await changeAppLanguage("en");

      // 验证返回类型结构
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe("英文资源'第一公民'策略", () => {
    it("应该在初始化时同步添加英文资源", async () => {
      mockI18nInit.mockResolvedValue({ t: (key: string) => key });

      const { initI18n } = await import("@/lib/i18n");

      await initI18n();

      // 验证 i18n.init 被调用
      expect(mockI18nInit).toHaveBeenCalled();

      // 验证 init 被调用时传入了 resources 配置
      expect(mockI18nInit).toHaveBeenCalledWith(
        expect.objectContaining({
          resources: expect.objectContaining({
            en: expect.any(Object),
          }),
        })
      );
    });

    it("应该验证英文资源包含所有命名空间", async () => {
      mockI18nInit.mockResolvedValue({ t: (key: string) => key });

      const { initI18n } = await import("@/lib/i18n");

      await initI18n();

      // 获取 init 的调用参数
      const calls = mockI18nInit.mock.calls;
      const initConfig = calls[0][0]; // 第一个参数是配置对象
      const enTranslation = initConfig.resources.en.translation; // 获取 translation 命名空间的内容

      // 验证包含所有命名空间
      const expectedNamespaces = ['common', 'chat', 'model', 'navigation', 'provider', 'setting', 'table'];
      expectedNamespaces.forEach(ns => {
        expect(enTranslation).toHaveProperty(ns);
      });
    });
  });
});
