## 1. Mock 状态隔离修复

- [x] 1.1 恢复 `model-config.integration.test.ts` 的 `afterEach` 中被误删的 `vi.restoreAllMocks()` 调用
- [x] 1.2 为 `src/services/toast/toastQueue.ts` 的 `ToastQueue` 类添加 `reset()` 公开方法
- [x] 1.3 在 `toast-system.integration.test.tsx` 的 `beforeEach` 或 `afterEach` 中调用 `toastQueue.reset()`

## 2. Mock 代码简化

- [x] 2.1 将 `toast-system.integration.test.tsx` 中 sonner mock 的 6 个重复函数体替换为 `Object.assign(renderToastToDom, { success: renderToastToDom, error: renderToastToDom, ... })` 模式
- [x] 2.2 删除 `model-config.integration.test.ts` 测试末尾多余的 `setupDefaultStreamMock()` 调用

## 3. 类型安全与 fixture 复用

- [x] 3.1 修复 `Layout.test.tsx` 中 `layoutMode: 'desktop' as string` 的类型断言，移除 `as string` 或导入 `LayoutMode` 类型
- [x] 3.2 删除 `chat/index.integration.test.ts` 中的本地 `createTestModel` 函数定义，所有调用点替换为 `createDeepSeekModel`
- [x] 3.3 删除 `auto-naming.integration.test.ts` 中的本地 `createTestModel` 函数定义，所有调用点替换为 `createDeepSeekModel`

## 4. 验证

- [x] 4.1 运行 `pnpm test` 确认所有测试通过
- [x] 4.2 运行 `pnpm tsc` 确认无类型错误
