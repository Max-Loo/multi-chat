# Spec: 集成测试覆盖范围

## Purpose

定义集成测试的覆盖范围和最佳实践，确保核心用户流程和关键错误场景得到充分测试。

## Requirements

### Requirement: 核心用户流程必须有集成测试覆盖

系统 SHALL 为所有核心用户流程提供集成测试覆盖，确保端到端场景正确工作。

**核心用户流程定义**：
- 用户每天使用的主要功能
- 涉及多个模块/服务交互的场景
- 对业务价值至关重要的功能

**覆盖标准**：
- 每个核心流程至少有一个完整的集成测试
- 测试覆盖正常流程和关键错误场景
- 测试使用真实模块（Redux、存储层、组件）

#### Scenario: 聊天流程集成测试
- **WHEN** 用户发送聊天消息时
- **THEN** 集成测试 SHALL 验证完整流程：
  - 用户输入 → Redux 更新 → API 调用 → 流式响应 → UI 更新 → 持久化存储
- **AND** 测试 SHALL 使用真实 Redux store
- **AND** 测试 SHALL 使用真实存储层（IndexedDB）
- **AND** 测试 SHALL 仅 Mock 远程 API（使用 MSW）

#### Scenario: 模型管理流程集成测试
- **WHEN** 用户管理模型时
- **THEN** 集成测试 SHALL 验证完整流程：
  - 创建模型 → 编辑模型 → 删除模型 → 验证持久化
- **AND** 测试 SHALL 验证 UI 与 Redux 状态同步
- **AND** 测试 SHALL 验证存储层正确保存/加载数据

#### Scenario: 设置变更流程集成测试
- **WHEN** 用户修改设置时
- **THEN** 集成测试 SHALL 验证完整流程：
  - 修改语言 → 修改推理开关 → 验证持久化 → 刷新页面验证恢复
- **AND** 测试 SHALL 验证设置正确应用到 UI
- **AND** 测试 SHALL 验证设置正确持久化到存储

### Requirement: 集成测试必须覆盖关键错误场景

系统 SHALL 确保集成测试覆盖关键错误场景，验证系统的错误处理和恢复能力。

**关键错误场景**：
- API 失败（网络错误、超时、服务器错误）
- 数据损坏（无效数据、格式错误）
- 用户体验中断（页面刷新、导航切换）

#### Scenario: API 错误处理集成测试
- **WHEN** API 请求失败时
- **THEN** 集成测试 SHALL 验证：
  - 错误消息正确显示
  - UI 状态正确更新（loading → error）
  - 用户可以重试或取消

#### Scenario: 网络超时处理集成测试
- **WHEN** API 请求超时时
- **THEN** 集成测试 SHALL 验证：
  - 超时错误正确显示
  - 请求正确取消
  - 用户可以重新发起请求

#### Scenario: 数据恢复集成测试
- **WHEN** 存储数据损坏或丢失时
- **THEN** 集成测试 SHALL 验证：
  - 系统检测到数据异常
  - 提供恢复方案（如重置、重新加载）
  - 用户体验不崩溃

### Requirement: 集成测试使用真实实现

系统 SHALL 确保集成测试使用真实实现，仅 Mock 外部依赖。

**真实实现范围**：
- Redux store（actions、reducers、selectors）
- 存储层（IndexedDB、文件系统）
- 组件树（完整渲染，不 Mock 子组件）
- 服务层（除 API 调用外）

**Mock 范围**：
- 远程 API 调用（使用 MSW）
- 第三方服务（如支付网关）
- 浏览器 API（如 Geolocation）

#### Scenario: 集成测试使用真实 Redux
- **WHEN** 编写集成测试时
- **THEN** 测试 SHALL 使用真实 Redux store
- **AND** 测试 SHALL 通过 `dispatch` actions 测试状态变化
- **AND** 测试 SHALL NOT Mock Redux middleware

#### Scenario: 集成测试使用真实存储层
- **WHEN** 编写集成测试时
- **THEN** 测试 SHALL 使用真实存储层（IndexedDB）
- **AND** 测试 SHALL 在测试前清理存储
- **AND** 测试 SHALL 在测试后验证持久化

#### Scenario: 集成测试使用 MSW Mock API
- **WHEN** 集成测试需要 Mock API 时
- **THEN** 测试 SHALL 使用 MSW（Mock Service Worker）
- **AND** 测试 SHALL 在 beforeEach 中设置 handlers
- **AND** 测试 SHALL 在 afterEach 中关闭 server

### Requirement: 集成测试运行时间可接受

系统 SHALL 确保集成测试运行时间在可接受范围内（单次测试套件 < 2 分钟）。

**性能优化策略**：
- 使用并行测试执行（Vitest 默认）
- 重用测试 fixtures 和 setup
- 避免重复的初始化操作

#### Scenario: 集成测试运行时间监控
- **WHEN** 运行集成测试时
- **THEN** 测试套件 SHALL 在 2 分钟内完成
- **AND** 测试 SHALL 报告每个测试的运行时间
- **AND** 超过阈值的测试 SHALL 被标记并优化

#### Scenario: 集成测试并行执行
- **WHEN** 运行集成测试时
- **THEN** Vitest SHALL 并行执行独立测试
- **AND** 测试 SHALL 不依赖执行顺序

### Requirement: 集成测试与单元测试互补

系统 SHALL 确保集成测试与单元测试互补，避免重复测试同一行为。

**职责划分**：
- **单元测试**：测试独立函数/组件的内部逻辑（如复杂计算、数据转换）
- **集成测试**：测试模块间交互和完整用户流程

**避免重复**：
- 如果集成测试已覆盖行为，单元测试可删除或简化
- 保留关键单元测试（如性能关键路径、安全相关）

#### Scenario: 单元测试与集成测试不重复
- **WHEN** 编写测试时
- **THEN** 测试 SHALL 避免重复测试同一行为
- **AND** 如果集成测试覆盖，单元测试 SHALL 优先删除

#### Scenario: 保留关键单元测试
- **WHEN** 删除冗余单元测试时
- **THEN** 关键单元测试 SHALL 保留：
  - 性能关键路径（如加密算法）
  - 安全相关逻辑（如输入验证）
  - 复杂计算（如数据处理）

### Requirement: 集成测试文档化用户场景

系统 SHALL 确保集成测试作为可执行的文档，清晰描述用户使用场景。

**文档化原则**：
- 测试文件名反映用户场景（如 `chat-flow.test.ts`）
- 测试用例描述用户行为（如"用户发送消息并接收响应"）
- 测试注释解释业务逻辑

#### Scenario: 集成测试文件命名反映用户场景
- **WHEN** 创建集成测试文件时
- **THEN** 文件名 SHALL 反映用户场景
- **示例**: `chat-flow.test.ts`、`model-management.test.ts`、`settings-change.test.ts`

#### Scenario: 集成测试用例描述用户行为
- **WHEN** 编写集成测试时
- **THEN** 测试用例 SHALL 描述用户行为
- **示例**: "应该完成聊天流程 当用户发送消息"

#### Scenario: 集成测试包含业务逻辑注释
- **WHEN** 测试复杂业务逻辑时
- **THEN** 测试 SHALL 包含注释解释业务逻辑
- **AND** 注释 SHALL 帮助新开发者理解系统行为
