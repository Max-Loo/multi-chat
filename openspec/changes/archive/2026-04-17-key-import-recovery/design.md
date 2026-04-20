## Context

当前密钥导入入口仅在设置页面 (`KeyManagementSetting`)，但真正需要导入的场景是错误恢复：

1. **Web 端 seed 丢失**：localStorage 中的 seed 被清除，但 IndexedDB 中的加密数据仍在。新 seed 派生的新 encryptionKey 无法解密旧密文，导致 `getMasterKey()` 抛异常 → FatalErrorScreen。此时 `importMasterKey` 实际上可以工作（新 seed 持久化后，导入的密钥用新 encryptionKey 加密并写入 IndexedDB，reload 后可正常读取）。
2. **Tauri 端钥匙串被清除**：`getMasterKey()` 返回 null → 新密钥生成 → `masterKeyRegenerated=true` → Toast 提示用户导入。当前 Toast 按钮导航到设置页。

此外，`decryptModelSensitiveFields` 中解密失败时静默置空 `apiKey`，不抛异常，调用方完全不知道解密失败。导入错误密钥后用户无法得到任何反馈。

## Goals / Non-Goals

**Goals:**

- 将密钥导入从"通用设置功能"迁移到"错误恢复上下文"
- FatalErrorScreen 中提供密钥导入入口（覆盖 W3 等 Web 端可恢复场景）
- 密钥重新生成 Toast 的"导入密钥"按钮改为打开独立恢复对话框
- 导入密钥时验证其是否能解密现有加密数据
- 移除设置页面的密钥导入 UI

**Non-Goals:**

- 不修改 keyring 兼容层或加密算法
- 不修改 FatalErrorScreen 的其他错误处理（如 keyring 完全不可用时的重置流程）
- 不处理密钥轮换或定期更换
- 不做加密文件导入（仅支持明文密钥字符串粘贴）
- 不解决 `decryptModelSensitiveFields` 的静默吞错问题（属于独立改进）

## Decisions

### D1: 密钥验证通过独立模块 `keyVerification.ts` 实现

**决策**: 新建 `src/store/keyring/keyVerification.ts` 模块，包含 `verifyMasterKey(key: string)` 函数。该函数直接导入 `modelStorage.ts` 的 `loadFromStore`（读取模型数据）和 `crypto.ts` 的 `decryptField`（尝试解密），不导入 `masterKey.ts`，避免循环依赖。

**备选方案**:
- A) 将 `verifyMasterKey` 放在 `modelStorage.ts` → 会导致 `masterKey.ts` ↔ `modelStorage.ts` 循环依赖（`modelStorage.ts` 已导入 `getMasterKey`）
- B) 仅验证 hex 格式，不验证能否解密 → 用户导入错误密钥无反馈
- C) 导入后 reload，由 models 步骤的解密结果判断 → 太晚，已覆写旧密钥

**理由**: 在覆写密钥前验证是唯一安全的时机。独立模块消除循环依赖，`loadFromStore` 和 `decryptField` 是现有函数，验证成本很低。

### D2: FatalErrorScreen 和 Toast 恢复共用同一个 `KeyRecoveryDialog` 组件

**决策**: 新建 `src/components/KeyRecoveryDialog/` 组件，包含密钥输入、验证逻辑和结果反馈。FatalErrorScreen 直接嵌入，Toast 按钮通过状态控制显示。

**备选方案**:
- A) 两处各自实现导入 UI → 重复代码，验证逻辑需维护两份
- B) 在 FatalErrorScreen 中用路由导航到独立恢复页面 → 增加路由复杂度，FatalErrorScreen 本身已在 Router 外

**理由**: 共用组件保证验证行为一致，且 FatalErrorScreen 在 Router 外，无法使用路由导航。

### D3: FatalErrorScreen 仅在 masterKey 步骤失败时显示导入按钮

**决策**: 给 `InitError` 增加 `stepName?: string` 字段，各步骤的 `onError` 回调填入步骤名称。FatalErrorScreen 通过 `error.stepName === 'masterKey'` 判断是否为 masterKey 步骤的 fatal 错误。

**备选方案**:
- A) 通过错误消息内容匹配（如包含 "master key" 或 "密钥" 关键词）→ i18n 已在 masterKey 之前完成，错误消息是翻译后的字符串，多语言环境下匹配不可靠
- B) 始终显示导入按钮 → 对非密钥错误（如 i18n 失败）显示导入按钮会误导用户

**理由**: `stepName` 字段从根源消除了脆弱的字符串匹配，只需在 `InitError` 接口增加一个可选字段、各步骤 `onError` 填入 `step.name`，影响范围极小。

### D4: 验证失败时允许用户选择继续导入

**决策**: 验证失败（密钥不匹配）时显示警告"导入的密钥无法解密现有数据"，但提供"仍然导入"和"取消"两个选项。可能场景：用户有多个备份密钥，想先试一个。

**备选方案**:
- A) 验证失败直接拒绝导入 → 过于严格，用户无法尝试其他密钥
- B) 不提供选择，直接取消 → 同 A

**理由**: 用户最了解自己的情况，系统应提供建议但不强制阻断。

### D5: 无加密数据时跳过验证

**决策**: 如果 `hasEncryptedModels()` 返回 false（没有加密数据），直接接受导入，不做验证。

**理由**: 没有加密数据意味着没有可验证的内容，此时密钥匹配检查无意义。

## Risks / Trade-offs

**[FatalErrorScreen 中 WebKeyringCompat 状态一致性]** → FatalErrorScreen 渲染时，WebKeyringCompat 单例保持初始化状态（db + encryptionKey）。`importMasterKey` 会复用这个状态。如果状态不一致（理论上不应发生），导入可能静默失败。缓解：导入操作本身有 try-catch，失败时显示错误提示。

**[Toast 恢复对话框需要 Portal]** → Toast 是通过 sonner 渲染的，对话框需要 Portal 脱离 Toast 容器。缓解：使用 `AlertDialog` 组件（已有 Portal 实现）。

**[移除设置导入后的 T3 恢复路径变更]** → T3 用户通过 Toast 按钮进入恢复对话框，不再导航到设置页。如果用户关闭了 Toast，就无法再触发导入。缓解：Toast 设为 `duration: Infinity`，不自动消失。
