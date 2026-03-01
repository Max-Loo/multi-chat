# Remote Model Fetch Capability Specification (Delta)

## MODIFIED Requirements

### Requirement: 从远程 API 动态获取模型供应商数据

系统 MUST 在应用启动时自动从 `https://models.dev/api.json` API 获取最新的模型供应商数据。

系统 MUST 使用兼容层 `@/utils/tauriCompat/http.ts` 中的 `fetch` 函数发起网络请求，确保在 Tauri 和 Web 环境中都能正常工作。

系统 MUST 实现超时控制机制，默认超时时间为 5 秒（可配置），超时后自动取消请求并抛出 `RemoteDataError` 错误。

系统 MUST 实现重试机制，默认最大重试次数为 2 次，使用指数退避算法（第 1 次重试延迟 1 秒，第 2 次重试延迟 2 秒）。

系统 MUST 对可重试错误进行重试，包括：网络超时、网络连接失败、服务器 5xx 错误。

系统 MUST 对不可重试错误立即失败，包括：客户端 4xx 错误、JSON 解析失败、请求被取消（AbortSignal）。

#### Scenario: 应用启动时成功获取远程数据

- **WHEN** 应用启动并执行 `initializeModelProvider` Thunk
- **AND** 网络连接正常
- **AND** models.dev API 返回成功响应（HTTP 200）
- **THEN** 系统从 API 获取完整的供应商数据
- **AND** 将获取的数据保存到本地缓存（`remote-cache.json`）
- **AND** 将过滤后的供应商数据（`RemoteProviderData[]`）直接存储到 Redux store
- **AND** 更新 Redux state 中的 `lastUpdate` 时间戳
- **AND** `loading` 状态设置为 `false`
- **AND** `error` 状态设置为 `null`

#### Scenario: 远程获取失败时降级到缓存

- **WHEN** 应用启动并执行 `initializeModelProvider` Thunk
- **AND** 网络请求失败（超时、服务器错误或网络连接失败）
- **AND** 本地存在有效的缓存数据
- **THEN** 系统从 `remote-cache.json` 加载缓存的供应商数据
- **AND** 将加载的数据（`RemoteProviderData[]`）直接存储到 Redux store
- **AND** 更新 Redux state，`error` 字段包含失败原因
- **AND** `loading` 状态设置为 `false`

#### Scenario: 远程获取失败且无缓存时显示全屏错误

- **WHEN** 应用启动并执行 `initializeModelProvider` Thunk
- **AND** 网络请求失败（所有重试均失败）
- **AND** 本地不存在缓存数据
- **THEN** 显示全屏错误提示 `NoProvidersAvailable` 组件
- **AND** 错误提示包含"无可用的模型供应商，请检查网络连接后重试"
- **AND** 提供"重新加载"按钮，点击后刷新页面重试

#### Scenario: 请求超时后重试

- **WHEN** 发起网络请求
- **AND** 请求在 5 秒内未响应（超时）
- **THEN** 系统自动取消请求并抛出 `RemoteDataError.NETWORK_TIMEOUT` 错误
- **AND** 等待 1 秒后发起第 1 次重试
- **AND** 如果第 1 次重试也超时，等待 2 秒后发起第 2 次重试
- **AND** 所有重试均失败后，降级到缓存或显示错误

#### Scenario: 服务器 5xx 错误时重试

- **WHEN** models.dev API 返回 5xx 服务器错误（如 500、502、503）
- **THEN** 系统识别为可重试错误
- **AND** 等待 1 秒后发起第 1 次重试
- **AND** 如果继续返回 5xx 错误，等待 2 秒后发起第 2 次重试
- **AND** 所有重试均失败后，降级到缓存或显示错误

#### Scenario: 客户端 4xx 错误时不重试

- **WHEN** models.dev API 返回 4xx 客户端错误（如 400、404）
- **THEN** 系统识别为不可重试错误
- **AND** 立即失败，不发起重试
- **AND** 降级到缓存或显示错误

#### Scenario: JSON 解析失败时不重试

- **WHEN** models.dev API 返回的响应不是有效的 JSON 格式
- **THEN** 系统抛出 `RemoteDataError.PARSE_ERROR` 错误
- **AND** 立即失败，不发起重试
- **AND** 降级到缓存或显示错误

