## Why

集成测试 README（`src/__test__/integration/README.md`）描述了一套基于 MSW (Mock Service Worker) 的 Mock 架构，但项目中从未安装 MSW，所有 9 个集成测试文件实际使用的是 `vi.mock()` + `vi.importActual()` 模式。文档中引用的 4 个辅助文件（`testServer.ts`、`fixtures.ts` 及其导出）均不存在。新贡献者按 README 模板编写测试会遇到编译失败。

## What Changes

- 删除 README 中所有 MSW 相关内容：安装依赖说明、`setupServer` 配置、分层 Mock 策略表格中的 MSW 引用
- 删除对不存在文件的引用：`testServer.ts`、`fixtures.ts`、`setupTestServer`、`setupErrorHandlers`、`setupTimeoutHandlers`、`integrationFixtures`
- 重写测试模板（基础模板 + 聊天流程模板），替换为实际使用的 `vi.mock` + `vi.hoisted` + `vi.importActual` 模式
- 更新 Mock 策略表格，反映实际的 Service 层模块替换方案

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

（无 spec 级行为变更，仅文档修正）

## Impact

- **文档**：`src/__test__/integration/README.md`（唯一受影响文件）
- **代码**：无代码变更
- **依赖**：无依赖变更（不引入也不移除任何 npm 包）
- **测试**：无测试变更
