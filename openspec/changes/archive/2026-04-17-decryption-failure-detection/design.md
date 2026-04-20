## Context

`decryptModelSensitiveFields`（`modelStorage.ts`）在解密失败时将 `apiKey` 静默置为 `""`。调用方 `loadModelsFromJson` 返回 `Model[]`，不携带任何错误信息。上层（`initializeModels` thunk → initSteps → `InitResult` → `MainApp.tsx`）完全无法感知解密失败。

同时，`""` 会在后续 `saveModelsToJson` 时覆盖磁盘上的 `enc:` 原始加密数据，导致不可逆数据丢失。

现有模式参考：`masterKeyRegenerated` 通过 `context.setResult('masterKeyRegenerated', bool)` → `InitializationManager` 提取 → `InitResult.masterKeyRegenerated` → `MainApp.tsx` 检测并显示 Toast。本变更沿用同一模式。

## Goals / Non-Goals

**Goals:**

- 解密失败时保留 `enc:` 原始值，防止后续保存覆盖可恢复的加密数据
- `loadModelsFromJson` 返回解密失败统计信息
- 通过 `InitResult.decryptionFailureCount` 将失败信息传递到 UI 层
- `MainApp.tsx` 检测解密失败并显示恢复通知

**Non-Goals:**

- 不修改 `encryptField` / `decryptField` 的加解密实现
- 不修改 keyring 兼容层
- 不迁移密钥导入入口（由 `key-import-recovery` 变更负责）
- 不修改 FatalErrorScreen 的错误处理
- 不实现恢复对话框或导入 UI（由 `key-import-recovery` 变更负责）

## Decisions

### D1: 解密失败时保留 `enc:` 原始值

**决策**: `decryptModelSensitiveFields` 解密失败时，保持 `apiKey` 为原始 `enc:xxx` 值，不置空。

**备选方案**:
- A) 置空 + 在 middleware 中阻断所有保存 → 用户在恢复前不能操作任何模型，副作用大
- B) 置空 + 引入 `_decryptionFailed` 标记 → 污染 Model 类型，增加 save 路径复杂度

**理由**: 保留 `enc:` 利用现有 `encryptModelSensitiveFields` 中 `!model.apiKey.startsWith("enc:")` 检查，天然阻止覆写。零额外代码即可实现数据保护。`enc:` 值到达 `getProvider` 时会因 API 认证失败而被拒绝，与 `""` 的结果一致（都不可用）。

### D2: `loadModelsFromJson` 返回结构化结果

**决策**: 返回值从 `Model[]` 改为 `{ models: Model[]; decryptionFailureCount: number }`。

**备选方案**:
- A) 单独新增 `detectDecryptionFailures()` 函数 → 需要再次遍历模型列表，冗余
- B) 通过回调或事件通知 → 引入新的通信模式，与现有同步返回风格不一致

**理由**: 解密和统计在同一次遍历中完成，结构化返回值最自然。调用方只需改解构方式。

### D3: 沿用 `masterKeyRegenerated` 的 InitResult 传递模式

**决策**: models 步骤中 `context.setResult('decryptionFailureCount', count)`，`InitializationManager` 提取到 `InitResult.decryptionFailureCount`。

**备选方案**:
- A) 在 models 步骤的 `onError` 中处理 → models 步骤是 warning 级别，解密失败不触发 onError
- B) 让 `initializeModels` thunk 直接 dispatch 一个新 action → 增加中间层

**理由**: 与 `masterKeyRegenerated`、`modelProviderStatus` 保持同一模式，一致且可预测。

### D4: `MainApp.tsx` 的通知策略

**决策**: 检测 `decryptionFailureCount > 0` 时显示 `duration: Infinity` 的 Toast，提示"N 个模型的 API Key 无法解密"并提供"导入密钥"按钮（导航到 `/setting/key-management`，待 `key-import-recovery` 变更后改为打开恢复对话框）。

**理由**: 与现有 `masterKeyRegenerated` 的 Toast 模式一致。当前阶段先导航到设置页作为过渡，`key-import-recovery` 变更会替换为恢复对话框。

## Risks / Trade-offs

**[`enc:` 值出现在 Redux Store]** → 违反了"enc: 不离开存储层"的分层约定。缓解：`enc:` 值到达 `getProvider` 后 API 调用必然失败，与 `""` 的用户体验一致。且数据保护收益远大于分层违反的代价。

**[`initializeModels` thunk 返回类型变更]** → 从 `Model[]` 变为 `{ models, decryptionFailureCount }`，需确认 `unwrap()` 的调用方是否受影响。缓解：`initializeModels` 的调用方仅限 initSteps，影响可控。

**[与 `key-import-recovery` 的依赖关系]** → 本变更的 Toast 按钮导航到设置页作为过渡方案，`key-import-recovery` 完成后会替换为恢复对话框。缓解：两个变更可独立实施，过渡期间功能不中断。
