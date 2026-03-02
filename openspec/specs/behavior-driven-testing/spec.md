# Spec: 行为驱动测试实践

## Purpose

定义行为驱动测试（BDD）的最佳实践，确保测试关注用户可见行为而非内部实现细节，提高测试的稳定性和可维护性。

## Requirements

### Requirement: 测试必须关注用户可见行为

系统 SHALL 确保所有测试关注用户可见行为，而非内部实现细节。

**原则**：
- 测试应该模拟真实用户操作（点击、输入、导航）
- 测试应该验证用户可见结果（UI 渲染、数据展示、用户体验）
- 测试应该在重构时保持稳定，不因内部实现变化而失败

#### Scenario: 组件测试测试用户交互而非内部实现
- **WHEN** 编写组件测试时
- **THEN** 测试 SHALL 模拟用户交互（如点击按钮、输入文本）
- **AND** 测试 SHALL 验证可见结果（如文本内容、UI 状态）
- **AND** 测试 SHALL NOT Mock 子组件
- **AND** 测试 SHALL NOT 测试内部方法调用

#### Scenario: Hooks 测试测试行为结果而非内部实现
- **WHEN** 编写 Hooks 测试时
- **THEN** 测试 SHALL 验证 Hook 返回值的行为
- **AND** 测试 SHALL NOT 测试内部函数调用（如 `clearTimeout` 调用次数）
- **AND** 测试 SHALL NOT 测试内部状态管理细节

#### Scenario: Redux 测试测试完整行为而非状态转换
- **WHEN** 编写 Redux 测试时
- **THEN** 测试 SHALL 验证用户可见的最终状态
- **AND** 测试 SHALL NOT 测试中间状态转换（如 `pending` → `fulfilled`）
- **AND** 测试 SHALL 更多依赖集成测试验证 Redux 行为

### Requirement: 测试在重构时保持稳定

系统 SHALL 确保测试在代码重构时保持稳定，不因内部实现变化而失败。

**判断标准**：
- 如果重命名函数、移动文件、改变内部实现，测试是否仍然通过？
- 如果答案是"否"，则测试可能过度关注实现细节

#### Scenario: 组件重构不导致测试失败
- **WHEN** 重构组件内部实现（如拆分组件、提取逻辑）
- **THEN** 测试 SHALL 继续通过
- **AND** 测试 SHALL NOT 需要修改

#### Scenario: 工具函数重构不导致测试失败
- **WHEN** 重构工具函数内部实现（如改变算法）
- **THEN** 测试 SHALL 继续通过
- **AND** 测试 SHALL NOT 需要修改

### Requirement: 测试命名清晰描述行为

系统 SHALL 确保所有测试用例使用统一的命名规范，清晰描述被测试的行为。

**命名规范**：
- 格式："应该 [预期行为] 当 [条件]"
- 使用中文描述
- 预期行为：用户可见的结果
- 条件：触发行为的条件

#### Scenario: 组件测试命名示例
- **WHEN** 编写组件测试时
- **THEN** 测试名称 SHALL 使用规范格式
- **示例**："应该渲染错误消息 当 API 请求失败"

#### Scenario: Hooks 测试命名示例
- **WHEN** 编写 Hooks 测试时
- **THEN** 测试名称 SHALL 使用规范格式
- **示例**："应该延迟更新值 当输入值变化"

#### Scenario: 集成测试命名示例
- **WHEN** 编写集成测试时
- **THEN** 测试名称 SHALL 使用规范格式
- **示例**："应该完成完整聊天流程 当用户发送消息"

### Requirement: 测试目录结构按功能组织

系统 SHALL 确保测试目录结构按功能/行为组织，而非机械照搬源代码结构。

**目录结构原则**：
- 按功能领域组织（如 `chat-management.test.ts`）
- 按用户场景组织（如 `user-authentication.test.ts`）
- 简单组件/工具可保留按文件组织

#### Scenario: 功能测试文件命名
- **WHEN** 创建功能测试时
- **THEN** 测试文件名 SHALL 反映功能领域
- **示例**: `chat-management.test.ts`、`model-management.test.ts`

#### Scenario: 组件测试文件命名
- **WHEN** 组件足够简单（如 `Button`）
- **THEN** 测试文件名 CAN 按组件命名
- **示例**: `Button.test.tsx`

#### Scenario: 避免机械照搬源代码结构
- **WHEN** 组织测试文件时
- **THEN** 测试目录结构 SHALL NOT 机械照搬 `src/` 目录
- **AND** 测试 SHALL 按功能组织，而非文件结构
