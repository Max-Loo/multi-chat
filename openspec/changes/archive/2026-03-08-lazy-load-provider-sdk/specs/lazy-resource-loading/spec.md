# Lazy Resource Loading Capability Specification

## ADDED Requirements

### Requirement: 按需加载资源

系统 MUST 提供 `ResourceLoader<T>` 通用类，支持按需动态加载任意类型的资源（SDK、模块、数据等）。

系统 MUST 支持资源注册功能，通过 `register(key, config)` 方法注册资源加载器。

系统 MUST 在调用 `load(key)` 方法时动态导入资源，而非在应用启动时静态导入。

系统 MUST 缓存已加载的资源，后续调用 `load(key)` 或 `get(key)` 时直接从缓存返回。

系统 MUST 支持并发控制，当多个调用者同时请求同一未加载资源时，只执行一次加载操作，所有调用者共享同一个 Promise。

系统 MUST 支持错误重试机制，当加载失败且错误为网络错误时，自动重试最多 3 次，每次重试间隔 1000ms。

系统 MUST 提供资源状态查询功能，通过 `getState(key)` 获取资源的加载状态（idle/loading/loaded/error）。

系统 MUST 支持预加载功能，通过 `preload(keys)` 方法在后台预加载多个资源，不影响主流程。

#### Scenario: 首次加载资源
- **WHEN** 调用 `resourceLoader.load('deepseek')` 且该资源未被加载过
- **THEN** 系统执行动态导入 `import('@ai-sdk/deepseek')`
- **AND** 系统将加载结果缓存到内存中
- **AND** 系统返回加载的资源
- **AND** 系统将资源状态标记为 `loaded`

#### Scenario: 从缓存获取已加载资源
- **WHEN** 调用 `resourceLoader.load('deepseek')` 且该资源已被加载
- **THEN** 系统直接从缓存返回资源
- **AND** 系统不执行动态导入操作
- **AND** 系统立即返回（无网络延迟）

#### Scenario: 并发请求同一资源
- **WHEN** 组件 A 调用 `resourceLoader.load('deepseek')` 且资源未加载
- **AND** 组件 B 在组件 A 的加载完成前也调用 `resourceLoader.load('deepseek')`
- **THEN** 系统只执行一次动态导入操作
- **AND** 组件 A 和组件 B 共享同一个 Promise
- **AND** 两个组件最终收到相同的资源实例

#### Scenario: 网络错误自动重试
- **WHEN** 调用 `resourceLoader.load('deepseek')` 且第一次加载失败
- **AND** 错误类型为网络错误（fetch failed / network error）
- **THEN** 系统等待 1000ms
- **AND** 系统自动重试加载操作
- **AND** 系统最多重试 3 次
- **AND** 如果 3 次重试都失败，系统抛出最终错误

#### Scenario: 非网络错误不重试
- **WHEN** 调用 `resourceLoader.load('unknown-provider')` 且模块不存在
- **THEN** 系统立即抛出 "Module not found" 错误
- **AND** 系统不执行重试操作

#### Scenario: 预加载多个资源
- **WHEN** 调用 `resourceLoader.preload(['deepseek', 'moonshotai', 'zhipuai'])`
- **THEN** 系统并发加载所有资源（Promise.all）
- **AND** 某个资源加载失败不影响其他资源的加载
- **AND** 系统不抛出异常（静默失败，仅记录警告）
- **AND** 预加载操作不阻塞调用方

---

### Requirement: 供应商 SDK 按需加载

系统 MUST 提供 `ProviderSDKLoader` 单例，封装供应商 SDK 的加载逻辑。

系统 MUST 在应用初始化时注册所有支持的供应商 SDK（deepseek、moonshotai、zhipuai、zhipuai-coding-plan）。

系统 MUST 将每个供应商 SDK 的加载器注册为动态导入函数（使用 `import()` 语法）。

系统 MUST 提供统一的 `loadProvider(key)` 方法，返回 Promise<ProviderFactory>。

系统 MUST 支持查询 SDK 是否已加载，通过 `isProviderLoaded(key)` 方法。

系统 MUST 支持获取 SDK 加载状态，通过 `getProviderState(key)` 方法。

系统 MUST 支持预加载多个供应商 SDK，通过 `preloadProviders(keys)` 方法。

#### Scenario: 注册供应商 SDK
- **WHEN** `ProviderSDKLoader` 初始化
- **THEN** 系统注册 `deepseek` 供应商，加载器为 `import('@ai-sdk/deepseek').then(m => m.createDeepSeek)`
- **AND** 系统注册 `moonshotai` 供应商，加载器为 `import('@ai-sdk/moonshotai').then(m => m.createMoonshotAI)`
- **AND** 系统注册 `zhipuai` 供应商，加载器为 `import('zhipu-ai-provider').then(m => m.createZhipu)`
- **AND** 系统注册 `zhipuai-coding-plan` 供应商，加载器为 `import('zhipu-ai-provider').then(m => m.createZhipu)`

