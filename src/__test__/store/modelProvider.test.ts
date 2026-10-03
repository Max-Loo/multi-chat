/**
 * modelProvider store 单元测试（Pinia）
 *
 * 转写自 Redux modelProviderSlice 测试，行为断言保持一致：
 * - Thunk dispatch 转写为 store action 调用
 * - action.type（fulfilled/rejected）断言转写为返回值与 state 变化断言
 * - 源测试中直接 dispatch pending/rejected action 铺垫状态的写法，
 *   分别用"真实失败路径"和"直接对 Pinia state 赋值"等价替代
 *
 * 转写中删除的测试（仅覆盖 Redux reducer 内部机制，Pinia store 无对应行为路径）：
 * - initialize rejected 且有 providers payload：Redux 通过 rejected action payload 写入
 *   providers，Pinia 失败路径不写入 providers（保留"失败保持已有 providers"等价用例）
 * - initialize rejected 无 payload 时使用 error.message：Pinia 统一降级为固定错误消息
 *   （固定消息已由"无缓存且远程失败时返回错误"用例覆盖）
 * - refresh rejected 无 payload 时使用 error.message：Pinia 对非 RemoteDataError
 *   统一使用默认错误消息（已由对应用例覆盖）
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useModelProviderStore } from "@/store/modelProvider";
import {
  RemoteDataError,
  RemoteDataErrorType,
  type RemoteProviderData,
} from "@/services/modelRemote";
import { ALLOWED_REMOTE_MODEL_PROVIDERS } from "@/services/modelRemote/config";
import {
  createDeepSeekProvider,
  createMockRemoteProviders,
} from "@/__test__/helpers/fixtures";

// Mock 服务层依赖 - 必须在导入 store 之前执行
// 使用 vi.hoisted 确保变量在 vi.mock 之前被定义
const {
  mockFetchRemoteData,
  mockSaveCachedProviderData,
  mockLoadCachedProviderData,
  MockRemoteDataError,
  mockRemoteDataErrorType,
} = vi.hoisted(() => {
  /** 与真实 RemoteDataError 签名一致的 Mock 错误类（保证 store 内 instanceof 判断可用） */
  class RemoteDataError extends Error {
    constructor(
      public type: string,
      message: string,
      public originalError?: unknown,
      public statusCode?: number,
    ) {
      super(message);
      this.name = "RemoteDataError";
    }
  }
  return {
    mockFetchRemoteData: vi.fn(),
    mockSaveCachedProviderData: vi.fn(),
    mockLoadCachedProviderData: vi.fn(),
    MockRemoteDataError: RemoteDataError,
    mockRemoteDataErrorType: {
      NETWORK_TIMEOUT: "network_timeout",
      SERVER_ERROR: "server_error",
      NO_CACHE: "no_cache",
      NETWORK_ERROR: "network_error",
    },
  };
});

vi.mock("@/services/modelRemote", () => ({
  fetchRemoteData: mockFetchRemoteData,
  saveCachedProviderData: mockSaveCachedProviderData,
  loadCachedProviderData: mockLoadCachedProviderData,
  RemoteDataError: MockRemoteDataError,
  RemoteDataErrorType: mockRemoteDataErrorType,
}));