---

### Requirement: 过滤模型供应商白名单

系统 MUST 从 models.dev API 响应中提取供应商数据后，根据白名单 `ALLOWED_MODEL_PROVIDERS` 进行过滤。

系统 MUST 在 `src/utils/constants.ts` 中维护 `ALLOWED_MODEL_PROVIDERS` 常量，定义为只读数组。

系统 MUST 使用 `providerKey` 进行精确匹配，只有白名单中的供应商才会被存储到 Redux store 中。

系统 MUST 使用 `as const` 断言确保白名单数组为编译时常量，类型为 `readonly string[]`。

#### Scenario: 成功过滤白名单供应商

- **WHEN** 从 models.dev API 获取到包含多个供应商的数据
- **AND** 白名单定义为 `["moonshotai", "deepseek", "zhipuai", "zhipuai-coding-plan"]`
- **THEN** 系统只保留 `providerKey` 在白名单中的供应商
- **AND** 其他供应商（如 `openai`、`anthropic`）被过滤掉
- **AND** 最终只将白名单中的供应商数据存储到 Redux store

#### Scenario: 白名单为空时不存储任何供应商

- **WHEN** `ALLOWED_MODEL_PROVIDERS` 定义为空数组 `[]`
- **THEN** 系统过滤掉所有供应商
- **AND** Redux store 中的供应商数据为空数组
- **AND** 应用进入"无可用供应商"状态

#### Scenario: API 响应不包含白名单中的供应商

- **WHEN** models.dev API 响应中不包含白名单定义的某些供应商
- **THEN** 系统跳过缺失的供应商
- **AND** 只将 API 响应中存在的白名单供应商存储到 Redux store
- **AND** 不抛出错误

---

### Requirement: 数据适配和转换

系统 MUST 将 models.dev API 的响应格式（键值对对象）转换为系统内部的数组格式。

系统 MUST 提取 API 响应中的关键字段：`providerKey`、`providerName`、`api`、`models`。

系统 MUST 将 models 对象（键值对）转换为数组，提取 `modelKey` 和 `modelName` 字段。

系统 MUST 使用适配器函数 `adaptApiResponseToInternalFormat` 封装转换逻辑，确保可测试性和可维护性。

#### Scenario: 成功转换 API 响应为内部格式

- **WHEN** 从 models.dev API 获取到供应商数据
- **AND** API 响应格式为 `{ [providerKey: string]: ModelsDevApiProvider }`
- **THEN** 系统调用 `adaptApiResponseToInternalFormat` 进行转换
- **AND** 转换后的格式为 `RemoteProviderData[]` 数组
- **AND** 每个元素包含 `providerKey`、`providerName`、`api`、`models` 字段
- **AND** `models` 字段为 `{ modelKey, modelName }[]` 数组格式

#### Scenario: API 响应缺失字段时使用默认值

- **WHEN** models.dev API 响应中的某个模型缺少可选字段（如 `family`、`structured_output`）
- **THEN** 适配器跳过缺失的字段
- **AND** 只转换存在的必填字段
- **AND** 不抛出错误，继续处理其他数据

---

### Requirement: 本地缓存策略

系统 MUST 将远程获取的供应商数据保存到独立的 Store 文件 `remote-cache.json` 中。

系统 MUST 在缓存数据中包含元数据字段：`lastRemoteUpdate`（最后更新时间）和 `source`（数据来源）。

系统 MUST 在每次成功从远程获取数据后更新缓存。

系统 MUST 在网络请求失败时尝试从缓存加载数据（降级策略）。

系统 MUST 使用 `@/utils/tauriCompat` 的 `createLazyStore` 创建缓存 Store，确保跨平台兼容性。

#### Scenario: 成功保存远程数据到缓存

- **WHEN** 从 models.dev API 成功获取完整的供应商数据
- **THEN** 系统调用 `saveCachedProviderData` 保存**完整的 API 响应**（未过滤）
- **AND** 缓存文件包含 `apiResponse` 字段（完整的 `ModelsDevApiResponse` 对象）
- **AND** 缓存文件包含 `metadata` 字段
- **AND** `metadata.lastRemoteUpdate` 设置为当前时间（ISO 8601 格式）
- **AND** `metadata.source` 设置为 `'remote'`

