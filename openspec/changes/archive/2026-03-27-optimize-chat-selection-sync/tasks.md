## 1. 代码修改

- [x] 1.1 修改 `src/hooks/useCreateChat.ts`：按以下顺序添加 `setSelectedChatId` 调用
  - 位置：在 `dispatch(createChat({ chat }))` 之后、`navigateToChat({ chatId: chat.id })` 之前
  - 代码：`dispatch(setSelectedChatId(chat.id))`
- [x] 1.2 确认 `setSelectedChatId` 已从 `chatSlices.ts` 正确导出

## 2. 测试更新

- [x] 2.1 更新 `src/__test__/hooks/useCreateChat.test.ts`：验证新行为
- [x] 2.2 添加测试用例：验证创建新聊天后 `selectedChatId` 立即更新
- [x] 2.3 添加测试用例：验证 URL 参数同步正常工作
- [x] 2.4 边界测试：连续快速创建多个新聊天，验证 `selectedChatId` 最终值正确
- [x] 2.5 边界测试：从已有聊天切换到新聊天，验证 `selectedChatId` 正确更新

## 3. 验证

- [x] 3.1 手动测试：创建新聊天，验证选中状态正确
- [x] 3.2 手动测试：通过 URL 直接访问聊天，验证选中状态正确
- [x] 3.3 运行完整测试套件，确保无回归
- [x] 3.4 边界验证：在应用初始化期间（loading 为 true）创建新聊天，确保 `selectedChatId` 正确设置
