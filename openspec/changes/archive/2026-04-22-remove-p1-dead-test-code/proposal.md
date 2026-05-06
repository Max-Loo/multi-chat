## Why

测试辅助代码中存在大量死代码：`helpers/fixtures/reduxState.ts`（155 行）使用过时的状态结构且无任何消费者；`mocks/rawResponse.ts`（260 行）、`mocks/chatPanel.ts` 的 `createChatPanelMocks`、以及 `mocks/redux.ts` 的 `createMockStore` 均无任何测试文件导入。这些死代码增加维护负担，且过时的状态结构可能误导开发者。

## What Changes

- 删除 `src/__test__/helpers/fixtures/reduxState.ts`（155 行纯死代码）
- 移除 `src/__test__/helpers/fixtures/index.ts` 中对 `reduxState` 的导出
- 删除 `src/__test__/helpers/mocks/rawResponse.ts`（260 行纯死代码）
- 删除 `src/__test__/helpers/mocks/chatPanel.ts` 中的 `createChatPanelMocks`（仅被死代码 `chatPanel.ts` 内部引用）
- 删除 `src/__test__/helpers/mocks/redux.ts` 中的 `createMockStore`（仅被死代码和文档引用）

## Capabilities

### New Capabilities

（无新能力——纯代码删除）

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **删除文件**: `reduxState.ts`（155 行）、`rawResponse.ts`（260 行）
- **修改文件**: `helpers/fixtures/index.ts`（移除 1 行导出）、`mocks/chatPanel.ts`（移除 `createChatPanelMocks`）、`mocks/redux.ts`（移除 `createMockStore`）
- **风险**: 低——所有删除项经 grep 确认零消费者
