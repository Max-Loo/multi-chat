## Why

当前 ModelProviderSetting 组件界面过于简陋，不符合现代 UI/UX 设计标准。用户体验存在以下问题：

1. **信息缺失**：用户无法看到当前已加载的模型供应商列表
2. **状态不透明**：无法查看各供应商的可用状态、支持的模型数量
3. **交互单调**：仅提供一个刷新按钮，缺少其他必要的操作入口
4. **视觉层次不清**：错误提示和状态信息混排，缺乏清晰的视觉层级

作为应用的核心设置之一，模型供应商管理需要更好的信息架构和交互设计，以提升用户体验和可维护性。

## What Changes

- **重新设计界面布局**：采用卡片式设计，清晰展示模型供应商信息
- **添加供应商列表展示**：显示所有可用的模型供应商及其状态（可用/不可用）
- **增强状态反馈**：为每个供应商显示支持的模型数量、最后更新时间
- **改进错误处理**：使用更友好的错误提示和重试机制
- **优化刷新交互**：保留刷新功能，但增强视觉反馈和加载状态
- **添加详细信息视图**：支持展开查看单个供应商的详细信息（模型列表、API 端点等）

## Capabilities

### New Capabilities
- `model-provider-display`: 显示模型供应商列表及其状态信息
- `provider-detail-view`: 查看单个供应商的详细信息（模型列表、API 配置等）

### Modified Capabilities
- (无 - 本次改动仅为 UI 层面的优化，不改变后端需求和业务逻辑)

## Impact

- **受影响的代码**:
  - `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting.tsx` (完全重构)
  - 可能需要调整相关的国际化文件 (`src/locales/zh/setting.json`, `src/locales/en/setting.json`)
  - 可能需要添加新的 CSS 样式或 Tailwind 类

- **不受影响的部分**:
  - 后端 API (`src/store/slices/modelProviderSlice.ts`)
  - 远程数据获取逻辑 (`src/services/modelRemoteService.ts`)
  - 其他设置组件

- **依赖关系**:
  - 需要引用 `design-taste-frontend` 和 `web-design-guidelines` skill 的设计原则
  - 使用现有的 shadcn/ui 组件库 (Card, Badge, Button, Alert 等)
