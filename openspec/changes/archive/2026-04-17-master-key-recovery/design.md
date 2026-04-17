## Context

当前主密钥管理存在两条故障路径：

1. **Keyring 损坏/不可访问**（场景 B）：`getMasterKey()` 抛出异常 → `initSteps` 标记 fatal → `FatalErrorScreen` 只显示"刷新页面"按钮 → 用户无法恢复
2. **密钥静默丢失**（场景 A）：`initializeMasterKey()` 返回 `string`，调用方无法区分新旧密钥 → 旧加密数据静默失效

现有的 `clearAllKeyringData()`（`keyringMigration.ts`）仅覆盖 Web 环境且为私有函数，`exportMasterKey()` 已实现但无 UI 接入，`importMasterKey()` 完全不存在。

数据存储分两层：安全基础设施（keyring + seed）和业务数据（模型配置含加密 apiKey、聊天记录）。应用配置（语言、偏好）存储在独立的 localStorage key 中，不受密钥变更影响。

## Goals / Non-Goals

**Goals:**

- 为 FatalErrorScreen 提供重置逃生通道，打破死循环
- 密钥重新生成时通知用户，避免静默数据丢失
- 提供密钥导入能力，支持从备份恢复加密数据
- 接入已有的密钥导出功能到 UI

**Non-Goals:**

- 不做加密文件的导出/导入（仅支持明文密钥字符串的复制粘贴）
- 不做跨设备迁移向导
- 不修改 Keyring 兼容层或加密算法本身
- 不处理密钥轮换（定期主动更换密钥）

## Decisions

### D1: `initializeMasterKey()` 返回值改为结构化对象

**决策**: 返回 `Promise<{ key: string; isNewlyGenerated: boolean }>` 而非 `Promise<string>`

**备选方案**:
- A) 在 context 中额外存储一个 flag → 需要改 initSteps 的 execute 签名，侵入性更大
- B) 让 `initializeMasterKey()` 内部直接弹通知 → 违反职责单一，初始化阶段 UI 可能未就绪

**理由**: 结构化返回值是最小侵入方案，调用方自行决定如何处理 `isNewlyGenerated`，不耦合 UI 逻辑。

**影响**: `initSteps.ts` 中 masterKey 步骤的 execute 需要适配新返回值，后续步骤通过 `context.getResult()` 获取 key 时需要改为 `.key`。注意：当前 `models` 步骤不通过 `context.getResult('masterKey')` 获取密钥，而是通过 Redux dispatch 内部调用 `getMasterKey()`，因此 initSteps 层面的影响仅限于 masterKey 步骤自身。

### D6: `isNewlyGenerated` 通过 `InitResult` 传递到 UI 层

**决策**: 在 `InitResult` 接口中新增 `masterKeyRegenerated?: boolean` 字段。`initSteps.ts` 中 masterKey 步骤将 `isNewlyGenerated` 存入 context（key 为 `masterKeyRegenerated`），`InitializationManager` 在构建 `InitResult` 时提取该值。注意：execute 必须返回 `result.key`（字符串），由 `InitializationManager` 自动存入 `context.setResult('masterKey', value)`。

**数据流**:
```
initializeMasterKey()
  → { key, isNewlyGenerated }
    → initSteps masterKey.execute:
        context.setResult('masterKeyRegenerated', isNewlyGenerated)  // UI 层用
        return key  // 必须返回字符串，而非整个对象
      → InitializationManager.runInitialization():
          context.setResult('masterKey', key)             // 管理器自动存储 execute 返回值
          从 context 提取 'masterKeyRegenerated' → result.masterKeyRegenerated
        → InitResult { ..., masterKeyRegenerated: true/false }
          → MainApp.tsx:
              result.masterKeyRegenerated && hasEncryptedData
                → 显示 toast 通知
```

> **注意**: execute 必须返回 `result.key`（字符串）而非 `result`（对象），否则 `InitializationManager.runInitialization()` 中的 `context.setResult(step.name, value)` 会将 context 中的 `masterKey` 从字符串覆写为 `{ key, isNewlyGenerated }` 对象，导致类型不一致。

