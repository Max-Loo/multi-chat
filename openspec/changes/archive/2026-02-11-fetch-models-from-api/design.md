## Context

**当前状态**：
应用中的模型供应商（Model Providers）数据完全硬编码在代码中，包括：

- API 地址（`apiAddress`）
- 支持的模型列表（`modelList`）
- 供应商信息（`providerName`、`providerKey`）

每当 models.dev 发布新模型或更新 API 信息时，需要手动修改代码并重新发布应用。用户无法及时获得最新的模型信息，增加了维护成本。

**约束条件**：

- 必须兼容 Tauri 和 Web 两种运行环境
- 必须使用现有的 `@/utils/tauriCompat/http.ts` 进行网络请求
- 不能新增第三方依赖
- 离线环境下应用必须可用（降级策略）
- 敏感数据（apiKey）必须加密存储（现有机制）

**利益相关者**：

- **最终用户**：希望使用最新的模型，无需频繁更新应用
- **开发者**：希望减少手动维护模型数据的工作量
- **应用稳定性**：网络故障不能影响应用基本功能

## Goals / Non-Goals

**Goals**：

- 从 `https://models.dev/api.json` 动态获取模型供应商数据
- 每次应用启动时自动拉取最新数据，失败时降级到缓存
- 在设置页面提供手动刷新按钮，用户可主动触发更新
- 仅保留白名单中的供应商（moonshotai、deepseek、zhipuai、zhipuai-coding-plan）
- 缓存获取的数据，记录更新时间戳
- 跨平台兼容（Tauri + Web）

**Non-Goals**：

- 不实现定时自动更新（仅启动时 + 手动刷新）
- 不支持用户自定义添加新的模型供应商（过滤列表由开发者维护）
- 不实现模型数据的版本控制和迁移（每次直接覆盖）
- 不修改现有的加密存储机制（apiKey 加密逻辑保持不变）
- **不解决启动流程的竞态条件问题**：`initializeModelProvider` 和 `initializeModels` 并行执行存在时序风险，但该问题将在未来通过 `@ai-sdk/react` 插件统一解决，当前风险可控

## Decisions

### 1. 数据架构设计

**决策**：采用"远程获取-动态注册-模型加载"分离架构

**架构层次**：

```
models.dev API (远程源)
    ↓ fetch()
远程数据获取层 (src/services/modelRemoteService.ts)
    ↓ filter(ALLOWED_MODEL_PROVIDERS)
供应商过滤层 (src/utils/constants.ts)
    ↓ registerDynamicProviders()
动态注册层 (src/lib/factory/modelProviderFactory/registerDynamicProviders.ts)
    ↓ initializeModels()
模型初始化层 (src/store/slices/modelSlice.ts)
    ↓ Redux store
应用数据层
```

**关键设计点**：

1. **远程数据获取**：独立的 service 模块，负责网络请求和过滤
2. **动态 Provider 注册**：根据远程数据创建 Provider 实例并注册到工厂
3. **模型初始化**：从存储加载用户配置的模型列表（职责保持不变）
4. **本地缓存**：远程数据失败时降级到缓存（models.json）

**理由**：

- **职责分离**：数据获取、Provider 注册、模型加载各司其职，符合单一职责原则
- **解决硬编码**：`ProviderRegistry.ts` 不再硬编码，而是根据远程数据动态注册
- **向后兼容**：`initializeModels` 的职责不变，仍然是加载存储的模型列表
- **易于测试**：每层可独立测试，mock 数据简单
- **可扩展性**：未来添加更多数据源（如其他 API）只需扩展获取层
- **降级友好**：任一层失败都能优雅降级

**替代方案**：

- ❌ 单一函数处理所有逻辑：违反 SRP，难以测试和维护
- ❌ 在 initializeModels 中集成远程获取：混淆了"数据获取"和"模型加载"两个职责
- ❌ 直接在 Redux action 中获取和注册：业务逻辑与状态管理耦合

---

### 2. 供应商过滤策略

**决策**：在常量文件中维护白名单，使用 `providerKey` 进行精确匹配

**实现方式**：

```typescript
// src/utils/constants.ts
export const ALLOWED_MODEL_PROVIDERS: readonly string[] = [
  "moonshotai", // Kimi
  "deepseek",
  "zhipuai", // 智谱 AI
  "zhipuai-coding-plan", // 智谱 AI 编程模型
] as const;
```

**过滤逻辑**：

```typescript
// models.dev API 返回的是键值对对象，而非数组
const providerEntries = Object.entries(apiResponse); // 转换为 [providerKey, providerData][] 数组

const filteredProviders = providerEntries
  .filter(([providerKey]) => ALLOWED_MODEL_PROVIDERS.includes(providerKey))
  .map(([providerKey, providerData]) => ({
    providerKey,
    ...providerData,
  }));
```

**理由**：

- **类型安全**：使用 `readonly` 和 `as const` 确保编译时常量
- **易于维护**：添加新供应商只需修改数组，无需改动过滤逻辑
- **精确匹配**：使用 `providerKey` 而非名称字符串，避免命名不一致问题
- **集中管理**：所有配置常量在同一文件，符合 DRY 原则

**替代方案**：

- ❌ 使用配置文件（JSON）：需要文件 I/O，增加复杂度
- ❌ 使用环境变量：过度工程化，供应商列表不需要运行时动态配置
- ❌ 黑名单模式：默认不安全，新供应商可能不符合标准

---

### 3. 网络请求层设计

**决策**：创建独立的服务模块 `src/services/modelRemoteService.ts`，实现包含超时、重试、错误分类的健壮网络请求层

**核心职责**：

```typescript
// src/services/modelRemoteService.ts
export interface RemoteProviderData {
  providerKey: string;
  providerName: string;
  apiAddress: string;
  models: ModelDetail[];
}

// 请求配置选项
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

// 主要导出函数
export const fetchRemoteData = async (options?: FetchRemoteOptions): Promise<RemoteProviderData[]>
export const isRemoteDataFresh = (cachedTimestamp: string): boolean
export const loadCachedProviderData = async (): Promise<RemoteProviderData[]>
```

