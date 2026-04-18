## Why

代码审查发现 3 项 P0 级运行时危害（资源泄漏、死代码路径）和 6 项 P1/P2 级代码质量问题。P0 问题直接影响应用稳定性——Store 连接未关闭可能导致文件句柄泄漏，密钥恢复通知因死代码路径永远不会触发。这些问题应立即修复以消除运行时风险并降低维护负担。

## What Changes

### P0 — 运行时危害修复

- **E1**: 修复 `hasEncryptedModels` 死代码路径——密钥重新生成后恢复提示永远无法触发，需调整 `MainApp` 通知逻辑，在 `decryptionFailureCount > 0` 分支中直接展示恢复提示或在 `InitResult` 中携带加密模型信息
- **E2**: 修复 `verificationStore` 未关闭——`verifyMasterKey` 完成后关闭 store 或复用 `modelStorage.ts` 的 `getModelsStore()` 单例，避免文件句柄泄漏和双重连接
- **E3**: 修复 `clearTauriStore` 中 LazyStore 未调用 `close()`——在 `save()` 后调用 `store.close()`，防止与 `modelsStore` 单例的写入冲突

### P1 — 潜在风险消除

- **Q1**: 移除冗余状态 `isFetchingKey`，所有使用处替换为 `exportState === ""`，减少状态同步负担
- **Q2**: 从 `initSteps.ts` 导出步骤名常量，`FatalErrorScreen` 中引用常量替代硬编码字符串 `'masterKey'`
- **Q5**: `InitializationManager` 在调用 `onError` 后自动注入 `initError.stepName = step.name`，各步骤的 `onError` 无需再手动声明

### P2 — 代码质量提升

- **R1**: 将重置确认 AlertDialog JSX 提取为共享组件或放入 `useResetDataDialog` hook 返回，消除 `KeyManagementSetting` 和 `FatalErrorScreen` 中的重复代码
- **Q4**: 移除 `KeyManagementSetting` 中外层 `items-center` 和内层 `w-full` div 的不必要嵌套
- **R2**: 将 `'multi-chat-security-warning-dismissed'` 提取为命名常量，`masterKey.ts` 和 `resetAllData.ts` 两处引用

## Capabilities

### New Capabilities

无。本变更为修复和重构，不引入新的功能能力。

### Modified Capabilities

- `decryption-failure-reporting`: E1 修复后密钥重新生成的恢复提示将正确触发，需更新解密失败通知的触发逻辑
- `app-master-key`: E2 修复 verificationStore 生命周期管理，store 在验证完成后正确关闭或复用单例
- `data-reset`: E3 修复 clearTauriStore 资源释放；R1 提取共享重置确认对话框组件

## Impact

- **文件变更**（预计 8-10 个文件）:
  - `src/MainApp.tsx` — 通知逻辑调整（E1）
  - `src/store/keyring/keyVerification.ts` — store 生命周期管理（E2）
  - `src/utils/resetAllData.ts` — store.close() 调用（E3）、常量引用（R2）
  - `src/config/initSteps.ts` — 导出步骤名常量、移除手动 stepName（Q2、Q5）
  - `src/config/InitializationManager.ts` — 自动注入 stepName（Q5）
  - `src/pages/Setting/components/KeyManagementSetting/index.tsx` — 移除冗余状态、简化 JSX（Q1、Q4、R1）
  - `src/components/FatalErrorScreen/index.tsx` — 引用常量、共享对话框组件（Q2、R1）
  - `src/store/keyring/masterKey.ts` — 常量提取（R2）
- **无 API 变更**，无破坏性变更
- **依赖**: 无新依赖
