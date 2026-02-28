# Spec: Custom Hooks Testing

本规格定义了项目中所有自定义 Hooks 的测试要求，确保核心业务逻辑的正确性和稳定性。

## Purpose

确保项目中的自定义 Hooks 具有完整的单元测试覆盖，验证核心业务逻辑的正确性、类型安全性和边界情况处理。测试用例应遵循项目测试规范，使用标准化的 Mock 策略和测试辅助工具。

## Requirements

### Requirement: useDebounce Hook 测试覆盖
系统 SHALL 为 `useDebounce` Hook 提供完整的单元测试，验证防抖功能的正确性。

#### Scenario: 防抖值延迟更新
- **WHEN** 用户传入一个值和延迟时间（如 500ms）
- **THEN** Hook 应在延迟时间后才返回更新的值
- **AND** 在延迟期间内多次更新值时，应只返回最后一次更新的值

#### Scenario: 定时器正确清理
- **WHEN** 组件卸载或值/延迟参数变化时
- **THEN** Hook 应清理之前的定时器，避免内存泄漏

#### Scenario: 立即返回初始值
- **WHEN** Hook 首次渲染时
- **THEN** 应立即返回传入的初始值，无需等待延迟

#### Scenario: 支持泛型类型
- **WHEN** 传入不同类型的值（string、number、object 等）
- **THEN** Hook 应保持类型安全并正确返回对应类型的值

---

### Requirement: useConfirm Hook 测试覆盖
系统 SHALL 为 `useConfirm` Hook 和 `ConfirmProvider` 提供完整的单元测试。

#### Scenario: 显示确认对话框
- **WHEN** 调用 `modal.confirm()` 方法并传入配置参数
- **THEN** 应显示 AlertDialog 组件
- **AND** 对话框标题和描述应正确显示

#### Scenario: 确认操作回调执行
- **WHEN** 用户点击"确认"按钮
- **THEN** 应调用 `onOk` 回调函数
- **AND** 对话框应关闭

#### Scenario: 取消操作回调执行
- **WHEN** 用户点击"取消"按钮或点击遮罩层
- **THEN** 应调用 `onCancel` 回调函数（如果提供）
- **AND** 对话框应关闭

#### Scenario: Context Provider 必须包裹
- **WHEN** 在 `ConfirmProvider` 外部使用 `useConfirm` Hook
- **THEN** 应抛出错误提示"useConfirm must be used within ConfirmProvider"

#### Scenario: 默认文本国际化
- **WHEN** 未提供自定义按钮文本
- **THEN** 应使用国际化翻译的默认文本（"确认"、"取消"）

#### Scenario: 警告类型对话框
- **WHEN** 调用 `modal.warning()` 方法
- **THEN** 应显示警告类型的对话框，标题默认为"警告"

---

### Requirement: useNavigateToPage Hook 测试覆盖
系统 SHALL 为 `useNavigateToPage` Hook 提供完整的单元测试。

#### Scenario: 导航到聊天页面
- **WHEN** 调用 `navigateToChat()` 并传入 `chatId`
- **THEN** 应使用 React Router 导航到 `/chat?chat=chatId` 路径

#### Scenario: 导航到聊天页面无参数
- **WHEN** 调用 `navigateToChat()` 不传入 `chatId`
- **THEN** 应导航到 `/chat` 路径（无查询参数）

#### Scenario: 导航到模型页面
- **WHEN** 调用 `navigateToModel()` 方法
- **THEN** 应正确导航到模型管理页面路径

---

### Requirement: useCurrentSelectedChat Hook 测试覆盖
系统 SHALL 为 `useCurrentSelectedChat` Hook 提供完整的单元测试。

#### Scenario: 获取当前选中的聊天
- **WHEN** Redux store 中有选中的聊天 ID
- **THEN** Hook 应返回对应的聊天对象

#### Scenario: 无选中聊天时返回 undefined
- **WHEN** Redux store 中没有选中的聊天 ID
- **THEN** Hook 应返回 `undefined`

---

### Requirement: useExistingChatList Hook 测试覆盖
系统 SHALL 为 `useExistingChatList` Hook 提供完整的单元测试。

#### Scenario: 获取所有已存在的聊天列表
- **WHEN** Redux store 中有聊天数据
- **THEN** Hook 应返回完整的聊天列表数组

#### Scenario: 空列表处理
- **WHEN** Redux store 中没有聊天数据
- **THEN** Hook 应返回空数组

---

### Requirement: useExistingModels Hook 测试覆盖
系统 SHALL 为 `useExistingModels` Hook 提供完整的单元测试。

