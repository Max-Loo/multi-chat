# 远程模型数据获取

本文档说明如何从 models.dev API 动态获取模型供应商数据，包括架构设计、缓存策略和错误处理机制。

## 动机

模型供应商数据（支持的模型列表、API 地址等）经常更新，为了避免硬编码和及时获取最新数据，我们采用：
- **动态获取**：从 models.dev API 实时获取
- **缓存优化**：减少网络请求，提升启动速度
- **优雅降级**：网络失败时使用本地缓存

## 架构

### 数据流

```
models.dev API → 远程数据获取层 → 供应商过滤层 → Redux store
                  ↓
              缓存层
```

### 三层缓存策略

| 优先级 | 数据源 | 说明 |
|-------|--------|------|
| **首选** | 远程 API | 最新的模型数据 |
| **备选** | 本地缓存 | 上次成功的 API 响应（`remote-cache.json`） |
| **终极** | 错误提示 | 无可用数据时显示错误 |

### 供应商过滤

只保留白名单中的供应商：
- moonshotai (Kimi)
- deepseek
- zhipuai (Zhipu)
- zhipuai-coding-plan

## 关键模块

### 1. 远程数据获取

**位置**：`src/services/modelRemote/index.ts`

**核心函数**：
- `fetchRemoteData()`: 从远程 API 获取数据（带重试和超时）
- `saveCachedProviderData()`: 保存完整 API 响应到缓存
- `loadCachedProviderData()`: 从缓存加载并过滤数据
- `isRemoteDataFresh()`: 判断缓存是否新鲜

**特性**：
- 超时控制（默认 5 秒）
- 自动重试（默认 2 次，指数退避）
- AbortSignal 支持（可取消请求）

### 2. Redux 状态管理

**位置**：`src/store/slices/modelProviderSlice.ts`

**状态结构**：
```typescript
{
  providers: RemoteProviderData[],  // 过滤后的供应商列表
  loading: boolean,                  // 加载状态
  error: string | null,              // 错误信息
  lastUpdate: number                 // 最后更新时间戳
}
```

**Actions**：
- `initializeModelProvider()`: 初始化模型供应商数据

### 3. 网络和缓存配置

**位置**：`src/services/modelRemote/config.ts`

**网络配置**：
- `DEFAULT_TIMEOUT`: 5000ms（5 秒）
- `DEFAULT_MAX_RETRIES`: 2
- `RETRY_DELAY_BASE`: 1000ms（指数退避）
- `API_ENDPOINT`: https://models.dev/api.json

**缓存配置**：
- `EXPIRY_TIME_MS`: 24 小时
- `CACHE_VERSION`: 1
- `MAX_CACHE_SIZE_MB`: 10 MB

## 数据结构

### ModelsDev API 响应

```typescript
interface ModelsDevApiResponse {
  [providerKey: string]: {
    id: string;
    env: string[];
    npm: string;
    api: string;
    name: string;
    doc: string;
    models: {
      [modelId: string]: {
        id: string;
        name: string;
      };
    };
  };
}
```

### 内部数据结构

```typescript
interface RemoteProviderData {
  providerKey: string;
  providerName: string;
  api: string;
  models: ModelDetail[];
}

interface ModelDetail {
  modelKey: string;
  modelName: string;
}
```

## 重试机制

### 指数退避算法

```
第 1 次请求：立即发送
第 2 次重试：等待 1000ms (1 × RETRY_DELAY_BASE)
第 3 次重试：等待 2000ms (2 × RETRY_DELAY_BASE)
```

### 可重试的错误

- **网络超时**：`NETWORK_TIMEOUT`
- **网络错误**：`NETWORK_ERROR`
- **服务器错误（5xx）**：`SERVER_ERROR`

### 不可重试的错误

- **客户端错误（4xx）**：立即失败
- **JSON 解析失败**：`PARSE_ERROR`
- **请求被取消**：`ABORTED`

## 错误处理

### RemoteDataError 类型

```typescript
enum RemoteDataErrorType {
  NETWORK_TIMEOUT = "network_timeout",
  SERVER_ERROR = "server_error",
  PARSE_ERROR = "parse_error",
  NO_CACHE = "no_cache",
  ABORTED = "aborted",
  NETWORK_ERROR = "network_error",
}
```

### 错误处理流程

```
1. 尝试远程 API
   ├─ 成功 → 保存缓存，返回数据
   └─ 失败 → 继续下一步
2. 尝试本地缓存
   ├─ 缓存存在且新鲜 → 返回缓存数据
   └─ 缓存不存在或过期 → 继续下一步
3. 显示错误提示
```

## 实现位置

- **远程数据获取**：`src/services/modelRemote/index.ts`
- **网络和缓存配置**：`src/services/modelRemote/config.ts`
- **Redux 状态管理**：`src/store/slices/modelProviderSlice.ts`
- **缓存文件**：`remote-cache.json`（自动生成）

## 使用示例

### 基本使用（通过 Redux）

```typescript
// 在应用初始化时
await store.dispatch(initializeModelProvider()).unwrap();

// 获取模型供应商数据
const providers = useSelector((state) => state.modelProvider.providers);
```

### 高级使用（直接调用服务）

```typescript
import {
  fetchRemoteData,
  loadCachedProviderData,
  isRemoteDataFresh,
} from '@/services/modelRemote';

// 强制刷新
const { filteredData } = await fetchRemoteData({ forceRefresh: true });

// 使用缓存
const cachedData = await loadCachedProviderData(ALLOWED_REMOTE_MODEL_PROVIDERS);
```

## 性能优化

1. **缓存优先**：24 小时内不重复请求
2. **并行处理**：多个组件同时访问时，只发起一次请求
3. **请求取消**：组件卸载时自动取消请求
4. **指数退避**：避免服务器过载

## 注意事项

1. **供应商白名单**：新增供应商时需更新 `ALLOWED_REMOTE_MODEL_PROVIDERS`
2. **缓存清理**：手动删除 `remote-cache.json` 可强制刷新
3. **网络环境**：弱网环境下建议增加超时时间
4. **API 变更**：models.dev API 结构变更时需更新适配器
