## Tasks

### Task 1: 补充 NoCoverage 路径测试 — initializeChatList fulfilled filter 逻辑
- **文件**: `src/__test__/store/slices/chatSlices.test.ts`
- **目标**: 杀死变异体 #51 #52 #53（L64 filter 逻辑）
- **操作**: 新增 `describe('initializeChatList fulfilled - 过滤已删除聊天')` 测试块
  - 测试用例：dispatch `initializeChatList.fulfilled` 包含 `isDeleted: true` 和 `isDeleted: false` 的混合列表，验证 `chatMetaList` 只保留未删除条目
  - 测试用例：验证空列表传入时 `chatMetaList` 为空数组
- **验证**: 变异体 #51 #52 #53 状态从 NoCoverage 变为 Killed

### Task 2: 补充 NoCoverage 路径测试 — setSelectedChatIdWithPreload 内部预加载逻辑
- **文件**: `src/__test__/store/slices/chatSlices.test.ts`
- **目标**: 杀死变异体 #85 #91-L105 #107（L168-L197 预加载路径）
- **前置条件**: 这些代码在 async thunk 函数体内，测试必须完整执行 async thunk（不能仅 dispatch fulfilled action）。需要先 `createChat` 将 chatData 放入 `activeChatData`，并确保 models state 中有对应 model 数据
- **操作**: 新增 `describe('setSelectedChatIdWithPreload - 预加载 SDK')` 测试块
  - 测试用例：chatModelList 非空且 model 存在时，验证 `preloadProviders` 被调用且参数正确
  - 测试用例：model 不在 models 列表中时，验证跳过该 model 的 providerKey 提取
  - 测试用例：providerKeys 为空时，验证 `preloadProviders` 未被调用
  - 测试用例：预加载抛出异常时，验证返回值不受影响（catch 分支）
- **验证**: 变异体 #85 #91-L107 状态从 NoCoverage 变为 Killed

### Task 3: 补充 NoCoverage 路径测试 — generateChatName / startSendChatMessage / setChatMetaList
- **文件**: `src/__test__/store/slices/chatSlices.test.ts`
- **目标**: 杀死变异体 #114 #115（generateChatName）、#120（startSendChatMessage）、#179 #178（setChatMetaList）及其他散落 NoCoverage
- **操作**:
  - 新增 `describe('generateChatName - NoCoverage 路径')` 测试块
    - 测试用例：`autoNamingEnabled` 为 true 且调用成功时，验证返回值结构完整（覆盖 #115）
    - 测试用例：`autoNamingEnabled` 为 false 时返回 null（覆盖 #114 BlockStatement）
  - 新增 `describe('startSendChatMessage - NoCoverage 路径')` 测试块
    - 测试用例：chatModelList 非空且有匹配 model 时，验证 sendMessage 被正确 dispatch（覆盖 #120 ArrayDeclaration）
  - 新增 `describe('setChatMetaList')` 测试块
    - 测试用例：dispatch 后 `chatMetaList` 等于 payload 的浅拷贝
    - 测试用例：验证是浅拷贝而非引用（`not.toBe(payload)`）
- **验证**: 对应变异体状态变为 Killed

### Task 4: 补充条件表达式反向路径测试 — 异步 thunk 条件
- **文件**: `src/__test__/store/slices/chatSlices.test.ts`
- **目标**: 杀死 34 个 ConditionalExpression 存活变异中的主要部分
- **操作**: 新增以下测试用例
  - `setSelectedChatIdWithPreload` 路径：chatId 为 null 时返回 `{ chatId: null }`（L148）
  - chatData 已缓存时跳过 `loadChatById`（L158）
  - `loaded` 为 null 时返回 `{ chatId }`（L160）
  - chatModelList 非空时执行预加载（L171 `!== 0` 边界）
  - `autoNamingEnabled` 为 false 时返回 null（L225）
  - `providerKeys.size >= 0`（L189 边界值 `size === 1`）
- **验证**: 对应 ConditionalExpression 变异体状态变为 Killed

### Task 5: 补充条件表达式反向路径测试 — reducer 内部条件
- **文件**: `src/__test__/store/slices/chatSlices.test.ts`
- **目标**: 杀死 `pushChatHistory`/`updateMetaInList`/`deleteChat`/`editChatName` 中的条件变异
- **操作**: 新增以下测试用例
  - `appendHistoryToModel`：`message` 为 null 时返回 false（L306）
  - `appendHistoryToModel`：`chatModelList` 为 falsy 时返回 false（L315）
  - `updateMetaInList`：`metaIdx === -1` 时不更新（L336）
  - `editChatName`：name 恰好 20 字符时不截断（L409 边界）
  - `deleteChat`：不在 `sendingChatIds` 中时正常删除，验证 chatMetaList 过滤后的精确内容（L441）
  - `deleteChat`：`selectedChatId` 不匹配时不置空（L447）
- **验证**: 对应 ConditionalExpression/EqualityOperator 变异体状态变为 Killed

### Task 6: 精确化 state 断言
- **文件**: `src/__test__/store/slices/chatSlices.test.ts`
- **目标**: 杀死 11 个 ObjectLiteral 和 14 个 BlockStatement 存活变异
- **操作**: 审查所有使用 `toBeDefined()`、`toMatchObject()` 的断言，改为逐字段验证
  - `sendMessage.fulfilled` 测试：验证 `chatModelList[0]` 的完整字段（非仅 `chatHistoryList`）
  - `generateChatName.fulfilled` 测试：验证 `updatedAt` 被设置（`expect.any(Number)`）
  - `startSendChatMessage.rejected` 测试：验证 `sendingChatIds` 被清理
  - `setSelectedChatIdWithPreload.fulfilled` 测试：验证 `activeChatData` 被清理后的精确状态
- **验证**: ObjectLiteral/BlockStatement 变异体状态变为 Killed

### Task 7: 运行变异测试并验证得分
- **操作**: 执行 `pnpm test:mutation`
- **验证**: chatSlices.ts 变异得分 ≥ 75%
- **如未达标**: 根据报告分析剩余存活变异，补充针对性测试