#### Scenario: 加载供应商 SDK
- **WHEN** 调用 `providerSDKLoader.loadProvider('deepseek')`
- **THEN** 系统调用底层 `ResourceLoader.load('deepseek')`
- **AND** 系统动态导入 `@ai-sdk/deepseek` 模块
- **AND** 系统返回 `createDeepSeek` 工厂函数
- **AND** 系统缓存该工厂函数

#### Scenario: 创建 Provider 实例
- **WHEN** 调用 `getProvider(providerKey, apiKey, baseURL)` 获取 Provider 实例
- **THEN** 系统调用 `await providerSDKLoader.loadProvider(providerKey)` 获取工厂函数
- **AND** 系统使用工厂函数创建 Provider 实例：`createProvider({ apiKey, baseURL, fetch })`
- **AND** 系统返回 Provider 实例

#### Scenario: 预加载供应商 SDK
- **WHEN** 用户切换到某个聊天
- **AND** 该聊天使用了 deepseek 和 moonshotai 两个模型
- **THEN** 系统调用 `providerSDKLoader.preloadProviders(['deepseek', 'moonshotai'])`
- **AND** 系统在后台并发加载这两个供应商 SDK
- **AND** UI 不被阻塞，立即切换到该聊天
- **AND** 用户发送消息时，SDK 已加载完成（或正在加载中）

---

### Requirement: 聊天切换时预加载 SDK

系统 MUST 在用户切换聊天时，后台预加载该聊天使用的所有供应商 SDK。

系统 MUST 提供 `setSelectedChatIdWithPreload()` 异步 Thunk，接收 `chatId` 参数。

系统 MUST 根据聊天配置的模型列表，收集所有唯一的供应商 Key。

系统 MUST 过滤掉已禁用或已删除的模型。

系统 MUST 调用 `providerSDKLoader.preloadProviders(providerKeys)` 在后台预加载。

系统 MUST 立即更新 Redux state 中的 `selectedChatId`，不等待预加载完成。

系统 MUST 在预加载失败时记录警告日志，不影响聊天切换。

#### Scenario: 切换聊天时预加载 SDK
- **WHEN** 用户点击切换到聊天 A
- **AND** 聊天 A 配置了 3 个模型：deepseek-chat、moonshot-v1、zhipu-glm
- **THEN** 系统调用 `setSelectedChatIdWithPreload('chat-a')`
- **AND** 系统收集供应商 Key：`['deepseek', 'moonshotai', 'zhipuai']`
- **AND** 系统立即更新 `selectedChatId` 为 'chat-a'（UI 响应）
- **AND** 系统在后台调用 `preloadProviders(['deepseek', 'moonshotai', 'zhipuai'])`
- **AND** 用户可以立即在聊天界面发送消息

#### Scenario: 预加载与发送消息的时序
- **WHEN** 用户切换到聊天 A
- **AND** 系统开始预加载 deepseek SDK（耗时 80ms）
- **AND** 用户在 50ms 后发送消息
- **THEN** 系统调用 `getProvider('deepseek', ...)`
- **AND** 系统等待正在进行的预加载操作完成
- **AND** 预加载完成后，系统立即返回 Provider 实例
- **AND** 消息发送成功

#### Scenario: 过滤已禁用或已删除的模型
- **WHEN** 用户切换到聊天 B
- **AND** 聊天 B 配置了 3 个模型：model-1（启用）、model-2（禁用）、model-3（已删除）
- **THEN** 系统只收集 model-1 的供应商 Key
- **AND** 系统只预加载 model-1 对应的供应商 SDK
- **AND** 系统 NOT 预加载 model-2 和 model-3 的供应商 SDK

---

### Requirement: 移除静态导入

系统 MUST 从 `src/services/chat/providerFactory.ts` 顶部移除所有供应商 SDK 的静态导入语句。

系统 MUST 移除以下导入：`import { createDeepSeek } from '@ai-sdk/deepseek'`

系统 MUST 移除以下导入：`import { createMoonshotAI } from '@ai-sdk/moonshotai'`

系统 MUST 移除以下导入：`import { createZhipu } from 'zhipu-ai-provider'`

系统 MUST 改为在 `getProvider()` 函数内部通过动态导入加载 SDK。

#### Scenario: 验证静态导入已移除
- **WHEN** 检查 `src/services/chat/providerFactory.ts` 文件
- **THEN** 文件顶部 NOT 包含 `import { createDeepSeek } from '@ai-sdk/deepseek'`
- **AND** 文件顶部 NOT 包含 `import { createMoonshotAI } from '@ai-sdk/moonshotai'`
- **AND** 文件顶部 NOT 包含 `import { createZhipu } from 'zhipu-ai-provider'`
- **AND** 文件包含 `import { getProviderSDKLoader } from './providerLoader'`