**请求配置常量**（`src/utils/constants.ts`）：

```typescript
// 网络请求配置
export const NETWORK_CONFIG = {
  /** 默认请求超时时间（5 秒） */
  DEFAULT_TIMEOUT: 5000,
  /** 默认最大重试次数 */
  DEFAULT_MAX_RETRIES: 2,
  /** 重试延迟基数（毫秒），使用指数退避算法 */
  RETRY_DELAY_BASE: 1000,
  /** API 端点 URL */
  API_ENDPOINT: "https://models.dev/api.json",
} as const;
```

**错误类型定义**：

```typescript
// src/services/modelRemoteService.ts

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
```

**重试策略**：

- **指数退避算法**：每次重试的延迟时间为 `RETRY_DELAY_BASE * (2 ^ retryCount)`
- **首次重试**：1 秒后
- **第二次重试**：2 秒后
- **可重试条件**：
  - 网络错误（如 DNS 解析失败、连接超时）
  - 服务器 5xx 错误（如 500、502、503）
  - 请求超时
- **不可重试条件**：
  - 客户端错误（4xx，如 400、404）
  - JSON 解析失败
  - 请求被取消（AbortSignal）

**超时控制**：

使用 `AbortController` 实现请求超时：

```typescript
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
```

**完整实现示例**：

```typescript
// src/services/modelRemoteService.ts

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
  // 例如：maxRetries=2 表示首次请求失败后，最多重试2次，总计3次请求
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

/**
 * 判断错误是否可重试
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
 * 延迟函数（用于重试）
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
```

**调用关系**：

```
Redux Thunk (initializeModelProvider / refreshModelProvider)
    ↓ 调用
modelRemoteService.fetchRemoteData({ timeout, maxRetries, signal })
    ↓ 带超时和重试的请求
fetchWithTimeout() → models.dev API
    ↓ 失败时指数退避重试
重试延迟（1s → 2s → 4s...）
    ↓ 成功或最终失败
返回数据 或 抛出 RemoteDataError
    ↓ Redux Thunk 捕获错误
降级到缓存 或 显示错误提示
```

**用户提示国际化**（`src/locales/zh/setting.json`）：

```json
{
  "modelProvider": {
    "refreshSuccess": "模型供应商数据已更新",
    "refreshFailed": "刷新失败",
    "errors": {
      "network_timeout": "网络请求超时，请检查网络连接",
      "server_error": "服务器错误，请稍后重试",
      "parse_error": "数据解析失败",
      "no_cache": "无可用的缓存数据",
      "network_error": "网络连接失败",
      "aborted": "请求已取消"
    }
  }
}
```

**在 Redux Thunk 中使用**：

```typescript
// src/store/slices/modelProviderSlice.ts

export const refreshModelProvider = createAsyncThunk(
  'modelProvider/refresh',
  async (_, { signal }) => {
    try {
      const remoteData = await fetchRemoteData({
        forceRefresh: true,
        signal,  // 传入 AbortSignal（Redux Toolkit 自动提供）
      });
      registerDynamicProviders(remoteData);
      return { lastUpdate: new Date().toISOString() };
    } catch (error) {
      if (error instanceof RemoteDataError) {
        // 根据错误类型显示不同的提示
        const errorMessage = t(`setting.modelProvider.errors.${error.type}`);
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
);
```

**理由**：

- **健壮性**：超时机制防止请求无限期挂起
- **可靠性**：指数退避重试提高网络不稳定时的成功率
- **用户体验**：明确的错误分类让用户知道具体问题
- **性能**：快速失败（5 秒超时）避免用户长时间等待
- **资源管理**：AbortSignal 支持组件卸载时取消请求
- **国际化**：错误提示支持多语言
- **可测试性**：独立的超时和重试逻辑易于单元测试

**替代方案**：

- ❌ 直接在 Redux Thunk 中调用 fetch：难以复用和测试，缺少重试逻辑
- ❌ 使用通用 HTTP 客户端库（如 axios）：违反"不能新增第三方依赖"的约束
- ❌ 简单的 try-catch 而无重试：网络不稳定时成功率低，用户体验差

---

### 4. 缓存存储策略

**决策**：使用独立的 Store 文件（`remote-cache.json`）存储远程供应商数据，与用户模型数据分离

**存储结构**：

```typescript
// 缓存数据结构定义（在 modelRemoteService.ts 中）
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

// 缓存存储键（在 modelRemoteService.ts 中定义）
const REMOTE_MODEL_CACHE_KEY = "remoteModelCache";

// 缓存存储配置（在 src/utils/constants.ts 中）
export const CACHE_CONFIG = {
  /** 缓存过期时间（24 小时） */
  EXPIRY_TIME_MS: 24 * 60 * 60 * 1000,
  /** 缓存版本（API 结构变更时递增） */
  CACHE_VERSION: 1,
  /** 最大缓存大小（10 MB） */
  MAX_CACHE_SIZE_MB: 10,
} as const;
```

**存储实现**：

```typescript
// 使用 tauriCompat 的 Store 兼容层
import { createLazyStore } from '@/utils/tauriCompat';
import type { StoreCompat } from '@/utils/tauriCompat';

// 创建独立的 Store 实例（文件名：remote-cache.json）
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
    apiResponse: fullApiResponse,  // 保存完整响应
    metadata: {
      lastRemoteUpdate: new Date().toISOString(),
      source: 'remote',
    },
  };

  await store.set(REMOTE_MODEL_CACHE_KEY, cachedData);
  await store.save(); // Tauri 环境需要显式保存，Web 环境为空操作
};

/**
 * 从缓存加载并过滤供应商数据
 * @param allowedProviders - 允许的供应商白名单
 * @returns 过滤后的供应商数据数组
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
```

**理由**：

