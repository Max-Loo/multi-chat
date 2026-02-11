import { fetch } from '@/utils/tauriCompat/http';
import { createLazyStore } from '@/utils/tauriCompat/store';
import type { StoreCompat } from '@/utils/tauriCompat';
import { NETWORK_CONFIG, CACHE_CONFIG, ALLOWED_MODEL_PROVIDERS } from '@/utils/constants';

/**
 * models.dev API 响应的实际数据结构（键值对对象）
 * API 返回格式: { [providerKey: string]: ModelsDevApiProvider }
 */
export interface ModelsDevApiResponse {
  [providerKey: string]: ModelsDevApiProvider;
}

/**
 * 单个模型供应商的 API 数据结构
 */
interface ModelsDevApiProvider {
  /** 供应商唯一标识符 */
  id: string;
  /** 环境变量名数组 */
  env: string[];
  /** NPM 包名 */
  npm: string;
  /** API 基础地址 */
  api: string;
  /** 供应商名称 */
  name: string;
  /** 文档链接 */
  doc: string;
  /** 支持的模型列表（键值对对象） */
  models: {
    [modelId: string]: ModelsDevApiModelDetail;
  };
}

/**
 * 模型详细信息（简化版，仅包含需要的字段）
 */
interface ModelsDevApiModelDetail {
  id: string;
  name: string;
}

/**
 * 内部数据格式：远程供应商数据
 */
export interface RemoteProviderData {
  /** 供应商唯一标识符 */
  providerKey: string;
  /** 供应商名称 */
  providerName: string;
  /** API 基础地址 */
  apiAddress: string;
  /** 支持的模型列表 */
  models: ModelDetail[];
}

/**
 * 模型详细信息（内部格式）
 */
export interface ModelDetail {
  /** 模型唯一标识符 */
  modelKey: string;
  /** 模型名称 */
  modelName: string;
}

/**
 * 远程数据获取错误类型
 */
export enum RemoteDataErrorType {
  /** 网络超时 */
  NETWORK_TIMEOUT = 'network_timeout',
  /** 服务器错误（4xx/5xx） */
  SERVER_ERROR = 'server_error',
  /** JSON 解析失败 */
  PARSE_ERROR = 'parse_error',
  /** 无可用缓存 */
  NO_CACHE = 'no_cache',
  /** 请求被取消 */
  ABORTED = 'aborted',
  /** 网络连接失败 */
  NETWORK_ERROR = 'network_error',
}

/**
 * 自定义错误类（便于错误分类和用户提示）
 */
export class RemoteDataError extends Error {
  constructor(
    public type: RemoteDataErrorType,
    message: string,
    public originalError?: unknown,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'RemoteDataError';
  }
}

/**
 * 请求配置选项
 */
export interface FetchRemoteOptions {
  /** 强制刷新（忽略缓存） */
  forceRefresh?: boolean;
  /** 请求超时时间（毫秒），默认使用 DEFAULT_TIMEOUT */
  timeout?: number;
  /** 最大重试次数，默认使用 DEFAULT_MAX_RETRIES */
  maxRetries?: number;
  /** 取消信号（用于组件卸载时取消请求） */
  signal?: AbortSignal;
}

/**
 * 缓存数据结构
 */
export interface CachedModelData {
  /** 完整的 models.dev API 响应（未过滤） */
  apiResponse: ModelsDevApiResponse;
  /** 缓存元数据 */
  metadata: {
    /** 最后更新时间（ISO 8601 格式） */
    lastRemoteUpdate: string;
    /** 数据来源标记 */
    source: 'remote' | 'fallback';
  };
}

/**
 * 缓存存储键
 */
const REMOTE_MODEL_CACHE_KEY = "remoteModelCache";

/**
 * 组合多个 AbortSignal，任意一个信号中止时，组合信号也会中止
 * @param signals - 要组合的信号数组
 * @returns 组合后的 AbortSignal
 */
const combineSignals = (signals: AbortSignal[]): AbortSignal => {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return controller.signal;
};

/**
 * 带超时的 fetch 请求
 * @param url - 请求 URL
 * @param timeout - 超时时间（毫秒）
 * @param signal - 外部取消信号
 * @returns Response 对象
 * @throws {RemoteDataError} 请求失败时抛出
 */