#### Scenario: 动态导入在运行时执行
- **WHEN** 应用启动完成
- **AND** 用户尚未使用任何供应商
- **THEN** 浏览器网络面板显示 `@ai-sdk/deepseek` 包未被下载
- **AND** 浏览器网络面板显示 `@ai-sdk/moonshotai` 包未被下载
- **AND** 浏览器网络面板显示 `zhipu-ai-provider` 包未被下载
- **WHEN** 用户首次使用 deepseek 供应商
- **THEN** 浏览器网络面板显示 `@ai-sdk/deepseek` 包被下载

---

### Requirement: 异步获取 Provider

系统 MUST 将 `getProvider()` 函数从同步函数改为异步函数。

系统 MUST 修改函数签名为 `async function getProvider(providerKey, apiKey, baseURL): Promise<LanguageModelV1>`。

系统 MUST 在 `streamChatCompletion()` 中使用 `await getProvider(...)` 获取 Provider 实例。

系统 MUST 确保 `streamChatCompletion()` 函数本身保持为异步生成器函数。

#### Scenario: 异步获取 Provider
- **WHEN** `streamChatCompletion()` 被调用
- **THEN** 系统调用 `const provider = await getProvider(model.providerKey, model.apiKey, model.apiAddress)`
- **AND** 系统等待 Provider SDK 加载完成
- **AND** 系统使用 Provider 创建模型实例：`provider(model.modelKey)`
- **AND** 系统继续执行后续的流式响应逻辑

#### Scenario: 保持流式响应功能不变
- **WHEN** 用户发送聊天消息
- **THEN** 系统异步加载 Provider SDK
- **AND** 系统返回异步生成器 `AsyncIterable<StandardMessage>`
- **AND** 调用方可以使用 `for await...of` 迭代流式响应
- **AND** 流式响应的行为与之前完全一致

---

### Requirement: 资源加载状态管理

系统 MUST 为每个资源维护加载状态，包括：`idle`（未加载）、`loading`（加载中）、`loaded`（已加载）、`error`（加载失败）。

系统 MUST 在 `loading` 状态记录当前重试次数。

系统 MUST 在 `error` 状态记录错误信息。

系统 MUST 在 `loaded` 状态记录加载完成时间戳。

系统 MUST 通过 `getState(key)` 方法返回状态对象。

#### Scenario: 查询资源状态
- **WHEN** 调用 `resourceLoader.getState('deepseek')`
- **AND** deepseek SDK 已加载完成
- **THEN** 系统返回 `{ status: 'loaded', loadTime: 1715123456789 }`

#### Scenario: 查询加载中的资源
- **WHEN** 调用 `resourceLoader.getState('moonshotai')`
- **AND** moonshotai SDK 正在加载（首次尝试）
- **THEN** 系统返回 `{ status: 'loading', retryCount: 1 }`

#### Scenario: 查询加载失败的资源
- **WHEN** 调用 `resourceLoader.getState('zhipuai')`
- **AND** zhipuai SDK 加载失败（3 次重试后）
- **THEN** 系统返回 `{ status: 'error', error: Error(...) }`

---

### Requirement: 通用资源加载器的可扩展性

系统 MUST 设计 `ResourceLoader<T>` 为泛型类，支持任意类型的资源加载。

系统 MUST 不包含任何特定于供应商 SDK 的逻辑。

系统 MUST 可被其他模块复用（如图片处理库、数据可视化库等）。

系统 MUST 支持自定义重试策略，通过 `ResourceConfig` 配置 `retryCount`、`retryDelay`、`isRetryable`。

系统 MUST 支持自定义错误判断逻辑，通过 `isRetryable(error)` 函数判断错误是否可重试。

#### Scenario: 加载非 SDK 资源
- **WHEN** 开发者创建 `imageProcessorLoader = new ResourceLoader<ImageProcessor>()`
- **AND** 开发者注册 `imageProcessorLoader.register('tesseract', { loader: () => import('tesseract.js') })`
- **THEN** 系统按需加载 `tesseract.js`
- **AND** 系统缓存已加载的实例
- **AND** 系统支持并发控制、错误重试等所有特性

#### Scenario: 自定义重试策略
- **WHEN** 开发者注册资源时配置重试策略
- **THEN** 系统支持配置 `retryCount: 5`（最多重试 5 次）
- **AND** 系统支持配置 `retryDelay: 2000`（重试延迟 2000ms）
- **AND** 系统支持配置 `isRetryable: (error) => error.code === 'NETWORK_ERROR'`（仅重试网络错误）

---

### Requirement: LRU 缓存淘汰机制

