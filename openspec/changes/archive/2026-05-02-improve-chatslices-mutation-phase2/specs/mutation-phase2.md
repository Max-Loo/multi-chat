---
name: chatslices-mutation-phase2
description: chatSlices.ts 第二轮变异测试精确断言提升
---

## Why

chatSlices.ts 变异测试得分 80.22%，53 个存活变异体占全部存活的 52%，是整体分数的最大短板。前一轮（2026-04-30）解决了 NoCoverage 路径问题，本轮存活变异体的根因已从"路径未覆盖"变为"断言不够精确"——测试触发了代码路径，但没有验证 Redux state 变化的细节。仅修复此模块即可将整体变异测试分数从 86.23% 提升到约 92%。

## What Changes

- `updateMetaInList` 函数（约 11 个存活）：新增独立测试，断言 `chatMetaList` 被正确合并更新
- `removeActiveChatData` / `setSelectedChatIdWithPreload.fulfilled`（约 14 个存活）：断言 `activeChatData` 写入和 previousChat 清理，升级现有 `toBeDefined()` 为逐字段 `toEqual`
- `clearActiveChatData`（约 4 个存活）：断言 sendingChatIds 条件和 delete 行为
- `sendMessage` thunk 体（约 2 个存活）：验证 transmitHistoryReasoning 传入和 signal 传递
- `startSendChatMessage` 条件（约 2 个存活）：验证模型过滤条件
- `editChatName`（约 3 个存活）：补充边界值精确断言
- `appendHistoryToModel`（约 3 个存活）：补充返回值和内容验证
- `deleteChat`（约 2 个存活）：补充 selectedChatId 清理断言
- 其余散布变异（约 12 个）：initializeChatList、pushRunningChatHistory、sendMessage.fulfilled/rejected、clearError 等
- 断言精确化：将 15 处 `toBeDefined()` 升级为逐字段 `toEqual`（文件中无 `toMatchObject` 用法）

## Capabilities

### New Capabilities

- `chatslices-mutation-phase2`: chatSlices.ts 第二轮变异测试精确断言提升，目标从 80.22% → ≥93%

### Modified Capabilities

（无）

## Impact

- **测试文件**: `src/__test__/store/slices/chatSlices.test.ts` — 新增约 25-30 个测试用例，升级 15 处 `toBeDefined()` 弱断言
- **源代码**: 无改动
- **构建时间**: 变异测试运行时间预计增加 1-2 分钟
- **CI/CD**: 无影响
