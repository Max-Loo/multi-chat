## 1. 修复 resetStore 无效 dispatch

- [x] 1.1 移除 `src/__test__/helpers/integration/resetStore.ts` 行 54 的 `testStore.dispatch({ type: 'RESET' })`，仅保留 `testStore = null`

## 2. 清理集成测试中的 Redux 逻辑测试

- [x] 2.1 从 `drawer-state.integration.test.tsx` 中删除 settingPage 的 3 个重复测试（行 169-204）及 TODO 注释
- [x] 2.2 从 `drawer-state.integration.test.tsx` 中删除 modelPage 的 3 个重复测试（行 207-243）及 TODO 注释
- [x] 2.3 从 `drawer-state.integration.test.tsx` 中删除 chatPage 的 1 个重复测试（行 107-112，初始状态）及 TODO 注释
- [x] 2.4 迁移 chatPage 的 4 个新测试到 `src/__test__/store/slices/chatPageSlices.test.ts`：
  - toggleDrawer 切换抽屉状态（行 115-128）
  - setIsDrawerOpen 设置抽屉状态（行 131-141）
  - 重复 dispatch toggleDrawer（行 356-366）
  - setIsDrawerOpen 覆盖当前状态（行 369-383）
- [x] 2.5 从 `drawer-state.integration.test.tsx` 中删除已迁移的 4 个测试及 TODO 注释，清理不再需要的 renderHelper 函数（如整个 describe 块清空）

## 3. 启用多线程测试

- [x] 3.1 将 `vite.config.ts` 中 `maxThreads` 从 1 改为 2
- [x] 3.2 运行完整测试套件验证多线程稳定性
- [x] 3.3 如测试失败，分析失败的测试文件并记录并发 mock 问题

## 4. 验证

- [x] 4.1 运行完整测试套件确认所有测试通过
- [x] 4.2 确认 `drawer-state.integration.test.tsx` 中无残留的 `TODO(单元测试迁移)` 注释
- [x] 4.3 确认 `chatPageSlices.test.ts` 新增 4 个测试且不与已有测试重复
- [x] 4.4 确认多线程执行速度有提升
