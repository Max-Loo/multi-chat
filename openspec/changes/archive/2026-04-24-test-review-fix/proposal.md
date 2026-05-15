## Why

`simplify-review.md` 审查报告（2026-04-23）识别出 20 个测试质量问题，2026-04-24 三次验证确认全部未修复。其中 P0 级 4 项（状态泄漏风险、循环论证测试）和 P1 级 10 项（重复 mock、死代码、脆弱断言）直接影响测试的可维护性、执行效率和可靠性。项目已有 157 个测试文件，技术债持续累积会增加后续维护成本。

## What Changes

### P0 — 立即修复

- 提取 `setup.ts` 中 3 个重复的 AI SDK provider mock（`createDeepSeek`/`createMoonshotAI`/`createZhipu`）为 `createMockAIProvider` 工厂函数，减少约 50 行重复代码
- 移除 38 个测试文件中冗余的 `cleanup()` 调用（`setup.ts` 全局 `afterEach` 已处理）
- 删除 `verify-setup-mock.test.ts`（仅验证 mock 基础设施本身，不涉及业务逻辑）
- 修复 `FatalErrorScreen.test.tsx` 和 `NoProvidersAvailable.test.tsx` 中 `window.location` 替换未恢复的问题

### P1 — 短期改进

- 将 23 处真实 `setTimeout` 等待替换为 `vi.useFakeTimers()` + `vi.advanceTimersByTime()`
- 统一 `ThinkingSection.test.tsx` 的 `markdown-it`/`dompurify` mock 为共享工厂；`ChatBubble.test.tsx` 保留使用真实库（其测试验证真实 HTML 渲染结果）
- 将 3 个文件的 `useResponsive` 手动 mock 改为使用已有的 `globalThis.__createResponsiveMock()`
- 创建 `useAdaptiveScrollbar` 共享 mock，消除 5 个文件的重复内联定义
- 在 `setup.ts` 中全局 mock `@/components/ui/skeleton`，消除 4 个文件的重复定义
- 迁移剩余 9 个文件的手动 Provider+BrowserRouter 包装到 `renderWithProviders`
- 统一测试命名风格，去除编号前缀（`4.1.1`、`5.1`）和混合中英文
- 清理 4 个 slice 测试文件中的"已删除测试"注释块
- 修复 `setup.ts` 第 341-342 行的重复注释
- 移除 3 个文件（keyVerification、modelSlice、app-loading）中与 `setup.ts` 全局 mock 重复的 `storeUtils` mock；`modelStorage.test.ts` 因使用真实存储行为需保留本地 mock
- 删除 `fixtures.test.ts` 中 5 处空 `beforeEach` 块和 `test-keyring.test.ts` 中 7 处 `console.log` 调试残留

## Capabilities

### New Capabilities

- `shared-mock-factories`: 统一 AI SDK provider、markdown-it、dompurify、useAdaptiveScrollbar、skeleton 的 mock 工厂，消除跨文件重复定义
- `test-dead-code-removal`: 移除冗余 cleanup()、循环论证测试、重复 storeUtils mock、空 beforeEach 块、console.log 残留和已删除测试注释
- `test-pattern-modernization`: 将真实 setTimeout 迁移为 fakeTimers、迁移手动 Provider 包装到 renderWithProviders、统一测试命名风格
- `test-assertion-safety`: 修复 window.location 替换未恢复问题，确保测试环境隔离

### Modified Capabilities

无。本次变更仅涉及测试基础设施，不改变任何源代码行为或现有 spec 的需求定义。

## Impact

- **测试文件**：约 50+ 个测试文件需要修改（删除冗余代码、替换 mock 方式、调整命名）
- **setup.ts**：提取工厂函数、添加全局 skeleton mock、修复重复注释
- **测试辅助目录**：`src/__test__/helpers/mocks/` 将新增共享 mock 文件（scrollbar、markdown、dompurify）
- **无源代码变更**：所有改动仅限于 `src/__test__/` 目录
- **无 API 变更**：不影响任何公开接口
- **测试行为**：测试结果应保持不变，仅改善代码质量和执行效率
