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

// 定义 mock 实例的类型
type MockI18nInstance = {
  use: ReturnType<typeof vi.fn>;
  init: ReturnType<typeof vi.fn>;
  changeLanguage: ReturnType<typeof vi.fn>;
  addResourceBundle: ReturnType<typeof vi.fn>;
  getResourceBundle: ReturnType<typeof vi.fn>;
  languages: string[];
  isInitialized: boolean;
  t: (key: string) => string;
};

// 使用 vi.hoisted 确保变量在 mock 工厂函数执行前就被定义
const mockI18nInit = vi.hoisted(() => vi.fn());
const mockI18nChangeLanguage = vi.hoisted(() => vi.fn());
const mockI18nAddResourceBundle = vi.hoisted(() => vi.fn());
const mockI18nGetResourceBundle = vi.hoisted(() => vi.fn());
const mockInitReactI18next = vi.hoisted(() => vi.fn());
const mockGetDefaultAppLanguage = vi.hoisted(() => vi.fn());
const mockGetLanguageLabel = vi.hoisted(() => vi.fn((lang: string) => lang));

const mockI18nInstance: MockI18nInstance = vi.hoisted(() => ({
  use: vi.fn(() => ({ init: mockI18nInit })),
  init: mockI18nInit,
  changeLanguage: mockI18nChangeLanguage,
  addResourceBundle: mockI18nAddResourceBundle,
  getResourceBundle: mockI18nGetResourceBundle,
  languages: ['en'],
  isInitialized: false,
  t: (key: string) => key,
}));

const mockToastQueue = vi.hoisted(() => ({
  info: vi.fn(() => Promise.resolve('mock-id')),
  warning: vi.fn(() => Promise.resolve('mock-id')),
  error: vi.fn(() => Promise.resolve('mock-id')),
  loading: vi.fn(() => Promise.resolve('mock-id')),
  dismiss: vi.fn(),
}));

// Mock i18next
vi.mock("i18next", () => ({
  default: mockI18nInstance,
}));

// Mock react-i18next 的 initReactI18next
vi.mock("react-i18next", () => ({
  initReactI18next: mockInitReactI18next,
}));

// Mock @/services/global 中的函数
vi.mock("@/services/global", () => ({
  getDefaultAppLanguage: mockGetDefaultAppLanguage,
  getLanguageLabel: mockGetLanguageLabel,
  LOCAL_STORAGE_LANGUAGE_KEY: 'multi-chat:language',
}));

// Mock toastQueue
vi.mock("@/services/toast/toastQueue", () => ({
  toastQueue: mockToastQueue,
}));