- **数据隔离**：远程供应商数据与用户模型数据分离，避免混淆和冲突
- **独立生命周期**：缓存文件可独立清理，不影响用户配置
- **向后兼容**：不影响现有的 `models.json` 存储结构
- **平台兼容**：使用 tauriCompat 的 Store 兼容层，自动适配 Tauri 和 Web 环境
- **元数据分离**：`metadata` 字段与业务数据分离，易于扩展
- **来源追踪**：`source` 字段帮助调试（知道数据是远程的还是降级的）
- **白名单灵活性**：缓存完整响应后，白名单可以随时调整，不影响缓存有效性。新增白名单供应商时，即使离线也能从缓存中获取数据

**替代方案**：

- ❌ 扩展现有 `models.json`：混淆用户配置和远程数据，增加维护复杂度
- ❌ 使用浏览器 localStorage：容量限制（通常 5-10MB），不适合存储大量模型数据
- ❌ 仅存储时间戳：无法在离线时恢复完整数据

---

### 5. 错误处理和降级策略

**决策**：两级降级 + 全屏错误提示，避免使用过时的硬编码配置

**降级流程**：

```
启动时/手动刷新
  ↓
1. 尝试从 https://models.dev/api.json 获取数据
  ↓ 失败
2. 降级到本地缓存（如果存在）
  ↓ 失败或无缓存
3. 显示全屏错误提示："无可用的模型供应商，请检查网络连接后重试"
```

**全屏提示实现**：

```typescript
// src/components/NoProvidersAvailable.tsx
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export const NoProvidersAvailable: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex max-w-md flex-col items-center gap-6 text-center p-6">
        <AlertCircle className="h-16 w-16 text-destructive" />

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">无可用的模型供应商</h2>
          <p className="text-muted-foreground">
            应用无法连接到模型数据服务器，且本地无可用缓存。
          </p>
          <p className="text-sm text-muted-foreground">
            请检查网络连接后点击下方按钮重试。
          </p>
        </div>

        <Button onClick={() => window.location.reload()} size="lg">
          重新加载
        </Button>
      </div>
    </div>
  );
};
```

**理由**：

- **避免使用过时数据**：硬编码配置可能包含已废弃的 API 地址或模型信息，误导用户
- **明确的错误提示**：用户清楚知道问题所在（网络连接）和解决方法（重试）
- **强制修复**：全屏阻断式提示，避免用户使用过时配置导致更严重的错误
- **简化维护**：不需要在代码中维护硬编码的默认配置，减少维护成本
- **真实反映状态**：缓存过期时明确告知用户，而非悄悄使用旧数据

**替代方案**：

- ❌ 三级降级（含硬编码配置）：可能使用过时的 API 地址，导致用户困惑
- ❌ 无降级（网络失败就报错）：缺少缓存利用，体验不佳

---

### 6. 启动时数据刷新策略

**决策**：远程数据获取封装为 Redux Thunk `initializeModelProvider`，在 main.tsx 中异步调用

**⚠️ 重要说明：竞态条件风险**

当前设计中，`initializeModelProvider` 和 `initializeModels` 并行执行，存在潜在的竞态条件风险：

- **风险描述**：如果 `initializeModels` 在 `initializeModelProvider` 完成之前执行，可能会导致 Provider 尚未注册就尝试加载模型
- **暂不处理原因**：项目计划在未来使用 `@ai-sdk/react` 插件重构模型调用层，届时将通过更现代的方式统一管理 Provider 和模型生命周期
- **缓解措施**：由于 `initializeModels` 主要是加载用户已配置的模型列表，而动态注册主要用于新模型的可用性，当前实现中即使存在短暂的时间差，也不会导致应用崩溃或数据丢失
- **未来方案**：使用 `@ai-sdk/react` 后，将通过 React Hooks 和 Suspense 实现更优雅的异步依赖管理，彻底解决此问题

**架构设计**：

```
应用启动流程 (main.tsx)
  ↓
【阻断式初始化】
  ├─ 1. 国际化初始化（initI18n）
  └─ 2. 主密钥初始化（initializeMasterKey）
       ↓
     3. 模型初始化（initializeModels）← 依赖主密钥（需要解密 apiKey）
       ↓
【异步初始化 - 并行执行】
  ├─ store.dispatch(initializeModels())       ← 模型初始化
  ├─ store.dispatch(initializeChatList())     ← 聊天列表加载
  ├─ store.dispatch(initializeAppLanguage())  ← 应用语言配置加载
  └─ store.dispatch(initializeModelProvider())← Provider 初始化（新增）
       ↓
     4. 远程数据获取（fetchRemoteData）← 独立执行，不依赖主密钥
       ↓
     5. 动态注册 Provider（registerDynamicProviders）
       ↓
【渲染后】
  ├─ 安全性警告 Toast（Web 环境）
  └─ 手动刷新按钮（设置页面）
```

**职责分离**：

1. **Provider 初始化 Thunk**（`src/store/slices/modelProviderSlice.ts` - 新增）：
   - 职责：协调远程数据获取和 Provider 注册
   - 实现：调用 `fetchRemoteData()` 和 `registerDynamicProviders()`
   - 特点：**不依赖主密钥**（获取的是公开的 Provider 定义，不包含敏感的 apiKey）
   - 调用时机：应用启动时（异步，非阻塞），类似 `initializeAppLanguage()`

2. **远程数据获取模块**（`src/services/modelRemoteService.ts`）：
   - 职责：从 models.dev API 获取最新的提供商定义
   - 返回：Provider 定义数据（apiAddress、modelList、providerInfo 等）
   - 失败处理：降级到本地缓存

3. **动态 Provider 注册**（`src/lib/factory/modelProviderFactory/registerDynamicProviders.ts`）：
   - 职责：根据远程数据动态创建并注册 Provider 实例
   - 替代：`ProviderRegistry.ts` 中的硬编码注册逻辑
   - 兼容：保留用户自定义 Provider 的能力
   - 特点：**不影响已加载的模型数据**

