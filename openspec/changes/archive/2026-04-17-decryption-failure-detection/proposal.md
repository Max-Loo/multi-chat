## Why

`decryptModelSensitiveFields` 在解密失败时将 `apiKey` 静默置为 `""`，导致两个严重后果：(1) 上层无法感知解密失败，用户看到模型在列表中但无法使用，完全不知道原因；(2) 任何后续模型操作（添加、编辑、删除）触发 `saveModelsToJson` 时，`""` 会覆盖磁盘上的 `enc:` 加密数据，造成不可逆的数据丢失，即使之后导入正确密钥也无法恢复。

## What Changes

- 解密失败时保留原始 `enc:` 加密值而非置空，利用 `encryptModelSensitiveFields` 已有的 `!model.apiKey.startsWith("enc:")` 检查天然阻止覆写
- `loadModelsFromJson` 返回解密失败统计信息（失败数量和失败模型 ID），通过 `initializeModels` → initSteps context → `InitResult.decryptionFailureCount` 传递到 UI 层
- `MainApp.tsx` 检测 `decryptionFailureCount > 0`，显示恢复通知并引导用户导入密钥

> **注意**：密钥导入入口的迁移（从设置页移到错误恢复上下文）由 `key-import-recovery` 变更负责，本变更仅关注检测和上报。

## Capabilities

### New Capabilities

- `decryption-failure-reporting`: 模型加载时检测并上报解密失败，保留加密原始值防止数据损坏，通过 InitResult 将失败信息传递到 UI 层

### Modified Capabilities

- `field-level-encryption`: 解密失败时的行为从"置空并静默吞掉错误"改为"保留 enc: 原始值并上报失败信息"

## Impact

- `src/store/storage/modelStorage.ts` — `decryptModelSensitiveFields` 保留 enc: 值、`loadModelsFromJson` 返回失败统计
- `src/store/slices/modelSlice.ts` — `initializeModels` thunk 适配新返回结构
- `src/config/initSteps.ts` — models 步骤上报 `decryptionFailureCount`
- `src/services/initialization/types.ts` — `InitResult` 新增 `decryptionFailureCount` 字段
- `src/services/initialization/InitializationManager.ts` — 从 context 提取 `decryptionFailureCount`
- `src/MainApp.tsx` — 检测解密失败并显示恢复通知
- `src/__test__/store/storage/modelStorage.test.ts` — 更新解密失败场景的测试期望值（apiKey 从期望 `""` 改为期望保留 `enc:` 值）
