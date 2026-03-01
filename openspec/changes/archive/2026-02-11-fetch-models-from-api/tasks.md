# 实现任务清单

本文档将 `fetch-models-from-api` 变更的实现工作分解为可追踪的任务清单。

---

## 1. 网络请求配置和常量定义

- [x] 1.1 在 `src/utils/constants.ts` 中添加网络请求配置常量 `NETWORK_CONFIG`
  - 定义 `DEFAULT_TIMEOUT`（5000ms）
  - 定义 `DEFAULT_MAX_RETRIES`（2）
  - 定义 `RETRY_DELAY_BASE`（1000ms）
  - 定义 `API_ENDPOINT`（`https://models.dev/api.json`）

- [x] 1.2 在 `src/utils/constants.ts` 中添加缓存配置常量 `CACHE_CONFIG`
  - 定义 `EXPIRY_TIME_MS`（24 小时）
  - 定义 `CACHE_VERSION`（1）
  - 定义 `MAX_CACHE_SIZE_MB`（10）

- [x] 1.3 在 `src/utils/constants.ts` 中定义供应商白名单 `ALLOWED_MODEL_PROVIDERS`
  - 定义只读数组：`["moonshotai", "deepseek", "bigmodel"]`
  - 使用 `as const` 确保类型安全

---

## 2. 远程数据获取服务层

- [x] 2.1 创建 `src/services/modelRemoteService.ts` 模块

- [x] 2.2 定义 models.dev API 类型接口
  - `ModelsDevApiResponse` 接口（键值对对象）
  - `ModelsDevApiProvider` 接口
  - `ModelsDevApiModelDetail` 接口
  - `ModelsDevApiModelCost` 接口
  - `ModelsDevApiModelLimit` 接口
  - `ModalityType` 类型

- [x] 2.3 定义内部数据类型接口
  - `RemoteProviderData` 接口
  - `ModelDetail` 接口
  - `CachedModelData` 接口（包含 `apiResponse` 和 `metadata`）
  - `FetchRemoteOptions` 接口

- [x] 2.4 定义错误类型和错误类
  - `RemoteDataErrorType` 枚举
  - `RemoteDataError` 自定义错误类

- [x] 2.5 实现工具函数
  - `fetchWithTimeout()` - 带超时的 fetch 请求
  - `combineSignals()` - 组合多个 AbortSignal
  - `sleep()` - 延迟函数
  - `isRetryableError()` - 判断错误是否可重试

- [x] 2.6 实现数据适配器 `adaptApiResponseToInternalFormat()`
  - 将 models.dev API 响应转换为 `RemoteProviderData[]` 数组
  - 根据白名单过滤供应商
  - 提取关键字段并转换格式

- [x] 2.7 实现缓存存储函数
  - `createCacheStore()` - 创建 Store 实例
  - `saveCachedProviderData()` - 保存完整 API 响应到缓存
  - `loadCachedProviderData()` - 从缓存加载并过滤数据
  - `isRemoteDataFresh()` - 判断缓存是否新鲜

- [x] 2.8 实现核心导出函数 `fetchRemoteData()`
  - 实现重试循环（最多 3 次请求）
  - 实现指数退避算法
  - 返回 `{ fullApiResponse, filteredData }` 对象
  - 错误分类和处理

---

## 3. 动态 Provider 注册模块

- [x] 3.1 创建 `src/lib/factory/modelProviderFactory/registerDynamicProviders.ts` 模块

- [x] 3.2 实现 `DynamicModelProvider` 类
  - 基于 `ConfigurableModelProvider` 基类
  - 根据 `RemoteProviderData` 创建实例
  - 实现 `getProviderKey()` 方法
  - 实现 `getProviderInfo()` 方法

- [x] 3.3 实现 `registerDynamicProviders()` 函数
  - 遍历 `RemoteProviderData[]` 数组
  - 为每个供应商创建 `DynamicModelProvider` 实例
  - 调用 `registerProviderFactory()` 注册到工厂

---

## 4. Redux 状态管理

- [x] 4.1 创建 `src/store/slices/modelProviderSlice.ts` 模块

- [x] 4.2 定义 slice state 接口和初始状态
  - `ModelProviderSliceState` 接口
  - `initialState` 对象（`loading`、`error`、`lastUpdate`）

- [x] 4.3 实现 `initializeModelProvider` Thunk
  - 调用 `fetchRemoteData()` 获取数据
  - 调用 `saveCachedProviderData()` 保存完整响应
  - 调用 `registerDynamicProviders()` 注册 Provider
  - 错误时降级到 `loadCachedProviderData()`

- [x] 4.4 实现 `refreshModelProvider` Thunk
  - 强制刷新模式（`forceRefresh: true`）
  - 更新缓存和重新注册

- [x] 4.5 创建 slice 并添加 extraReducers
  - 处理 `pending`、`fulfilled`、`rejected` 状态
  - 添加 `clearError` action

- [x] 4.6 在 `src/store/index.ts` 中添加 `modelProviderSlice` reducer
  - 导入 reducer
  - 添加到 `rootReducer`

---

## 5. 应用启动集成

- [x] 5.1 在 `src/main.tsx` 中导入 `initializeModelProvider` Thunk

- [x] 5.2 移除 `ProviderRegistry.ts` 的硬编码注册逻辑
  - 删除 `import { registerAllProviders }`
  - 删除 `registerAllProviders()` 调用