4. **模型初始化**（`initializeModels` Redux Thunk）：
   - 职责：从存储加载用户配置的模型列表（包含加密的 apiKey）
   - 依赖：**依赖主密钥初始化**（需要解密 apiKey）
   - 数据来源：已注册的 Provider + 用户配置
   - 保持不变：不涉及远程数据获取

**关键区别**：

| 对比项 | 远程数据获取 | 模型初始化 |
|--------|------------|-----------|
| 数据内容 | Provider 定义（apiAddress、modelList 等） | 用户配置的模型（包含加密的 apiKey） |
| 是否依赖主密钥 | ❌ 否（公开数据，无需加密） | ✅ 是（需要解密 apiKey） |
| 执行时机 | 异步并行，不阻塞启动 | 阻断式，必须在主密钥初始化后 |
| 失败影响 | 仅影响 Provider 动态注册，降级到缓存 | 应用无法加载用户模型，显示错误 |
| 存储位置 | models.json（元数据） | models.json（用户配置） |

**实现方式**：

```typescript
// src/services/modelRemoteService.ts（新增）
export const fetchRemoteData = async (): Promise<RemoteProviderData[]> => {
  const response = await fetch("https://models.dev/api.json");
  const apiData: ModelsDevApiResponse = await response.json();
  
  // models.dev API 返回的是键值对对象: { [providerKey: string]: ModelProvider }
  // 需要转换为内部格式: RemoteProviderData[]
  return adaptApiResponseToInternalFormat(apiData, ALLOWED_MODEL_PROVIDERS);
};

// src/lib/factory/modelProviderFactory/registerDynamicProviders.ts（新增）
export const registerDynamicProviders = (
  providers: RemoteProviderData[],
): void => {
  providers.forEach((remoteProvider) => {
    const provider = new DynamicModelProvider(remoteProvider);
    registerProviderFactory(provider.key, new GenericFactory(provider));
  });
};

// src/store/slices/modelProviderSlice.ts（新增）
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchRemoteData,
  saveCachedProviderData,
  loadCachedProviderData,
} from '@/services/modelRemoteService';
import { registerDynamicProviders } from '@/lib/factory/modelProviderFactory/registerDynamicProviders';

export interface ModelProviderSliceState {
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
}

const initialState: ModelProviderSliceState = {
  loading: false,
  error: null,
  lastUpdate: null,
};

// Provider 初始化 Thunk
export const initializeModelProvider = createAsyncThunk(
  'modelProvider/initialize',
  async () => {
    try {
      // 1. 尝试从远程获取最新数据
      const { fullApiResponse, filteredData } = await fetchRemoteData();

      // 2. 保存完整响应到缓存
      await saveCachedProviderData(fullApiResponse);

      // 3. 使用过滤后的数据动态注册 Provider
      registerDynamicProviders(filteredData);

      return { lastUpdate: new Date().toISOString() };
    } catch (error) {
      // 4. 降级到缓存（加载时过滤）
      const cachedData = await loadCachedProviderData(ALLOWED_MODEL_PROVIDERS);
      registerDynamicProviders(cachedData);

      throw error; // 保留错误信息以便在 UI 中显示
    }
  }
);

// 刷新 Provider Thunk（用于设置页面的手动刷新）
export const refreshModelProvider = createAsyncThunk(
  'modelProvider/refresh',
  async () => {
    // 1. 强制从远程获取最新数据
    const { fullApiResponse, filteredData } = await fetchRemoteData({ forceRefresh: true });

    // 2. 更新缓存（保存完整响应）
    await saveCachedProviderData(fullApiResponse);

    // 3. 使用过滤后的数据动态注册 Provider
    registerDynamicProviders(filteredData);

    return { lastUpdate: new Date().toISOString() };
  }
);

const modelProviderSlice = createSlice({
  name: 'modelProvider',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // initializeModelProvider
      .addCase(initializeModelProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeModelProvider.fulfilled, (state, action) => {
        state.loading = false;
        state.lastUpdate = action.payload.lastUpdate;
      })
      .addCase(initializeModelProvider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to initialize model providers';
      })
      // refreshModelProvider
      .addCase(refreshModelProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshModelProvider.fulfilled, (state, action) => {
        state.loading = false;
        state.lastUpdate = action.payload.lastUpdate;
      })
      .addCase(refreshModelProvider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to refresh model providers';
      });
  },
});

export const { clearError } = modelProviderSlice.actions;
export default modelProviderSlice.reducer;

// src/main.tsx（修改）
import { initializeModelProvider } from "@/store/slices/modelProviderSlice";
// 移除：import { registerAllProviders } from "./lib/factory/modelProviderFactory/ProviderRegistry";

const rootDom = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

// 先预渲染一个开屏动画
rootDom.render(<FullscreenLoading />);

// 移除：registerAllProviders() ← 不再需要硬编码注册
interceptClickAToJump();

// 阻断式的初始化逻辑（渲染前需要保证初始化完成）
const InterruptiveInitPromise = Promise.all([
  initI18n(),
  initializeMasterKey(),
]);

// 可以异步完成的初始化逻辑
store.dispatch(initializeModels());
store.dispatch(initializeChatList());
store.dispatch(initializeAppLanguage());
store.dispatch(initializeModelProvider()); // ← 新增：Provider 初始化（异步并行）

// 渲染真正的页面
await InterruptiveInitPromise;

rootDom.render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfirmProvider>
        <RouterProvider router={router} />
        <Toaster />
      </ConfirmProvider>
    </Provider>
  </React.StrictMode>,
);

// 应用渲染后，处理安全性警告（现在可以使用 Toast）
await handleSecurityWarning();
```

**关键特性**：

- **完全独立**：远程数据获取不依赖主密钥，可以并行执行
- **职责单一**：每个模块只负责一件事（SRP）
- **依赖倒置**：`initializeModels` 依赖已注册的 Provider 抽象，而非数据来源
- **开放封闭**：新增 Provider 无需修改代码，只需远程 API 返回
- **降级策略**：远程失败 → 缓存 → 全屏错误提示（design.md 第 5 节）

