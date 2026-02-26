## Why

当前项目的核心服务层（modelRemoteService、modelProviderSlice、Middleware）缺少单元测试覆盖，导致这些关键业务逻辑的可靠性无法得到验证。这些模块涉及网络请求、状态管理、数据持久化等核心功能，一旦出现故障会严重影响用户体验。现在补充测试可以为后续重构提供安全网，并防止回归问题。

## What Changes

- 为 `src/services/modelRemoteService.ts` 添加完整的单元测试套件
  - 测试远程数据获取功能（`fetchRemoteData`）
  - 测试超时控制机制（`fetchWithTimeout`）
  - 测试重试逻辑和指数退避算法
  - 测试缓存读写功能（`saveCachedProviderData`、`loadCachedProviderData`）
  - 测试数据适配器（`adaptApiResponseToInternalFormat`）
  - Mock 网络请求和 Store 兼容层

- 为 `src/store/slices/modelProviderSlice.ts` 添加单元测试
  - 测试 `initializeModelProvider` Thunk（应用启动初始化流程）
  - 测试 `refreshModelProvider` Thunk（手动刷新流程）
  - 测试 Redux reducer 的状态转换逻辑
  - 测试错误处理和缓存降级策略
  - Mock Redux store 和服务层依赖

- 为 `src/store/middleware/chatMiddleware.ts` 和 `modelMiddleware.ts` 添加单元测试
  - 测试 Listener Middleware 的触发时机
  - 测试数据持久化副作用
  - Mock Redux store 和存储层依赖

- 更新测试辅助工具（如需要），支持上述模块的 Mock 需求

## Capabilities

### New Capabilities
- `model-remote-service-tests`: 为 modelRemoteService.ts 提供完整的单元测试覆盖，包括网络请求、缓存管理、重试机制和错误处理
- `model-provider-slice-tests`: 为 modelProviderSlice.ts 提供完整的单元测试覆盖，包括 Redux Thunk、状态管理和错误降级
- `middleware-tests`: 为 chatMiddleware 和 modelMiddleware 提供完整的单元测试覆盖，验证持久化触发的正确性

### Modified Capabilities
无。本次变更仅添加测试代码，不修改现有功能的需求或行为。

## Impact

**影响的代码模块**：
- `src/services/modelRemoteService.ts` - 新增测试文件 `src/__test__/services/modelRemoteService.test.ts`
- `src/store/slices/modelProviderSlice.ts` - 新增测试文件 `src/__test__/store/slices/modelProviderSlice.test.ts`
- `src/store/middleware/chatMiddleware.ts` - 新增测试文件 `src/__test__/store/middleware/chatMiddleware.test.ts`
- `src/store/middleware/modelMiddleware.ts` - 新增测试文件 `src/__test__/store/middleware/modelMiddleware.test.ts`

**新增依赖**（测试依赖）：
- 可能需要扩展 `src/__test__/helpers/mocks/` 中的 Mock 工厂以支持新的测试场景

**不影响的系统**：
- 现有生产代码逻辑不变
- API 接口不变
- 用户体验不变（仅提升代码质量和可靠性）
