# 实施任务清单

## 1. 修复核心逻辑（移除条件判断）

- [x] 1.1 修改 `src/services/chat/streamProcessor.ts`：移除第46行的 `includeReasoningContent` 参数解构
- [x] 1.2 修改 `src/services/chat/streamProcessor.ts`：移除第72-76行的 `if (includeReasoningContent)` 条件判断，无条件保存 `reasoning-delta` 事件
- [x] 1.3 修改 `src/services/chat/types.ts`：从 `ProcessStreamOptions` 接口中移除 `includeReasoningContent` 字段（第104行）
- [x] 1.4 修改 `src/services/chat/index.ts`：移除传递给 `processStreamEvents` 的 `includeReasoningContent` 参数（第107行）
- [x] 1.5 运行 `pnpm test:services/chat/streamProcessor.integration.test.ts` 验证修改

## 2. 重命名参数为 `transmitHistoryReasoning`

- [x] 2.1 修改 `src/services/chat/types.ts`：重命名 `ChatRequestParams.includeReasoningContent` → `transmitHistoryReasoning`（第45行）
- [x] 2.2 更新 `src/services/chat/types.ts`：更新 `ChatRequestParams` 接口的注释（第44行）
- [x] 2.3 修改 `src/services/chat/index.ts`：更新参数解构，`includeReasoningContent` → `transmitHistoryReasoning`（第84行）
- [x] 2.4 修改 `src/services/chat/index.ts`：更新传递给 `buildMessages` 的参数名（第92行）
- [x] 2.5 修改 `src/services/chat/messageTransformer.ts`：重命名函数参数 `includeReasoningContent` → `transmitHistoryReasoning`（第20行）
- [x] 2.6 更新 `src/services/chat/messageTransformer.ts`：更新函数注释（第9行）
- [x] 2.7 修改 `src/services/chat/messageTransformer.ts`：更新第50行的条件判断变量名
- [x] 2.8 运行 `pnpm tsc` 进行类型检查，确保无 TypeScript 错误（发现 chatSlices.ts 错误，待 Phase 3 修复）
- [x] 2.9 运行 `pnpm test:services/chat/index.integration.test.ts` 验证修改



## 4. 更新测试用例

### 4.1 修复 streamProcessor 测试

- [x] 4.1.1 修改 `src/__test__/services/chat/streamProcessor.integration.test.ts`：从 `defaultOptions` 中移除 `includeReasoningContent` 字段（第111行）
- [x] 4.1.2 删除测试用例"应该在 includeReasoningContent 为 false 时忽略 reasoning-delta"（第229-249行）
- [x] 4.1.3 添加新测试用例"应该无条件保存 reasoning-delta 事件"
- [x] 4.1.4 更新测试断言，验证 `reasoningContent` 被保存
- [x] 4.1.5 运行 `pnpm test:services/chat/streamProcessor.integration.test.ts` 验证修改

### 4.2 更新其他测试文件

- [x] 4.2.1 修改 `src/__test__/services/chat/index.integration.test.ts`：更新参数名 `includeReasoningContent` → `transmitHistoryReasoning`（第429行）
- [x] 4.2.2 修改 `src/__test__/services/chat/index.integration.test.ts`：更新测试标题"应该传递 transmitHistoryReasoning 参数"（第422行）
- [x] 4.2.3 运行 `pnpm test:services/chat/index.integration.test.ts` 验证修改
- [x] 4.2.4 修改 `src/__test__/integration/chat-flow.integration.test.ts`：更新第1003行的注释
- [x] 4.2.5 修改 `src/__test__/integration/chat-flow.integration.test.ts`：更新第1109行的注释
- [x] 4.2.6 运行 `pnpm test:integration` 验证修改
- [x] 4.3.1 修改 `src/__test__/components/ChatPanelSender.test.tsx`：添加注释说明 Redux state 保持原名（第55行）
- [x] 4.3.2 运行 `pnpm test:components/ChatPanelSender.test.tsx` 验证修改

## 5. 更新国际化配置文件

- [x] 5.1 修改 `src/locales/en/chat.json`：重命名翻译键 `includeReasoningContent` → `transmitHistoryReasoning`（第31行）
- [x] 5.2 修改 `src/locales/en/chat.json`：重命名翻译键 `includeReasoningContentHint` → `transmitHistoryReasoningHint`（第32行）
- [x] 5.3 修改 `src/locales/zh/chat.json`：重命名翻译键 `includeReasoningContent` → `transmitHistoryReasoning`
- [x] 5.4 修改 `src/locales/zh/chat.json`：重命名翻译键 `includeReasoningContentHint` → `transmitHistoryReasoningHint`
- [x] 5.5 修改 `src/locales/fr/chat.json`：重命名翻译键 `includeReasoningContent` → `transmitHistoryReasoning`
- [x] 5.6 修改 `src/locales/fr/chat.json`：重命名翻译键 `includeReasoningContentHint` → `transmitHistoryReasoningHint`

## 6. 更新 UI 组件引用

- [x] 6.1 更新所有使用 `t('chat:includeReasoningContent')` 的地方为 `t('chat:transmitHistoryReasoning')`
- [x] 6.2 更新所有使用 `t('chat:includeReasoningContentHint')` 的地方为 `t('chat:transmitHistoryReasoningHint')`

## 7. 更新其他文件

- [x] 7.1 修改 `src/config/initSteps.ts`：更新 thunk 引用

## 8. 全面验证

- [x] 8.1 运行类型检查：`pnpm tsc`
- [x] 8.2 运行所有单元测试：`pnpm test`
- [x] 8.3 运行所有集成测试：`pnpm test:integration`
- [x] 8.4 运行所有测试：`pnpm test:all`
- [x] 8.5 验证 localStorage 重命名：确认使用新的 key `LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY`
- [x] 8.6 启动应用手动验证：`pnpm tauri dev`
- [x] 8.7 验证场景1：开启"传输推理内容"开关，发送消息，检查推理内容是否显示
- [x] 8.8 验证场景2：关闭"传输推理内容"开关，发送消息，检查推理内容是否仍显示
- [x] 8.9 验证场景3：检查 Redux DevTools，确认 `transmitHistoryReasoning` 字段被正确保存
- [x] 8.10 运行 Lint 检查：`pnpm lint`
- [x] 8.11 检查是否有遗漏的 `includeReasoningContent` 引用（应该在所有层面都已完成重命名）

## 9. 文档

- [x] 9.1 更新 AGENTS.md（如有需要）
