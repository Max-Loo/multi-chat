# Proposal: 添加供应商 Logo 显示

## Why

当前模型供应商设置页面使用供应商名称的首字母作为头像，这种显示方式不够直观和专业，无法快速识别供应商品牌。使用实际的供应商 logo 可以显著改善用户体验，提升界面美观度和品牌识别度。

## What Changes

- 修改供应商卡片头像显示逻辑，从首字母改为使用供应商 logo
- 使用固定格式的 logo URL：`https://models.dev/logos/{provider.providerKey}.svg`
- 创建可复用的工具函数 `getProviderLogoUrl(providerKey: string)` 来构建 logo URL
- **实现渐进显示策略**：先显示首字母占位符，logo 加载成功后平滑淡入
- **添加超时机制**：使用常量 `LOGO_LOAD_TIMEOUT`（5000ms）防止网络挂起导致长时间等待
- **实现智能状态管理**：使用 `key={providerKey}` 确保供应商切换时正确重新加载
- 添加 logo 加载失败时的降级方案（保留首字母显示作为后备）
- **增强可访问性**：为首字母降级添加 ARIA 属性，支持屏幕阅读器
- 优化 logo 显示的样式和布局，确保 SVG 图片清晰显示
- 在所有需要显示供应商 logo 的地方统一使用该工具函数

## Capabilities

### New Capabilities
- `provider-logo-display`: 提供供应商 logo 的完整解决方案，包括：
  - 工具函数 `getProviderLogoUrl()` - 构建 logo URL
  - React 组件 `ProviderLogo` - 封装显示逻辑、降级处理、渐进显示和性能优化
  - 支持在项目任何地方统一使用，性能优异（双层缓存：React.memo 组件级缓存 + 浏览器 HTTP 缓存）

### Modified Capabilities
- `model-provider-display`: 现有规格已定义图标显示需求（第 17 行），本次变更将实现从首字母到实际 logo 的升级，不涉及规格级别的需求变更

## Impact

**受影响的代码**:
- `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderCardHeader.tsx` - 使用新的 `ProviderLogo` 组件替代原有头像渲染
- 项目中所有其他需要显示供应商 logo 的地方 - 可以直接使用 `ProviderLogo` 组件

**新增文件**:
- `src/utils/providerUtils.ts` - 工具函数
  - `getProviderLogoUrl(providerKey: string): string`
  - 返回 `https://models.dev/logos/${providerKey}.svg`

- `src/components/ProviderLogo/index.tsx` - React 组件
  - 封装所有 logo 显示逻辑
  - 使用 `React.memo` 优化性能
  - 内置渐进显示和错误降级
  - 内置超时机制（使用 `LOGO_LOAD_TIMEOUT` 常量，5000ms）
  - Props：`{ providerKey, providerName, size?, className? }`

**API 和依赖**:
- 使用 models.dev 提供的静态 logo 资源：`https://models.dev/logos/{providerKey}.svg`
- 不需要依赖远程 API 提供额外的 logo URL 字段
- 使用原生 `<img>` 标签加载 SVG 图片
- 不需要额外的第三方库

**系统影响**:
- 设置页面的网络流量会增加（需要从 models.dev 加载 SVG logo）
- 需要处理 logo 图片加载失败的场景（降级到首字母显示）
- SVG 图片较小，对性能影响可控
- **用户体验提升**：渐进显示策略避免首屏空白和闪烁
- **健壮性提升**：超时机制（5000ms）避免网络挂起影响体验
- **性能优化**：双层缓存机制（React.memo 组件级缓存 + 浏览器 HTTP 缓存）减少重复渲染
- **可维护性提升**：组件封装所有逻辑，易于测试和维护
- **代码一致性**：项目中所有使用供应商 logo 的地方都通过统一组件获取
- **可访问性增强**：支持屏幕阅读器用户正确识别供应商
- **复用性提升**：`ProviderLogo` 组件可在项目中任何地方使用
