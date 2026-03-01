## 1. 新增导航辅助函数

- [x] 1.1 在 `src/hooks/useNavigateToPage.ts` 中新增 `navigateToChatWithoutParams()` 函数
- [x] 1.2 在 `useNavigateToChat` hook 的返回对象中导出 `navigateToChatWithoutParams` 函数
- [x] 1.3 验证函数正确导航到 `/chat` 路径（不包含查询参数）

## 2. 修改删除聊天逻辑

- [x] 2.1 在 `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx` 中从 `useNavigateToChat` hook 解构 `navigateToChatWithoutParams` 函数
- [x] 2.2 在 `handleDelete` 函数的 `onOk` 回调中，删除成功后添加条件判断：仅当 `chat.id === selectedChatId` 时调用导航函数
- [x] 2.3 确保 `navigateToChatWithoutParams()` 调用在 `try` 块内，删除失败时不会执行

## 3. 测试验证

- [x] 3.1 测试删除当前选中的聊天：验证 URL 从 `/chat?chatId=xxx` 变为 `/chat`
- [x] 3.2 测试删除非当前选中的聊天：验证 URL 保持不变
- [x] 3.3 测试删除失败场景：模拟删除抛出异常，验证 URL 和 Redux state 不被修改
- [x] 3.4 测试刷新页面场景：删除当前聊天后刷新页面，验证不尝试加载已删除的聊天
- [x] 3.5 测试快速删除多个聊天：验证每次删除都正确处理 URL

## 4. 代码质量检查

- [x] 4.1 运行 `pnpm lint` 确保代码符合 ESLint 规则
- [x] 4.2 运行 `pnpm tsc` 确保类型检查通过
- [x] 4.3 检查新增代码是否符合项目注释规范（中文注释）