系统 MUST 实现 LRU（Least Recently Used）缓存淘汰策略，限制缓存大小。

系统 MUST 默认最多缓存 10 个供应商 SDK（约 50MB 内存占用）。

系统 MUST 维护资源访问顺序，最近使用的资源排在末尾。

系统 MUST 在缓存满且需要加载新资源时，自动淘汰最久未使用的资源。

系统 MUST 提供可配置的 `maxCacheSize` 参数，允许高级用户调整缓存大小。

系统 MUST 在淘汰资源时，同时清理 `cache`、`states` 和 `lruList` 中的记录。

系统 MUST 在淘汰资源时，记录调试日志（仅在开发环境）。

#### Scenario: LRU 缓存淘汰
- **WHEN** 缓存已满（10 个资源）且需要加载第 11 个资源
- **THEN** 系统淘汰 `lruList` 中第一个资源（最久未使用）
- **AND** 系统从 `cache` 中删除该资源
- **AND** 系统从 `states` 中删除该资源的状态
- **AND** 系统从 `lruList` 中移除该资源
- **AND** 系统加载并缓存新资源
- **AND** 系统在开发环境打印日志：`Evicted ${key} from cache (LRU)`

#### Scenario: 访问资源时更新 LRU 顺序
- **WHEN** 调用 `resourceLoader.get('deepseek')` 获取已缓存资源
- **THEN** 系统从缓存中返回资源
- **AND** 系统从 `lruList` 中移除 'deepseek'
- **AND** 系统将 'deepseek' 添加到 `lruList` 末尾（最近使用）

#### Scenario: 加载资源时更新 LRU 顺序
- **WHEN** 调用 `resourceLoader.load('moonshotai')` 加载新资源
- **AND** 加载成功
- **THEN** 系统将资源添加到缓存
- **AND** 系统将 'moonshotai' 添加到 `lruList` 末尾（最近使用）

#### Scenario: 自定义缓存大小
- **WHEN** 开发者创建 `ResourceLoader` 时配置 `maxCacheSize: 20`
- **THEN** 系统最多缓存 20 个资源
- **AND** 系统在缓存满（20 个）时淘汰最久未使用的资源

---

### Requirement: 错误恢复机制

系统 MUST 提供 `reset(key)` 方法，重置资源状态，清除失败的记录。

系统 MUST 提供 `forceReload(key)` 方法，强制重新加载资源（忽略缓存）。

系统 MUST 在预加载失败时标记 `preloadFailed: true`，延迟清理状态（5 秒）。

系统 MUST 在用户主动加载时检测到 `preloadFailed` 标记，立即重试（不等待重试延迟）。

系统 MUST 支持监听网络恢复事件，自动重试所有失败的加载。

系统 MUST 在聊天 UI 层面提供"重试"按钮，允许用户手动重试失败的加载。

#### Scenario: 预加载失败后的快速重试
- **WHEN** 切换聊天时预加载 deepseek SDK 失败
- **AND** 系统标记 `preloadFailed: true`，延迟清理状态（5 秒）
- **AND** 用户在 5 秒内发送消息，触发 deepseek 加载
- **THEN** 系统检测到 `preloadFailed` 标记
- **AND** 系统立即重试加载（不等待 1000ms 延迟）
- **AND** 如果加载成功，清除 `preloadFailed` 标记

#### Scenario: 手动重置资源状态
- **WHEN** 调用 `resourceLoader.reset('deepseek')`
- **THEN** 系统从 `states` 中删除 'deepseek' 的记录
- **AND** 系统保留 'deepseek' 的缓存（如果已加载）

#### Scenario: 强制重新加载资源
- **WHEN** 调用 `resourceLoader.forceReload('deepseek')`
- **THEN** 系统从 `cache` 中删除 'deepseek'
- **AND** 系统从 `states` 中删除 'deepseek'
- **AND** 系统重新执行动态导入
- **AND** 系统缓存新加载的资源

#### Scenario: 网络恢复后自动重试
- **WHEN** 用户在离线环境下首次使用 deepseek SDK，加载失败
- **AND** 系统标记 `preloadFailed: true`
- **AND** 用户恢复网络连接（`window.addEventListener('online')` 触发）
- **THEN** 系统检测到网络恢复事件
- **AND** 系统自动重试所有 `preloadFailed: true` 的资源
- **AND** 系统在后台静默重试，不干扰用户

#### Scenario: UI 层面的手动重试
- **WHEN** SDK 加载失败 3 次后，仍无法加载
- **THEN** 聊天 UI 显示错误提示："供应商 SDK 加载失败，请检查网络连接"
- **AND** UI 提供"重试"按钮
- **AND** 用户点击"重试"按钮后，系统调用 `forceReload(key)` 重新加载
- **AND** 如果重试成功，UI 显示"SDK 加载成功"，用户可以发送消息
