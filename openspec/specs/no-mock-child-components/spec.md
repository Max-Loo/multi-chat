# Spec: 组件测试禁止 mock 子组件

## Purpose

确保组件测试渲染真实的组件树，通过用户可见行为验证功能，而非通过 mock 子组件来绕过渲染依赖。

## Requirements

### Requirement: 组件测试禁止 mock 子组件

组件测试 SHALL NOT 使用 `vi.mock()` 替换子组件为空壳占位符（如仅返回 `data-testid` 的 div）。测试 SHALL 渲染完整的组件树，通过用户可见行为验证功能。

**适用范围**：组件测试（`.test.tsx` 文件中渲染 React 组件的测试）。

**例外**：
- 第三方 UI 库组件（如 shadcn/ui 的 Progress、Radix UI 组件）可以 mock，因为它们是外部依赖而非项目子组件
- Hook 测试中 mock hook 依赖不属于此规范管辖范围

#### Scenario: 组件测试渲染真实子组件
- **WHEN** 编写组件测试（如 GeneralSetting、SettingPage、InitializationController）
- **THEN** 测试 SHALL NOT 使用 `vi.mock()` mock 项目内部的子组件
- **AND** 测试 SHALL 渲染完整的组件树
- **AND** 测试 SHALL 通过用户可见行为（文本内容、交互反馈、UI 状态变化）验证功能
- **AND** 测试 SHALL NOT 仅验证 `data-testid` 存在

#### Scenario: 组件测试提供必要的 Provider
- **WHEN** 组件或其子组件依赖全局 Provider（Redux Store、Router、i18n）
- **THEN** 测试 SHALL 通过 `renderWithProviders` 或类似辅助函数包裹渲染
- **AND** Provider SHALL 提供满足组件运行的最小依赖集
- **AND** 测试 SHALL 使用项目已有的 `createTypeSafeTestStore()` 创建 Redux Store

#### Scenario: 组件测试验证用户交互而非内部结构
- **WHEN** 组件测试需要验证功能
- **THEN** 测试 SHALL 通过 `screen.getByText()`、`screen.getByRole()` 等语义化查询验证
- **AND** 测试 SHALL NOT 依赖组件内部 CSS 类名（如 `custom-scrollbar-class`）进行验证
- **AND** 测试 SHALL NOT 验证组件内部实现细节（如特定方法调用）
