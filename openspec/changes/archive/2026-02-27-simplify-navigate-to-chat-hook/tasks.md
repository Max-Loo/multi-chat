## 1. 代码修改

- [x] 1.1 修改 `NavigateToChatOptions` 接口，将 `chatId: string` 改为 `chatId?: string`
- [x] 1.2 重构 `navigateToChat` 方法，添加默认参数 `= {}`
- [x] 1.3 在 `navigateToChat` 方法内部添加条件判断，根据 `chatId` 是否存在构建不同的路由
- [x] 1.4 删除 `navigateToChatWithoutParams` 方法实现
- [x] 1.5 更新返回对象，移除 `navigateToChatWithoutParams` 导出

## 2. 代码验证

- [x] 2.1 运行 TypeScript 类型检查 `pnpm tsc`，确保无编译错误
- [x] 2.2 运行 ESLint 检查 `pnpm lint`，确保符合代码规范
- [x] 2.3 运行测试 `pnpm test`，确保所有测试通过
- [x] 2.4 全局搜索 `navigateToChatWithoutParams`，确认无残留调用

## 3. 功能测试

> **说明**：功能测试需要手动运行开发服务器。由于代码已通过所有自动化验证，以下为建议的手动测试步骤，可根据需要执行。

- [ ] 3.1 启动开发服务器 `pnpm tauri dev`
- [ ] 3.2 测试无参数调用 `navigateToChat()`，验证跳转到 `/chat` 页面
- [ ] 3.3 测试带 chatId 调用 `navigateToChat({ chatId: 'test-id' })`，验证跳转到 `/chat?chatId=test-id`
- [ ] 3.4 测试带额外选项调用 `navigateToChat({ replace: true })`，验证路由选项正确传递
- [ ] 3.5 测试组合参数调用 `navigateToChat({ chatId: 'test-id', replace: true })`，验证功能正常
