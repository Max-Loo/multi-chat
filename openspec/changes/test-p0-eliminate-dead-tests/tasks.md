## 实施任务清单

### T1: 删除 codeHighlight.test.ts
- [x] 删除 `src/__test__/utils/codeHighlight.test.ts`
- [x] 验证 `highlightLanguageManager.test.ts` 和 `markdown.test.ts` 仍覆盖高亮集成逻辑
- **文件**: `src/__test__/utils/codeHighlight.test.ts`

### T2: 删除旧版 chatPageSlices.test.ts
- [x] 确认 `src/__test__/store/slices/chatPageSlices.test.ts`（新版本）已覆盖所有逻辑
- [x] 删除 `src/__test__/store/chatPageSlices.test.ts`（旧版本）
- **文件**: `src/__test__/store/chatPageSlices.test.ts`

### T3: 删除 ChatPage.test.tsx（过时 mock 路径）
- [x] 确认该文件无法正常运行（3 个 mock 路径指向不存在的目录）
- [x] 删除 `src/__test__/pages/Chat/ChatPage.test.tsx`
- **文件**: `src/__test__/pages/Chat/ChatPage.test.tsx`

### T4: 删除 http.test.ts（全部假阳性）
- [x] 删除 `src/__test__/utils/tauriCompat/http.test.ts`
- [x] 确认 `src/utils/tauriCompat/http.ts` 的核心逻辑（fetch 初始化、getFetchFunc）已被集成测试间接覆盖
- **文件**: `src/__test__/utils/tauriCompat/http.test.ts`

### T5: 清理 tauriCompat 假阳性断言（os/shell/store）
- [x] `os.test.ts`：删除 "应该导出 locale 函数"、"应该返回 Promise<string>"、"应该支持异步调用" 3 个纯假阳性用例；保留 "返回值格式应该符合 BCP 47 标准"
- [x] `shell.test.ts`：删除 "类型定义" describe 块（2 个用例）；删除 `expect(openPromise).toBeInstanceOf(Promise)` 断言；保留 Command.create 工厂测试和 execute/isSupported 行为测试
- [x] `store.test.ts`：删除 `expect(store).toBeDefined()` 类纯赋值断言（line 30, 43-44, 105, 113）；保留所有 CRUD 行为测试（get/set/delete/keys/save）和 IndexedDB 特性测试
- **文件**: `src/__test__/utils/tauriCompat/os.test.ts`、`shell.test.ts`、`store.test.ts`

### T6: 删除 useNavigateToExternalSite "Mock 验证测试"
- [x] 删除第 205-251 行的 `describe('Mock 验证测试', ...)` 整个块
- **文件**: `src/__test__/hooks/useNavigateToExternalSite.test.ts`

### T7: 删除 useConfirm 假阳性断言
- [x] 删除第 124-156 行中 `expect(typeof onOk).toBe('function')` 等 2 个假阳性断言
- **文件**: `src/__test__/hooks/useConfirm.test.tsx`

### T8: 运行测试验证
- [x] 执行 `pnpm test` 确认全部测试通过
- [x] 检查覆盖率是否仍满足 60% 阈值
- **验证命令**: `pnpm test`
