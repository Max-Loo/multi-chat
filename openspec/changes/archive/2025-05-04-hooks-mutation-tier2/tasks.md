## 1. useCreateChat 变异测试

- [x] 1.1 将 `src/hooks/useCreateChat.ts` 添加到 `stryker.config.json` 的 `mutate` 列表
- [x] 1.2 运行 Stryker 获取 useCreateChat 基线变异报告
- [x] 1.3 补充测试：createChat → setSelectedChatId → navigateToChat 严格顺序验证
- [x] 1.4 补充测试：连续创建多个聊天时 selectedChatId 为最后一个
- [x] 1.5 补充测试：createNewChat 的 useCallback 引用稳定性
- [x] 1.6 确认 useCreateChat 变异得分达到 80%

## 2. useDebounce 变异测试

- [x] 2.1 将 `src/hooks/useDebounce.ts` 添加到 `stryker.config.json` 的 `mutate` 列表
- [x] 2.2 运行 Stryker 获取 useDebounce 基线变异报告
- [x] 2.3 补充测试：延迟期间多次更新取最后一次值
- [x] 2.4 补充测试：delay 参数变化时定时器重置
- [x] 2.5 补充测试：value 变化时旧定时器被清除
- [x] 2.6 确认 useDebounce 变异得分达到 80%

## 3. useScrollContainer 变异测试

- [x] 3.1 将 `src/hooks/useScrollContainer.ts` 添加到 `stryker.config.json` 的 `mutate` 列表
- [x] 3.2 运行 Stryker 获取 useScrollContainer 基线变异报告
- [x] 3.3 补充测试：挂载时绑定 passive scroll 监听器
- [x] 3.4 补充测试：卸载时移除 scroll 监听器
- [x] 3.5 补充测试：scrollbarClassname 透传与切换
- [x] 3.6 确认 useScrollContainer 变异得分达到 80%

## 4. 收尾

- [x] 4.1 运行完整 `pnpm test` 确认所有测试通过
- [x] 4.2 运行完整 `pnpm test:mutation` 确认所有 3 个 Hook 变异得分达标
