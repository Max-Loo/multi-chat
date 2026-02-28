# 规格文档：初始化管理系统

## ADDED Requirements

### Requirement: 初始化步骤定义

系统 MUST 提供统一的初始化步骤定义接口，允许开发者声明式地配置初始化逻辑。

初始化步骤定义 SHALL 包含以下属性：
- `name`: 步骤的唯一标识符（字符串）
- `critical`: 是否为关键步骤（布尔值）
- `execute`: 执行函数，接收 ExecutionContext 并返回 Promise
- `dependencies`: （可选）依赖的步骤名称列表
- `onError`: （可选）错误处理函数

#### Scenario: 定义基础初始化步骤
- **WHEN** 开发者定义一个初始化步骤
- **THEN** 该步骤 MUST 包含 `name`、`critical` 和 `execute` 属性
- **AND** `execute` 函数 MUST 接收 `ExecutionContext` 作为参数
- **AND** `execute` 函数 MUST 返回 Promise

#### Scenario: 定义带依赖的初始化步骤
- **WHEN** 开发者定义一个依赖其他步骤的初始化步骤
- **THEN** 该步骤 MUST 包含 `dependencies` 数组
- **AND** `dependencies` 数组中的每个元素 MUST 是已存在的步骤名称

---

### Requirement: 执行上下文管理

系统 MUST 提供 `ExecutionContext` 接口，用于在初始化步骤之间传递数据。

`ExecutionContext` SHALL 提供以下方法：
- `setResult(name: string, value: unknown): void` - 存储步骤执行结果
- `getResult<T>(name: string): T | undefined` - 获取已执行步骤的结果
- `isSuccess(name: string): boolean` - 检查某个步骤是否成功执行

#### Scenario: 存储步骤执行结果
- **WHEN** 初始化步骤成功执行
- **THEN** 该步骤 MUST 能够将执行结果存入 ExecutionContext
- **AND** 后续步骤 MUST 能够通过 `getResult()` 获取该结果

#### Scenario: 获取依赖步骤的结果
- **WHEN** 步骤 A 依赖步骤 B
- **AND** 步骤 B 已成功执行
- **THEN** 步骤 A MUST 能够通过 `getResult('B')` 获取步骤 B 的执行结果
- **AND** 返回值类型 MUST 与步骤 B 的存储类型一致

#### Scenario: 检查步骤执行状态
- **WHEN** 步骤需要检查某个依赖是否成功执行
- **THEN** 该步骤 MUST 能够调用 `isSuccess(name)` 方法
- **AND** 如果该步骤已成功执行，MUST 返回 `true`
- **AND** 如果该步骤未执行或执行失败，MUST 返回 `false`

---

### Requirement: 依赖关系管理

系统 MUST 支持初始化步骤之间的依赖关系声明，并自动优化执行顺序。

系统 MUST 验证依赖关系的有效性：
- 检查依赖的步骤是否存在
- 检测循环依赖
- 根据依赖关系进行拓扑排序

#### Scenario: 无依赖步骤并行执行
- **WHEN** 多个初始化步骤之间没有依赖关系
- **THEN** 这些步骤 MUST 能够并行执行
- **AND** 执行顺序 SHOULD 遵循它们在配置中的顺序

#### Scenario: 依赖步骤串行执行
- **WHEN** 步骤 A 声明依赖步骤 B
- **THEN** 步骤 B MUST 在步骤 A 之前执行
- **AND** 步骤 A MUST 等待步骤 B 成功完成后才开始执行

#### Scenario: 复杂依赖关系优化
- **WHEN** 步骤 C 依赖步骤 A，步骤 D 依赖步骤 B
- **AND** 步骤 A 和 B 之间没有依赖关系
- **THEN** 步骤 A 和 B MUST 能够并行执行
- **AND** 步骤 C 和 D MUST 在它们的依赖完成后执行

#### Scenario: 检测循环依赖
- **WHEN** 步骤之间形成循环依赖（A → B → C → A）
- **THEN** 系统 MUST 抛出错误
- **AND** 错误信息 MUST 明确指出哪些步骤形成了循环
- **AND** 应用初始化 MUST 终止

#### Scenario: 依赖不存在的步骤
- **WHEN** 步骤声明依赖一个不存在的步骤
- **THEN** 系统 MUST 抛出错误
- **AND** 错误信息 MUST 明确指出哪个依赖不存在
- **AND** 应用初始化 MUST 终止

---

### Requirement: 初始化流程管理

系统 MUST 提供 `InitializationManager` 类来统一管理初始化流程。

