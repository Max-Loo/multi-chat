## 1. 工具函数提取

- [x] 1.1 在 `src/store/storage/modelStorage.ts` 中定义并导出 `isModelEncrypted(model: Model): boolean` 函数
- [x] 1.2 将 `modelStorage.ts` 中 `encryptModelSensitiveFields` 和 `decryptModelSensitiveFields` 内的 `startsWith("enc:")` 替换为 `isEncrypted()` 调用
- [x] 1.3 将 `hasEncryptedModels` 中的内联谓词替换为 `isModelEncrypted()` 调用

## 2. keyVerification 重构

- [x] 2.1 在 `keyVerification.ts` 中移除 `verificationStore` 模块级变量、`getVerificationStore()` 函数
- [x] 2.2 从 `modelStorage.ts` 导入 `getModelsStore` 和 `resetModelsStore`
- [x] 2.3 将 `verifyMasterKey` 中的 store 获取改为调用 `getModelsStore()`
- [x] 2.4 将 `resetVerificationStore` 改为委托调用 `resetModelsStore()`
- [x] 2.5 将 `verifyMasterKey` 中的加密检测谓词替换为 `isModelEncrypted()` 调用
- [x] 2.6 移除 `verifyMasterKey` 中多余的 `finally` 块（store 生命周期现在由 modelStorage 管理）

## 3. 导出更新

- [x] 3.1 确认 `modelStorage.ts` 导出 `getModelsStore`、`resetModelsStore`、`isModelEncrypted`
- [x] 3.2 确认 `keyVerification.ts` 的公共 API（`verifyMasterKey`、`resetVerificationStore`）签名不变

## 4. 验证

- [x] 4.1 运行 `pnpm tsc` 确认无类型错误（已有的 StepName 错误与本变更无关）
- [x] 4.2 运行 `pnpm lint` 确认无 lint 警告
- [x] 4.3 运行 `pnpm test` 确认现有测试通过（125 文件，1670 测试全部通过）
