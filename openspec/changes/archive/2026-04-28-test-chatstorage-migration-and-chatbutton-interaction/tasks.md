## 1. chatStorage 迁移逻辑测试

- [x] 1.1 补充 `migrateOldChatStorage` 测试：旧数据存在时执行完整三步迁移（写入 chat_<id>、生成索引、删除旧 key）
- [x] 1.2 补充 `migrateOldChatStorage` 测试：旧聊天缺少 updatedAt 时自动补充时间戳
- [x] 1.3 补充 `migrateOldChatStorage` 测试：索引已存在时跳过迁移直接返回
- [x] 1.4 补充 `migrateOldChatStorage` 测试：旧数据为空数组时初始化空索引
- [x] 1.5 补充 `deleteChatFromStorage` 测试：聊天不存在于存储时跳过并输出 console.warn

## 2. ChatButton 重命名交互测试

- [x] 2.1 补充测试：打开 DropdownMenu 后点击重命名进入编辑模式（验证 Input、确认/取消按钮渲染）
- [x] 2.2 补充测试：在编辑模式输入新名称并点击确认（验证 dispatch editChatName + toastQueue.success）
- [x] 2.3 补充测试：在编辑模式点击取消退出（验证无 dispatch）
- [x] 2.4 补充测试：输入为空白时确认按钮 disabled

## 3. ChatButton 删除确认测试

- [x] 3.1 补充测试：从 DropdownMenu 点击删除触发 modal.warning（验证标题包含聊天名称、onOk 回调存在）
- [x] 3.2 补充测试：执行 onOk 回调后验证 dispatch deleteChat + toastQueue.success
- [x] 3.3 补充测试：删除当前选中聊天时 clearChatIdParam 被调用
- [x] 3.4 补充测试：dispatch deleteChat 抛出异常时调用 toastQueue.error

## 4. ChatButton 快捷删除测试

- [x] 4.1 补充测试：Shift 按下 + 鼠标悬停时渲染快捷删除按钮（替代 DropdownMenu）
- [x] 4.2 补充测试：点击快捷删除按钮直接执行 dispatch deleteChat（不经过 modal.warning）
- [x] 4.3 补充测试：Shift 松开后恢复 DropdownMenu
- [x] 4.4 补充测试：快捷删除 dispatch 失败时调用 toastQueue.error

## 5. ChatButton 发送状态测试

- [x] 5.1 补充测试：sendingChatIds 包含当前 chatId 时删除菜单项 disabled

## 6. 验证

- [x] 6.1 运行 `pnpm test:run` 确认所有新增测试通过且无回归
- [x] 6.2 运行 `pnpm test:coverage` 确认 chatStorage 行覆盖率 >= 90%、ChatButton 行覆盖率 >= 75%
