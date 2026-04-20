## Why

当前项目已有 1,650 个测试用例，覆盖了 store/services/hooks/utils/router 等核心模块。但探索式分析发现，**自定义业务组件和聊天面板核心组件**存在显著测试空白：5 个自定义组件（AnimatedLogo、FilterInput、OpenExternalBrowserButton、ProviderLogo、Skeleton）和 9 个聊天面板组件（Panel/）完全没有单元测试。这些模块包含用户交互逻辑和业务规则，缺乏测试覆盖意味着回归风险高、重构信心低。

## What Changes

- 为 5 个自定义业务组件新增单元测试：AnimatedLogo、FilterInput、OpenExternalBrowserButton、ProviderLogo、Skeleton（4 个子组件）
- 为聊天面板中尚未覆盖的子组件补充测试：Grid、Splitter、PanelSkeleton、RunningBubble、Title、Detail 滚动行为（现有 ChatPanel/Header/Sender 测试已较完善）

## Capabilities

### New Capabilities
- `custom-component-testing`: 自定义业务组件（AnimatedLogo、FilterInput、OpenExternalBrowserButton、ProviderLogo、Skeleton）的单元测试覆盖
- `chat-panel-testing`: 聊天面板子组件（Grid、Splitter、PanelSkeleton、RunningBubble、Title、Detail 滚动行为）的测试补充（Panel/Header/Sender 已有测试覆盖）

### Modified Capabilities
<!-- 无现有规格的变更 -->

## Impact

- **新增测试文件**：预计 10-15 个测试文件，位于 `src/__test__/` 对应目录下
- **依赖**：使用现有测试基础设施（vitest、React Testing Library、happy-dom）
- **无业务代码变更**：纯测试新增，不影响现有功能
- **CI**：测试数量增加，运行时间可能增加 5-10 秒
