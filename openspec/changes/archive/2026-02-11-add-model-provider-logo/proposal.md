# 修复模型供应商 Logo 显示

## Why

当前模型供应商的 logo 无法正常展示，原因是各 Provider 使用的 logo URL 来源不一致且部分已失效。动态注册的 Provider 没有设置 logo URL。用户在界面上无法看到供应商的品牌标识，影响用户体验。

## What Changes

- **修改所有 Provider（静态和动态）的 logo URL，统一使用 `https://models.dev/logos/{provider}.svg` 格式**
  - 静态 Provider：KimiProvider、BigModelProvider、DeepseekProvider
  - 动态 Provider：DynamicModelProvider（用于远程注册的供应商）

- **受影响的 Provider logo URL 变更**：
  - KimiProvider: `https://www.moonshot.cn/favicon.ico` → `https://models.dev/logos/kimi.svg`
  - BigModelProvider: `https://cdn.bigmodel.cn/static/logo/dark.svg` → `https://models.dev/logos/bigmodel.svg`
  - DeepseekProvider: `https://deepseek.com/favicon.ico` → `https://models.dev/logos/deepseek.svg`
  - DynamicModelProvider: `undefined` → `https://models.dev/logos/{providerKey}.svg`

## Capabilities

### New Capabilities
无

### Modified Capabilities
无

**说明**：此变更仅修改了实现细节（logo URL 的值），不涉及系统行为或需求的变化。现有 spec（如 `remote-model-fetch`）中未定义 logo 相关要求，因此无需创建新的 spec 或修改现有 spec。

## Impact

**受影响的代码模块**：
- `src/lib/factory/modelProviderFactory/providers/KimiProvider.ts` - 静态 Provider 的 logo URL
- `src/lib/factory/modelProviderFactory/providers/BigModelProvider.ts` - 静态 Provider 的 logo URL
- `src/lib/factory/modelProviderFactory/providers/DeepseekProvider.ts` - 静态 Provider 的 logo URL
- `src/lib/factory/modelProviderFactory/registerDynamicProviders.ts` - 动态 Provider 的 logo URL 生成逻辑

**UI 组件**（无需修改，会自动使用新的 logo URL）：
- `src/pages/Model/ModelTable/components/ModelProviderDisplay.tsx` - 展示 Provider logo 和名称
- `src/pages/Model/CreateModel/components/ModelSidebar.tsx` - 侧边栏展示 Provider logo

**外部依赖**：
- 依赖 `https://models.dev` 提供稳定的 logo 图片资源

**兼容性**：
- 无破坏性变更，向后兼容
- 不影响现有功能和 API