**与硬编码 Provider 的区别**：

| 对比项   | 硬编码 Provider（当前） | 动态 Provider（新方案） |
| -------- | ----------------------- | ----------------------- |
| 数据来源 | 代码硬编码              | models.dev API          |
| 更新方式 | 修改代码 + 重新发布     | 自动同步 API            |
| 模型列表 | 静态数组                | 动态获取                |
| API 地址 | 硬编码字符串            | API 返回                |
| 维护成本 | 高（手动更新）          | 低（自动同步）          |
| 依赖主密钥 | 否 | 否（注册不依赖，模型加载依赖） |

**理由**：

- **清晰的架构边界**：远程数据获取（Provider 定义）与模型初始化（用户配置）完全独立
- **解决硬编码问题**：`ProviderRegistry.ts` 不再硬编码 Provider，而是根据远程数据动态注册
- **保持向后兼容**：`initializeModels` 的职责不变，仍然是加载存储的模型列表
- **灵活的数据源**：未来可轻松添加其他数据源（如本地配置文件、其他 API）
- **性能优化**：远程数据获取并行执行，不阻塞应用启动和模型加载

**替代方案**：

- ❌ 在 `initializeModels` 中集成远程获取：违反 SRP，混淆了"Provider 定义获取"和"模型配置加载"两个职责
- ❌ 远程数据获取作为模型初始化的前置步骤：不必要的依赖，增加启动延迟
- ❌ 直接在 ProviderRegistry 中调用 API：违反依赖注入原则，ProviderRegistry 应该只负责注册

---

### 7. 手动刷新功能实现

**决策**：在设置页面添加"刷新模型供应商"按钮，调用 modelProviderSlice 的 `refreshModelProvider` action

**实现方式**：

```typescript
// src/store/slices/modelProviderSlice.ts（已定义）

export const refreshModelProvider = createAsyncThunk(
  'modelProvider/refresh',
  async () => {
    const remoteData = await fetchRemoteData({ forceRefresh: true });
    registerDynamicProviders(remoteData);
    return { lastUpdate: new Date().toISOString() };
  }
);
```

**UI 交互**：

```typescript
// src/pages/Settings.tsx（设置页面组件）
import { useDispatch, useSelector } from 'react-redux';
import { refreshModelProvider } from '@/store/slices/modelProviderSlice';
import { RootState } from '@/store';

const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { loading, error, lastUpdate } = useSelector(
    (state: RootState) => state.modelProvider
  );

  const handleRefresh = () => {
    dispatch(refreshModelProvider())
      .unwrap()
      .then(() => {
        toast.success('模型供应商数据已更新');
      })
      .catch((err) => {
        toast.error(`刷新失败: ${err.message}`);
      });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">模型供应商</h3>
        <p className="text-sm text-muted-foreground">
          从远程服务器获取最新的模型供应商信息
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? '刷新中...' : '刷新模型供应商'}
        </Button>

        {lastUpdate && (
          <span className="text-sm text-muted-foreground">
            最后更新: {new Date(lastUpdate).toLocaleString()}
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive">
          刷新失败: {error}
        </div>
      )}
    </div>
  );
};
```

**理由**：

- **用户控制**：用户可主动触发更新，无需重启应用
- **即时反馈**：通过 Toast 显示更新结果，用户体验好
- **状态可见**：显示最后更新时间，用户知道数据新鲜度
- **Redux 统一管理**：刷新逻辑与启动时初始化逻辑共享相同代码（都在 modelProviderSlice）
- **错误处理**：失败时显示错误信息，用户可以重试

**替代方案**：

- ❌ 独立的刷新组件（不使用 Redux）：增加状态管理复杂度
- ❌ 隐藏的自动刷新（无手动按钮）：用户无法主动更新
- ❌ 刷新后不提示：用户不知道是否成功

---

### 8. 数据转换和兼容性处理

**决策**：创建适配层处理 API 响应格式变化

**实现方式**：

```typescript
// src/services/modelRemoteService.ts

/**
 * models.dev API 响应的实际数据结构（键值对对象）
 * API 返回格式: { [providerKey: string]: ModelsDevApiProvider }
 * 注意：这些类型定义在附录 D 中详细说明
 */
export interface ModelsDevApiResponse {
  [providerKey: string]: ModelsDevApiProvider;
}

/**
 * 单个模型供应商的 API 数据结构
 * 注意：这是 models.dev API 返回的格式，不是应用内部的 ModelProvider 类型
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
 * 注意：这是 models.dev API 返回的格式，不是应用内部的 Model 类型
 */
interface ModelsDevApiModelDetail {
  id: string;
  name: string;
  // ... 其他字段（详见附录 D）
}

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
```

**理由**：

- **解耦**：内部数据格式与外部 API 格式独立，API 变更只需修改适配器
- **类型安全**：TypeScript 确保字段映射的正确性
- **易于测试**：可单独测试适配逻辑，无需真实网络请求
- **容错性**：适配器可处理缺失字段、格式变化等异常情况

**替代方案**：

- ❌ 直接使用 API 格式：API 变更需要修改多处代码
- ❌ 运行时动态解析：类型不安全，易出错

---

## Risks / Trade-offs

### Risk 1: API 可用性依赖

**风险**：如果 `models.dev` API 长期不可用，用户无法获取最新模型数据

**缓解措施**：

- ✅ 本地缓存 + 时间戳（短期离线可用）
- ✅ 全屏错误提示（明确告知用户网络问题，引导重试）
- ✅ 错误监控（记录 API 失败率，考虑添加备用数据源）

---

### Risk 2: API 响应格式变化

**风险**：models.dev 修改 API 结构导致解析失败

**缓解措施**：