#### Scenario: 从缓存加载数据

- **WHEN** 网络请求失败
- **AND** 本地存在缓存文件 `remote-cache.json`
- **THEN** 系统调用 `loadCachedProviderData(ALLOWED_MODEL_PROVIDERS)` 加载数据
- **AND** 从缓存的 `apiResponse` 中提取完整的 API 响应
- **AND** 使用 `ALLOWED_MODEL_PROVIDERS` 白名单过滤完整响应
- **AND** 返回过滤后的 `RemoteProviderData[]` 数组
- **AND** 将过滤后的数据存储到 Redux store

#### Scenario: 缓存不存在时抛出错误

- **WHEN** 网络请求失败
- **AND** 本地不存在缓存文件 `remote-cache.json`
- **THEN** `loadCachedProviderData` 抛出 `RemoteDataError.NO_CACHE` 错误
- **AND** 系统显示全屏错误提示

#### Scenario: 白名单调整后缓存仍然有效

- **WHEN** 白名单从 `["moonshotai", "deepseek", "zhipuai", "zhipuai-coding-plan"]` 调整为 `["moonshotai", "deepseek", "zhipuai", "zhipuai-coding-plan", "openai"]`
- **AND** 本地存在旧的缓存数据（包含所有供应商的完整 API 响应）
- **AND** 网络请求失败
- **THEN** 系统从缓存加载完整的 API 响应
- **AND** 使用新的白名单过滤完整响应
- **AND** 返回包含 5 个供应商的数据（包括新增的 `openai`）
- **AND** 将数据存储到 Redux store

---

### Requirement: 手动刷新功能

系统 MUST 在设置页面提供"刷新模型供应商"按钮，允许用户手动触发数据更新。

系统 MUST 在点击按钮时调用 Redux Thunk `refreshModelProvider`，强制从远程获取最新数据。

系统 MUST 在刷新过程中显示加载状态（按钮显示"刷新中..."并被禁用）。

系统 MUST 在刷新成功后显示成功提示（Toast："模型供应商数据已更新"）。

系统 MUST 在刷新失败后显示错误提示（Toast："刷新失败: [错误原因]"）。

系统 MUST 在设置页面显示最后更新时间，格式为本地时间字符串。

#### Scenario: 用户手动刷新成功

- **WHEN** 用户在设置页面点击"刷新模型供应商"按钮
- **AND** 网络连接正常
- **AND** models.dev API 返回成功响应
- **THEN** 按钮显示"刷新中..."并被禁用
- **AND** 系统从远程获取最新数据
- **AND** 更新本地缓存
- **AND** 将过滤后的数据存储到 Redux store
- **AND** 显示成功提示："模型供应商数据已更新"
- **AND** 更新"最后更新"时间显示
- **AND** 按钮恢复为"刷新模型供应商"状态

#### Scenario: 用户手动刷新失败（网络错误）

- **WHEN** 用户在设置页面点击"刷新模型供应商"按钮
- **AND** 网络连接失败（所有重试均失败）
- **AND** 本地存在缓存数据
- **THEN** 系统使用缓存数据存储到 Redux store
- **AND** 显示错误提示："刷新失败: 网络连接失败"
- **AND** 按钮恢复为可点击状态

#### Scenario: 用户手动刷新时取消请求

- **WHEN** 用户在设置页面点击"刷新模型供应商"按钮
- **AND** 刷新过程中用户离开设置页面（组件卸载）
- **THEN** 系统通过 AbortSignal 取消网络请求
- **AND** 不再处理响应或错误
- **AND** Redux state 中的 `loading` 状态重置为 `false`

#### Scenario: 显示最后更新时间

- **WHEN** 用户打开设置页面
- **AND** Redux state 中存在 `lastUpdate` 时间戳
- **THEN** 页面显示"最后更新: [本地化时间字符串]"
- **AND** 时间格式为用户的本地时间格式（如 `2026/2/9 15:30:00`）

---

### Requirement: Redux 状态管理

