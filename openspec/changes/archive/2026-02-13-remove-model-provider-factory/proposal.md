## Why

当前应用使用工厂模式管理模型供应商，引入了不必要的抽象层和复杂度。`modelRemoteService` 已经能够从远程 API 获取完整的供应商数据（包括名称、API 地址、模型列表等），工厂注册层成为冗余的中间层。移除工厂模式将简化架构、减少代码量，并使数据流更加直观——从远程 API 直接到应用状态。

## What Changes

- **BREAKING** 删除 `src/lib/factory/modelProviderFactory/index.ts` 及其导出的所有接口和函数
  - 移除 `ModelProviderFactory`、`ModelProvider`、`ApiAddress`、`FetchApi` 等接口定义
  - 移除 `getProviderFactory()`、`getProviderFactoryMap()`、`registerProviderFactory()` 等工厂注册函数
  - 移除内部的 `factories` Map 注册表

- **BREAKING** 删除 `src/lib/factory/modelProviderFactory/registerDynamicProviders.ts`（如果存在）
  - 移除动态注册逻辑，该逻辑将远程数据转换为工厂实例

- 修改 `src/store/slices/modelProviderSlice.ts` 中的 `initializeModelProvider` Thunk
  - 改为直接使用 `modelRemoteService.fetchRemoteData()` 或 `loadCachedProviderData()` 获取 `RemoteProviderData[]`
  - 移除对 `registerDynamicProviders()` 的调用
  - 直接将 `RemoteProviderData` 存储到 Redux state

- 更新使用工厂模式的代码
  - 识别并重构所有调用 `getProviderFactory()` 的地方
  - 改为从 Redux store 直接获取供应商数据

## Capabilities

### New Capabilities
无新功能引入，这是架构简化变更。

### Modified Capabilities
- **model-provider-init**: 模型供应商初始化流程需求变更
  - 原需求：通过工厂注册表管理供应商实例
  - 新需求：直接从远程服务获取并存储供应商数据到 Redux store
  - 变更原因：移除不必要的抽象层，简化数据流

## Impact

**受影响的代码**：
- `src/lib/factory/modelProviderFactory/` - 整个目录将被删除
- `src/store/slices/modelProviderSlice.ts` - 需要重构初始化逻辑
- 任何导入并使用 `getProviderFactory()`、`registerProviderFactory()` 的组件

**受影响的类型**：
- `ModelProvider` 接口将由 `RemoteProviderData` 替代
- `ModelProviderFactory` 接口将被移除

**依赖变更**：
- 减少对 `es-toolkit` 的 `isUndefined` 函数依赖（工厂模式中使用）

**迁移影响**：
- 如果有外部代码依赖 `modelProviderFactory` 的公共 API，将需要重构
- 建议在合并前进行完整的回归测试，确保供应商数据正确加载和使用
