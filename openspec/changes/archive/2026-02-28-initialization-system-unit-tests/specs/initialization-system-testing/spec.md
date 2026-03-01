# 初始化系统测试规格

本规格定义了初始化系统（InitializationManager）的测试需求，确保核心功能、边界条件和错误处理机制都经过充分验证。

## ADDED Requirements

### Requirement: InitializationManager 核心功能测试

系统必须提供 InitializationManager 的完整单元测试覆盖，验证初始化流程的核心功能。

#### Scenario: 成功执行所有步骤

- **WHEN** 所有初始化步骤配置正确且无错误
- **THEN** 系统必须按拓扑排序顺序执行所有步骤
- **AND** `result.success` 必须为 `true`
- **AND** `result.completedSteps` 必须包含所有步骤名称
- **AND** `result.fatalErrors` 必须为空数组

#### Scenario: 并行执行无依赖步骤

- **WHEN** 多个步骤之间无依赖关系
- **THEN** 系统必须并行执行这些步骤
- **AND** 所有步骤必须在同一执行批次中完成

#### Scenario: 进度回调正确触发

- **WHEN** 初始化过程中提供 `onProgress` 回调
- **THEN** 每个步骤完成后必须调用回调
- **AND** 回调必须传入当前步骤索引、总步骤数和当前步骤名称

### Requirement: ExecutionContext 数据管理测试

系统必须验证 ExecutionContext 的数据存储和检索功能。

#### Scenario: 存储和检索步骤结果

- **WHEN** 步骤通过 `context.setResult(name, value)` 存储结果
- **THEN** `context.getResult<T>(name)` 必须返回相同的值
- **AND** 返回值类型必须与存储时一致

#### Scenario: 跟踪步骤执行状态

- **WHEN** 步骤成功执行完成
- **THEN** `context.isSuccess(name)` 必须返回 `true`
- **AND** 未执行的步骤必须返回 `false`

#### Scenario: 检索不存在的步骤结果

- **WHEN** 调用 `context.getResult(name)` 且该步骤未设置结果
- **THEN** 必须返回 `undefined`

### Requirement: 拓扑排序算法测试

系统必须验证拓扑排序算法的正确性，确保步骤按依赖关系顺序执行。

#### Scenario: 无依赖步骤独立执行

- **WHEN** 多个步骤之间无任何依赖关系
- **THEN** 这些步骤必须在第一批次中并行执行
- **AND** 执行顺序可以任意

#### Scenario: 单层依赖顺序执行

- **WHEN** 步骤 B 依赖步骤 A
- **THEN** 步骤 A 必须在步骤 B 之前执行
- **AND** 执行顺序必须为 [A, B]

#### Scenario: 复杂依赖图正确排序

- **WHEN** 步骤间存在复杂依赖关系（如 A→B, A→C, B→D, C→D）
- **THEN** 系统必须正确计算执行顺序
- **AND** 每个步骤的所有依赖都必须在该步骤之前执行

### Requirement: 依赖验证测试

系统必须验证依赖关系的完整性，确保所有依赖的步骤都存在。

#### Scenario: 依赖不存在的步骤

- **WHEN** 步骤声明依赖一个不存在的步骤名称
- **THEN** 系统必须抛出错误
- **AND** 错误信息必须包含"依赖的步骤不存在"和具体的步骤名称

#### Scenario: 依赖自身（自依赖）

- **WHEN** 步骤的 `dependencies` 数组包含其自身名称
- **THEN** 系统必须拒绝该配置
- **AND** 必须抛出明确的错误信息

### Requirement: 循环依赖检测测试

系统必须检测并拒绝存在循环依赖的步骤配置。

#### Scenario: 简单循环依赖

- **WHEN** 步骤 A 依赖步骤 B，且步骤 B 依赖步骤 A（A→B→A）
- **THEN** 系统必须检测到循环依赖
- **AND** 必须抛出错误说明形成循环的步骤

#### Scenario: 复杂循环依赖

- **WHEN** 步骤形成复杂循环（A→B→C→A）
- **THEN** 系统必须检测到循环依赖
- **AND** 错误信息必须列出循环路径中的所有步骤

#### Scenario: 跨层循环依赖

- **WHEN** 多个步骤通过多层依赖形成循环（A→B→C→D→A）
- **THEN** 系统必须检测到循环依赖
- **AND** 初始化流程不得进入死循环

### Requirement: 错误处理机制测试

系统必须验证三级错误处理机制的正确性。

#### Scenario: 致命错误中断初始化

- **WHEN** 关键步骤（`critical: true`）执行失败且返回 `severity: 'fatal'`
- **THEN** 系统必须立即停止初始化
- **AND** `result.success` 必须为 `false`
- **AND** 错误必须添加到 `result.fatalErrors` 数组

#### Scenario: 警告错误继续执行

