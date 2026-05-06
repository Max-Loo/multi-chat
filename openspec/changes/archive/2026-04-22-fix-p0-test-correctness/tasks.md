## 1. 修复误判通过的测试

- [x] 1.1 重写停止按钮测试：mock `AbortController`，点击后验证 `abort()` 被调用（文件：`src/__test__/components/ChatPanelSender.test.tsx`，行 175-197）
- [x] 1.2 修复或删除 compositionEnd 时间戳测试：验证时间戳相关行为，或删除此测试用例（文件：`src/__test__/components/ChatPanelSender.test.tsx`，行 452-469）

## 2. 移除 dangerouslyIgnoreUnhandledErrors

- [x] 2.1 实验阶段：在本地分支移除 `vite.config.ts` 行 65 的 `dangerouslyIgnoreUnhandledErrors: true`，运行完整测试套件，收集所有失败清单
- [x] 2.2 评估阶段：按文件分类失败项，区分"测试隔离 bug"和"预期的 rejection"
- [x] 2.3 修复阶段：逐一修复暴露的 rejection——隔离 bug 添加清理逻辑，预期 rejection 添加 `expect(...).rejects` 显式处理
- [x] 2.4 若失败数量过大（>20），启用备选方案：暂时保留配置，在新增测试中通过 review checklist 禁止依赖此行为

## 3. 删除重复的 vi.mock 块

- [x] 3.1 删除 `src/__test__/integration/app-loading.integration.test.ts` 中重复的第一个 mock 块（行 25-34），保留第二个（行 39-48）

## 4. 验证

- [x] 4.1 运行完整测试套件确认所有测试通过
- [x] 4.2 确认无新的 unhandled rejection 警告
