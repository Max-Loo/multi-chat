## ADDED Requirements

### Requirement: chatExport 服务层单元测试覆盖
系统 SHALL 对 `src/services/chatExport.ts` 的所有导出函数提供完整的单元测试覆盖。

#### Scenario: loadAllChats 正常加载所有聊天
- **WHEN** `loadChatIndex` 返回多条聊天索引
- **AND** `loadChatById` 对每条索引均返回有效 Chat 对象
- **THEN** `loadAllChats` SHALL 返回包含所有 Chat 对象的数组

#### Scenario: loadAllChats 跳过加载失败的聊天
- **WHEN** `loadChatIndex` 返回多条聊天索引
- **AND** `loadChatById` 对其中一条返回 `undefined`
- **THEN** `loadAllChats` SHALL 仅返回成功加载的 Chat 对象，跳过 `undefined` 结果

#### Scenario: loadAllChats 索引为空
- **WHEN** `loadChatIndex` 返回空数组
- **THEN** `loadAllChats` SHALL 返回空数组

#### Scenario: exportAllChats 仅导出活跃聊天
- **WHEN** 存储中包含活跃聊天和已删除聊天（`isDeleted: true`）
- **THEN** `exportAllChats` SHALL 仅返回 `isDeleted` 不为 `true` 的聊天
- **AND** 返回数据的 `chats` 字段 SHALL 不包含已删除聊天

#### Scenario: exportAllChats 全部为活跃聊天
- **WHEN** 存储中所有聊天均未标记删除
- **THEN** `exportAllChats` SHALL 返回全部聊天

#### Scenario: exportAllChats 全部为已删除聊天
- **WHEN** 存储中所有聊天均标记 `isDeleted: true`
- **THEN** `exportAllChats` SHALL 返回空的 `chats` 数组

#### Scenario: exportAllChats 空存储
- **WHEN** 存储中无任何聊天数据
- **THEN** `exportAllChats` SHALL 返回 `{ chats: [], exportedAt: <ISO string>, version: <string> }`

#### Scenario: exportDeletedChats 仅导出已删除聊天
- **WHEN** 存储中包含活跃聊天和已删除聊天
- **THEN** `exportDeletedChats` SHALL 仅返回 `isDeleted === true` 的聊天

#### Scenario: exportDeletedChats 无已删除聊天
- **WHEN** 存储中无 `isDeleted` 为 `true` 的聊天
- **THEN** `exportDeletedChats` SHALL 返回空的 `chats` 数组

#### Scenario: 导出数据格式校验
- **WHEN** 任一导出函数成功执行
- **THEN** 返回数据 SHALL 包含 `exportedAt` 字段且为 ISO 8601 格式
- **AND** 返回数据 SHALL 包含 `version` 字段且为非空字符串
- **AND** 返回数据 SHALL 包含 `chats` 字段且为数组

## MODIFIED Requirements

（无修改，已有 spec 保持不变）