`InitializationManager` MUST 提供 `runInitialization(config)` 方法：
- 接收初始化配置（包含步骤列表）
- 根据依赖关系优化执行顺序
- 按顺序执行所有初始化步骤
- 返回初始化结果（成功/失败、错误列表等）

#### Scenario: 成功完成初始化
- **WHEN** 所有初始化步骤成功执行
- **THEN** `runInitialization()` MUST 返回成功结果
- **AND** 结果 MUST 包含 `success: true`
- **AND** 错误列表 MUST 为空

#### Scenario: 关键步骤失败导致初始化终止
- **WHEN** 某个关键步骤（`critical: true`）执行失败
- **THEN** 系统 MUST 停止执行后续步骤
- **AND** `runInitialization()` MUST 返回失败结果
- **AND** 结果 MUST 包含该步骤的错误信息
- **AND** 后续步骤 MUST 不被执行

#### Scenario: 非关键步骤失败不影响初始化成功
- **WHEN** 某个非关键步骤（`critical: false`）执行失败
- **THEN** 系统 MUST 继续执行后续步骤
- **AND** `runInitialization()` MUST 返回成功结果
- **AND** 结果 MUST 包含该步骤的错误信息（在 warnings 或 ignorableErrors 中）

#### Scenario: 进度回调
- **WHEN** 初始化配置提供了 `onProgress` 回调函数
- **THEN** 系统 MUST 在每个步骤状态变化时调用该回调
- **AND** 回调参数 MUST 包含步骤名称和状态（pending/running/success/error）

---

### Requirement: Redux Thunk 集成

系统 MUST 支持 Redux Toolkit 的 Thunk 作为初始化步骤。

系统 MUST 提供 `.unwrap()` 方法来等待 Thunk 完成：
- 如果 Thunk 成功，返回 payload
- 如果 Thunk 失败，抛出错误

#### Scenario: 将 Thunk 作为初始化步骤
- **WHEN** 开发者将 Redux Thunk 作为初始化步骤
- **THEN** 步骤的 `execute` 函数 MUST 能够调用 `store.dispatch(thunk()).unwrap()`
- **AND** 如果 Thunk 成功，`unwrap()` MUST 返回 payload
- **AND** 如果 Thunk 失败，`unwrap()` MUST 抛出错误

#### Scenario: Thunk 错误被正确捕获
- **WHEN** Thunk 执行失败
- **AND** 步骤使用了 `.unwrap()` 方法
- **THEN** 错误 MUST 被抛出
- **AND** 错误 MUST 能够被 `InitializationManager` 捕获
- **AND** 错误信息 MUST 包含在初始化结果中

---

### Requirement: 初始化配置集中管理

系统 MUST 提供统一的配置文件来管理所有初始化步骤。

配置文件 MUST 能够：
- 导出所有初始化步骤的配置数组
- 支持添加、删除、修改步骤
- 清晰展示步骤之间的依赖关系

#### Scenario: 添加新的初始化步骤
- **WHEN** 开发者需要添加新的初始化逻辑
- **THEN** 开发者 MUST 只需在配置文件中添加新的步骤配置
- **AND** 不需要修改 `main.tsx` 或其他初始化逻辑

#### Scenario: 修改现有步骤
- **WHEN** 开发者需要修改某个初始化步骤的行为
- **THEN** 开发者 MUST 能够在配置文件中修改该步骤的配置
- **AND** 修改 MUST 不影响其他步骤

#### Scenario: 移除步骤
- **WHEN** 开发者需要移除某个初始化步骤
- **THEN** 开发者 MUST 能够从配置文件中删除该步骤的配置
- **AND** 如果其他步骤依赖该步骤，系统 MUST 报错

---

### Requirement: 向后兼容性

系统 MUST 保持与现有初始化函数的向后兼容性。

系统 MUST 确保：
- 现有的初始化函数（如 `initI18n`、`initializeMasterKey` 等）保持导出
- 现有的调用方式不被破坏
- 只有初始化流程使用新的调用方式

#### Scenario: 保留现有函数导出
- **WHEN** 重构后的应用运行
- **THEN** 所有现有的初始化函数 MUST 仍然可以被导入和使用
- **AND** 其他代码中的函数调用 MUST 不受影响

#### Scenario: 新旧调用方式共存
- **WHEN** 某个初始化函数同时在初始化流程和其他地方被调用
- **THEN** 两种调用方式 MUST 都能正常工作
- **AND** 不应该出现兼容性问题