describe("modelProvider store（Pinia）", () => {
  // Mock 数据
  const mockProviders = createMockRemoteProviders([
    createDeepSeekProvider({
      models: [{ modelKey: "deepseek-chat", modelName: "DeepSeek Chat" }],
    }),
  ]);

  const mockFullApiResponse = {
    deepseek: {
      id: "deepseek",
      name: "DeepSeek",
      api: "https://api.deepseek.com",
      env: ["DEEPSEEK_API_KEY"],
      npm: "@ai-sdk/deepseek",
      doc: "https://docs.deepseek.com",
      models: {
        "deepseek-chat": {
          id: "deepseek-chat",
          name: "DeepSeek Chat",
        },
      },
    },
  };

  /**
   * 通过真实失败路径构造 error 状态
   * （对应源测试中直接 dispatch rejected action 的状态铺垫方式，
   * Pinia 无独立 action 可 dispatch，改走完整失败流程）
   */
  async function setupErrorState(): Promise<void> {
    mockLoadCachedProviderData.mockRejectedValue(
      new RemoteDataError(RemoteDataErrorType.NO_CACHE, "无可用缓存"),
    );
    mockFetchRemoteData.mockRejectedValue(
      new RemoteDataError(RemoteDataErrorType.NETWORK_ERROR, "网络请求失败"),
    );
    const store = useModelProviderStore();
    await store.initializeModelProvider();
    expect(store.error).not.toBeNull();
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe("clearError", () => {
    it("应该清除错误信息", async () => {
      const store = useModelProviderStore();

      // 先通过真实失败路径设置一个错误状态
      await setupErrorState();
      expect(store.error).not.toBeNull();

      // 清除错误
      store.clearError();

      expect(store.error).toBeNull();
    });
  });

  describe("initializeModelProvider", () => {
    it("应该在 pending 时设置 loading=true 并清除 error", async () => {
      const store = useModelProviderStore();

      // 先设置 error 状态
      await setupErrorState();

      // 缓存快速路径成功，重新发起初始化（不等待，观察 pending 阶段状态）
      mockLoadCachedProviderData.mockResolvedValue(mockProviders);
      const promise = store.initializeModelProvider();

      expect(store.loading).toBe(true);
      expect(store.error).toBe(null);

      await promise;
    });

    it("应该在失败时保持已有 providers 不变（对应源 rejected 无 providers payload 用例）", async () => {
      const store = useModelProviderStore();

      // 先成功初始化，写入 providers
      mockLoadCachedProviderData.mockResolvedValue(mockProviders);
      await store.initializeModelProvider();
      expect(store.providers).toEqual(mockProviders);

      // 再次初始化失败（缓存与远程均失败）
      mockLoadCachedProviderData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NO_CACHE, "无可用缓存"),
      );
      mockFetchRemoteData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NETWORK_ERROR, "网络请求失败"),
      );
      await store.initializeModelProvider();

      // providers 保持不变，仅设置 error
      expect(store.providers).toEqual(mockProviders);
      expect(store.error).toBe("无法获取模型供应商数据，请检查网络连接");
    });

    it("应该使用缓存快速启动（快速路径）", async () => {
      const store = useModelProviderStore();

      // Mock loadCachedProviderData 成功返回缓存数据
      mockLoadCachedProviderData.mockResolvedValue(mockProviders);

      const result = await store.initializeModelProvider();

      // 验证 fulfilled（成功返回非 null 结果）
      expect(result).not.toBeNull();

      // 验证状态转换
      expect(store.loading).toBe(false);
      expect(store.providers).toEqual(mockProviders);
      expect(store.error).toBe(null);
      expect(store.lastUpdate).toBe(null); // 缓存数据，lastUpdate 为 null
      expect(store.backgroundRefreshing).toBe(false);

      // 验证返回值内容
      expect(result?.providers).toEqual(mockProviders);
      expect(result?.lastUpdate).toBe(null);

      // 验证服务层被调用
      expect(mockLoadCachedProviderData).toHaveBeenCalledTimes(1);
      expect(mockLoadCachedProviderData).toHaveBeenCalledWith(
        ALLOWED_REMOTE_MODEL_PROVIDERS,
      );
      expect(mockFetchRemoteData).not.toHaveBeenCalled(); // 不应该调用远程请求
    });

    it("应该在缓存无效时降级到远程请求", async () => {
      const store = useModelProviderStore();

      // Mock loadCachedProviderData 返回空数组（无效缓存）
      mockLoadCachedProviderData.mockResolvedValue([]);

      // Mock fetchRemoteData 成功返回
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      const result = await store.initializeModelProvider();

      // 验证 fulfilled（成功返回非 null 结果）
      expect(result).not.toBeNull();

      // 验证状态转换
      expect(store.loading).toBe(false);
      expect(store.providers).toEqual(mockProviders);
      expect(store.error).toBe(null);
      expect(store.lastUpdate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // 验证服务层被调用
      expect(mockLoadCachedProviderData).toHaveBeenCalledTimes(1);
      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
      expect(mockSaveCachedProviderData).toHaveBeenCalledWith(
        mockFullApiResponse,
      );
    });

    it("应该在无缓存时等待远程请求", async () => {
      const store = useModelProviderStore();

      // Mock loadCachedProviderData 失败（无缓存）
      mockLoadCachedProviderData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NO_CACHE, "无可用缓存"),
      );

      // Mock fetchRemoteData 成功返回
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      const result = await store.initializeModelProvider();

      // 验证 fulfilled（成功返回非 null 结果）
      expect(result).not.toBeNull();

      // 验证状态转换
      expect(store.loading).toBe(false);
      expect(store.providers).toEqual(mockProviders);
      expect(store.error).toBe(null);
      expect(store.lastUpdate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // 验证服务层被调用
      expect(mockLoadCachedProviderData).toHaveBeenCalledTimes(1);
      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
      expect(mockSaveCachedProviderData).toHaveBeenCalledWith(
        mockFullApiResponse,
      );
    });

    it("应该在无缓存且远程失败时返回错误", async () => {
      const store = useModelProviderStore();

      // Mock loadCachedProviderData 失败（无缓存）
      mockLoadCachedProviderData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NO_CACHE, "无可用缓存"),
      );

      // Mock fetchRemoteData 失败
      mockFetchRemoteData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NETWORK_ERROR, "网络请求失败"),
      );

      const result = await store.initializeModelProvider();

      // 验证 rejected（失败返回 null）
      expect(result).toBeNull();

      // 验证状态转换（完全失败）
      expect(store.loading).toBe(false);
      expect(store.providers).toEqual([]); // 空数组
      expect(store.lastUpdate).toBe(null);
      expect(store.error).toBe("无法获取模型供应商数据，请检查网络连接");

      // 验证服务层被调用
      expect(mockLoadCachedProviderData).toHaveBeenCalledTimes(1);
      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
    });
  });

  describe("refreshModelProvider", () => {
    it("应该在 pending 时设置 loading=true 并清除 error", async () => {
      const store = useModelProviderStore();

      // 先设置 error 状态
      await setupErrorState();

      // 发起刷新（不等待，观察 pending 阶段状态）
      const promise = store.refreshModelProvider();

      expect(store.loading).toBe(true);
      expect(store.error).toBe(null);

      await promise;
    });

    it("应该在失败后设置 loading=false 并返回 false", async () => {
      const store = useModelProviderStore();

      // Mock fetchRemoteData 失败
      mockFetchRemoteData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NETWORK_ERROR, "网络请求失败"),
      );

      const result = await store.refreshModelProvider();

      expect(result).toBe(false);
      expect(store.loading).toBe(false);
    });

    it("应该成功刷新并更新状态", async () => {
      const store = useModelProviderStore();

      // Mock fetchRemoteData 成功返回
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });

      // Mock saveCachedProviderData 成功
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      const result = await store.refreshModelProvider();

      // 验证 fulfilled（成功返回 true）
      expect(result).toBe(true);

      // 验证状态转换
      expect(store.loading).toBe(false);
      expect(store.providers).toEqual(mockProviders);
      expect(store.error).toBe(null);
      expect(store.lastUpdate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // 验证服务层被调用
      expect(mockFetchRemoteData).toHaveBeenCalledWith(
        expect.objectContaining({
          forceRefresh: true,
        }),
      );
      expect(mockSaveCachedProviderData).toHaveBeenCalledWith(
        mockFullApiResponse,
      );
    });

    it("应该使用 RemoteDataError 的消息作为错误信息（对应源 rejectWithValue 用例）", async () => {
      const store = useModelProviderStore();

      // Mock fetchRemoteData 失败
      mockFetchRemoteData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NETWORK_ERROR, "网络请求失败"),
      );

      const result = await store.refreshModelProvider();

      // 验证失败（返回 false），错误消息来自 RemoteDataError
      expect(result).toBe(false);

      expect(store.error).toBe("网络请求失败");
    });

    it("应该验证状态变化正确生效（对应源 Redux 状态不可变性验证）", async () => {
      const store = useModelProviderStore();

      // 捕获初始状态快照
      const initialError = store.error;
      expect(initialError).toBeNull();

      // 设置一个 error 然后清除，确保 state 实际发生变化
      await setupErrorState();
      expect(store.error).not.toBeNull(); // error 已写入
      store.clearError();

      // 快照不变，当前状态已清除
      expect(initialError).toBeNull();
      expect(store.error).toBeNull();
    });
  });

  describe("silentRefreshModelProvider", () => {
    it("应该成功刷新并静默更新 store", async () => {
      const store = useModelProviderStore();

      // 设置初始状态（有错误）
      await setupErrorState();

      const loadingBefore = store.loading;

      // Mock fetchRemoteData 成功返回
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      await store.silentRefreshModelProvider();

      // 验证状态更新
      expect(store.backgroundRefreshing).toBe(false);
      expect(store.providers).toEqual(mockProviders); // 更新为远程数据
      expect(store.lastUpdate).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      ); // 更新为当前时间
      expect(store.error).toBe(null); // 清除旧的 error
      expect(store.loading).toBe(loadingBefore); // loading 保持不变
    });

    it("应该在失败时保持所有状态不变（静默失败）", async () => {
      const store = useModelProviderStore();

      // 先设置初始状态（有错误）
      await setupErrorState();

      const stateBefore = {
        providers: store.providers,
        lastUpdate: store.lastUpdate,
        error: store.error,
        loading: store.loading,
      };

      // Mock fetchRemoteData 失败
      mockFetchRemoteData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NETWORK_ERROR, "网络请求失败"),
      );

      await store.silentRefreshModelProvider();

      // 验证状态不变
      expect(store.backgroundRefreshing).toBe(false);
      expect(store.providers).toEqual(stateBefore.providers);
      expect(store.lastUpdate).toEqual(stateBefore.lastUpdate);
      expect(store.error).toEqual(stateBefore.error);
      expect(store.loading).toEqual(stateBefore.loading);
    });

    it("应该在 loading 为 true 时正常执行（并发控制由调用方负责）", async () => {
      const store = useModelProviderStore();

      // 设置 loading 为 true（对应源测试直接 dispatch pending action 的铺垫方式）
      store.loading = true;

      // Mock fetchRemoteData
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      await store.silentRefreshModelProvider();

      // 验证正常执行：providers 已更新（并发控制由调用方在调用之前检查）
      expect(store.providers).toEqual(mockProviders);
      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
    });

    it("应该在 backgroundRefreshing 为 true 时正常执行（并发控制由调用方负责）", async () => {
      const store = useModelProviderStore();

      // 设置 backgroundRefreshing 为 true（对应源测试直接 dispatch pending action 的铺垫方式）
      store.backgroundRefreshing = true;

      // Mock fetchRemoteData
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      await store.silentRefreshModelProvider();

      // 验证正常执行：providers 已更新（并发控制由调用方在调用之前检查）
      expect(store.providers).toEqual(mockProviders);
      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
    });

    it("应该在执行期间设置 backgroundRefreshing 为 true", async () => {
      const store = useModelProviderStore();

      // Mock fetchRemoteData 为延迟返回
      let resolveFetch!: (value: {
        fullApiResponse: typeof mockFullApiResponse;
        filteredData: RemoteProviderData[];
      }) => void;
      mockFetchRemoteData.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }),
      );
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      // 调用 action（不等待）
      const promise = store.silentRefreshModelProvider();

      // 验证 backgroundRefreshing 被设置为 true
      expect(store.backgroundRefreshing).toBe(true);

      // 放行延迟请求并等待完成
      resolveFetch({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      await promise;

      // 验证完成后被释放
      expect(store.backgroundRefreshing).toBe(false);
    });

    it("应该在成功后释放 backgroundRefreshing 锁", async () => {
      const store = useModelProviderStore();

      // 设置初始状态（对应源测试 dispatch pending 设置锁）
      store.backgroundRefreshing = true;

      // Mock fetchRemoteData 成功返回
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      await store.silentRefreshModelProvider();

      // 验证 backgroundRefreshing 被释放
      expect(store.backgroundRefreshing).toBe(false);
    });

    it("应该在失败时释放 backgroundRefreshing 锁", async () => {
      const store = useModelProviderStore();

      // 设置初始状态（对应源测试 dispatch pending 设置锁）
      store.backgroundRefreshing = true;

      // Mock fetchRemoteData 失败
      mockFetchRemoteData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NETWORK_ERROR, "网络请求失败"),
      );

      await store.silentRefreshModelProvider();

      // 验证 backgroundRefreshing 被释放
      expect(store.backgroundRefreshing).toBe(false);
    });

    it("应该在成功时保持 error 为 null", async () => {
      const store = useModelProviderStore();

      // 不设置错误，初始状态 error 为 null
      expect(store.error).toBe(null);

      // Mock fetchRemoteData 成功返回
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      await store.silentRefreshModelProvider();

      expect(store.error).toBe(null);
    });

    it("应该在失败时不清除现有的 error", async () => {
      const store = useModelProviderStore();

      // 先设置初始状态（有错误）
      await setupErrorState();

      const errorBefore = store.error;

      // Mock fetchRemoteData 失败
      mockFetchRemoteData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NETWORK_ERROR, "网络请求失败"),
      );

      await store.silentRefreshModelProvider();

      // 验证 error 保持不变
      expect(store.error).toEqual(errorBefore);
      expect(store.error).not.toBeNull();
    });
  });

  describe("refreshModelProvider 非 RemoteDataError 分支", () => {
    it("应该在 RemoteDataError 时使用错误消息", async () => {
      const store = useModelProviderStore();

      // Mock fetchRemoteData 抛出 RemoteDataError（自定义消息）
      mockFetchRemoteData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.SERVER_ERROR, "服务器内部错误"),
      );

      const result = await store.refreshModelProvider();

      expect(result).toBe(false);

      expect(store.error).toBe("服务器内部错误");
    });

    it("应该在非 RemoteDataError 时使用默认错误消息", async () => {
      const store = useModelProviderStore();

      // Mock fetchRemoteData 抛出普通 Error（非 RemoteDataError）
      mockFetchRemoteData.mockRejectedValue(
        new TypeError("fetch is not a function"),
      );

      const result = await store.refreshModelProvider();

      expect(result).toBe(false);

      expect(store.error).toBe("刷新失败，请稍后重试");
    });
  });

  describe("triggerSilentRefreshIfNeeded", () => {
    it("应该在 backgroundRefreshing 为 false 时触发刷新", async () => {
      const store = useModelProviderStore();

      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      store.triggerSilentRefreshIfNeeded();

      // 已触发后台刷新（对应源测试断言 dispatch 被调用一次）
      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
      expect(store.backgroundRefreshing).toBe(true);

      // 等待后台刷新完成
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(store.backgroundRefreshing).toBe(false);
      expect(store.providers).toEqual(mockProviders);
    });

    it("应该在 backgroundRefreshing 为 true 时跳过刷新", () => {
      const store = useModelProviderStore();

      // 设置后台刷新锁
      store.backgroundRefreshing = true;

      store.triggerSilentRefreshIfNeeded();

      // 未触发刷新
      expect(mockFetchRemoteData).not.toHaveBeenCalled();
    });
  });
});
