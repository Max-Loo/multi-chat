# 语言降级持久化修复任务列表

## 1. 核心实现

- [x] 1.1 修改 `appConfigMiddleware` 的 matcher，添加 `initializeAppLanguage.fulfilled`
- [x] 1.2 修改 middleware 的 effect 函数，根据 action 类型决定是否显示 Toast
- [x] 1.3 删除 `initI18n()` 中的 localStorage 写入逻辑（204-213 行）
- [-] ~~1.4 删除 `initI18n()` 中的 Toast 提示逻辑（187-202 行）~~ **[已取消] 保留降级 Toast 以告知用户语言已切换**
- [x] 1.5 验证 middleware 在初始化时正确持久化语言但不显示 Toast
- [x] 1.6 验证用户主动切换语言时正确显示 Toast（loading + success/error）

## 2. 测试更新

- [x] 2.1 更新 `src/__test__/lib/i18n.test.ts`：
   - 移除对 `initI18n()` 直接写 localStorage 的测试
   - 移除对 `initI18n()` 显示 Toast 的测试
   - 验证 `initI18n()` 不再直接操作 localStorage 或显示 Toast
- [x] 2.2 更新 `src/__test__/lib/global.test.ts`：
   - 保持现有的 `getDefaultAppLanguage()` 测试不变
- [x] 2.3 更新 `src/__test__/store/middleware/appConfigMiddleware.test.ts`：
   - 添加测试验证 `initializeAppLanguage.fulfilled` 触发 localStorage 写入
   - 验证初始化时使用 `action.payload` 持久化（而非从 store 读取）
   - 验证用户主动切换时显示 Toast（action.type 是 'appConfig/setAppLanguage'）
   - 验证降级语言被正确持久化到 localStorage
   - 验证即使 extraReducers 未更新 store，middleware 仍能正确持久化
- [x] 2.4 添加集成测试：验证完整的初始化流程
   - `initI18n()` 执行（不显示 Toast，不写 localStorage）
   - `initializeAppLanguage` thunk 执行
   - middleware 持久化到 localStorage（不显示 Toast）
   - 刷新页面后不再重复降级

## 3. 测试验证

- [x] 3.1 运行所有语言检测相关的单元测试
- [x] 3.2 运行国际化系统测试（i18n）
- [x] 3.3 运行 Redux middleware 测试
- [x] 3.4 手动测试：设置无效语言代码并刷新页面，验证不显示降级 Toast
- [x] 3.5 手动测试：验证用户主动切换语言时正确显示 Toast（loading + success）
- [x] 3.6 手动测试：模拟 localStorage 写入失败，验证应用正常启动
- [x] 3.7 验证初始化完成后，设置页面显示正确的当前语言

## 4. 代码审查

- [x] 4.1 自我审查代码，确保符合项目规范
- [x] 4.2 检查所有新增的中文注释是否清晰
- [x] 4.3 验证 middleware 修改不引入 lint 错误
- [x] 4.4 验证不引入 TypeScript 类型错误
- [x] 4.5 确认修改符合 `docs/design/i18n-system.md` 的架构设计

## 5. 文档和收尾

- [x] 5.1 检查是否需要更新 `docs/design/i18n-system.md`
- [x] 5.2 运行完整的测试套件确保无回归
- [x] 5.3 验证所有测试用例通过
