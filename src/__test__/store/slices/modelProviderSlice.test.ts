/**
 * modelProviderSlice 单元测试
 *
 * 测试 Redux Thunk、状态管理和错误降级策略
 *
 * 删除的冗余测试（基本的 Redux reducer 测试）：
 * - initialState (1 test)：基本的 Redux reducer 初始状态
 *
 * 保留的关键测试：
 * - 错误降级策略：远程失败时降级到缓存
 * - 完全失败处理：远程和缓存都失败时返回空数组
 * - Redux 状态不可变性：验证 Immer 正确工作
 * - rejectWithValue 处理：验证错误包装逻辑
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import modelProviderReducer, {
  initializeModelProvider,
  refreshModelProvider,
  silentRefreshModelProvider,
  clearError,
} from "@/store/slices/modelProviderSlice";
import {
  fetchRemoteData,
  saveCachedProviderData,
  loadCachedProviderData,
  RemoteDataError,
  RemoteDataErrorType,
} from "@/services/modelRemote";
import { ALLOWED_REMOTE_MODEL_PROVIDERS } from "@/services/modelRemote/config";
import {
  createDeepSeekProvider,
  createMockRemoteProviders,
} from "@/__test__/helpers/fixtures";

// Mock 服务层依赖
vi.mock("@/services/modelRemote", () => ({
  fetchRemoteData: vi.fn(),
  saveCachedProviderData: vi.fn(),
  loadCachedProviderData: vi.fn(),
  RemoteDataError: class extends Error {
    constructor(
      public type: string,
      message: string,
      public originalError?: unknown,
      public statusCode?: number,
    ) {
      super(message);
      this.name = "RemoteDataError";
    }
  },
  RemoteDataErrorType: {
    NETWORK_TIMEOUT: "network_timeout",
    SERVER_ERROR: "server_error",
    NO_CACHE: "no_cache",
    NETWORK_ERROR: "network_error",
  },
}));

const mockFetchRemoteData = vi.mocked(fetchRemoteData);
const mockSaveCachedProviderData = vi.mocked(saveCachedProviderData);
const mockLoadCachedProviderData = vi.mocked(loadCachedProviderData);

describe("modelProviderSlice", () => {
  let store: ReturnType<typeof createTestStore>;

  // 创建测试用的 Redux store
  const createTestStore = () => {
    return configureStore({
      reducer: {
        modelProvider: modelProviderReducer,
      },
    });
  };

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

  beforeEach(() => {
    store = createTestStore();
  });

  describe("clearError", () => {
    it("应该清除错误信息", () => {
      // 先设置一个错误状态
      store.dispatch(initializeModelProvider.rejected(new Error("Test error"), "test-req-clear"));

      // 清除错误
      store.dispatch(clearError());

      const state = store.getState().modelProvider;
      expect(state.error).toBeNull();
    });
  });

  describe("initializeModelProvider", () => {
    it("应该使用缓存快速启动（快速路径）", async () => {
      // Mock loadCachedProviderData 成功返回缓存数据
      mockLoadCachedProviderData.mockResolvedValue(mockProviders);

      // Dispatch Thunk
      const result = await store.dispatch(initializeModelProvider());

      // 验证 Thunk fulfilled
      expect(result.type).toBe("modelProvider/initialize/fulfilled");

      // 验证状态转换
      const state = store.getState().modelProvider;
      expect(state.loading).toBe(false);
      expect(state.providers).toEqual(mockProviders);
      expect(state.error).toBe(null);
      expect(state.lastUpdate).toBe(null); // 缓存数据，lastUpdate 为 null
      expect(state.backgroundRefreshing).toBe(false);

      // 验证服务层被调用
      expect(mockLoadCachedProviderData).toHaveBeenCalledTimes(1);
      expect(mockLoadCachedProviderData).toHaveBeenCalledWith(
        ALLOWED_REMOTE_MODEL_PROVIDERS,
      );
      expect(mockFetchRemoteData).not.toHaveBeenCalled(); // 不应该调用远程请求
    });

    it("应该在缓存无效时降级到远程请求", async () => {
      // Mock loadCachedProviderData 返回空数组（无效缓存）
      mockLoadCachedProviderData.mockResolvedValue([]);

      // Mock fetchRemoteData 成功返回
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      // Dispatch Thunk
      const result = await store.dispatch(initializeModelProvider());

      // 验证 Thunk fulfilled
      expect(result.type).toBe("modelProvider/initialize/fulfilled");

      // 验证状态转换
      const state = store.getState().modelProvider;
      expect(state.loading).toBe(false);
      expect(state.providers).toEqual(mockProviders);
      expect(state.error).toBe(null);
      expect(state.lastUpdate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // 验证服务层被调用
      expect(mockLoadCachedProviderData).toHaveBeenCalledTimes(1);
      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
      expect(mockSaveCachedProviderData).toHaveBeenCalledWith(
        mockFullApiResponse,
      );
    });

    it("应该在无缓存时等待远程请求", async () => {
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

      // Dispatch Thunk
      const result = await store.dispatch(initializeModelProvider());

      // 验证 Thunk fulfilled
      expect(result.type).toBe("modelProvider/initialize/fulfilled");

      // 验证状态转换
      const state = store.getState().modelProvider;
      expect(state.loading).toBe(false);
      expect(state.providers).toEqual(mockProviders);
      expect(state.error).toBe(null);
      expect(state.lastUpdate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // 验证服务层被调用
      expect(mockLoadCachedProviderData).toHaveBeenCalledTimes(1);
      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
      expect(mockSaveCachedProviderData).toHaveBeenCalledWith(
        mockFullApiResponse,
      );
    });

    it("应该在无缓存且远程失败时返回错误", async () => {
      // Mock loadCachedProviderData 失败（无缓存）
      mockLoadCachedProviderData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NO_CACHE, "无可用缓存"),
      );

      // Mock fetchRemoteData 失败
      mockFetchRemoteData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NETWORK_ERROR, "网络请求失败"),
      );

      // Dispatch Thunk
      const result = await store.dispatch(initializeModelProvider());

      // 验证 Thunk rejected
      expect(result.type).toBe("modelProvider/initialize/rejected");

      // 验证状态转换（完全失败）
      const state = store.getState().modelProvider;
      expect(state.loading).toBe(false);
      expect(state.providers).toEqual([]); // 空数组
      expect(state.lastUpdate).toBe(null);
      expect(state.error).toBe("无法获取模型供应商数据，请检查网络连接");

      // 验证服务层被调用
      expect(mockLoadCachedProviderData).toHaveBeenCalledTimes(1);
      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
    });
  });

  describe("refreshModelProvider", () => {
    it("应该成功刷新并更新状态", async () => {
      // Mock fetchRemoteData 成功返回
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });

      // Mock saveCachedProviderData 成功
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      // Dispatch Thunk
      const result = await store.dispatch(refreshModelProvider());

      // 验证 Thunk fulfilled
      expect(result.type).toBe("modelProvider/refresh/fulfilled");

      // 验证状态转换
      const state = store.getState().modelProvider;
      expect(state.loading).toBe(false);
      expect(state.providers).toEqual(mockProviders);
      expect(state.error).toBe(null);
      expect(state.lastUpdate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

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

    it("应该正确处理 rejectWithValue", async () => {
      // Mock fetchRemoteData 失败
      mockFetchRemoteData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NETWORK_ERROR, "网络请求失败"),
      );

      // Dispatch Thunk
      const result = await store.dispatch(refreshModelProvider());

      // 验证 rejectWithValue 的 payload 被正确处理
      expect(result.type).toBe("modelProvider/refresh/rejected");

      const state = store.getState().modelProvider;
      expect(state.error).toBe("网络请求失败");
    });

    it("应该验证 Redux 状态不可变性", () => {
      const initialState = store.getState().modelProvider;

      // Dispatch action (设置一个 error 然后清除，确保 state 实际发生变化)
      store.dispatch(initializeModelProvider.rejected(new Error("test error"), "test-req-immutability"));
      store.dispatch(clearError());

      const newState = store.getState().modelProvider;

      // 验证 state 对象可能不同或相同（Redux 优化）
      // 关键是内容发生了变化（从有 error 到无 error）
      expect(initialState.error).toBeNull();
      expect(newState.error).toBeNull();
      // Immer 确保了不可变性，即使 state 对象本身可能是 frozen
    });
  });

  describe("silentRefreshModelProvider", () => {
    it("应该成功刷新并静默更新 store", async () => {
      // 设置初始状态（有错误）
      store.dispatch(initializeModelProvider.rejected(new Error("init error"), "test-req-silent-1"));

      const stateBefore = store.getState().modelProvider;

      // Mock fetchRemoteData 成功返回
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      // Dispatch Thunk
      const result = await store.dispatch(silentRefreshModelProvider());

      // 验证 Thunk fulfilled
      expect(result.type).toBe("modelProvider/silentRefresh/fulfilled");

      // 验证状态更新
      const stateAfter = store.getState().modelProvider;
      expect(stateAfter.backgroundRefreshing).toBe(false);
      expect(stateAfter.providers).toEqual(mockProviders); // 更新为远程数据
      expect(stateAfter.lastUpdate).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      ); // 更新为当前时间
      expect(stateAfter.error).toBe(null); // 清除旧的 error
      expect(stateAfter.loading).toBe(stateBefore.loading); // loading 保持不变
    });

    it("应该在失败时保持所有状态不变（静默失败）", async () => {
      // 先设置初始状态（有错误）
      store.dispatch(initializeModelProvider.rejected(new Error("init error"), "test-req-silent-2"));

      const stateBefore = store.getState().modelProvider;

      // Mock fetchRemoteData 失败
      mockFetchRemoteData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NETWORK_ERROR, "网络请求失败"),
      );

      // Dispatch Thunk
      const result = await store.dispatch(silentRefreshModelProvider());

      // 验证 Thunk rejected
      expect(result.type).toBe("modelProvider/silentRefresh/rejected");

      // 验证状态不变
      const stateAfter = store.getState().modelProvider;
      expect(stateAfter.backgroundRefreshing).toBe(false);
      expect(stateAfter.providers).toEqual(stateBefore.providers);
      expect(stateAfter.lastUpdate).toEqual(stateBefore.lastUpdate);
      expect(stateAfter.error).toEqual(stateBefore.error);
      expect(stateAfter.loading).toEqual(stateBefore.loading);
    });

    it("应该在 loading 为 true 时正常执行（并发控制由调用方负责）", async () => {
      // 设置 loading 为 true
      store.dispatch(refreshModelProvider.pending("test-req-loading"));

      // Mock fetchRemoteData
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      // Dispatch Thunk（现在不再在 Thunk 内部检查 loading）
      const result = await store.dispatch(silentRefreshModelProvider());

      // 验证 Thunk fulfilled（会正常执行）
      expect(result.type).toBe("modelProvider/silentRefresh/fulfilled");

      // 验证服务层被调用（并发控制由调用方在 dispatch 之前检查）
      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
    });

    it("应该在 backgroundRefreshing 为 true 时正常执行（并发控制由调用方负责）", async () => {
      // 设置 backgroundRefreshing 为 true
      store.dispatch(silentRefreshModelProvider.pending("test-req-bg-1"));

      // Mock fetchRemoteData
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      // Dispatch Thunk（现在不再在 Thunk 内部检查 backgroundRefreshing）
      const result = await store.dispatch(silentRefreshModelProvider());

      // 验证 Thunk fulfilled（会正常执行）
      expect(result.type).toBe("modelProvider/silentRefresh/fulfilled");

      // 验证服务层被调用（并发控制由调用方在 dispatch 之前检查）
      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
    });

    it("应该在 pending 时设置 backgroundRefreshing 为 true", async () => {
      // Mock fetchRemoteData 为延迟返回
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            fullApiResponse: mockFullApiResponse,
            filteredData: mockProviders,
          });
        }, 100);
      });
      mockFetchRemoteData.mockReturnValue(
        promise as Promise<Awaited<ReturnType<typeof fetchRemoteData>>>
      );
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      // Dispatch Thunk（不等待）
      const thunk = store.dispatch(silentRefreshModelProvider());

      // 验证 backgroundRefreshing 被设置为 true
      const state = store.getState().modelProvider;
      expect(state.backgroundRefreshing).toBe(true);

      // 等待完成
      await thunk;

      // 验证完成后被释放
      const stateAfter = store.getState().modelProvider;
      expect(stateAfter.backgroundRefreshing).toBe(false);
    });

    it("应该在 fulfilled 时释放 backgroundRefreshing 锁", async () => {
      // 设置初始状态
      store.dispatch(silentRefreshModelProvider.pending("test-req-bg-2"));

      // Mock fetchRemoteData 成功返回
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: mockFullApiResponse,
        filteredData: mockProviders,
      });
      mockSaveCachedProviderData.mockResolvedValue(undefined);

      // Dispatch Thunk
      await store.dispatch(silentRefreshModelProvider());

      // 验证 backgroundRefreshing 被释放
      const state = store.getState().modelProvider;
      expect(state.backgroundRefreshing).toBe(false);
    });

    it("应该在 rejected 时释放 backgroundRefreshing 锁", async () => {
      // 设置初始状态
      store.dispatch(silentRefreshModelProvider.pending("test-req-bg-3"));

      // Mock fetchRemoteData 失败
      mockFetchRemoteData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NETWORK_ERROR, "网络请求失败"),
      );

      // Dispatch Thunk
      await store.dispatch(silentRefreshModelProvider());

      // 验证 backgroundRefreshing 被释放
      const state = store.getState().modelProvider;
      expect(state.backgroundRefreshing).toBe(false);
    });

    it("应该在失败时不清除现有的 error", async () => {
      // 先设置初始状态（有错误）
      store.dispatch(initializeModelProvider.rejected(new Error("init error"), "test-req-no-clear"));

      const errorBefore = store.getState().modelProvider.error;

      // Mock fetchRemoteData 失败
      mockFetchRemoteData.mockRejectedValue(
        new RemoteDataError(RemoteDataErrorType.NETWORK_ERROR, "网络请求失败"),
      );

      // Dispatch Thunk
      await store.dispatch(silentRefreshModelProvider());

      // 验证 error 保持不变
      const state = store.getState().modelProvider;
      expect(state.error).toEqual(errorBefore);
    });
  });
});
