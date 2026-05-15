## 1. 迁移 Redux 逻辑测试

- [x] 1.1 在 `chatPageSlices.test.ts`（或对应 slice 单元测试文件）中添加 2 个抽屉状态独立管理的单元测试（来自 `drawer-state.integration.test.tsx` 行 104 和行 124）
- [x] 1.2 从 `drawer-state.integration.test.tsx` 中删除已迁移的 2 个测试及仅被其使用的导入
- [x] 1.3 运行测试验证迁移正确性

## 2. 删除未使用的 mock 导出

- [x] 2.1 从 `helpers/mocks/router.ts` 删除 `createReactRouterMocks` 导出
- [x] 2.2 从 `helpers/mocks/crypto.ts` 删除 `createCryptoMocks` 导出，并从 `helpers/mocks/mocks.test.ts` 中删除 `createCryptoMocks` 的 `describe` 块（行 64-98）
- [x] 2.3 从 `helpers/mocks/chatPanel.ts` 删除 `createMockChatModel`、`createMockSelectedChat`、`createMockRunningChat` 导出
- [x] 2.4 从 `helpers/mocks/redux.ts` 删除 `createMockAbortController`、`createMockAbortSignal` 导出
- [x] 2.5 运行完整测试套件确认无导入错误

## 3. 验证

- [x] 3.1 执行 `pnpm test` 确认所有测试通过
- [x] 3.2 执行 `pnpm tsc` 确认无类型错误