- ✅ 适配层隔离（adaptApiResponseToInternalFormat）
- ✅ 类型检查（TypeScript 编译时验证）
- ✅ 容错解析（缺失字段使用默认值，避免崩溃）
- ✅ 单元测试覆盖各种响应格式

---

### Risk 3: 启动性能影响

**风险**：每次启动都发起网络请求可能影响启动速度

**缓解措施**：

- ✅ 非阻塞式请求（网络请求不阻塞 UI 渲染）
- ✅ 快速降级（网络超时 5 秒，立即使用缓存）
- ✅ 可配置（未来可添加"禁用自动更新"选项）

**重试策略影响评估**：

- **首次失败**：1 秒后重试，总耗时约 6 秒（5 秒超时 + 1 秒延迟）
- **第二次失败**：2 秒后重试，总耗时约 13 秒（5+5 秒超时 + 1+2 秒延迟）
- **第三次失败**：放弃，降级到缓存
- **结论**：最坏情况下 13 秒后使用缓存，仍在可接受范围内

---

### Risk 3.1: 网络重试风暴

**风险**：大量用户同时重试可能导致服务器压力过大

**缓解措施**：

- ✅ 指数退避算法（避免客户端同步重试）
- ✅ 最大重试次数限制（2 次）
- ✅ 仅对服务器错误（5xx）重试，4xx 错误立即失败
- ✅ 启动时和手动刷新使用相同重试策略，避免额外开销
- ⚠️ **监控**：记录重试率，如果超过 30% 考虑调整重试策略

---

### Risk 4: 启动流程竞态条件

**风险**：`initializeModelProvider` 和 `initializeModels` 并行执行可能导致时序问题

**具体场景**：
- Provider 尚未注册完成时，`initializeModels` 就开始加载模型列表
- 可能导致动态 Provider 的模型无法正确加载

**缓解措施**：

- ✅ **有意识的设计决策**：当前实现接受此风险，因为：
  - `initializeModels` 主要加载用户已配置的模型（依赖 Provider 枚举，而非动态注册）
  - 动态 Provider 主要用于提供可用性列表，不影响已配置模型的使用
  - 实际测试中，远程获取通常耗时大于本地模型加载，竞态窗口极小
- ✅ **未来解决方案**：项目计划使用 `@ai-sdk/react` 重构模型调用层，届时将通过 React Hooks 和 Suspense 实现更优雅的异步依赖管理
- ⚠️ **短期监控**：如果发现实际使用中出现模型加载失败，可考虑将 `initializeModelProvider` 移至阻断式初始化（临时方案）

**不采取立即行动的原因**：
- 修改启动流程会增加应用启动时间（将并行改为串行）
- `@ai-sdk/react` 集成已在规划中，届时将彻底解决此问题
- 当前风险可控，不会导致应用崩溃或数据丢失

---

### Risk 5: 数据一致性问题

**风险**：远程数据与用户自定义模型合并时可能冲突

**缓解措施**：

- ✅ 明确的数据来源标记（`source: 'remote' | 'user'`）
- ✅ 用户模型优先（远程数据不覆盖用户自定义模型）
- ✅ 幂等性保证（多次刷新结果一致）

---

### Trade-off 1: 维护成本 vs 灵活性

**权衡**：白名单过滤需要开发者手动维护，但保证了数据质量

**选择**：选择白名单模式，因为：

- ✅ 应用只需要主流供应商，不需要全量数据
- ✅ 过滤后的数据体积更小，缓存效率更高
- ✅ 避免低质量或不兼容的供应商进入系统

**未来优化**：可考虑添加"开发者选项"允许高级用户自定义白名单

---

### Trade-off 2: 启动时自动更新 vs 手动控制

**权衡**：启动时自动更新方便但减少用户控制，手动刷新灵活但易被遗忘

**选择**：混合模式（启动时自动 + 手动刷新按钮），兼顾便利性和控制权

---

### Trade-off 3: 用户体验 vs 维护成本

**权衡**：全屏阻断式提示用户体验较差，但避免了使用过时配置导致的问题

**选择**：优先保证数据准确性，宁可提示错误也不提供可能过时的硬编码配置

- **优势**：避免用户使用已废弃的 API 地址，减少困惑和潜在错误
- **劣势**：网络完全不可用时用户无法使用应用（但这种情况极少）
- **未来优化**：可考虑添加多个备用数据源，而非硬编码配置

---

## Migration Plan

### 部署步骤

**Phase 1: 代码实现**（开发阶段）
1. 在 `src/utils/constants.ts` 添加网络请求配置常量（`NETWORK_CONFIG`）
2. 创建 `src/services/modelRemoteService.ts` 模块（远程数据获取）
   - 实现 `fetchWithTimeout` 超时控制
   - 实现 `fetchRemoteData` 带重试逻辑
   - 定义 `RemoteDataError` 错误类型
   - 实现 `adaptApiResponseToInternalFormat` 适配器
3. 创建 `src/lib/factory/modelProviderFactory/registerDynamicProviders.ts`（动态注册）
4. 创建 `src/store/slices/modelProviderSlice.ts`（Provider 状态管理）
5. 在 `src/utils/constants.ts` 添加 `ALLOWED_MODEL_PROVIDERS`
6. 在 `src/store/index.ts` 中添加 modelProviderSlice reducer
7. 在设置页面添加刷新按钮和状态显示（支持取消请求）
8. 在 `src/locales/zh/setting.json` 和 `src/locales/en/setting.json` 添加错误提示文案
9. 编写单元测试和集成测试
   - 测试超时机制（mock AbortController）
   - 测试重试逻辑（mock fetch 失败场景）
   - 测试错误分类（各种错误类型）

**Phase 2: 代码重构**（移除硬编码）
1. 删除 `ProviderRegistry.ts` 中的硬编码 Provider 实例化
2. 修改 `src/main.tsx`：
   - 移除 `import { registerAllProviders } from "./lib/factory/modelProviderFactory/ProviderRegistry"`
   - 移除 `registerAllProviders()` 调用
   - 添加 `import { initializeModelProvider } from "@/store/slices/modelProviderSlice"`
   - 添加 `store.dispatch(initializeModelProvider())` 调用（异步并行执行）
