## Why

经过二次深度校验，项目测试覆盖存在 3 个确认缺口：`tauriCompat/env.ts` 的环境检测逻辑从未被直接测试（仅被 mock）、`ChatExportSetting.tsx` 导出组件覆盖薄弱（仅测 1 条路径）、`config/navigation.tsx` 导航配置无完整性校验。这些缺口导致核心平台检测、数据导出 UI 和导航配置的正确性完全依赖人工信任。

## What Changes

- 为 `src/utils/tauriCompat/env.ts` 新增独立单元测试，验证 `isTauri()`、`isTestEnvironment()`、`getPBKDF2Iterations()` 的实际逻辑
- 为 `src/pages/Setting/components/GeneralSetting/components/ChatExportSetting.tsx` 补充测试，覆盖 `downloadJson()`、导出全部、loading 状态、错误处理等未测路径
- 为 `src/config/navigation.tsx` 新增配置完整性测试，验证 `NAVIGATION_ITEMS` 与 `NAVIGATION_ITEM_MAP` 的一致性和字段完整性

## Capabilities

### New Capabilities

- `tauri-compat-env-testing`: tauriCompat/env.ts 环境检测函数的单元测试覆盖
- `chat-export-setting-testing`: ChatExportSetting 组件交互逻辑的单元测试覆盖
- `navigation-config-testing`: navigation.tsx 导航配置完整性校验测试

### Modified Capabilities

（无，本次变更不修改已有 spec 的需求定义）

## Impact

- **新增测试文件**：3 个测试文件，位于 `src/__test__/` 对应子目录下
- **受测源文件**：`env.ts`、`ChatExportSetting.tsx`、`navigation.tsx`（仅读取，不修改）
- **测试基础设施**：可能需要调整 `env.ts` 的全局 mock 策略，使特定测试用例能测试真实逻辑
- **无破坏性变更**：纯增量测试，不影响现有代码和测试
