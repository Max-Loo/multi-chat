# title-generator-testing Specification

## Purpose
定义 titleGenerator 模块的测试覆盖要求，包括 buildTitlePrompt 纯函数和 generateChatTitleService 的单元测试。

## Requirements

### Requirement: buildTitlePrompt 纯函数
系统 SHALL 导出 `buildTitlePrompt(messages: StandardMessage[]): string` 纯函数，从最后两条消息中提取用户消息和助手消息，构建标题生成 prompt。

#### Scenario: 标准双消息输入
- **WHEN** 传入包含一条用户消息和一条助手消息的数组
- **THEN** 返回包含对话内容的 prompt 字符串
- **AND** prompt 包含用户消息内容和助手消息内容

#### Scenario: 仅一条消息
- **WHEN** 传入仅包含一条用户消息的数组
- **THEN** 返回 prompt，其中助手消息部分为空字符串

#### Scenario: 空消息数组
- **WHEN** 传入空数组
- **THEN** 返回 prompt，其中用户和助手消息部分均为空字符串

#### Scenario: 多条消息取最后两条
- **WHEN** 传入包含 5 条消息的数组
- **THEN** prompt 从 `slice(-2)` 的范围内提取用户消息和助手消息

---

### Requirement: generateChatTitleService 单元测试覆盖
系统 MUST 为 `generateChatTitleService` 提供完整的单元测试，通过 `vi.mock` 拦截 `ai` 和 `providerFactory` 模块实现隔离，覆盖以下场景：

#### Scenario: 正常标题生成
- **WHEN** `vi.mocked(generateText)` 返回有效文本
- **THEN** 函数返回经过后处理的标题（去标点 + 截取）
- **AND** 标题长度不超过 10 个字符

#### Scenario: provider 初始化失败
- **WHEN** `vi.mocked(getProvider).mockRejectedValue()` 抛出错误
- **THEN** 函数抛出错误
- **AND** 错误信息包含失败原因

#### Scenario: generateText 返回空文本
- **WHEN** `vi.mocked(generateText)` 返回空字符串
- **THEN** 函数抛出 "Generated title is empty" 错误

#### Scenario: generateText 返回纯标点文本
- **WHEN** `vi.mocked(generateText)` 返回 "！！！。。。"
- **THEN** 经过 `removePunctuation` 处理后为空
- **AND** 函数抛出 "Generated title is empty" 错误

#### Scenario: generateText 返回超长文本
- **WHEN** `vi.mocked(generateText)` 返回 20 个汉字
- **THEN** 函数截取前 10 个字符返回

---

### Requirement: 测试覆盖率目标
完成所有测试后，`titleGenerator.ts` 的语句覆盖率 MUST 达到 80% 以上。

#### Scenario: 覆盖率验证
- **WHEN** 运行 `vitest run --coverage` 命令
- **THEN** `src/services/chat/titleGenerator.ts` 的 Stmts 覆盖率 ≥ 80%
- **AND** Branch 覆盖率 ≥ 70%
