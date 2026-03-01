## REMOVED Requirements

### Requirement: ModelProvider 提供 Logo URL 属性
**Reason**：移除不必要的重复代码，简化 ModelProvider 接口设计。Logo URL 格式固定（`https://models.dev/logos/{providerKey}.svg`），无需在数据层维护。将 URL 拼接逻辑移至 UI 层，符合关注点分离原则。

**Migration**：
1. **数据层变更**：
   - 从 `ModelProvider` 接口中移除 `logoUrl?: string` 属性
   - 从 `ConfigurableModelProvider` 基类中移除抽象属性定义
   - 从各 Provider 子类中移除硬编码的 `logoUrl` 赋值
   - 从 `DynamicModelProvider` 构造函数中移除 `logoUrl` 拼接逻辑

2. **UI 层变更**：
   - 在 `ModelProviderDisplay.tsx` 中改为直接使用 `https://models.dev/logos/${provider.key}.svg`
   - 在 `ModelSidebar.tsx` 中改为直接使用 `https://models.dev/logos/${provider.key}.svg`

3. **兼容性说明**：
   - UI 层的 URL 格式与原保持一致，因此对用户无感知
   - 确保 `provider.key` 值与 models.dev 上的 logo 文件名对应

#### Scenario: 移除前的 Logo 显示行为
- **WHEN** UI 组件需要显示模型供应商 Logo
- **THEN** 组件从 `provider.logoUrl` 属性获取 URL（已废弃）

#### Scenario: 迁移后的 Logo 显示行为
- **WHEN** UI 组件需要显示模型供应商 Logo
- **THEN** 组件使用 `https://models.dev/logos/${provider.key}.svg` 直接拼接 URL
- **AND** 系统不再依赖 `provider.logoUrl` 属性
