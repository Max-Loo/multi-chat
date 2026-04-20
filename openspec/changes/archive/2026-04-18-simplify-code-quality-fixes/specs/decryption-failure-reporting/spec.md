## MODIFIED Requirements

### Requirement: 解密失败时显示恢复通知
当 `InitResult.decryptionFailureCount > 0` 时，系统 SHALL 显示持续通知引导用户恢复，并在通知中附带密钥恢复操作按钮。

#### Scenario: 检测到解密失败
- **GIVEN** 应用初始化完成且 `InitResult.decryptionFailureCount > 0`
- **WHEN** `MainApp` 渲染
- **THEN** 系统 SHALL 显示 Toast 警告通知
- **AND** 通知 SHALL 包含失败模型数量信息
- **AND** 通知 SHALL 设为不自动消失（`duration: Infinity`）
- **AND** 通知 SHALL 提供"导入密钥"操作按钮
- **AND** 点击"导入密钥"按钮 SHALL 打开 `KeyRecoveryDialog`

#### Scenario: 同时存在密钥重新生成和解密失败
- **GIVEN** `InitResult.masterKeyRegenerated = true` 且 `InitResult.decryptionFailureCount > 0`
- **WHEN** `MainApp` 渲染
- **THEN** 系统 SHALL 只显示解密失败通知
- **AND** 解密失败通知中的"导入密钥"按钮 SHALL 同时覆盖密钥重新生成的恢复需求
- **AND** 系统 SHALL 不再调用 `hasEncryptedModels()`（该检查在 `decryptionFailureCount > 0` 条件下为冗余死代码）

### Requirement: 密钥重新生成时通知用户
当初始化过程中检测到主密钥为新生成，且存储中存在因密钥变更而无法解密的加密数据时，系统 SHALL 通过 `decryptionFailureCount > 0` 的解密失败通知附带恢复按钮来引导用户。系统 SHALL 不再使用独立的 `hasEncryptedModels()` 调用检查加密数据。通知 MUST 仅在组件挂载时触发一次，不响应语言切换等后续变化。

#### Scenario: 密钥重新生成且存在加密数据时通过解密失败通知恢复
- **GIVEN** 应用初始化完成
- **AND** `initializeMasterKey()` 返回 `isNewlyGenerated: true`
- **AND** 存在加密模型数据导致 `decryptionFailureCount > 0`
- **WHEN** 主界面加载完成
- **THEN** 系统 SHALL 显示解密失败通知（包含恢复操作按钮）
- **AND** 通知 SHALL 提供"导入密钥"操作跳转到密钥导入流程
- **AND** 通知 SHALL 提供"我知道了"操作关闭通知
- **AND** 通知 SHALL 持续显示直到用户主动操作

#### Scenario: 首次使用（密钥新生成但无加密数据）时不显示通知
- **GIVEN** 应用初始化完成
- **AND** `initializeMasterKey()` 返回 `isNewlyGenerated: true`
- **AND** `decryptionFailureCount === 0`（首次使用，无旧加密数据）
- **WHEN** 主界面加载完成
- **THEN** 系统 SHALL 不显示任何密钥相关通知

#### Scenario: 密钥未重新生成时不显示通知
- **GIVEN** 应用初始化完成
- **AND** `initializeMasterKey()` 返回 `isNewlyGenerated: false`
- **AND** `decryptionFailureCount === 0`
- **WHEN** 主界面加载完成
- **THEN** 系统 SHALL 不显示密钥变更通知