- [x] 5.3 在异步初始化阶段 dispatch `initializeModelProvider`
  - 与 `initializeModels`、`initializeChatList`、`initializeAppLanguage` 并行执行
  - 不阻塞应用渲染

---

## 6. 设置页面 UI 实现

- [x] 6.1 在 `src/pages/Settings.tsx` 中添加"刷新模型供应商"部分
  - 导入 `refreshModelProvider` Thunk
  - 使用 `useSelector` 读取 `modelProvider` state

- [x] 6.2 实现刷新按钮和状态显示
  - 根据 `loading` 状态显示"刷新中..."或"刷新模型供应商"
  - 根据 `error` 状态显示错误提示
  - 显示最后更新时间（本地化格式）

- [x] 6.3 实现刷新按钮点击处理
  - Dispatch `refreshModelProvider` action
  - 成功时显示 Toast 提示："模型供应商数据已更新"
  - 失败时显示 Toast 提示："刷新失败: [错误原因]"

- [x] 6.4 支持取消请求
  - 使用 `AbortController` 管理请求生命周期
  - 组件卸载时取消正在进行的请求

---

## 7. 错误处理 UI 组件

- [x] 7.1 创建 `src/components/NoProvidersAvailable.tsx` 组件
  - 使用 shadcn/ui 的 `Button` 和 `AlertCircle` 图标
  - 显示全屏错误提示
  - 提供"重新加载"按钮

- [x] 7.2 在应用中集成 `NoProvidersAvailable` 组件
  - 在 Redux state 中检测 `modelProvider.error`
  - 当远程获取失败且无缓存时显示该组件
  - 替代应用主界面

---

## 8. 国际化文案

- [x] 8.1 在 `src/locales/zh/setting.json` 中添加中文文案
  - 添加 `modelProvider.refreshSuccess`
  - 添加 `modelProvider.refreshFailed`
  - 添加 `modelProvider.errors.*`（所有错误类型）
  - 添加 `modelProvider.lastUpdate`

- [x] 8.2 在 `src/locales/en/setting.json` 中添加英文文案
  - 翻译所有新增的中文文案

- [x] 8.3 在 `src/locales/zh/common.json` 中添加通用错误文案
  - 添加"无可用的模型供应商"错误提示
  - 添加"重新加载"按钮文本

- [x] 8.4 在 `src/locales/en/common.json` 中添加英文翻译

---

## 9. 单元测试

- [ ] 9.1 编写 `modelRemoteService` 测试
  - 测试 `fetchRemoteData()` 成功场景
  - 测试超时重试逻辑
  - 测试指数退避算法
  - 测试错误分类和抛出
  - 测试 `adaptApiResponseToInternalFormat()` 适配器

- [ ] 9.2 编写缓存存储测试
  - 测试 `saveCachedProviderData()` 保存完整响应
  - 测试 `loadCachedProviderData()` 加载并过滤
  - 测试缓存不存在时抛出错误

- [ ] 9.3 编写 Redux Thunk 测试
  - 测试 `initializeModelProvider` 成功流程
  - 测试 `initializeModelProvider` 降级流程
  - 测试 `refreshModelProvider` 成功和失败场景

- [ ] 9.4 编写 `registerDynamicProviders` 测试
  - 测试动态创建 Provider 实例
  - 测试正确注册到工厂

---

## 10. 代码清理和文档更新

- [x] 10.1 删除 `ProviderRegistry.ts` 中的硬编码 Provider 实例化代码
  - 保留 `ConfigurableModelProvider` 基类
  - 保留工厂注册机制

- [x] 10.2 更新 `AGENTS.md` 文档
  - 添加远程数据获取相关说明
  - 更新应用启动流程文档
  - 添加新模块的架构说明

- [ ] 10.3 验证跨平台兼容性
  - 在 Tauri 环境测试网络请求
  - 在 Web 环境测试网络请求
  - 验证缓存在两种环境都能正常工作

---

## 11. 集成测试和发布准备

- [ ] 11.1 端到端测试
  - 测试应用启动时自动获取远程数据
  - 测试网络失败时降级到缓存
  - 测试手动刷新功能
  - 测试白名单调整后缓存仍然有效

- [ ] 11.2 性能测试
  - 测试应用启动时间影响
  - 测试缓存文件大小
  - 测试重试机制的总耗时

- [ ] 11.3 错误场景测试
  - 测试网络超时场景
  - 测试服务器 5xx 错误
  - 测试客户端 4xx 错误
  - 测试 JSON 解析失败
  - 测试离线环境

- [ ] 11.4 发布准备
  - 运行 `pnpm lint` 确保代码规范
  - 运行 `pnpm tsc` 确保类型检查通过
  - 构建生产版本并测试
  - 准备回滚方案（设计文档附录）

---

## 任务优先级说明

### 高优先级（核心功能）
- 任务 1-5：必须完成才能实现基本功能
- 任务 8：国际化文案，用户体验必需

### 中优先级（用户体验）
- 任务 6：设置页面 UI
- 任务 7：错误处理组件
- 任务 9：单元测试

### 低优先级（质量保证）
- 任务 10：代码清理和文档
- 任务 11：集成测试

### 预计工作量
- **核心功能（任务 1-5 + 8）**：约 6-8 小时
- **UI 和错误处理（任务 6-7）**：约 2-3 小时
- **测试和清理（任务 9-11）**：约 4-5 小时
- **总计**：约 12-16 小时
