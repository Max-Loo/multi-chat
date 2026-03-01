## ADDED Requirements

### Requirement: 秒级时间戳生成
系统 SHALL 提供 `getCurrentTimestamp()` 函数，该函数返回当前时间的 Unix 时间戳（秒级精度）。

#### Scenario: 成功获取秒级时间戳
- **WHEN** 调用 `getCurrentTimestamp()` 函数
- **THEN** 返回一个数字类型的 Unix 时间戳
- **AND** 时间戳为秒级精度（10 位数字，约 1700000000 范围）
- **AND** 时间戳表示从 1970-01-01 00:00:00 UTC 到当前时间的秒数
- **AND** 连续调用返回的时间戳 SHALL 单调递增

#### Scenario: 验证时间戳格式
- **WHEN** 调用 `getCurrentTimestamp()` 函数
- **THEN** 返回值 SHALL 为整数（不包含小数部分）
- **AND** 返回值 SHALL 大于等于 1700000000（2023 年之后的时间戳）
- **AND** 返回值 SHALL 小于 2000000000（2033 年之前的时间戳）

### Requirement: 毫秒级时间戳生成
系统 SHALL 提供 `getCurrentTimestampMs()` 函数，该函数返回当前时间的 Unix 时间戳（毫秒级精度）。

#### Scenario: 成功获取毫秒级时间戳
- **WHEN** 调用 `getCurrentTimestampMs()` 函数
- **THEN** 返回一个数字类型的 Unix 时间戳
- **AND** 时间戳为毫秒级精度（13 位数字，约 1700000000000 范围）
- **AND** 时间戳表示从 1970-01-01 00:00:00 UTC 到当前时间的毫秒数
- **AND** 连续调用返回的时间戳 SHALL 单调递增

#### Scenario: 验证毫秒级时间戳格式
- **WHEN** 调用 `getCurrentTimestampMs()` 函数
- **THEN** 返回值 SHALL 为整数（不包含小数部分）
- **AND** 返回值 SHALL 大于等于 1700000000000（2023 年之后的毫秒时间戳）
- **AND** 返回值 SHALL 小于 2000000000000（2033 年之后的毫秒时间戳）

### Requirement: 时间戳工具函数的可导出性
系统 SHALL 在 `src/utils/utils.ts` 模块中导出时间戳生成函数，使其可在项目任何地方导入使用。

#### Scenario: 从 utils.ts 导入秒级时间戳函数
- **WHEN** 代码中使用 `import { getCurrentTimestamp } from '@/utils/utils'`
- **THEN** 导入 SHALL 成功，不抛出模块未找到错误
- **AND** 导入的函数 SHALL 可正常调用并返回正确的时间戳

#### Scenario: 从 utils.ts 导入毫秒级时间戳函数
- **WHEN** 代码中使用 `import { getCurrentTimestampMs } from '@/utils/utils'`
- **THEN** 导入 SHALL 成功，不抛出模块未找到错误
- **AND** 导入的函数 SHALL 可正常调用并返回正确的时间戳

### Requirement: 时间戳函数的文档注释
系统 SHALL 为每个时间戳函数提供完整的 JSDoc 注释，说明函数用途、返回值类型和单位。

#### Scenario: 秒级时间戳函数的文档
- **WHEN** 查看 `getCurrentTimestamp` 函数的源代码
- **THEN** 函数 SHALL 包含 JSDoc 注释块
- **AND** 注释 SHALL 说明函数返回秒级 Unix 时间戳
- **AND** 注释 SHALL 包含 `@returns` 标签说明返回值类型为 `number`

#### Scenario: 毫秒级时间戳函数的文档
- **WHEN** 查看 `getCurrentTimestampMs` 函数的源代码
- **THEN** 函数 SHALL 包含 JSDoc 注释块
- **AND** 注释 SHALL 说明函数返回毫秒级 Unix 时间戳
- **AND** 注释 SHALL 包含 `@returns` 标签说明返回值类型为 `number`

### Requirement: 聊天消息时间戳一致性
系统 SHALL 确保聊天消息（`StandardMessage`）中的 `timestamp` 字段使用秒级 Unix 时间戳。

#### Scenario: 聊天服务使用秒级时间戳
- **WHEN** `chatService.ts` 生成新的消息对象
- **THEN** 消息的 `timestamp` 字段 SHALL 使用 `getCurrentTimestamp()` 函数生成
- **AND** `timestamp` 值 SHALL 为秒级精度（而非毫秒级）

#### Scenario: 聊天状态管理使用秒级时间戳
- **WHEN** `chatSlices.ts` 创建新的消息状态
- **THEN** 消息的 `timestamp` 字段 SHALL 使用 `getCurrentTimestamp()` 函数生成
- **AND** `timestamp` 值 SHALL 为秒级精度（而非直接使用 `Date.now() / 1000`）
