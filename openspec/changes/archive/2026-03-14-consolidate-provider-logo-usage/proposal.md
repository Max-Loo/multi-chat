## Why

代码中存在多处重复的 provider logo URL 拼接逻辑 `https://models.dev/logos/${provider.providerKey}.svg`，而已有 `getProviderLogoUrl` 工具函数可复用。消除重复代码，提高可维护性。

## What Changes

- 将 `ModelSidebar.tsx` 中的内联 URL 替换为 `getProviderLogoUrl` 调用
- 将 `ModelProviderDisplay.tsx` 中的内联 URL 替换为 `getProviderLogoUrl` 调用

## Capabilities

### New Capabilities

无（此为代码重构，不引入新功能）

### Modified Capabilities

- `provider-logo-display`: 实现方式变更（使用工具函数替代内联拼接），需求不变

## Impact

**受影响文件**：
- `src/pages/Model/CreateModel/components/ModelSidebar.tsx`
- `src/pages/Model/ModelTable/components/ModelProviderDisplay.tsx`

**依赖**：
- `src/utils/providerUtils.ts`（已存在 `getProviderLogoUrl` 函数）
