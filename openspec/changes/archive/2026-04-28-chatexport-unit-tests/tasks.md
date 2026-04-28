## 1. 测试基础设施

- [x] 1.1 创建测试文件 `src/__test__/services/lib/chatExport.test.ts`，配置 Mock 依赖（`chatStorage`、`package.json` version）
- [x] 1.2 编写 `createMockChatMeta` 和 `createMockChat` 测试数据工厂函数

## 2. loadAllChats 测试

- [x] 2.1 测试正常加载：索引返回多条，`loadChatById` 均返回有效对象，验证返回全部 Chat
- [x] 2.2 测试跳过失败：部分 `loadChatById` 返回 `undefined`，验证仅返回成功的
- [x] 2.3 测试空索引：`loadChatIndex` 返回空数组，验证返回空数组

## 3. exportAllChats 测试

- [x] 3.1 测试过滤已删除：混合数据中仅返回 `isDeleted` 不为 `true` 的聊天
- [x] 3.2 测试全部活跃：所有聊天均未删除，验证返回全部
- [x] 3.3 测试全部已删除：所有聊天均标记删除，验证返回空 `chats` 数组
- [x] 3.4 测试空存储：无聊天数据，验证返回 `{ chats: [], exportedAt, version }`

## 4. exportDeletedChats 测试

- [x] 4.1 测试仅返回已删除：混合数据中仅返回 `isDeleted === true` 的聊天
- [x] 4.2 测试无已删除聊天：验证返回空 `chats` 数组

## 5. 导出格式校验

- [x] 5.1 测试返回数据格式：验证 `exportedAt` 为 ISO 8601、`version` 为非空字符串、`chats` 为数组
