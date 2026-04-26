## ADDED Requirements

### Requirement: 查询优先级规则
测试中的 DOM 查询 SHALL 遵循以下优先级顺序：`getByRole` > `getByLabelText` > `getByText` > `getByDisplayValue` > `getByTestId`。`container.querySelector` SHALL NOT 出现在任何测试文件中。

#### Scenario: 使用 ARIA 角色查询交互元素
- **WHEN** 测试需要查找按钮、开关、输入框等交互元素
- **THEN** SHALL 优先使用 `getByRole` 配合 `name` 选项定位元素

#### Scenario: 使用 testId 查询无语义元素
- **WHEN** 目标元素没有合适的 ARIA 角色或可访问名称（如骨架屏装饰元素）
- **THEN** MAY 使用 `getByTestId`，但 SHALL NOT 使用 `container.querySelector('[data-testid=...]')`

### Requirement: ARIA 标准语义断言
组件的功能状态 SHALL 通过 ARIA 属性表达，测试 SHALL 通过 ARIA 属性断言验证状态。

#### Scenario: 选中状态断言
- **WHEN** 组件有"选中/未选中"语义状态（如聊天列表项）
- **THEN** 组件 SHALL 设置 `aria-selected="true"/"false"`
- **THEN** 测试 SHALL 使用 `toHaveAttribute('aria-selected', ...)` 断言

#### Scenario: 活跃导航状态断言
- **WHEN** 导航项表示当前所在页面
- **THEN** 组件 SHALL 设置 `aria-current="page"`
- **THEN** 测试 SHALL 使用 `toHaveAttribute('aria-current', 'page')` 断言

#### Scenario: 加载状态断言
- **WHEN** 组件显示加载指示器
- **THEN** 加载指示器 SHALL 具有 `role="status"` 属性
- **THEN** 测试 SHALL 使用 `getByRole('status')` 查询

#### Scenario: 错误状态断言
- **WHEN** 组件显示错误信息
- **THEN** 错误容器 SHALL 具有 `role="alert"` 属性
- **THEN** 测试 SHALL 使用 `getByRole('alert')` 查询

#### Scenario: 展开折叠状态断言
- **WHEN** 组件有可展开/折叠的内容区域
- **THEN** 触发器 SHALL 设置 `aria-expanded="true"/"false"`
- **THEN** 测试 SHALL 使用 `toHaveAttribute('aria-expanded', ...)` 断言

### Requirement: data-variant 自定义语义断言
ARIA 标准未覆盖的组件展示变体 SHALL 通过 `data-variant` 属性表达，测试 SHALL 通过该属性断言。

#### Scenario: 尺寸变体断言
- **WHEN** 组件有多种尺寸模式（如默认尺寸和紧凑尺寸）
- **THEN** 组件最外层容器 SHALL 设置 `data-variant` 属性，值为小写英文形容词（如 `"default"`、`"compact"`）
- **THEN** 测试 SHALL 使用 `toHaveAttribute('data-variant', '...')` 断言

#### Scenario: data-variant 命名约束
- **WHEN** 为组件定义 data-variant 值
- **THEN** 值 SHALL 描述功能意图而非 CSS 实现（`"compact"` 而非 `"py-1-text-xs"`）
- **THEN** 值 SHALL 为有限集合，使用 TypeScript 联合类型约束

#### Scenario: 多维变体表达
- **WHEN** 组件同时有多种独立的展示维度
- **THEN** SHALL 使用多个 `data-*` 属性分别表达（如 `data-variant="compact" data-density="comfortable"`）
- **THEN** SHALL NOT 将多个维度塞入单个属性值

### Requirement: 纯装饰样式不测试
不表达功能状态或展示模式意图的 CSS 类名 SHALL NOT 出现在测试断言中。

#### Scenario: 布局装饰类名排除
- **WHEN** CSS 类名仅为布局实现（如 `flex`、`items-center`、`border-t`、`overflow-y-auto`）
- **THEN** 测试 SHALL NOT 断言这些类名

#### Scenario: 交互反馈类名排除
- **WHEN** CSS 类名仅为交互反馈（如 `hover:*`、`focus:*`、`transition-*`）
- **THEN** 测试 SHALL NOT 断言这些类名

#### Scenario: className 透传测试例外
- **WHEN** 测试验证组件的 `className` prop 是否正确透传到 DOM 元素
- **THEN** MAY 使用 `toHaveClass` 断言传入的自定义类名

### Requirement: 禁止 container.querySelector
测试文件 SHALL NOT 使用 `container.querySelector` 或 `container.querySelectorAll`。

#### Scenario: 用语义查询替代 querySelector
- **WHEN** 需要查找特定 DOM 元素
- **THEN** SHALL 使用 `screen.getByRole`、`screen.getByText`、`screen.getByTestId` 等 Testing Library 语义查询 API
- **THEN** SHALL NOT 使用 `container.querySelector`
