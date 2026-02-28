# Tasks: 自定义 Hooks 测试实现

本文档将自定义 Hooks 测试的实现工作分解为可跟踪的任务列表。

## 1. 准备工作

- [x] 1.1 验证 `@testing-library/react` 的 `renderHook` API 可用性
- [x] 1.2 验证 Vitest 的 Fake Timers 功能（`vi.useFakeTimers()`）
- [x] 1.3 检查项目现有的测试辅助工具是否满足需求（`createTauriMocks`、`createMockModel` 等）
- [x] 1.4 创建 `src/__test__/hooks/` 目录（如果不存在）

## 2. 核心 Hooks 测试（高优先级）

### 2.1 useDebounce Hook 测试

- [x] 2.1.1 创建 `src/__test__/hooks/useDebounce.test.ts` 文件
- [x] 2.1.2 实现基础功能测试：初始值立即返回
- [x] 2.1.3 实现防抖延迟测试：使用 Fake Timers 验证值在延迟后更新
- [x] 2.1.4 实现多次更新测试：验证只返回最后一次更新的值
- [x] 2.1.5 实现定时器清理测试：验证组件卸载时清理定时器
- [x] 2.1.6 实现参数变化测试：验证 delay 参数变化时重新设置定时器
- [x] 2.1.7 实现泛型类型测试：测试 string、number、object 等类型

### 2.2 useConfirm Hook 测试

- [x] 2.2.1 创建 `src/__test__/hooks/useConfirm.test.tsx` 文件
- [x] 2.2.2 实现 ConfirmProvider 渲染测试
- [x] 2.2.3 实现显示确认对话框测试：调用 `modal.confirm()` 并验证 AlertDialog 显示
- [x] 2.2.4 实现确认操作测试：验证 `onOk` 回调执行和对话框关闭
- [x] 2.2.5 实现取消操作测试：验证 `onCancel` 回调执行和对话框关闭
- [x] 2.2.6 实现 Context 外使用测试：验证抛出错误"useConfirm must be used within ConfirmProvider"
- [x] 2.2.7 实现警告类型测试：验证 `modal.warning()` 显示警告对话框
- [x] 2.2.8 实现默认文本测试：验证国际化默认文本（"确认"、"取消"）

### 2.3 useNavigateToPage Hook 测试

- [x] 2.3.1 创建 `src/__test__/hooks/useNavigateToPage.test.ts` 文件
- [x] 2.3.2 实现 `navigateToChat` 测试：传入 `chatId` 时导航到 `/chat?chat=chatId`
- [x] 2.3.3 实现 `navigateToChat` 无参数测试：不传 `chatId` 时导航到 `/chat`
- [x] 2.3.4 实现 `navigateToModel` 测试：验证导航到模型管理页面
- [x] 2.3.5 Mock React Router 的 `useNavigate` hook

## 3. 数据选择器 Hooks 测试

### 3.1 Redux 类型化 Hooks 测试

- [x] 3.1.1 创建 `src/__test__/hooks/redux.test.tsx` 文件
- [x] 3.1.2 实现 `useAppSelector` 类型安全测试：验证 RootState 类型推断
- [x] 3.1.3 实现 `useAppDispatch` 类型安全测试：验证 AppDispatch 类型
- [x] 3.1.4 创建 Mock Redux Store（使用 `configureStore` 和 `preloadedState`）
- [x] 3.1.5 使用 Redux Provider 包装测试

### 3.2 useCurrentSelectedChat Hook 测试

- [x] 3.2.1 创建 `src/__test__/hooks/useCurrentSelectedChat.test.tsx` 文件
- [x] 3.2.2 实现有选中聊天测试：返回对应的聊天对象
- [x] 3.2.3 实现无选中聊天测试：返回 `undefined`
- [x] 3.2.4 提供 Mock 的 Redux state（包含 `chat.selectedChatId`）

### 3.3 useExistingChatList Hook 测试

- [x] 3.3.1 创建 `src/__test__/hooks/useExistingChatList.test.tsx` 文件
- [x] 3.3.2 实现获取聊天列表测试：返回完整聊天数组
- [x] 3.3.3 实现空列表测试：返回空数组
- [x] 3.3.4 提供 Mock 的 Redux state（包含 `chat.list`）

