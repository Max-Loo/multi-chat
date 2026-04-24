## Why

`tauriCompat/http.ts` 是全项目 HTTP 层基础（~220 行），承担三路环境分支（DEV/生产-Tauri/生产-Web），当前 0% 覆盖率。环境检测出错会导致全部聊天功能静默失败。同时，`store/slices`（68.04%）分支覆盖率偏低，大量异步错误路径未覆盖。

## What Changes

- 为 `tauriCompat/http.ts` 新建测试文件，覆盖三路环境分支、动态导入失败降级、`getFetchFunc` 实例一致性
- 补充 `store/slices` 中 chatSlice、modelSlice 的异步 thunk 错误分支测试

## Capabilities

### New Capabilities

- `http-fetch-testing`: `tauriCompat/http.ts` 跨平台 fetch 逻辑的完整测试覆盖，包括环境检测分支和降级路径

### Modified Capabilities

- `chat-slices-testing`: 补充异步 thunk 错误分支和边界条件覆盖
- `model-slice-testing`: 补充加载失败和状态回滚分支覆盖

### Deferred (out of scope)

- `components/ui` 条件渲染分支测试（27 个组件仅 1 个有测试，需独立 change 规划）
- 5 个 skip 用例推进（涉及密钥导出失败路径，需独立 change 规划）

## Impact

- 新增 1 个测试文件（`http.ts`），增强 2 个现有测试文件（chatSlice、modelSlice）
- 依赖现有 `tauri-compat-shared-modules` 的 mock 基础设施
- 目标：`tauriCompat/http.ts` 分支覆盖率 0% → 80%+，`store/slices` 分支覆盖率 68% → 75%+
