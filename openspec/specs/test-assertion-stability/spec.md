# test-assertion-stability Specification

## Purpose

规范组件测试中的元素选择策略和断言方式，确保测试基于语义化选择器而非实现细节（如 CSS 类名），提高测试的可维护性和对重构的鲁棒性。

## Requirements

### Requirement: 组件测试优先使用语义化选择器

组件测试 SHALL 按以下优先级选择元素：`getByRole` > `getByLabelText` > `getByText` > `getByTestId`。CSS 类名（包括 Tailwind 类）SHALL NOT 用于元素定位或行为断言。

#### Scenario: Button 组件变体样式验证
- **WHEN** 测试验证 Button 的 variant 样式差异
- **THEN** SHALL 通过 `data-testid` 或视觉差异（如不同文本内容）验证，而非断言 `bg-primary`、`bg-destructive` 等 CSS 类名

#### Scenario: ChatBubble 对齐方式验证
- **WHEN** 测试验证用户消息的右对齐样式
- **THEN** SHALL 通过 `data-testid="user-message"` 和 `data-testid="assistant-message"` 区分消息类型，而非查询 `.justify-end` 类名

### Requirement: data-testid 命名约定

`data-testid` SHALL 使用 kebab-case 命名，格式为 `<组件名>-<语义>`。同一组件内的 testid SHALL 以组件名前缀统一。

#### Scenario: 布局组件的 testid 命名
- **WHEN** Layout 组件添加 data-testid
- **THEN** SHALL 使用 `layout-root`（外层容器）、`layout-sidebar`（侧边栏）、`layout-main`（主内容区）等命名

### Requirement: 集成测试的 mock 策略一致性

集成测试 SHALL NOT mock 被测功能本身。当 mock 外部依赖时，SHALL 验证组件在不同 mock 状态下的渲染差异，而非仅验证 mock 变量自身的值。

#### Scenario: responsive 布局集成测试验证切换行为
- **WHEN** 测试从 Desktop 切换到 Mobile 模式
- **THEN** SHALL 在 cleanup 后用新状态重新渲染，验证 Desktop 下 Sidebar 可见而 Mobile 下 BottomNav 可见，而非仅断言 `mockResponsiveState.isMobile === true`
