## 1. 删除 MSW 相关内容

- [x] 1.1 删除分层 Mock 策略表格中"外部 API → MSW"的引用，替换为实际 `vi.mock` Service 层模块替换
- [x] 1.2 删除"MSW (Mock Service Worker)"整节（安装依赖、配置 Server、使用辅助工具）
- [x] 1.3 删除"测试辅助工具"小节中对 `fixtures.ts` 和 `testServer.ts` 的描述（文件不存在）

## 2. 重写测试模板

- [x] 2.1 基于 `auto-naming.integration.test.ts` 重写基础测试模板，使用 `vi.mock` + `vi.hoisted` + `vi.importActual` 替代 `setupServer`
- [x] 2.2 基于实际集成测试重写聊天流程测试模板，使用 `vi.mock` + `vi.hoisted` 替代 `vi.doMock`
- [x] 2.3 修正"Mock Service 层"示例代码，将 `vi.doMock` 替换为 `vi.mock` + `vi.hoisted` 模式

## 3. 修正辅助工具引用

- [x] 3.1 确认 `resetStore.ts`、`clearIndexedDB.ts`、`waitForStorage.ts` 的导出说明与实际文件一致
- [x] 3.2 更新"测试辅助工具"小节，仅保留实际存在的 3 个辅助文件

## 4. 收尾

- [x] 4.1 更新或移除设计文档引用（第 573 行 `openspec/changes/add-integration-tests-critical-flows/design.md`）
- [x] 4.2 通读全文确认无残留 MSW 引用（`setupServer`、`msw/node`、`http.get`/`http.post`）