3. 保留 `ConfigurableModelProvider` 基类（用于动态创建 Provider）
4. 确保向后兼容（用户自定义模型不受影响）

**注意**：在此阶段不需要处理 `initializeModelProvider` 和 `initializeModels` 之间的竞态条件问题。该问题将在未来通过 `@ai-sdk/react` 插件统一解决。当前实现中，由于 `initializeModels` 主要依赖已存在的 Provider 枚举而非动态注册，竞态条件风险可控且不会导致应用功能异常。

**Phase 3: 数据迁移**（首次运行）
1. 应用首次启动时检测是否存在远程数据缓存
2. 如果不存在，从远程 API 获取并保存
3. 无需用户数据迁移（向后兼容）

**Phase 4: 发布和监控**（生产环境）
1. 灰度发布（小部分用户）
2. 监控 API 成功率和失败率
3. 收集用户反馈
4. 全量发布

### 回滚策略

**触发条件**：

- API 失败率超过 50%
- 出现严重 bug 导致应用崩溃
- 用户强烈反馈

**回滚步骤**：

1. 发布热修复版本，禁用远程获取功能，恢复硬编码 Provider
2. 恢复 `main.tsx` 中的 `registerAllProviders()` 调用
3. 移除或注释 `store.dispatch(initializeModelProvider())` 调用
4. 用户数据无需回滚（本地缓存自动失效）
5. 修复问题后重新启用远程获取

**回滚代码示例**：

```typescript
// src/main.tsx
const ENABLE_REMOTE_PROVIDER_FETCH = false; // 紧急关闭

// 可以异步完成的初始化逻辑
store.dispatch(initializeModels());
store.dispatch(initializeChatList());
store.dispatch(initializeAppLanguage());

if (ENABLE_REMOTE_PROVIDER_FETCH) {
  store.dispatch(initializeModelProvider()); // 动态注册
} else {
  registerAllProviders(); // 回退到硬编码注册
}
```

---

## Open Questions

1. **Q**: models.dev API 是否需要认证或 API 密钥？
    - **A**: 不需要

2. **Q**: API 响应的数据量大小？是否会影响首次启动速度？
    - **A**: 待测试。如果数据量大，考虑实现增量更新或分页加载。

3. **Q**: 是否需要实现"后台静默更新"模式（启动时不刷新，后台定期更新）？
    - **A**: 当前设计不包含。未来可根据用户反馈考虑添加。

4. **Q**: 缓存过期时间应该如何设置？
    - **A**: 建议 24 小时。可根据 API 更新频率调整，已在 `CACHE_CONFIG` 中配置。

5. **Q**: 是否需要支持"禁用自动更新"选项（针对纯离线场景）？
    - **A**: 当前设计不支持。可根据用户反馈在设置页面添加开关。

6. **Q**: 启动流程的竞态条件风险是否需要在 `@ai-sdk/react` 集成前解决？
    - **A**: 不需要。当前设计已评估风险可控，且 `@ai-sdk/react` 集成计划已列入路线图。`@ai-sdk/react` 提供的 `useChat` 和 `useCompletion` Hooks 将自然解决 Provider 和模型的异步依赖关系。在此之前的短期方案是监控实际使用情况，如果出现模型加载失败问题，可临时将 `initializeModelProvider` 移至阻断式初始化。

7. **Q**: `@ai-sdk/react` 集成的时间表是什么？
    - **A**: 待定。当前优先级是实现基础动态 Provider 功能，`@ai-sdk/react` 集成将在后续迭代中规划。

8. **Q**: 网络请求超时时间 5 秒是否合适？
    - **A**: 需要根据实际测试调整。如果 models.dev API 响应时间通常较长，可考虑增加到 8-10 秒。超时时间配置化在 `NETWORK_CONFIG.DEFAULT_TIMEOUT` 中，便于调整。

9. **Q**: 最大重试次数 2 次是否足够？
    - **A**: 需要根据生产环境监控数据调整。如果网络不稳定导致失败率较高，可考虑增加到 3 次。但需注意每次重试都会增加用户等待时间（最多 13 秒），需权衡用户体验和成功率。

10. **Q**: 是否需要实现"智能重试"（如根据网络状态动态调整重试策略）？
    - **A**: 当前设计不包含。未来可根据用户反馈考虑添加网络状态检测（如 Navigator.onLine API），在离线时跳过重试直接使用缓存。

11. **Q**: 重试失败后的错误提示是否需要显示重试次数？
    - **A**: 建议在错误提示中包含"已重试 2 次"等信息，让用户了解系统已尽力尝试。可在国际化文案中添加模板支持。

---

## 附录

### A. 网络请求配置常量

完整的网络请求配置（`src/utils/constants.ts`）：

```typescript
// 网络请求配置
export const NETWORK_CONFIG = {
  /** 默认请求超时时间（5 秒） */
  DEFAULT_TIMEOUT: 5000,
  /** 默认最大重试次数 */
  DEFAULT_MAX_RETRIES: 2,
  /** 重试延迟基数（毫秒），使用指数退避算法 */
  RETRY_DELAY_BASE: 1000,
  /** API 端点 URL */
  API_ENDPOINT: "https://models.dev/api.json",
} as const;

// 缓存配置
export const CACHE_CONFIG = {
  /** 缓存过期时间（24 小时） */
  EXPIRY_TIME_MS: 24 * 60 * 60 * 1000,
  /** 缓存版本（API 结构变更时递增） */
  CACHE_VERSION: 1,
  /** 最大缓存大小（10 MB） */
  MAX_CACHE_SIZE_MB: 10,
} as const;
```

### B. 网络请求错误类型

完整的错误类型定义（`src/services/modelRemoteService.ts`）：