**备选方案**:
- A) 在 `initSteps` 的 models 步骤中检测解密失败来间接判断 → 耦合了模型加载逻辑，且 models 是 warning 级别可能被跳过
- B) 让 `InitializationManager` 直接调用 `initializeMasterKey()` → 破坏了步骤解耦设计

**理由**: 通过 `InitResult` 的显式字段是最清晰的传递方式。`modelProviderStatus` 已采用相同模式（context → result），保持一致。

### D2: `resetAllData()` 作为独立模块

**决策**: 新建 `src/utils/resetAllData.ts`

**备选方案**:
- A) 放在 `masterKey.ts` → 重置范围远超密钥管理，职责不匹配
- B) 放在 `keyringMigration.ts` → 该模块计划清理（见文件头注释），不适合扩展

**理由**: 重置逻辑涉及 keyring、store、localStorage 多个子系统，独立模块最清晰。

### D3: Tauri 环境的 Store 清理通过 API 而非文件删除

**决策**: 通过 `@tauri-apps/plugin-store` 的 Store API（`store.clear()`）清理数据

**备选方案**:
- A) 通过 `tauri-plugin-fs` 直接删除 JSON 文件 → 绕过 Store 内部状态，可能造成内存与磁盘不一致

**理由**: 使用 Store API 确保内存状态和磁盘同步，避免残留。

### D4: 密钥导入采用明文字符串输入

**决策**: 用户通过输入框粘贴 hex 编码的密钥字符串

**备选方案**:
- A) 文件导入 → 需要文件选择器，增加复杂度
- B) 加密文件导入 → 需要额外的保护密码，用户体验重

**理由**: 密钥是 64 字符 hex 字符串，复制粘贴最简单直接。用户通常通过导出功能获取此字符串。

### D5: 密钥变更通知放在初始化完成后

**决策**: 在 `MainApp.tsx` 的初始化结果处理中检测 `isNewlyGenerated`，使用 toast 通知

**理由**: 初始化阶段 UI 未完全就绪，不适合弹复杂通知。初始化完成后再通知，此时 toast 系统已可用，用户体验更好。

## Risks / Trade-offs

**[密钥明文暴露风险]** → 导出和导入流程中密钥以明文出现在 UI 中。缓解：显示安全警告，建议用户在安全环境下操作，操作完成后尽快清除剪贴板内容。

**[resetAllData 在 Tauri 中部分失败]** → keyring 删除成功但 store 清除失败，导致不一致状态。缓解：每个清理步骤独立 try-catch，不因部分失败中断整体流程，最终统一 reload。

**[initializeMasterKey 返回值变更影响范围]** → `initSteps.ts` 中 masterKey 步骤需要适配。缓解：经验证，`context.getResult('masterKey')` 仅在 initSteps 内部使用，后续步骤（models 等）通过 Redux dispatch 内部直接调用 `getMasterKey()`，无需改动。`isNewlyGenerated` 通过新增的 `InitResult.masterKeyRegenerated` 字段传递到 UI 层，与 `modelProviderStatus` 采用相同模式。

**[导入密钥验证不足]** → 用户可能粘贴无效的密钥字符串。缓解：验证 hex 格式（64 字符）和解密验证（尝试解密一个已知加密字段）。

**[密钥重新生成后模型保存覆盖可恢复数据]** → 密钥重新生成时，`loadModelsFromJson()` 解密失败会将内存中模型的 `apiKey` 设为空字符串，但持久化存储中仍保留 `enc:` 前缀的加密数据。若用户在导入备份密钥前编辑并保存模型配置，`saveModelsToJson()` 会用空 `apiKey`（`encryptModelSensitiveFields` 中 `apiKey.length > 0` 才加密）写回持久化存储，永久覆盖可恢复的加密数据。缓解：（1）密钥变更通知中明确警告用户在导入密钥前不要修改模型配置；（2）通知设为不自动消失（持续显示），确保用户看到警告；（3）通知优先引导用户点击"导入密钥"而非关闭通知。
