# Proposal: 动态生成模型供应商 Logo URL

## Why

当前系统中，每个模型供应商 Provider 类都需要硬编码其 logo URL，或在动态注册时手动拼接 URL。这种重复代码违反了 DRY 原则，增加了维护成本。当 logo URL 格式需要统一调整时，必须修改所有 Provider 类。通过将 logo URL 的生成逻辑集中到一处动态生成，可以显著简化代码并提升可维护性。

## What Changes

- **完全移除 `logoUrl` 属性**
  - 从 `ModelProvider` 接口中移除 `logoUrl?: string` 属性
  - 从 `ConfigurableModelProvider` 基类中移除 `abstract readonly logoUrl?: string`
  - 从各 Provider 子类（DeepseekProvider、KimiProvider、BigModelProvider）中移除硬编码的 `logoUrl` 赋值
  - 从 `DynamicModelProvider` 构造函数中移除 `logoUrl` 拼接逻辑

- **在 UI 组件中直接拼接 Logo URL**
  - 在 `ModelProviderDisplay.tsx` 中使用 `https://models.dev/logos/${provider.key}.svg` 直接拼接
  - 在 `ModelSidebar.tsx` 中使用 `https://models.dev/logos/${provider.key}.svg` 直接拼接
  - 统一 URL 格式：`https://models.dev/logos/${providerKey}.svg`

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- 移除 `logoUrl` 属性，简化 ModelProvider 接口

## Impact

**受影响的代码**：
- `src/lib/factory/modelProviderFactory/index.ts` - ModelProvider 接口（移除 logoUrl 属性）
- `src/lib/factory/modelProviderFactory/base/ConfigurableModelProvider.ts` - 基类（移除抽象属性）
- `src/lib/factory/modelProviderFactory/providers/DeepseekProvider.ts` - 移除硬编码 logoUrl
- `src/lib/factory/modelProviderFactory/providers/KimiProvider.ts` - 移除硬编码 logoUrl
- `src/lib/factory/modelProviderFactory/providers/BigModelProvider.ts` - 移除硬编码 logoUrl
- `src/lib/factory/modelProviderFactory/registerDynamicProviders.ts` - 移除构造函数中的 logoUrl 拼接
- `src/pages/Model/ModelTable/components/ModelProviderDisplay.tsx` - 改为直接拼接 URL
- `src/pages/Model/CreateModel/components/ModelSidebar.tsx` - 改为直接拼接 URL

**依赖和系统**：
- 无新增依赖
- 不影响现有功能
- UI 层需要修改拼接逻辑

**风险**：
- 低风险：URL 拼接逻辑简单明确
- 需要确保所有 providerKey 都有对应的 logo 文件（否则会显示 404）
