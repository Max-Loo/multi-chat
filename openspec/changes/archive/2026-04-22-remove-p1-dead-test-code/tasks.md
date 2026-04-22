## 1. 删除死代码文件

- [x] 1.1 删除 `src/__test__/helpers/fixtures/reduxState.ts`（155 行，零消费者，过时状态结构）
- [x] 1.2 删除 `src/__test__/helpers/mocks/rawResponse.ts`（260 行，零消费者）

## 2. 清理 barrel export

- [x] 2.1 从 `src/__test__/helpers/fixtures/index.ts` 中移除 `export * from './reduxState'`
- [x] 2.2 从 `src/__test__/helpers/mocks/index.ts` 中移除 `export * from './rawResponse'`

## 3. 清理部分死代码

- [x] 3.1 从 `src/__test__/helpers/mocks/chatPanel.ts` 中移除 `createChatPanelMocks` 及其专属依赖：未使用的 import（`createMockStore`、`createReactRouterMocks`、`createTauriMocks`）和仅被其调用的 `createMockChatService`
- [x] 3.2 从 `src/__test__/helpers/mocks/redux.ts` 中移除 `createMockStore`（仅被死代码和文档引用）
- [x] 3.3 更新 `src/__test__/README.md` 中对 `createMockStore` 的引用

## 4. 验证

- [x] 4.1 运行完整测试套件确认无导入错误
- [x] 4.2 grep 确认无残留引用