### 3.4 useExistingModels Hook 测试

- [x] 3.4.1 创建 `src/__test__/hooks/useExistingModels.test.tsx` 文件
- [x] 3.4.2 实现获取模型列表测试：返回完整模型数组
- [x] 3.4.3 实现空列表测试：返回空数组
- [x] 3.4.4 提供 Mock 的 Redux state（包含 `model.list`）
- [x] 3.4.5 使用 `createMockModel` 创建测试数据

## 4. UI 和兼容性 Hooks 测试（中优先级）

### 4.1 useNavigateToExternalSite Hook 测试

- [x] 4.1.1 创建 `src/__test__/hooks/useNavigateToExternalSite.test.ts` 文件
- [x] 4.1.2 实现 Tauri 环境测试：验证使用 `shell.open()` 打开链接
- [x] 4.1.3 实现 Web 环境测试：验证使用 `window.open()` 打开链接
- [x] 4.1.4 使用 `createTauriMocks` 切换环境 Mock
- [x] 4.1.5 Mock `shell.open` 和 `window.open` 方法

### 4.2 useAdaptiveScrollbar Hook 测试

- [x] 4.2.1 创建 `src/__test__/hooks/useAdaptiveScrollbar.test.ts` 文件
- [x] 4.2.2 查看 Hook 源代码，理解 DOM 操作逻辑
- [x] 4.2.3 实现滚动条样式应用测试
- [x] 4.2.4 实现浏览器兼容性测试（如果适用）
- [x] 4.2.5 Mock DOM 操作或使用 `@testing-library/jest-dom` 辅助函数

### 4.3 useBasicModelTable Hook 测试

- [x] 4.3.1 创建 `src/__test__/hooks/useBasicModelTable.test.tsx` 文件
- [x] 4.3.2 实现表格列配置测试：验证返回正确的列定义
- [x] 4.3.3 实现表格数据格式化测试：验证数据转换逻辑
- [x] 4.3.4 使用 `createMockModel` 创建测试模型数据

## 5. 验证和优化

- [x] 5.1 运行所有 Hooks 测试：`pnpm test src/__test__/hooks/`
- [x] 5.2 检查测试覆盖率：`pnpm test:coverage`，查看 `src/hooks/` 覆盖率是否达到 80%+
- [x] 5.3 运行完整测试套件：`pnpm test:run`，确保无回归
- [x] 5.4 检查测试执行时间，确保在可接受范围内（69个测试，~2.6秒）
- [x] 5.5 代码审查：检查测试用例的清晰度和可维护性
- [x] 5.6 重构重复代码：提取公共测试辅助函数（如有需要）

## 6. 文档更新

- [x] 6.1 更新 AGENTS.md 的测试统计信息
- [x] 6.2 在测试覆盖率章节添加 Hooks 测试的覆盖率数据
- [x] 6.3 更新测试文件列表，记录新增的 9 个测试文件
- [x] 6.4 在测试辅助工具章节补充 Hooks 测试的最佳实践（如有新方法）

## 7. 清理和收尾

- [x] 7.1 确保所有测试文件遵循项目的代码风格
- [x] 7.2 运行 `pnpm lint`，修复所有 lint 错误
- [x] 7.3 运行 `pnpm tsc`，确保无类型错误
- [x] 7.4 如适用，创建 Pull Request 进行代码审查

---

## 任务统计

- **总任务数**：60 个任务
- **准备工作**：4 个任务
- **核心 Hooks 测试**：26 个任务
- **数据选择器 Hooks 测试**：15 个任务
- **UI 和兼容性 Hooks 测试**：10 个任务
- **验证和优化**：6 个任务
- **文档更新**：4 个任务
- **清理和收尾**：4 个任务

## 预期成果

完成所有任务后：
- 新增 10 个测试文件（`src/__test__/hooks/*.test.ts`）
- 新增 30-40 个测试用例
- `src/hooks/` 目录的测试覆盖率达到 80%+
- 项目整体测试覆盖率从 49.63% 提升至 65%+