```typescript
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
 * 自定义错误类
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
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 取消信号 */
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
 * 保存完整的 API 响应到缓存
 * @param fullApiResponse - models.dev API 的完整响应（未过滤）
 * @throws {Error} 保存失败时抛出
 */
export const saveCachedProviderData = async (
  fullApiResponse: ModelsDevApiResponse
): Promise<void> => {
  const store = createLazyStore('remote-cache.json');
  await store.init();

  const cachedData: CachedModelData = {
    apiResponse: fullApiResponse,
    metadata: {
      lastRemoteUpdate: new Date().toISOString(),
      source: 'remote',
    },
  };

  await store.set(REMOTE_MODEL_CACHE_KEY, cachedData);
  await store.save(); // Tauri 环境需要显式保存
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
  const store = createLazyStore('remote-cache.json');
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
 * 判断缓存是否新鲜（未过期）
 * @param cachedTimestamp - 缓存时间戳（ISO 8601 格式）
 * @returns 如果缓存未过期返回 true
 */
export const isRemoteDataFresh = (cachedTimestamp: string): boolean => {
  const cachedTime = new Date(cachedTimestamp).getTime();
  const now = Date.now();
  return (now - cachedTime) < CACHE_CONFIG.EXPIRY_TIME_MS;
};
```

### C. 重试延迟计算表

指数退避算法的延迟时间表：

| 重试次数 | 延迟时间 | 累计耗时（含超时） |
|---------|---------|------------------|
| 第 1 次 | 0 秒（立即） | 5 秒 |
| 第 2 次 | 1 秒 | 11 秒（5 + 1 + 5） |
| 第 3 次 | 2 秒 | 18 秒（5 + 1 + 5 + 2 + 5） |

**说明**：
- 每次请求超时 5 秒
- 重试延迟为 `RETRY_DELAY_BASE * (2 ^ (retryCount - 1))`
- 默认最大重试 2 次，总计最多 3 次尝试
- 最坏情况：18 秒后降级到缓存

### D. models.dev API 数据类型定义

基于 `modelProvider.json` 的实际数据结构，以下是完整的 TypeScript 类型定义：

**注意**：为避免与项目中现有的类型冲突，所有 models.dev API 相关类型都使用 `ModelsDevApi` 前缀。

```typescript
/**
 * models.dev API 响应的完整数据结构
 * 键值对对象格式: { [providerKey: string]: ModelsDevApiProvider }
 */
export interface ModelsDevApiResponse {
  [providerKey: string]: ModelsDevApiProvider;
}

/**
 * models.dev API 返回的供应商定义
 * 注意：这是 API 响应格式，与应用内部的 ModelProvider 类型不同
 */
export interface ModelsDevApiProvider {
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
 * models.dev API 返回的模型详细信息
 * 注意：这是 API 响应格式，与应用内部的 Model 类型不同
 */
export interface ModelsDevApiModelDetail {
  /** 模型唯一标识符 */
  id: string;
  /** 模型显示名称 */
  name: string;
  /** 模型系列（可选） */
  family?: string;
  /** 是否支持附件 */
  attachment: boolean;
  /** 是否为推理模型 */
  reasoning: boolean;
  /** 是否支持工具调用 */
  tool_call: boolean;
  /** 是否支持结构化输出（可选） */
  structured_output?: boolean;
  /** 推理内容字段配置（可选） */
  interleaved?: {
    field: string;
  };
  /** 是否支持温度参数 */
  temperature: boolean;
  /** 知识截止日期（可选，格式：YYYY-MM） */
  knowledge?: string;
  /** 发布日期（格式：YYYY-MM-DD） */
  release_date: string;
  /** 最后更新日期（格式：YYYY-MM-DD，可选） */
  last_updated?: string;
  /** 输入输出模态 */
  modalities: {
    input: ModalityType[];
    output: ModalityType[];
  };
  /** 是否为开源权重 */
  open_weights: boolean;
  /** 成本信息 */
  cost: ModelsDevApiModelCost;
  /** 限制信息 */
  limit: ModelsDevApiModelLimit;
}

/**
 * 模态类型
 */
export type ModalityType = "text" | "image" | "audio" | "video" | "pdf";

/**
 * models.dev API 返回的模型成本信息
 */
export interface ModelsDevApiModelCost {
  /** 输入成本（每百万 tokens） */
  input: number;
  /** 输出成本（每百万 tokens） */
  output: number;
  /** 缓存读取成本（每百万 tokens，可选） */
  cache_read?: number;
  /** 推理成本（每百万 tokens，可选） */
  reasoning?: number;
}

/**
 * models.dev API 返回的模型限制信息
 */
export interface ModelsDevApiModelLimit {
  /** 上下文长度限制 */
  context: number;
  /** 输出长度限制 */
  output: number;
}
```

### 使用示例

```typescript
// 从 models.dev API 获取数据
const response = await fetch("https://models.dev/api.json");
const data: ModelsDevApiResponse = await response.json();

// 遍历供应商
Object.entries(data).forEach(([providerKey, provider]) => {
  console.log(`Provider: ${provider.name}`);
  console.log(`API: ${provider.api}`);
  console.log(`Models: ${Object.keys(provider.models).length}`);

  // 遍历模型
  Object.values(provider.models).forEach((model) => {
    console.log(`  - ${model.name} (${model.id})`);
    console.log(`    Reasoning: ${model.reasoning}`);
    console.log(`    Vision: ${model.modalities.input.includes("image")}`);
    console.log(`    Context: ${model.limit.context}`);
  });
});
```

### 字段说明

**必填字段 vs 可选字段**：
- 所有 Provider 属性都是必填的
- Model 的可选字段：`family`, `structured_output`, `interleaved`, `knowledge`, `last_updated`
- ModelCost 的可选字段：`cache_read`, `reasoning`

**日期格式**：
- `release_date`: YYYY-MM-DD（如 "2025-09-05"）
- `last_updated`: YYYY-MM-DD（如 "2025-09-05"）
- `knowledge`: YYYY-MM（如 "2025-06"）
