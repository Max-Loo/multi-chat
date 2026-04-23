## Purpose

减少测试中 mock 定义的重复代码，通过统一模式和共享 fixture 简化测试编写与维护。

## Requirements

### Requirement: sonner mock 不得重复定义相同行为的函数

`toast-system.integration.test.tsx` 中的 sonner mock MUST 使用 `Object.assign` 或等效模式，将 `success`、`error`、`warning`、`info`、`loading` 统一指向同一个 `renderToastToDom` 实现，消除 6 个函数体的重复。

#### Scenario: sonner mock 使用 Object.assign 消除重复

- **WHEN** 加载 `toast-system.integration.test.tsx` 的 sonner mock 定义
- **THEN** `toast.success`、`toast.error`、`toast.warning`、`toast.info`、`toast.loading` MUST 全部引用同一个 `renderToastToDom` 函数，不得逐一展开定义

### Requirement: 测试文件必须使用共享的 model fixture

测试文件 MUST NOT 手写与已有 fixture 工厂函数（如 `createDeepSeekModel`）功能等价的本地工厂函数。

#### Scenario: chat integration 测试复用 createDeepSeekModel

- **WHEN** `chat/index.integration.test.ts` 需要创建测试模型
- **THEN** MUST 使用 `createDeepSeekModel`（来自 `@/__test__/helpers/fixtures/model`），MUST NOT 定义本地 `createTestModel`

#### Scenario: auto-naming integration 测试复用 createDeepSeekModel

- **WHEN** `auto-naming.integration.test.ts` 需要创建测试模型
- **THEN** MUST 使用 `createDeepSeekModel`（来自 `@/__test__/helpers/fixtures/model`），MUST NOT 定义本地 `createTestModel`

### Requirement: mock 响应式数据的类型必须与源类型一致

测试中 mock `useResponsive` 返回值时，`layoutMode` 字段 MUST 使用 `LayoutMode` 联合类型，MUST NOT 使用 `as string` 断言绕过类型检查。

#### Scenario: Layout 测试中 layoutMode 使用正确类型

- **WHEN** `Layout.test.tsx` 定义 `mockResponsive` 对象的 `layoutMode` 字段
- **THEN** MUST 使用 `LayoutMode` 类型的合法值（`'mobile'` | `'compact'` | `'compressed'` | `'desktop'`），MUST NOT 使用 `as string` 类型断言

### Requirement: KeyManagementSetting 组件测试
系统 SHALL 对 `KeyManagementSetting` 组件进行完整的交互测试，覆盖密钥导出、复制和数据重置流程。

#### Scenario: 密钥导出成功
- **WHEN** 用户点击导出按钮且 `exportMasterKey` 成功返回密钥字符串
- **THEN** 系统应显示密钥内容并启用复制按钮

#### Scenario: 密钥导出失败
- **WHEN** 用户点击导出按钮且 `exportMasterKey` 抛出错误
- **THEN** 系统应显示错误 toast 提示

#### Scenario: 密钥复制成功
- **WHEN** 用户点击复制按钮且 `copyToClipboard` 成功
- **THEN** 系统应显示成功 toast 并关闭导出对话框

#### Scenario: 密钥复制失败
- **WHEN** 用户点击复制按钮且 `copyToClipboard` 抛出错误
- **THEN** 系统应显示错误 toast 提示

#### Scenario: 数据重置对话框交互
- **WHEN** 用户触发数据重置操作
- **THEN** 系统应通过 `useResetDataDialog` 显示确认对话框

---

### Requirement: useResetDataDialog hook 测试
系统 SHALL 对 `useResetDataDialog` hook 进行完整的状态和交互测试，覆盖对话框生命周期和重置流程。

#### Scenario: 初始状态
- **WHEN** hook 被调用
- **THEN** `isDialogOpen` SHALL 为 `false`
- **AND** `isResetting` SHALL 为 `false`

#### Scenario: 打开对话框
- **WHEN** 调用 `setIsDialogOpen(true)`
- **THEN** `isDialogOpen` SHALL 为 `true`
- **AND** `renderResetDialog()` SHALL 返回包含确认和取消按钮的 AlertDialog

#### Scenario: 确认重置成功
- **WHEN** 调用 `handleConfirmReset` 且 `resetAllData` 成功
- **THEN** 系统应调用 `resetAllData()` 一次
- **AND** `isResetting` SHALL 在重置过程中为 `true`

#### Scenario: 确认重置失败
- **WHEN** 调用 `handleConfirmReset` 且 `resetAllData` 抛出错误
- **THEN** 系统应重置 `isResetting` 为 `false`
- **AND** 系统应重置 `isDialogOpen` 为 `false`

#### Scenario: 重置中按钮禁用
- **WHEN** `isResetting` 为 `true`
- **THEN** `renderResetDialog()` 返回的确认和取消按钮 SHALL 被禁用
