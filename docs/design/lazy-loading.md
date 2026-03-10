# 按需加载机制

本文档说明应用使用的按需加载机制，包括 ResourceLoader 类设计、缓存策略和性能优化成果。

## 动机

应用启动时加载所有供应商 SDK 会显著增加初始 bundle 大小，影响首屏加载速度。我们实现了通用的按需加载机制：
- **减少初始 bundle**：只打包必要的代码
- **按需加载**：使用时才加载对应的 SDK
- **缓存优化**：避免重复加载
- **优雅降级**：加载失败时提供重试机制

## 成果

通过按需加载机制，成功将初始 bundle 大小减少了约 **125KB**（gzipped）。

## 架构

### ResourceLoader<T> 类

**位置**：`src/utils/resourceLoader.ts`

**核心功能**：
- 注册资源加载器
- 按需加载资源
- 缓存已加载的资源
- 并发控制（避免重复加载）
- 自动重试（网络错误）
- LRU 淘汰（缓存大小限制）

### 使用流程

```
1. 注册资源
   loader.register('deepseek', { loader: () => import('@ai-sdk/deepseek') });

2. 加载资源
   const createDeepSeek = await loader.load('deepseek');

3. 使用资源
   const provider = createDeepSeek({ apiKey });
```

## 关键模块

### 1. 供应商 SDK 加载器

**位置**：`src/services/chat/providerLoader.ts`

**支持的 SDK**：
- `@ai-sdk/deepseek`
- `@ai-sdk/moonshotai`
- `@ai-sdk/zhipuai`

**预加载策略**：
```typescript
// 在应用初始化时预加载常用 SDK
loader.preload(['deepseek', 'moonshotai']);
```

### 2. 异步 Provider 工厂

**位置**：`src/services/chat/providerFactory.ts`

**职责**：
- 通过 ResourceLoader 异步获取供应商 SDK
- 返回类型安全的 provider 工厂函数
- 支持 mock provider（测试用）

### 3. 预加载 Thunk

**位置**：`src/store/slices/chatSlices.ts` (行 134-184)

**策略**：
- 预加载用户最常用的供应商
- 不阻塞应用启动（后台加载）
- 失败时记录警告，不影响使用

## ResourceLoader API

### 注册资源

```typescript
loader.register(key, config);
```

**参数**：
- `key`: 资源标识符（如 'deepseek'）
- `config.loader`: 加载函数，返回 Promise
- `config.retryCount`: 最大重试次数（默认 3）
- `config.retryDelay`: 重试延迟（默认 1000ms）
- `config.isRetryable`: 判断错误是否可重试

### 加载资源

```typescript
const resource = await loader.load(key);
```

**特性**：
- 缓存命中：立即返回
- 并发控制：多个请求共享同一个 Promise
- 自动重试：网络错误时自动重试

### 预加载资源

```typescript
await loader.preload(['deepseek', 'moonshotai']);
```

**行为**：
- 并行加载多个资源
- 失败不抛出错误（仅记录警告）
- 延迟清理失败状态（5 秒后删除）

### 检查状态

```typescript
const isLoaded = loader.isLoaded('deepseek');
const state = loader.getState('deepseek');
```

**状态类型**：
- `idle`: 未加载
- `loading`: 加载中
- `loaded`: 已加载
- `error`: 加载失败

## 缓存策略

### LRU 淘汰

- **最大缓存大小**：默认 10 个资源
- **淘汰策略**：最久未使用的资源优先淘汰
- **自动管理**：缓存满时自动淘汰

### 缓存清理

```typescript
// 强制重新加载
const resource = await loader.forceReload('deepseek');

// 重置失败状态
loader.reset('deepseek');
```

## 错误处理

### 网络错误检测

ResourceLoader 自动识别以下网络错误：
- `TypeError`（动态导入失败）
- `ChunkLoadError`（代码块加载失败）
- 特定错误代码（`ERR_NETWORK`, `ECONNREFUSED`, `ETIMEDOUT` 等）

### 重试机制

```
第 1 次请求：立即发送
第 2 次重试：等待 1000ms
第 3 次重试：等待 1000ms
第 4 次重试：等待 1000ms
（共 4 次尝试）
```

### 预加载失败处理

```typescript
// 失败状态包含 preloadFailed 标记
{
  status: 'error',
  error: Error,
  preloadFailed: true,  // 允许用户立即重试
  retryCount: 1
}
```

## 性能优化

### 减少初始 bundle

**优化前**：所有供应商 SDK 都打包到初始 bundle

**优化后**：仅打包必要代码，供应商 SDK 按需加载

**成果**：减少 125KB（gzipped）

### 并行加载

```typescript
// 预加载时并行执行
await Promise.all([
  loader.load('deepseek'),
  loader.load('moonshotai'),
]);
```

### 缓存复用

```typescript
// 首次加载
const sdk1 = await loader.load('deepseek'); // 从网络加载

// 后续加载
const sdk2 = await loader.load('deepseek'); // 从缓存返回
```

## 实现位置

- **通用资源加载器**：`src/utils/resourceLoader.ts`
- **供应商 SDK 加载器**：`src/services/chat/providerLoader.ts`
- **异步 Provider 获取**：`src/services/chat/providerFactory.ts`
- **预加载 Thunk**：`src/store/slices/chatSlices.ts` (行 134-184)

## 使用示例

### 基本使用

```typescript
import { ResourceLoader } from '@/utils/resourceLoader';

const loader = new ResourceLoader();

// 注册资源
loader.register('deepseek', {
  loader: () => import('@ai-sdk/deepseek').then(m => m.createDeepSeek),
  retryCount: 3,
});

// 加载资源
const createDeepSeek = await loader.load('deepseek');

// 使用资源
const provider = createDeepSeek({ apiKey: 'sk-...' });
```

### 类型安全

```typescript
import type { ProviderFactory } from '@ai-sdk/provider';

const loader = new ResourceLoader<ProviderFactory>();

loader.register('deepseek', {
  loader: () => import('@ai-sdk/deepseek').then(m => m.createDeepSeek),
});

const createDeepSeek: ProviderFactory = await loader.load('deepseek');
```

### 测试中使用

```typescript
// Mock ResourceLoader
const mockLoader = new ResourceLoader();
mockLoader.register('deepseek', {
  loader: async () => mockProviderFactory,
});
```

## 设计原则

1. **通用性**：不限于供应商 SDK，可加载任意资源
2. **类型安全**：支持泛型，确保类型正确
3. **容错性**：自动重试、优雅降级
4. **性能优先**：缓存、并发控制、LRU 淘汰
5. **可测试性**：支持依赖注入和 mock

## 注意事项

1. **缓存大小**：根据实际需求调整 maxCacheSize
2. **重试次数**：网络不稳定时可增加 retryCount
3. **预加载策略**：只预加载常用的资源
4. **错误处理**：预加载失败不影响应用启动
5. **类型定义**：使用泛型确保类型安全

## 相关变更

详细的设计决策和性能测试报告见：
`openspec/changes/lazy-load-provider-sdk/`
