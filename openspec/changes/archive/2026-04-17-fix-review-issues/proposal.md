## Why

master-key-recovery 分支的 simplify 审查发现 13 个问题，其中 7 个 P0/P1 级别问题涉及运行时 Bug（useEffect 竞态导致重复通知）、误导用户（失败时显示成功提示、重置失败无反馈）和代码重复隐患（重置逻辑两处独立维护）。这些问题应在合并前修复。

## What Changes

- 修复 MainApp.tsx 中 `useEffect` 竞态条件：将 `notifiedRef.current = true` 提前为同步守卫，移除 `[t]` 依赖
- 简化 KeyManagementSetting 导入密钥后的验证流程：移除 `initializeModels()` 调用和恢复统计逻辑，导入成功后直接 toast + `window.location.reload()`
- 修复 FatalErrorScreen 重置失败时 catch 块静默吞错的问题，添加 `console.error` 日志
- 抽取 `useResetDataDialog` Hook 消除 FatalErrorScreen 与 KeyManagementSetting 的重置对话框重复代码
- 简化导入密钥后的验证流程：移除不必要的统计逻辑和 `setTimeout` reload，改为直接刷新
- 修正恢复数量统计：不再需要，移除统计逻辑（与导入流程简化合并处理）
- 将 `hasEncryptedDataInStorage` 从 `masterKey.ts` 移到 `modelStorage.ts`，复用已有 store 单例
- 统一存储常量引用：`resetAllData.ts` 引用 `keyring.ts` 和 `keyringMigration.ts` 导出的常量

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `data-reset`: 重置失败时必须记录错误日志（M3）；重置对话框逻辑抽取为共享 Hook 消除重复（H3）；存储常量统一引用（H4）
- `master-key-import`: 导入后移除 `initializeModels()` 验证统计逻辑，直接 toast + reload（M1+M2+M4）
- `app-master-key`: `hasEncryptedDataInStorage` 职责归属调整，从密钥管理模块移至模型存储模块（H1）；MainApp 中密钥重新生成通知修复竞态条件（H2）

## Impact

- **文件变更**: `src/store/keyring/masterKey.ts`（移除函数）、`src/store/storage/modelStorage.ts`（新增函数）、`src/MainApp.tsx`（修复竞态）、`src/components/FatalErrorScreen/index.tsx`（使用 Hook）、`src/pages/Setting/components/KeyManagementSetting/index.tsx`（使用 Hook + 简化导入流程）、`src/utils/resetAllData.ts`（统一常量引用）
- **新增文件**: `src/hooks/useResetDataDialog.ts`（共享 Hook）
- **测试影响**: `src/__test__/integration/master-key-recovery.integration.test.tsx`、`src/__test__/store/keyring/masterKey.test.ts` 需同步更新
- **无 API 变更**: 所有改动为内部实现修复，不影响外部接口