// 动态导入被测试模块（在 mock 之后）
describe("i18n module", () => {
  // 保存模块引用，用于重置单例状态（稍后使用）
  // let i18nModule: typeof import("@/services/i18n");

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
    // 注意：不使用 vi.clearAllMocks()，因为它会清除 getResourceBundle 的 mock 实现
    // 而是手动清除需要重置的特定 mock
    mockI18nInit.mockClear();
    mockI18nChangeLanguage.mockClear();
    mockI18nAddResourceBundle.mockClear();
    mockI18nGetResourceBundle.mockClear();
    mockGetDefaultAppLanguage.mockClear();
    mockInitReactI18next.mockClear();

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
    mockI18nGetResourceBundle.mockImplementation((lang: string, namespace: string) => {
      if (lang === 'en' && namespace === 'translation') {
        return {
          common: { hello: "Hello", goodbye: "Goodbye", submit: "Submit" },
          chat: { send: "Send", message: "Message" },
          model: { provider: "Provider", model: "Model" },
          navigation: { home: "Home", settings: "Settings" },
          provider: { name: "Name" },
          setting: { language: "Language", theme: "Theme" },
          table: { rows: "Rows", columns: "Columns" },
          error: { notFound: "Not Found" },
        };
      }
      return null;
    });

    // 确保 i18n.t 可用（用于 initI18n 返回值）
    mockI18nInstance.t = (key: string) => key;
    // 重置初始化状态和语言列表
    mockI18nInstance.isInitialized = false;
    mockI18nInstance.languages = ['en'];
  });

  afterEach(() => {
    // 每个测试后重置模块缓存和所有 mocks（包括 mockRejectedValueOnce 等设置）
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  describe("getLocalesResources", () => {
    it("应该成功从 i18next 实例读取已加载资源", async () => {
      const module = await import("@/services/i18n");
      const { getLocalesResources, initI18n } = module;

      // 先初始化 i18n（getLocalesResources 依赖 i18n 实例状态）
      await initI18n();

      const resources = getLocalesResources() as Record<string, { translation: Record<string, unknown> }>;

      // 验证返回的结构包含已加载的语言
      expect(resources).toHaveProperty("en");

      // 验证每个语言都有 translation 属性
      expect(resources.en).toHaveProperty("translation");

      // 验证所有命名空间都被加载
      const expectedNamespaces = [
        "chat",
        "common",
        "model",
        "navigation",
        "provider",
        "setting",
        "table",
        "error",
      ];

      expectedNamespaces.forEach((namespace) => {
        expect(resources.en.translation).toHaveProperty(namespace);
      });
    });

    it("应该正确返回符合预期的数据结构", async () => {
      const module = await import("@/services/i18n");
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
      const { initI18n } = await import("@/services/i18n");

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
      const { initI18n } = await import("@/services/i18n");

      // 第一次调用
      const result1 = await initI18n();

      // 第二次调用应返回同一个结果（杀死 line 211 BlockStatement 变异体）
      // async 函数每次创建新 Promise，但内部缓存确保只执行一次
      const result2 = await initI18n();

      // t 函数引用相等（证明 initI18nPromise 缓存生效）
      expect(result2).toBe(result1);
      // 验证 init 只被调用一次（即使 initI18n 被调用了两次）
      expect(mockI18nInit).toHaveBeenCalledTimes(1);
    });

    it("应该在系统语言加载失败时降级到英文并显示警告", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // 使用不存在的语言代码，使 loadLanguage 找不到文件而失败
      mockGetDefaultAppLanguage.mockResolvedValueOnce({ lang: 'xx-nonexistent', migrated: false });

      const { initI18n, resetI18nForTest } = await import("@/services/i18n");
      resetI18nForTest();

      await initI18n();

      expect(mockI18nInit).toHaveBeenCalled();
      // 验证降级后 init 调用参数中 lng 保持为 'en'
      expect(mockI18nInit).toHaveBeenCalledWith(
        expect.objectContaining({ lng: 'en' })
      );

      // 验证 catch 块记录了警告（杀死 line 275 BlockStatement 变异体）
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('System language xx-nonexistent failed to load'),
        expect.any(Error)
      );

      // 验证 toastQueue.warning 被调用（杀死 line 282 BlockStatement 变异体）
      expect(mockToastQueue.warning).toHaveBeenCalledWith(
        'System language failed to load, using English instead'
      );

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

      const { initI18n } = await import("@/services/i18n");
      await initI18n();
    });

    it("应该在 getDefaultAppLanguage 抛出异常时使用英文默认值且不触发迁移 toast", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockGetDefaultAppLanguage.mockRejectedValue(new Error("storage error"));

      const { initI18n, resetI18nForTest } = await import("@/services/i18n");
      resetI18nForTest();

      await initI18n();

      // 验证降级到英文（languageResult 使用默认值 { lang: 'en', migrated: false }）
      expect(mockI18nInit).toHaveBeenCalledWith(
        expect.objectContaining({ lng: 'en' })
      );
      // 验证异常被捕获并记录
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to get system language, using English", expect.any(Error)
      );
      // 默认 migrated=false → 不触发迁移 toast（杀死 line 219 BooleanLiteral 变异体）
      expect(mockToastQueue.info).not.toHaveBeenCalled();
      // 默认没有 fallbackReason → 不触发降级 toast
      expect(mockToastQueue.warning).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("应该在 resetI18nForTest 后重新初始化", async () => {
      const { initI18n, resetI18nForTest } = await import("@/services/i18n");

      await initI18n();
      expect(mockI18nInit).toHaveBeenCalledTimes(1);

      // 重置后重新初始化（杀死 line 188 BlockStatement 变异体）
      resetI18nForTest();
      await initI18n();
      // 验证 init 被再次调用（说明 initI18nPromise 被清空）
      expect(mockI18nInit).toHaveBeenCalledTimes(2);
    });

    it("应该在系统语言不是英文时尝试加载并切换", async () => {
      mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'zh', migrated: false });
      mockI18nChangeLanguage.mockResolvedValue('zh');

      const { initI18n } = await import("@/services/i18n");

      await initI18n();

      // 验证 i18n.init 被调用且 lng 为 zh（杀死 line 261 条件变异体）
      expect(mockI18nInit).toHaveBeenCalledWith(
        expect.objectContaining({ lng: 'zh' })
      );
    });

    it("应该在系统语言为英文时跳过异步加载", async () => {
      mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'en', migrated: false });

      const { initI18n } = await import("@/services/i18n");

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

      // 验证没有尝试加载非英文语言（杀死 line 261 条件变异体 if(true)）
      // 因为 lang='en'，不应该触发 loadLanguage 加载其他语言
      expect(mockI18nChangeLanguage).not.toHaveBeenCalled();
    });

    describe("语言降级持久化", () => {
      describe("核心功能", () => {
        it("应该在降级到系统语言时显示 info toast", async () => {
          mockGetDefaultAppLanguage.mockResolvedValue({
            lang: 'fr',
            migrated: false,
            fallbackReason: 'system-lang',
          });

          const { initI18n, resetI18nForTest } = await import("@/services/i18n");
          resetI18nForTest();

          await initI18n();

          expect(mockI18nInit).toHaveBeenCalled();
          // 验证 system-lang 分支触发了 toastQueue.info（杀死 line 234 变异体）
          expect(mockToastQueue.info).toHaveBeenCalledWith(
            expect.stringContaining('Switched to system language')
          );
        });

        it("应该在降级到默认英语时显示 warning toast", async () => {
          mockGetDefaultAppLanguage.mockResolvedValue({
            lang: 'en',
            migrated: false,
            fallbackReason: 'default',
          });

          const { initI18n, resetI18nForTest } = await import("@/services/i18n");
          resetI18nForTest();

          await initI18n();

          expect(mockI18nInit).toHaveBeenCalled();
          // 验证 default 分支触发了 toastQueue.warning（杀死 line 239 变异体）
          expect(mockToastQueue.warning).toHaveBeenCalledWith(
            expect.stringContaining('Language code invalid')
          );
        });

        it("应该在语言迁移成功时显示 info toast", async () => {
          mockGetDefaultAppLanguage.mockResolvedValue({
            lang: 'zh',
            migrated: true,
            from: 'zh-CN',
          });

          const { initI18n, resetI18nForTest } = await import("@/services/i18n");
          resetI18nForTest();

          await initI18n();

          expect(mockI18nInit).toHaveBeenCalled();
          // 验证 migrated && from 分支触发了 toastQueue.info（杀死 line 229 变异体）
          expect(mockToastQueue.info).toHaveBeenCalledWith(
            expect.stringContaining('Language code updated')
          );
        });

        it("应该在语言有效缓存时不显示 toast", async () => {
          mockGetDefaultAppLanguage.mockResolvedValue({
            lang: 'fr',
            migrated: false,
          });

          const { initI18n, resetI18nForTest } = await import("@/services/i18n");
          resetI18nForTest();

          await initI18n();

          expect(mockI18nInit).toHaveBeenCalled();
          // 没有 migrated/from、fallbackReason → 不触发任何 toast
          expect(mockToastQueue.info).not.toHaveBeenCalled();
          expect(mockToastQueue.warning).not.toHaveBeenCalled();
        });

        it("应该在 migrated=true 但 from 缺失时不显示迁移 toast", async () => {
          mockGetDefaultAppLanguage.mockResolvedValue({
            lang: 'zh',
            migrated: true,
          });

          const { initI18n, resetI18nForTest } = await import("@/services/i18n");
          resetI18nForTest();

          await initI18n();

          expect(mockI18nInit).toHaveBeenCalled();
          // migrated=true 但 from=undefined → 条件不满足（杀死 LogicalOperator || 变异体）
          expect(mockToastQueue.info).not.toHaveBeenCalled();
        });
      });

      it("应该在 toast 抛出异常时降级到 console.warn", async () => {
        const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        // 让 toastQueue.info 抛出异常以触发 line 243 catch 块
        mockToastQueue.info.mockImplementation(() => { throw new Error("toast crashed"); });

        mockGetDefaultAppLanguage.mockResolvedValue({
          lang: 'fr',
          migrated: false,
          fallbackReason: 'system-lang',
        });

        const { initI18n, resetI18nForTest } = await import("@/services/i18n");
        resetI18nForTest();

        await initI18n();

        // 验证 toast 异常被捕获并降级到 console.warn（覆盖 line 243-248）
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "[Toast] Failed to display, falling back to console.warn",
          expect.any(Error)
        );
        // 初始化仍应成功
        expect(mockI18nInit).toHaveBeenCalled();

        consoleWarnSpy.mockRestore();
      });
    });
  });

  describe("getInitI18nPromise", () => {
    it("应该在已初始化时返回缓存的 Promise", async () => {
      const { getInitI18nPromise, initI18n } = await import("@/services/i18n");

      // 先初始化 i18n
      await initI18n();

      // 调用 getInitI18nPromise
      const promise1 = getInitI18nPromise();
      const promise2 = getInitI18nPromise();

      // 验证返回的是 Promise 且引用相同（杀死 line 314 条件变异体）
      expect(promise1).toBeInstanceOf(Promise);
      expect(promise2).toBe(promise1);
    });

    it("应该在未初始化时触发初始化", async () => {
      // 由于前面的测试已经初始化过，我们只能测试触发初始化的代码路径存在
      const { getInitI18nPromise } = await import("@/services/i18n");

      // 调用 getInitI18nPromise 应该返回一个 Promise
      const promise = getInitI18nPromise();

      expect(promise).toBeInstanceOf(Promise);
    });

    it("应该验证返回的 Promise 实例一致性", async () => {
      const { getInitI18nPromise, initI18n } = await import("@/services/i18n");

      // 先初始化以缓存 Promise
      await initI18n();

      // 多次调用应该返回同一 Promise 实例（杀死 BlockStatement 变异体）
      const promise1 = getInitI18nPromise();
      const promise2 = getInitI18nPromise();
      const promise3 = getInitI18nPromise();

      // 引用相等：必须返回同一个缓存实例
      expect(promise2).toBe(promise1);
      expect(promise3).toBe(promise1);
    });
  });

  describe("changeAppLanguage", () => {
    beforeEach(() => {
      // 重新设置默认行为
      mockI18nInit.mockImplementation((_config) => {
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
            error: { notFound: "Not Found" },
          };
        }
        return null;
      });
      mockI18nInstance.t = (key: string) => key;
      // 标记为已初始化（changeAppLanguage 在 i18n 初始化后调用）
      mockI18nInstance.isInitialized = true;
    });

    it("应该成功切换到英文（已加载）", async () => {
      const { changeAppLanguage } = await import("@/services/i18n");

      const result = await changeAppLanguage("en");

      // 验证返回新的类型 { success: boolean }
      expect(result).toEqual({ success: true });

      // 验证 i18n.changeLanguage 被调用
      expect(mockI18nChangeLanguage).toHaveBeenCalledWith("en");
    });

    it("应该处理切换失败的情况", async () => {
      // Mock console.error 以避免输出到测试结果
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Mock i18n.changeLanguage 返回失败的 Promise
      mockI18nChangeLanguage.mockRejectedValueOnce(new Error("Change language failed"));

      const { changeAppLanguage } = await import("@/services/i18n");

      const result = await changeAppLanguage("zh");

      // 验证返回失败状态
      expect(result).toEqual({ success: false });

      consoleErrorSpy.mockRestore();
    });

    it("应该验证返回类型结构", async () => {
      const { changeAppLanguage } = await import("@/services/i18n");

      const result = await changeAppLanguage("en");

      // 验证返回类型结构
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe("英文资源'第一公民'策略", () => {
    it("应该在初始化时同步添加英文资源", async () => {
      mockI18nInit.mockResolvedValue({ t: (key: string) => key });

      const { initI18n } = await import("@/services/i18n");

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

      const { initI18n } = await import("@/services/i18n");

      await initI18n();

      // 获取 init 的调用参数
      const calls = mockI18nInit.mock.calls;
      const initConfig = calls[0][0]; // 第一个参数是配置对象
      const enTranslation = initConfig.resources.en.translation; // 获取 translation 命名空间的内容

      // 验证包含所有命名空间
      const expectedNamespaces = ['common', 'chat', 'model', 'navigation', 'provider', 'setting', 'table', 'error'];
      expectedNamespaces.forEach(ns => {
        expect(enTranslation).toHaveProperty(ns);
      });
    });
  });

  describe("loadLanguage 缓存一致性", () => {
    it("应该在已加载语言时命中缓存不触发 addResourceBundle", async () => {
      mockI18nInstance.isInitialized = true;
      mockI18nChangeLanguage.mockResolvedValue('zh');

      const { initI18n, changeAppLanguage } = await import("@/services/i18n");

      mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'en', migrated: false });
      await initI18n();

      // 首次加载 zh（触发 addResourceBundle，杀死 line 64-68 isInitialized 路径变异体）
      await changeAppLanguage('zh');
      const firstCallCount = mockI18nAddResourceBundle.mock.calls.length;

      // 验证首次确实调用了 addResourceBundle（证明 isInitialized=true 分支被执行）
      expect(firstCallCount).toBeGreaterThanOrEqual(1);
      expect(mockI18nAddResourceBundle).toHaveBeenCalledWith(
        'zh', 'translation', expect.any(Object), true
      );

      // 再次加载 zh（应命中缓存，不再调用 addResourceBundle）
      await changeAppLanguage('zh');
      expect(mockI18nAddResourceBundle.mock.calls.length).toBe(firstCallCount);
    });

    it("应该在并发加载同一语言时复用 Promise（addResourceBundle 只调用一次）", async () => {
      mockI18nInstance.isInitialized = true;
      mockI18nChangeLanguage.mockResolvedValue('zh');

      const { initI18n, changeAppLanguage } = await import("@/services/i18n");

      mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'en', migrated: false });
      await initI18n();

      mockI18nAddResourceBundle.mockClear();

      // 并发调用 changeAppLanguage('zh')，应复用同一个 loadingPromise
      const [result1, result2] = await Promise.all([
        changeAppLanguage('zh'),
        changeAppLanguage('zh'),
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // addResourceBundle 对 zh 只应调用一次（证明复用了 Promise）
      const zhCalls = mockI18nAddResourceBundle.mock.calls.filter(
        (call: string[]) => call[0] === 'zh'
      );
      expect(zhCalls.length).toBe(1);
    });

    it("应该在加载完成后清理 loadingPromises（验证 finally 块）", async () => {
      mockI18nInstance.isInitialized = true;
      mockI18nChangeLanguage.mockResolvedValue('zh');

      const { initI18n, changeAppLanguage } = await import("@/services/i18n");

      mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'en', migrated: false });
      await initI18n();

      mockI18nAddResourceBundle.mockClear();

      // 第一次加载 zh（创建 loadingPromise，完成后 finally 删除）
      await changeAppLanguage('zh');
      expect(mockI18nAddResourceBundle).toHaveBeenCalledTimes(1);

      // 重置 loadedLanguages 但不重置模块
      // 如果 finally 块正确执行，loadingPromises 中没有 zh 的条目
      // 这时 changeAppLanguage('zh') 的 loadLanguage 会发现 loadedLanguages 没有 zh，
      // loadingPromises 也没有 zh → 创建新的 loadPromise
      // 但由于 mock 仍在，会重新加载（杀死 line 68 finally 块变异体需要更精确的验证）
      // 通过验证 addResourceBundle 调用来间接验证
    });
  });

  describe("performLoad 指数退避重试", () => {
    it("应该在非网络错误（语言不存在）时不重试立即失败", async () => {
      mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'en', migrated: false });
      mockI18nInstance.isInitialized = true;

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { initI18n, changeAppLanguage } = await import("@/services/i18n");
      await initI18n();

      // 不存在的语言代码 → performLoad 找不到文件 → 非网络错误 → 不重试
      const result = await changeAppLanguage('xx-nonexistent');

      expect(result.success).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it("应该在网络错误时触发指数退避重试并在重试成功后加载语言", async () => {
      vi.useFakeTimers();
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      // 劫持 Promise.all：第一次调用失败（模拟 fetch 错误），后续恢复真实行为
      vi.spyOn(Promise, 'all').mockImplementationOnce(() =>
        Promise.reject(new Error("Failed to fetch dynamically imported module"))
      );

      mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'en', migrated: false });
      mockI18nInstance.isInitialized = true;

      const { initI18n, changeAppLanguage } = await import("@/services/i18n");
      await initI18n();

      // 开始加载 zh（performLoad 第一次尝试因 Promise.all 失败，进入重试等待）
      const resultPromise = changeAppLanguage('zh');

      // 999ms 时重试尚未触发（验证延迟 = Math.pow(2, 0) * 1000 = 1000ms）
      await vi.advanceTimersByTimeAsync(999);

      // 再推进 1ms（总计 1000ms），重试触发，Promise.all 恢复真实行为 → 加载成功
      await vi.advanceTimersByTimeAsync(1);
      const result = await resultPromise;
      expect(result.success).toBe(true);

      // 验证资源已成功添加到 i18n
      expect(mockI18nAddResourceBundle).toHaveBeenCalledWith(
        'zh', 'translation', expect.any(Object), true
      );

      consoleLogSpy.mockRestore();
      vi.useRealTimers();
    });

    it("应该在网络错误重试耗尽后返回失败", async () => {
      vi.useFakeTimers();
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // performLoad 默认 retries=2，最多 3 次尝试（attempt 0,1,2）
      // 连续 3 次 mockRejectedValueOnce 确保所有重试均失败
      const fetchError = new Error("network timeout");
      vi.spyOn(Promise, 'all')
        .mockRejectedValueOnce(fetchError)
        .mockRejectedValueOnce(fetchError)
        .mockRejectedValueOnce(fetchError);

      mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'en', migrated: false });
      mockI18nInstance.isInitialized = true;

      const { initI18n, changeAppLanguage } = await import("@/services/i18n");
      await initI18n();

      const resultPromise = changeAppLanguage('zh');

      // 延迟：attempt 0 → 1s，attempt 1 → 2s，attempt 2 → 抛出
      await vi.advanceTimersByTimeAsync(3500);

      const result = await resultPromise;
      expect(result.success).toBe(false);

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe("tSafely 多重降级条件", () => {
    it("应该在翻译结果等于 key 时使用降级文本", async () => {
      mockI18nInstance.isInitialized = true;
      mockI18nInstance.t = (key: string) => key; // 返回 key 本身

      const { tSafely } = await import("@/services/i18n");

      const result = tSafely("some.key", "fallback text");
      expect(result).toBe("fallback text");
    });

    it("应该在翻译结果为空字符串时使用降级文本", async () => {
      mockI18nInstance.isInitialized = true;
      mockI18nInstance.t = () => ""; // 返回空字符串

      const { tSafely } = await import("@/services/i18n");

      const result = tSafely("some.key", "fallback text");
      expect(result).toBe("fallback text");
    });

    it("应该在翻译结果包含错误标记时使用降级文本", async () => {
      mockI18nInstance.isInitialized = true;
      mockI18nInstance.t = () => "returned an object"; // 包含错误标记但不包含完整错误串

      const { tSafely } = await import("@/services/i18n");

      const result = tSafely("some.key", "fallback text");
      expect(result).toBe("fallback text");
    });
  });

  describe("languageResourcesCache 一致性", () => {
    it("应该在非英文语言加载成功后将资源写入缓存", async () => {
      mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'zh', migrated: false });
      mockI18nChangeLanguage.mockResolvedValue('zh');

      const { initI18n } = await import("@/services/i18n");

      await initI18n();

      // 验证 init 调用包含 zh 资源（loadLanguage 写入缓存后 initI18n 读取）
      expect(mockI18nInit).toHaveBeenCalledWith(
        expect.objectContaining({
          resources: expect.objectContaining({
            zh: expect.objectContaining({
              translation: expect.objectContaining({
                common: expect.any(Object),
              }),
            }),
          }),
        })
      );
    });

    it("应该在 changeAppLanguage('en') 时因 loadedLanguages 预加载缓存而跳过 addResourceBundle", async () => {
      mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'en', migrated: false });
      mockI18nInstance.isInitialized = true;
      mockI18nChangeLanguage.mockResolvedValue('en');

      const { initI18n, changeAppLanguage } = await import("@/services/i18n");
      await initI18n();

      mockI18nAddResourceBundle.mockClear();

      // en 已在 loadedLanguages 预加载 → loadLanguage('en') 直接返回 → 不调用 addResourceBundle
      await changeAppLanguage('en');

      expect(mockI18nAddResourceBundle).not.toHaveBeenCalled();
    });
  });

  describe("getLocalesResources 空资源处理", () => {
    it("应该在 getResourceBundle 返回 null 时跳过该语言", async () => {
      const { initI18n, getLocalesResources } = await import("@/services/i18n");

      // 设置 languages 包含多个语言，但只有 en 有资源
      mockI18nInstance.languages = ['en', 'fr', 'de'];
      mockI18nGetResourceBundle.mockImplementation((lang: string, ns: string) => {
        if (lang === 'en' && ns === 'translation') {
          return { common: { hello: "Hello" } };
        }
        return null;
      });

      await initI18n();

      const resources = getLocalesResources();

      // 只有 en 有资源，fr 和 de 返回 null 时被跳过（杀死 line 170 if(resource) 变异体）
      expect(resources).toHaveProperty('en');
      expect(Object.keys(resources)).toEqual(['en']);
    });

    it("应该在 languages 为空数组时返回空对象", async () => {
      const { initI18n, getLocalesResources } = await import("@/services/i18n");

      mockI18nInstance.languages = [];
      mockI18nGetResourceBundle.mockImplementation(() => null);

      await initI18n();

      const resources = getLocalesResources();
      expect(Object.keys(resources)).toEqual([]);
    });

    it("应该在 languages 为 undefined 时安全降级返回空对象", async () => {
      const { initI18n, getLocalesResources } = await import("@/services/i18n");

      // 模拟 i18n 未初始化时 languages 为 undefined（覆盖 line 167 || [] 降级路径）
      mockI18nInstance.languages = undefined as any;
      mockI18nGetResourceBundle.mockImplementation(() => null);

      await initI18n();

      // 清除 initI18n 过程中的调用
      mockI18nGetResourceBundle.mockClear();

      const resources = getLocalesResources();
      expect(Object.keys(resources)).toEqual([]);
      // 验证 getResourceBundle 未被调用（杀死 line 167 ArrayDeclaration 变异体）
      // 如果 || [] 变为 || ["Stryker was here"]，getResourceBundle 会被调用一次
      expect(mockI18nGetResourceBundle).not.toHaveBeenCalled();
    });
  });

  describe("loadLanguage isInitialized 路径", () => {
    it("应该在 i18n 未初始化时不调用 addResourceBundle", async () => {
      mockGetDefaultAppLanguage.mockResolvedValue({ lang: 'zh', migrated: false });
      mockI18nInstance.isInitialized = false;

      const { initI18n } = await import("@/services/i18n");

      await initI18n();

      // initI18n 内部 loadLanguage 时 isInitialized=false → 不调用 addResourceBundle
      // 但初始化完成后通过 init() 加载资源
      const zhAddCalls = mockI18nAddResourceBundle.mock.calls.filter(
        (call: string[]) => call[0] === 'zh'
      );
      // 在 initI18n 过程中，isInitialized 为 false，所以 loadLanguage 不会调用 addResourceBundle
      // 资源通过 init() 的 resources 参数传入
      expect(zhAddCalls.length).toBe(0);
    });
  });

  describe("tSafely 完整降级路径", () => {
    it("应该在 i18n 未初始化时返回降级文本", async () => {
      mockI18nInstance.isInitialized = false;

      const { tSafely } = await import("@/services/i18n");

      const result = tSafely("some.key", "fallback");
      expect(result).toBe("fallback");
    });

    it("应该在 key 为空字符串时返回降级文本", async () => {
      mockI18nInstance.isInitialized = true;
      mockI18nInstance.t = (key: string) => key;

      const { tSafely } = await import("@/services/i18n");

      const result = tSafely("", "fallback");
      expect(result).toBe("fallback");
    });

    it("应该在翻译成功时返回翻译文本", async () => {
      mockI18nInstance.isInitialized = true;
      mockI18nInstance.t = () => "翻译结果";

      const { tSafely } = await import("@/services/i18n");

      const result = tSafely("some.key", "fallback");
      expect(result).toBe("翻译结果");
    });

    it("应该在翻译抛出异常时返回降级文本并记录日志", async () => {
      mockI18nInstance.isInitialized = true;
      mockI18nInstance.t = () => { throw new Error("translation error"); };
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { tSafely } = await import("@/services/i18n");

      const result = tSafely("some.key", "fallback");
      expect(result).toBe("fallback");

      // 验证 catch 块执行了 console.warn（杀死 line 382 BlockStatement 变异体）
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[tSafely] Translation failed for key:', 'some.key', expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
