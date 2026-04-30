## ADDED Requirements

### Requirement: NoCoverage 路径测试覆盖

chatSlices.ts 中以下 4 个代码路径必须有独立测试覆盖：

1. **`initializeChatList` fulfilled 中的 filter 逻辑（L64）**：`index.filter(meta => !meta.isDeleted)` 必须验证过滤后的列表不包含 `isDeleted: true` 的条目，且保留未删除的条目
2. **`setSelectedChatIdWithPreload` 内部预加载逻辑（L168-L197）**：chatModelList 非空时的模型查找（`models.find`）、providerKey 提取、预加载调用路径必须有测试覆盖。注意：这些代码在 async thunk 函数体内，测试需要通过完整执行 async thunk（配合 mock 使其走到 L168+）来覆盖，而非仅 dispatch fulfilled action
3. **pushRunningChatHistory reducer（L473-L485）**：直接 dispatch `pushRunningChatHistory` action 后，必须验证 `state.runningChat[chat.id][model.id].history` 被正确设置
4. **setChatMetaList（L349-L351）**：dispatch `setChatMetaList` action 后，必须验证 `state.chatMetaList` 被替换为 action.payload 的浅拷贝

### Requirement: 条件表达式反向路径验证

对于每个条件表达式存活变异，必须补充反向路径测试：

1. **布尔取反检测**：对于 `if (!X)` 形式的条件，必须同时测试 X 为 truthy 和 falsy 两种路径，并验证 state 在两条路径下的精确值
2. **比较运算符检测**：对于 `===`、`!==`、`>`、`<` 等比较运算符，测试数据必须覆盖边界值（如 `length === 0` 和 `length === 1`、`metaIdx === -1` 和 `metaIdx >= 0`）
3. **逻辑运算符检测**：对于 `&&`、`||` 复合条件（如 L274 `isNotNil(model) && !model.isDeleted && model.isEnable`），必须分别测试每个子条件为 false 时的短路行为

### Requirement: State 断言精确化

所有涉及 state 变更的断言必须满足以下规范：

1. **禁止仅使用 `toBeDefined`**：对于 state 中的对象值，必须断言其关键属性而非仅验证存在性
2. **禁止仅使用 `toMatchObject` 验证完整对象**：当 ObjectLiteral 变异（替换为 `{}`）存活时，应改用 `toEqual` 并逐字段验证
3. **动态值处理**：对于时间戳等动态生成的值，使用 `expect.any(Number)` 匹配器
4. **字段完整性**：验证 `chatMetaList` 中元素时，必须检查 `id`、`name`、`updatedAt` 等关键属性，而非仅检查数组长度

### Requirement: 变异得分目标

补充测试后，`pnpm test:mutation` 运行结果中 chatSlices.ts 的变异得分必须达到 **75% 或以上**。
