## Why

集成测试文件 `drawer-state.integration.test.tsx` 中仍有 2 个纯 Redux 状态逻辑测试（行 104、124），渲染了完整页面组件但只断言 store.getState()，属于单元测试范畴，拖慢集成测试套件执行速度。同时，mock 工厂中存在 7 个未被任何测试文件导入的导出函数，增加维护负担且容易误导开发者。

## What Changes

- 迁移 `drawer-state.integration.test.tsx` 中 2 个 Redux 逻辑测试到对应的 slice 单元测试文件
- 删除 7 个未被使用的 mock 导出：
  - `createReactRouterMocks`（`mocks/router.ts`）
  - `createCryptoMocks`（`mocks/crypto.ts`）
  - `createMockChatModel`、`createMockSelectedChat`、`createMockRunningChat`（`mocks/chatPanel.ts`）
  - `createMockAbortController`、`createMockAbortSignal`（`mocks/redux.ts`）

## Capabilities

### New Capabilities

- `drawer-state-unit-tests`: 抽屉状态 Redux 逻辑的单元测试，覆盖多页面抽屉状态独立管理场景

### Modified Capabilities

无（本次变更不涉及已有 spec 的行为需求修改，仅是测试代码重组和清理）

## Impact

- **测试文件**：`drawer-state.integration.test.tsx`（减少 2 个测试）、对应的 slice 单元测试文件（新增 2 个测试）
- **Mock 文件**：`mocks/router.ts`、`mocks/crypto.ts`、`mocks/chatPanel.ts`、`mocks/redux.ts`（删除未使用的导出）
- **风险**：低 — 迁移是复制+删除操作，删除的导出已确认无任何消费者