系统 MUST 使用 Redux Toolkit 的 `createSlice` 创建 `modelProviderSlice`，管理远程数据获取的状态。

系统 MUST 在 `modelProviderSlice` 中定义以下状态字段：
- `providers`: `RemoteProviderData[]` - 过滤后的供应商数据数组
- `loading`: `boolean` - 加载状态
- `error`: `string | null` - 错误信息
- `lastUpdate`: `string | null` - 最后更新时间（ISO 8601 格式）

系统 MUST 使用 `createAsyncThunk` 定义 `initializeModelProvider` action，处理应用启动时的数据获取。

系统 MUST 使用 `createAsyncThunk` 定义 `refreshModelProvider` action，处理手动刷新的数据获取。

系统 MUST 在 `extraReducers` 中处理异步 action 的 `pending`、`fulfilled`、`rejected` 状态，更新 Redux state。

系统 MUST 将 `modelProviderSlice` 的 reducer 添加到 Redux store 的 `rootReducer` 中。

#### Scenario: initializeModelProvider 执行时更新状态

- **WHEN** 应用启动并 dispatch `initializeModelProvider` action
- **THEN** Redux state 中 `modelProvider.loading` 设置为 `true`
- **AND** `modelProvider.error` 设置为 `null`
- **AND** 请求成功后：
  - `providers` 设置为过滤后的 `RemoteProviderData[]`
  - `loading` 设置为 `false`
  - `lastUpdate` 设置为当前时间（ISO 8601 格式）
- **AND** 请求失败后：
  - `loading` 设置为 `false`
  - `error` 设置为错误消息字符串
  - `providers` 设置为缓存加载的数据或空数组

#### Scenario: refreshModelProvider 执行时更新状态

- **WHEN** 用户在设置页面点击刷新按钮
- **AND** dispatch `refreshModelProvider` action
- **THEN** Redux state 中 `modelProvider.loading` 设置为 `true`
- **AND** `modelProvider.error` 设置为 `null`
- **AND** 请求成功后：
  - `providers` 更新为最新的 `RemoteProviderData[]`
  - `loading` 设置为 `false`
  - `lastUpdate` 更新为最新时间
- **AND** 请求失败后：
  - `loading` 设置为 `false`
  - `error` 设置为错误消息字符串
  - `providers` 保持缓存数据

---

### Requirement: 应用启动时异步初始化

系统 MUST 在应用启动流程（`src/main.tsx`）中 dispatch `initializeModelProvider` action。

系统 MUST 将 `initializeModelProvider` 作为异步并行任务执行，不阻塞应用渲染。

系统 MUST 确保远程数据获取不依赖主密钥初始化（因为获取的是公开的 Provider 定义，不包含敏感信息）。

系统 MUST 在 Redux store 配置中添加 `modelProviderSlice` reducer。

#### Scenario: 应用启动时并行执行 Provider 初始化

- **WHEN** 应用启动
- **AND** 阻断式初始化完成（国际化、主密钥）
- **THEN** 系统并行 dispatch 以下异步 actions：
  - `initializeModels()`
  - `initializeChatList()`
  - `initializeAppLanguage()`
  - `initializeModelProvider()`
- **AND** 这些 actions 并行执行，互不阻塞
- **AND** 应用界面正常渲染

#### Scenario: Provider 初始化不阻塞应用启动

- **WHEN** 应用启动并 dispatch `initializeModelProvider`
- **AND** 网络请求耗时较长（如 3 秒）
- **THEN** 应用界面在 3 秒内正常渲染
- **AND** 用户可以正常使用应用的其他功能
- **AND** Provider 初始化在后台异步完成

---

### Requirement: 错误处理和用户提示

系统 MUST 根据不同的错误类型显示对应的用户友好提示。

系统 MUST 在国际化文件中定义错误提示文案，支持中英文双语。

系统 MUST 使用 Toast 提示显示刷新成功或失败的消息。

系统 MUST 使用全屏组件显示无可用的模型供应商的严重错误。

系统 MUST 错误提示包含错误类型（超时、服务器错误、网络错误、解析失败等）和建议的解决方案。

#### Scenario: 网络超时时显示超时提示

