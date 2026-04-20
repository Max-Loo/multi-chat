## 1. P0 运行时危害修复

- [x] 1.1 **E1: 修复 hasEncryptedModels 死代码路径** — 在 `MainApp.tsx` 中移除 `hasEncryptedModels` import 和密钥重新生成的独立检查分支（77-103 行），在 `decryptionFailureCount > 0` 分支的 toast 中直接附带恢复按钮（已存在 `onClick` 打开 `KeyRecoveryDialog`，无需额外修改），移除 `checkAndNotify` 异步函数和 `masterKeyRegenerated` 判断
- [x] 1.2 **E2: 修复 verificationStore 未关闭** — 在 `keyVerification.ts` 的 `verifyMasterKey` 函数中，使用 try/finally 包裹逻辑，在 finally 块中调用 `verificationStore?.close()` 并置 `verificationStore = null`
- [x] 1.3 **E3: 修复 clearTauriStore 未调用 close** — 在 `resetAllData.ts` 的 `clearTauriStore` 函数中，在 `store.save()` 后添加 `await store.close()`

## 2. P1 潜在风险消除

- [x] 2.1 **Q2: 导出步骤名常量** — 在 `initSteps.ts` 中导出 `MASTER_KEY_STEP_NAME = 'masterKey'` 常量
- [x] 2.2 **Q2: 引用步骤名常量** — 在 `FatalErrorScreen/index.tsx` 中导入 `MASTER_KEY_STEP_NAME`，将 `error.stepName === 'masterKey'` 替换为 `error.stepName === MASTER_KEY_STEP_NAME`
- [x] 2.3 **Q5: InitializationManager 自动注入 stepName** — 在 `InitializationManager.ts` 的 catch 块中，调用 `step.onError(error)` 后添加 `initError.stepName = step.name`
- [x] 2.4 **Q5: 移除各步骤 onError 中的手动 stepName** — 在 `initSteps.ts` 中移除所有 9 个 `onError` 回调中的 `stepName` 字段
- [x] 2.5 **Q1: 移除 isFetchingKey 冗余状态** — 在 `KeyManagementSetting/index.tsx` 中删除 `isFetchingKey` state，将所有 `isFetchingKey` 引用替换为 `exportState === ""`，移除 `setIsFetchingKey` 调用和 `finally` 块中的重置

## 3. P2 代码质量提升

- [x] 3.1 **R2: 提取 SECURITY_WARNING_DISMISSED_KEY 常量** — 在 `masterKey.ts` 中导出 `SECURITY_WARNING_DISMISSED_KEY = 'multi-chat-security-warning-dismissed'`，替换文件内的两处硬编码字符串
- [x] 3.2 **R2: resetAllData 引用常量** — 在 `resetAllData.ts` 中从 `masterKey.ts` 导入 `SECURITY_WARNING_DISMISSED_KEY`，替换 `KEYRING_LOCAL_STORAGE_KEYS` 数组中的硬编码字符串
- [x] 3.3 **R1: useResetDataDialog 返回 renderResetDialog** — 在 `useResetDataDialog.ts` 中新增 `renderResetDialog` 函数，返回完整的重置确认 AlertDialog JSX（包含 i18n、destructive 样式按钮）
- [x] 3.4 **R1: KeyManagementSetting 使用 renderResetDialog** — 在 `KeyManagementSetting/index.tsx` 中，将内联的重置确认 AlertDialog JSX 替换为 `{renderResetDialog()}`
- [x] 3.5 **R1: FatalErrorScreen 使用 renderResetDialog** — 在 `FatalErrorScreen/index.tsx` 中，将内联的重置确认 AlertDialog JSX 替换为 `{renderResetDialog()}`
- [x] 3.6 **Q4: 移除不必要的 JSX 嵌套** — 在 `KeyManagementSetting/index.tsx` 中，移除外层容器的 `items-center` class

## 4. 验证

- [x] 4.1 运行 `pnpm tsc` 确认类型检查通过
- [x] 4.2 运行 `pnpm lint` 确认 lint 通过
- [x] 4.3 运行 `pnpm test` 确认所有测试通过
