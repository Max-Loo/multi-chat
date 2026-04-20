## MODIFIED Requirements

### Requirement: slice 测试使用真实 thunk action creator

测试 MUST NOT 手动构造裸 action type 字符串（如 `type: 'chatModel/sendMessage/pending'`），SHALL 使用 Redux Toolkit 导出的 action creator（如 `sendMessage.pending`、`sendMessage.fulfilled`）。

#### Scenario: chatSlices 使用真实 action creator

- **WHEN** `chatSlices.test.ts` 测试 sendMessage thunk 的状态转换
- **THEN** SHALL 使用 `sendMessage.pending(requestId, arg)` 等 action creator 替代手动构造的 action 对象

#### Scenario: modelProviderSlice action type 一致

- **WHEN** `modelProviderSlice.test.ts` dispatch 裸 action type
- **THEN** SHALL 确认 action type 与 `createAsyncThunk` 生成的真实 type 匹配，不一致处 SHALL 修正为使用 action creator