const fetchWithTimeout = async (
  url: string,
  timeout: number,
  signal?: AbortSignal
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // 组合多个信号（外部取消 + 超时取消）
  const combinedSignal = signal
    ? combineSignals([signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch(url, { signal: combinedSignal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (controller.signal.aborted) {
      throw new RemoteDataError(
        RemoteDataErrorType.NETWORK_TIMEOUT,
        `请求超时（${timeout}ms）`,
        error
      );
    }
    throw error;
  }
};

/**
 * 延迟函数（用于重试）
 * @param ms - 延迟时间（毫秒）
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 判断错误是否可重试
 * @param error - RemoteDataError 实例
 * @returns 是否可重试
 */
const isRetryableError = (error: RemoteDataError): boolean => {
  // 网络超时可重试
  if (error.type === RemoteDataErrorType.NETWORK_TIMEOUT) return true;
  
  // 网络错误可重试
  if (error.type === RemoteDataErrorType.NETWORK_ERROR) return true;
  
  // 服务器错误（5xx）可重试
  if (error.type === RemoteDataErrorType.SERVER_ERROR && error.statusCode && error.statusCode >= 500) {
    return true;
  }

  // 其他错误不可重试
  return false;
};

/**
 * 适配器：将 models.dev API 响应转换为内部格式
 * @param apiResponse - models.dev API 原始响应（键值对对象）
 * @param allowedProviders - 允许的供应商白名单
 * @returns 过滤并转换后的供应商数据数组
 */
const adaptApiResponseToInternalFormat = (
  apiResponse: ModelsDevApiResponse,
  allowedProviders: readonly string[],
): RemoteProviderData[] => {
  // 将键值对对象转换为数组并过滤白名单
  const providerEntries = Object.entries(apiResponse);
  
  return providerEntries
    .filter(([providerKey]) => allowedProviders.includes(providerKey))
    .map(([providerKey, providerData]) => {
      // 将 models 对象转换为数组
      const modelList = Object.values(providerData.models).map((model) => ({
        modelKey: model.id,
        modelName: model.name,
      }));

      return {
        providerKey,
        providerName: providerData.name,
        apiAddress: providerData.api,
        models: modelList,
      };
    });
};

/**
 * 创建缓存 Store 实例
 * @returns Store 实例
 */
const createCacheStore = (): StoreCompat => {
  return createLazyStore('remote-cache.json');
};

/**
 * 保存完整的 API 响应到缓存
 * @param fullApiResponse - models.dev API 的完整响应（未过滤）
 */
export const saveCachedProviderData = async (
  fullApiResponse: ModelsDevApiResponse
): Promise<void> => {
  const store = createCacheStore();
  await store.init();

  const cachedData: CachedModelData = {
    apiResponse: fullApiResponse,
    metadata: {
      lastRemoteUpdate: new Date().toISOString(),
      source: 'remote',
    },
  };

  await store.set(REMOTE_MODEL_CACHE_KEY, cachedData);
  await store.save();
};

/**
 * 从缓存加载并过滤供应商数据
 * @param allowedProviders - 允许的供应商白名单
 * @returns 过滤后的供应商数据数组
 * @throws {RemoteDataError} 缓存不存在时抛出
 */
export const loadCachedProviderData = async (
  allowedProviders: readonly string[]
): Promise<RemoteProviderData[]> => {
  const store = createCacheStore();
  await store.init();

  const cached = await store.get<CachedModelData>(REMOTE_MODEL_CACHE_KEY);

  if (!cached) {
    throw new RemoteDataError(
      RemoteDataErrorType.NO_CACHE,
      '无可用缓存'
    );
  }

  // 加载时过滤完整响应
  return adaptApiResponseToInternalFormat(
    cached.apiResponse,
    allowedProviders
  );
};

/**
 * 判断缓存数据是否新鲜
 * @param cachedTimestamp - 缓存时间戳（ISO 8601 格式）
 * @returns 是否新鲜
 */
export const isRemoteDataFresh = (cachedTimestamp: string): boolean => {
  const cachedTime = new Date(cachedTimestamp).getTime();
  const now = Date.now();
  return (now - cachedTime) < CACHE_CONFIG.EXPIRY_TIME_MS;
};

/**
 * 从远程 API 获取模型供应商数据（带重试和超时）
 * @param options - 请求配置选项
 * @returns 包含完整 API 响应和过滤后数据的对象
 * @throws {RemoteDataError} 请求失败时抛出
 */
export const fetchRemoteData = async (
  options: FetchRemoteOptions = {}
): Promise<{
  /** 完整的 API 响应（用于缓存） */
  fullApiResponse: ModelsDevApiResponse;
  /** 过滤后的供应商数据（用于注册） */
  filteredData: RemoteProviderData[];
}> => {
  const {
    timeout = NETWORK_CONFIG.DEFAULT_TIMEOUT,
    maxRetries = NETWORK_CONFIG.DEFAULT_MAX_RETRIES,
    signal,
  } = options;

  let lastError: RemoteDataError | null = null;

  // 重试循环（maxRetries 表示最大重试次数，不包括首次请求）
  for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
    try {
      // 发起带超时的请求
      const response = await fetchWithTimeout(
        NETWORK_CONFIG.API_ENDPOINT,
        timeout,
        signal
      );

      // 检查 HTTP 状态码
      if (!response.ok) {
        // 客户端错误（4xx）不重试
        if (response.status >= 400 && response.status < 500) {
          throw new RemoteDataError(
            RemoteDataErrorType.SERVER_ERROR,
            `客户端错误: ${response.status} ${response.statusText}`,
            undefined,
            response.status
          );
        }

        // 服务器错误（5xx）可能重试
        throw new RemoteDataError(
          RemoteDataErrorType.SERVER_ERROR,
          `服务器错误: ${response.status} ${response.statusText}`,
          undefined,
          response.status
        );
      }

      // 解析 JSON
      const apiData: ModelsDevApiResponse = await response.json();
      
      // 转换为内部格式
      const filteredData = adaptApiResponseToInternalFormat(apiData, ALLOWED_MODEL_PROVIDERS);

      // 返回完整响应和过滤后的数据
      return {
        fullApiResponse: apiData,
        filteredData,
      };

    } catch (error) {
      lastError = error instanceof RemoteDataError
        ? error
        : new RemoteDataError(
            RemoteDataErrorType.NETWORK_ERROR,
            '网络请求失败',
            error
          );

      // 检查是否应该重试
      const shouldRetry =
        retryCount < maxRetries &&
        isRetryableError(lastError);

      if (!shouldRetry) {
        throw lastError;
      }

      // 指数退避延迟
      const delay = NETWORK_CONFIG.RETRY_DELAY_BASE * Math.pow(2, retryCount);
      await sleep(delay);
    }
  }

  // 所有重试都失败
  throw lastError;
};