- **WHEN** 网络请求超时（所有重试均失败）
- **AND** 本地不存在缓存
- **THEN** 显示全屏错误提示
- **AND** 错误消息："网络请求超时，请检查网络连接"
- **AND** 提供"重新加载"按钮

#### Scenario: 服务器错误时显示服务器提示

- **WHEN** models.dev API 返回 5xx 服务器错误
- **AND** 本地不存在缓存
- **THEN** 显示全屏错误提示
- **AND** 错误消息："服务器错误，请稍后重试"

#### Scenario: 手动刷新成功时显示成功提示

- **WHEN** 用户手动刷新成功
- **THEN** 显示 Toast 提示："模型供应商数据已更新"
- **AND** Toast 自动消失（默认 3 秒）

#### Scenario: 手动刷新失败时显示错误提示

- **WHEN** 用户手动刷新失败
- **THEN** 显示 Toast 提示："刷新失败: [具体错误原因]"
- **AND** Toast 自动消失（默认 3 秒）

---

### Requirement: 跨平台兼容性

系统 MUST 使用 `@/utils/tauriCompat` 的兼容层 API，确保在 Tauri 和 Web 环境中都能正常工作。

系统 MUST 使用 `@/utils/tauriCompat/http.ts` 的 `fetch` 函数发起网络请求。

系统 MUST 使用 `@/utils/tauriCompat` 的 `createLazyStore` 创建缓存 Store。

系统 MUST 在 Tauri 环境中使用系统代理和证书管理（生产环境）。

系统 MUST 在 Web 环境中使用原生 Web Fetch API（开发环境和生产环境）。

#### Scenario: Tauri 环境中正常工作

- **WHEN** 应用运行在 Tauri 桌面环境
- **THEN** 网络请求使用 `@tauri-apps/plugin-http` 的 `fetch`（生产环境）
- **AND** 支持系统代理和证书管理
- **AND** 缓存数据保存到文件系统

#### Scenario: Web 环境中正常工作

- **WHEN** 应用运行在 Web 浏览器环境
- **THEN** 网络请求使用原生 Web `fetch` API
- **AND** 缓存数据保存到 IndexedDB
- **AND** 所有功能与 Tauri 环境一致

---

### Requirement: 离线可用性

系统 MUST 在离线环境下能够正常工作（使用缓存数据降级）。

系统 MUST 在网络请求失败时自动降级到本地缓存，不显示错误提示（除非缓存也不存在）。

系统 MUST 确保离线环境下用户可以继续使用已配置的模型。

#### Scenario: 离线环境下启动应用

- **WHEN** 应用启动时设备离线
- **AND** 本地存在有效的缓存数据
- **THEN** 网络请求失败后自动降级到缓存
- **AND** 使用缓存数据填充 Redux store
- **AND** 用户可以正常使用已配置的模型
- **AND** 不显示错误提示

#### Scenario: 离线环境下手动刷新

- **WHEN** 用户在离线环境下点击"刷新模型供应商"按钮
- **AND** 本地存在有效的缓存数据
- **THEN** 网络请求失败后使用缓存数据
- **AND** 显示错误提示："刷新失败: 网络连接失败"
- **AND** 用户仍可继续使用应用（基于缓存）

---

### Requirement: 数据来源追踪

系统 MUST 在缓存数据中记录数据来源（`source` 字段：`'remote'` 或 `'fallback'`）。

系统 MUST 在从远程获取数据时将 `source` 设置为 `'remote'`。

系统 MUST 在降级到缓存时将 `source` 设置为 `'fallback'`（如果需要保存）。

系统 MUST 提供调试接口，允许开发者查看当前数据来源。

#### Scenario: 从远程获取数据时标记来源

- **WHEN** 从 models.dev API 成功获取数据
- **AND** 保存到缓存
- **THEN** `metadata.source` 设置为 `'remote'`

#### Scenario: 降级到缓存时标记来源

- **WHEN** 网络请求失败
- **AND** 成功加载缓存数据
- **THEN** 可以通过 `metadata.source` 确认数据来源
- **AND** 如果需要重新保存缓存，可将 `source` 设置为 `'fallback'`
