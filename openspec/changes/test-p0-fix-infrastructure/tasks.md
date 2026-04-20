## 实施任务清单

### T1: 修复 testServer.ts DeepSeek handler 冲突
- [x] 将第 30 行（通用 JSON）和第 52 行（流式 SSE）合并为 1 个条件分支 handler：`body.stream === true` → SSE 响应，默认 → JSON 响应
- [x] 删除第 115 行（无条件 401 handler）—— 属于设计失误的死代码，错误场景由 `setupErrorHandlers` 覆盖
- [x] 保留 `setupErrorHandlers` 和 `setupTimeoutHandlers` 不变
- **文件**: `src/__test__/helpers/integration/testServer.ts`

### T2: 替换 appConfigMiddleware.test.ts 中的 setTimeout
- [x] 将 30 处 `await new Promise(resolve => setTimeout(resolve, 0))` 后的 `expect(...)` 替换为 `await vi.waitFor(() => { expect(...) })`
- [x] 模式：`await new Promise(resolve => setTimeout(resolve, 0)); expect(fn).toHaveBeenCalled()` → `await vi.waitFor(() => { expect(fn).toHaveBeenCalled() })`
- **文件**: `src/__test__/store/middleware/appConfigMiddleware.test.ts`
- **参考**: `modelMiddleware.test.ts` 中已有的正确模式

### T3: 替换 chatMiddleware.test.ts 中的 setTimeout
- [x] 将 21 处（含 1 处 `setTimeout(resolve, 10)`）替换为 `vi.waitFor`
- [x] 同 T2 的替换模式
- **文件**: `src/__test__/store/middleware/chatMiddleware.test.ts`

### T4: 修复 crypto-storage isEncrypted 测试
- [x] 确认 `@/utils/crypto` 中是否存在 `isEncrypted` 导出
- [x] 如不存在，先在 `crypto.ts` 中创建 `isEncrypted` 函数（检查 `enc:` 前缀）
- [x] 在 `crypto-storage.integration.test.ts` 中导入 `isEncrypted`
- [x] 将第 1015-1055 行的 `input.startsWith('enc:')` 替换为 `isEncrypted(input)`
- [x] 将第 1188-1223 行的 `value.startsWith('enc:')` 替换为 `isEncrypted(value)`
- [x] 删除第 1044-1052 行验证 `String.prototype.startsWith` 不抛错的无效测试
- **文件**: `src/__test__/integration/crypto-storage.integration.test.ts`、`src/utils/crypto.ts`（可能）

### T5: 运行测试验证
- [x] 执行 `pnpm test` 确认全部测试通过
- [x] 重点关注中间件测试和 crypto 集成测试
- **验证命令**: `pnpm test`
