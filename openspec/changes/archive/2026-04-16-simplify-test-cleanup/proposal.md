## Why

测试基础设施重构已完成大部分高优先级问题（i18n mock 统一、createWrapper 迁移至 renderWithProviders），但 simplify 审查仍发现 8 个系统性问题：7 个 hook 测试各自定义 `createWrapper`、RunningChatBubble 中 13 处手动 `configureStore` 调用绕过已有工厂、ChatContent 14 个测试中 13 个是假阳性断言。这些问题导致测试代码维护成本高、默认值定义重复、虚假覆盖率信心。现在修复可以防止问题进一步扩散。

## What Changes

- **hook 测试 wrapper 统一**：提取 7 个 hook 测试中重复的 `createWrapper` 为共享 helper（如 `createHookWrapper`），或扩展 `renderWithProviders` 兼容 `renderHook`
- **RunningChatBubble 状态工厂迁移**：将 13 处手动 `configureStore` + 嵌套 `runningChat` 构建替换为 `createTypeSafeTestStore` + `createChatSliceState`
- **panelLayout 默认值去重**：`createPanelLayoutStore` 的内联默认值替换为 `createChatSliceState` / `createModelSliceState` 调用
- **ChatContent 假阳性测试清理**：将 13 个仅断言 `container.firstChild` 的占位测试合并为少量有意义的测试
- **BottomNav mock 提取**：两个文件中相同的 35 行导航配置 mock 提取到共享模块
- **自定义工厂替换**：`createTestModel`、`createTestChatModel`、`createMockChatModelForTest` 替换为已有共享工厂
- **类型化 action dispatch**：ChatPanel.test.tsx 中字符串字面量 action 替换为 slice 导出的 action creator
- **冗余注释清理**：Sidebar.test.tsx 中 14 处与测试标题重复的注释

## Capabilities

### New Capabilities

- `test-hook-wrapper`: hook 测试共享 wrapper helper，消除 7 个文件中 createWrapper 的重复定义
- `test-store-consolidation`: 测试 store 创建统一，将 RunningChatBubble 和 panelLayout 的手动状态构建迁移到已有工厂函数
- `test-quality-fix`: 测试质量修复，涵盖 ChatContent 假阳性清理、BottomNav mock 提取、自定义工厂替换、类型化 dispatch 和冗余注释清理

### Modified Capabilities

（无已有规格需要修改）

## Impact

- **影响文件**：约 15 个测试文件 + 2 个 helper 文件
- **影响范围**：仅测试代码，不影响生产代码
- **依赖**：已有的 `createTypeSafeTestStore`、`createChatSliceState`、`createMockModel`、`createMockPanelChatModel`、`createI18nMockReturn` 等工厂函数
- **风险**：低。纯测试重构，每次变更后运行对应测试即可验证
