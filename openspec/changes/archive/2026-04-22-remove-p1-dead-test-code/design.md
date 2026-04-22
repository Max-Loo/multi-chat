## Context

经 grep 验证，以下测试辅助代码无任何消费者：

| 文件 | 行数 | 状态 |
|------|------|------|
| `helpers/fixtures/reduxState.ts` | 155 | 零导入，使用过时 chat 状态结构 |
| `mocks/rawResponse.ts` | 260 | 零导入 |
| `mocks/chatPanel.ts` → `createChatPanelMocks` | ~50 | 零导入 |
| `mocks/redux.ts` → `createMockStore` | ~20 | 仅被死代码 `chatPanel.ts` 和 README 引用 |

`reduxState.ts` 尤其危险：其 `createMockRootState()` 使用 `{ activeChatId, chats, messages, temporaryMessages }` 等过时字段，而正确结构为 `{ chatList, selectedChatId, runningChat }`。`as RootState` 类型断言掩盖了不一致。

## Goals / Non-Goals

**Goals:**
- 删除所有无消费者的测试辅助代码，消除维护负担和误导风险
- 清理 barrel export 中的对应导出

**Non-Goals:**
- 不重构 `mocks/router.ts`（仍有 4 个 router 测试文件使用）
- 不重构 `mocks/tauri.ts`（有活跃消费者）
- 不处理 `mocks/crypto.ts` 的保留价值判断

## Decisions

### Decision 1: 整文件删除 vs 部分删除

**选择**: `reduxState.ts` 和 `rawResponse.ts` 整文件删除；`chatPanel.ts` 和 `redux.ts` 仅删除未使用的导出。

**理由**: `chatPanel.ts` 和 `redux.ts` 中其他导出可能仍有价值（如自测），且文件本身可能含其他有用内容。但 `reduxState.ts` 和 `rawResponse.ts` 的所有导出均无消费者。

### Decision 2: barrel export 清理

**选择**: 移除 `helpers/fixtures/index.ts` 中 `export * from './reduxState'`，移除 `helpers/mocks/index.ts` 中 `export * from './rawResponse'`。

**理由**: 消除未来开发者误用过时工厂的入口；删除 `rawResponse.ts` 后保留 export 会导致模块解析失败。

### Decision 3: 移除 `createChatPanelMocks` 后的 import 清理

**选择**: 一并移除 `chatPanel.ts` 中仅被 `createChatPanelMocks` 使用的 import（`createMockStore`、`createReactRouterMocks`、`createTauriMocks`）和函数（`createMockChatService`）。

**理由**: 项目配置 `noUnusedLocals: true`，未清理的 import 会触发 TypeScript 编译错误。

## Risks / Trade-offs

- **[风险] 未来可能需要这些工厂** → 可接受，git 历史可恢复
- **[风险] README 文档引用 `createMockStore`** → 同步更新 README
