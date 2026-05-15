## Why

深度审查发现 3 个源文件完全没有独立的单元测试：`useScrollContainer` hook（包含 DOM 事件绑定/清理逻辑，被两个设置页依赖）、`ProviderCardHeader` 和 `ProviderCardSummary` 组件（被 ProviderCard 间接渲染但未显式测试）。其中 `useScrollContainer` 风险最高——如果 `cleanup` 逻辑有缺陷会导致内存泄漏。

## What Changes

- 为 `useScrollContainer` hook 新增完整的单元测试，覆盖 ref 返回、事件绑定、事件解绑（cleanup）
- 为 `ProviderCardHeader` 组件新增单元测试，覆盖供应商名称渲染、状态徽章（available/unavailable）、展开/折叠图标方向
- 为 `ProviderCardSummary` 组件新增单元测试，覆盖模型数量文本、收起时提示信息显示/隐藏

## Capabilities

### New Capabilities

- `provider-card-header-testing`: 验证 ProviderCardHeader 组件的渲染行为——供应商名称、ProviderLogo、状态徽章（available/unavailable）图标切换、展开/折叠 Chevron 方向
- `provider-card-summary-testing`: 验证 ProviderCardSummary 组件的渲染行为——模型数量文本（i18n 插值）、收起时"点击查看详情"提示的显示/隐藏

### Modified Capabilities

- `scroll-container-hook`: 补充测试要求——现有 spec 定义了 hook 接口和行为，但从未实现对应的测试文件，需将 spec 中的 Scenario 转化为实际测试用例

## Impact

- 新增 3 个测试文件于 `src/__test__/` 目录
- 不影响任何业务代码、API 或依赖项
- 对 hooks 覆盖率（当前阈值 85%/80%）和 components 覆盖率（当前阈值 65%/50%）有正向提升