- **WHEN** 非关键步骤执行失败且返回 `severity: 'warning'`
- **THEN** 系统必须继续执行后续步骤
- **AND** 错误必须添加到 `result.warnings` 数组
- **AND** `result.success` 仍然为 `true`（如果无致命错误）

#### Scenario: 可忽略错误静默处理

- **WHEN** 步骤执行失败且返回 `severity: 'ignorable'`
- **THEN** 系统必须继续执行且不显示 UI 提示
- **AND** 错误必须添加到 `result.ignorableErrors` 数组
- **AND** 错误信息必须输出到控制台

#### Scenario: 多个错误分类处理

- **WHEN** 初始化过程中同时出现致命错误、警告错误和可忽略错误
- **THEN** 系统必须正确分类所有错误
- **AND** 致命错误必须中断初始化
- **AND** 警告和可忽略错误必须记录在对应数组中

### Requirement: initSteps 配置验证测试

系统必须验证 `initSteps.ts` 配置文件的结构正确性。

#### Scenario: 步骤名称唯一性

- **WHEN** 加载 `initSteps` 配置
- **THEN** 所有步骤的 `name` 字段必须唯一
- **AND** 不得存在重复的步骤名称

#### Scenario: 必要字段完整性

- **WHEN** 检查每个步骤配置
- **THEN** 每个步骤必须包含 `name`、`critical`、`execute`、`onError` 字段
- **AND** `name` 必须为非空字符串
- **AND** `critical` 必须为布尔值
- **AND** `execute` 和 `onError` 必须为函数

#### Scenario: 错误严重程度有效性

- **WHEN** 调用步骤的 `onError` 回调
- **THEN** 返回的 `severity` 必须为 `'fatal'`、`'warning'` 或 `'ignorable'` 之一
- **AND** 必须包含 `message` 字段

#### Scenario: 依赖存在性验证

- **WHEN** 步骤声明 `dependencies` 数组
- **THEN** 数组中的每个依赖名称必须在其他步骤的 `name` 字段中存在
- **AND** 不得引用不存在的步骤

### Requirement: 集成测试增强

系统必须使用真实的 `initSteps` 配置进行端到端测试。

#### Scenario: 使用真实配置执行初始化

- **WHEN** 使用 `initSteps` 配置执行初始化（mock 执行函数）
- **THEN** 所有步骤必须按正确依赖顺序执行
- **AND** `result.completedSteps` 长度必须等于 `initSteps.length`

#### Scenario: 真实配置的依赖关系解析

- **WHEN** 执行 `initSteps` 配置
- **THEN** `masterKey` 步骤必须在 `models` 步骤之前执行
- **AND** `i18n` 步骤必须在 `appLanguage` 步骤之前执行

### Requirement: FatalErrorScreen UI 组件测试

系统必须验证 FatalErrorScreen 组件的功能和交互。

#### Scenario: 渲染单个错误

- **WHEN** 组件接收包含一个错误的 `errors` 属性
- **THEN** 必须显示错误消息
- **AND** 必须显示刷新按钮
- **AND** 必须使用正确的国际化文本

#### Scenario: 渲染多个错误

- **WHEN** 组件接收包含多个错误的 `errors` 数组
- **THEN** 必须为每个错误渲染独立的 `<Alert>` 组件
- **AND** 所有错误必须同时显示

#### Scenario: 刷新按钮交互

- **WHEN** 用户点击刷新按钮
- **THEN** 必须调用 `window.location.reload()`
- **AND** 在测试中必须 mock 此函数

#### Scenario: DEV 模式显示错误详情

- **WHEN** `import.meta.env.DEV` 为 `true` 且错误包含 `originalError`
- **THEN** 必须显示可展开的 `<details>` 元素
- **AND** 展开时必须显示错误堆栈或序列化后的错误对象

#### Scenario: 生产环境不显示错误详情

- **WHEN** `import.meta.env.DEV` 为 `false`
- **THEN** 不得显示错误详情部分
- **AND** 用户只能看到错误消息

### Requirement: 测试覆盖率目标

系统必须达到指定的测试覆盖率标准。

#### Scenario: InitializationManager 覆盖率

- **WHEN** 运行所有 InitializationManager 测试
- **THEN** 代码覆盖率必须达到 80% 以上
- **AND** 必须覆盖所有核心方法（runInitialization、validateDependencies、detectCircularDependencies、topologicalSort）

#### Scenario: initSteps 配置覆盖率

- **WHEN** 运行配置验证测试
- **THEN** 配置文件覆盖率必须达到 70% 以上
- **AND** 必须验证所有配置规则

#### Scenario: FatalErrorScreen 覆盖率

- **WHEN** 运行 UI 组件测试
- **THEN** 组件覆盖率必须达到 75% 以上
- **AND** 必须覆盖所有交互场景