#### Scenario: 获取所有已配置的模型列表
- **WHEN** Redux store 中有模型数据
- **THEN** Hook 应返回完整的模型列表数组

#### Scenario: 空模型列表处理
- **WHEN** Redux store 中没有模型数据
- **THEN** Hook 应返回空数组

---

### Requirement: useAdaptiveScrollbar Hook 测试覆盖
系统 SHALL 为 `useAdaptiveScrollbar` Hook 提供完整的单元测试。

#### Scenario: 自适应滚动条样式应用
- **WHEN** Hook 在组件中挂载
- **THEN** 应正确应用自定义滚动条样式
- **AND** 应处理不同浏览器的兼容性

---

### Requirement: useBasicModelTable Hook 测试覆盖
系统 SHALL 为 `useBasicModelTable` Hook 提供完整的单元测试。

#### Scenario: 表格列配置返回
- **WHEN** 调用 Hook 获取表格配置
- **THEN** 应返回正确的列定义数组
- **AND** 每列应包含正确的 key、title 和渲染函数

#### Scenario: 表格数据处理
- **WHEN** 传入模型数据列表
- **THEN** Hook 应返回格式化后的表格数据

---

### Requirement: useNavigateToExternalSite Hook 测试覆盖
系统 SHALL 为 `useNavigateToExternalSite` Hook 提供完整的单元测试。

#### Scenario: 在 Tauri 环境打开外部链接
- **WHEN** 在 Tauri 环境中调用 Hook 并传入 URL
- **THEN** 应使用 Tauri 的 shell.open() 方法打开链接

#### Scenario: 在 Web 环境打开外部链接
- **WHEN** 在 Web 环境中调用 Hook 并传入 URL
- **THEN** 应使用 window.open() 方法打开链接

---

### Requirement: Redux 类型化 Hooks 测试覆盖
系统 SHALL 为 `redux.ts` 中的类型化 Hooks 提供完整的单元测试。

#### Scenario: useAppSelector 类型安全
- **WHEN** 使用 `useAppSelector` 选择 state
- **THEN** 应正确推断 RootState 类型
- **AND** 返回值应保持类型安全

#### Scenario: useAppDispatch 类型安全
- **WHEN** 使用 `useAppDispatch` 获取 dispatch 函数
- **THEN** 应返回类型安全的 AppDispatch 实例
- **AND** dispatch 的 action 应符合类型定义

---

### Requirement: 测试文件组织结构
系统 SHALL 按照统一的目录结构组织 Hook 测试文件。

#### Scenario: 测试文件位置
- **WHEN** 为 Hook 创建测试文件
- **THEN** 测试文件应位于 `src/__test__/hooks/` 目录
- **AND** 文件名应与源文件对应（如 `useDebounce.test.ts`）

#### Scenario: 测试辅助工具复用
- **WHEN** 编写 Hook 测试
- **THEN** 应复用项目现有的测试辅助工具（如 `createMockModel`、`createTauriMocks` 等）

---

### Requirement: Mock 策略和隔离
系统 SHALL 为每个 Hook 提供适当的 Mock 和环境隔离。

#### Scenario: React Hooks 测试依赖
- **WHEN** 测试自定义 Hooks
- **THEN** 应使用 `@testing-library/react` 的 `renderHook` 方法
- **AND** 应使用 `act` 包装状态更新操作

#### Scenario: Redux Mock 提供
- **WHEN** 测试依赖 Redux 的 Hooks
- **THEN** 应使用 Redux Provider 包装 Hook
- **AND** 应提供 Mock 的 preloadedState

#### Scenario: Tauri 环境 Mock
- **WHEN** 测试依赖 Tauri API 的 Hooks（如 `useNavigateToExternalSite`）
- **THEN** 应使用 `createTauriMocks` 创建 Mock
- **AND** 应测试 Tauri 和 Web 两种环境

---

### Requirement: 测试覆盖率目标
系统 SHALL 确保每个 Hook 的测试覆盖率达到预定目标。

#### Scenario: 语句覆盖率目标
- **WHEN** 运行 Hook 测试套件
- **THEN** 每个 Hook 的语句覆盖率应至少达到 80%
- **AND** 关键逻辑路径应达到 100% 覆盖

#### Scenario: 分支覆盖率目标
- **WHEN** 运行 Hook 测试套件
- **THEN** 每个 Hook 的分支覆盖率应至少达到 75%
- **AND** 所有条件分支（if/else、三元运算符）都应被测试

#### Scenario: 边界情况测试
- **WHEN** 测试 Hook 行为
- **THEN** 应测试空值、undefined、null 等边界情况
- **AND** 应测试异常输入的错误处理
