## ADDED Requirements

### Requirement: 导入密钥前验证密钥是否能解密现有数据
系统 SHALL 在接受导入密钥前，尝试使用该密钥解密 Store 中的加密数据来验证密钥匹配性。

#### Scenario: 有加密数据且密钥匹配
- **GIVEN** Store 中存在 `enc:` 前缀的加密模型数据
- **WHEN** 用户输入有效的 64 字符 hex 编码密钥并确认导入
- **THEN** 系统 SHALL 使用该密钥尝试 `decryptField` 解密第一个加密的 apiKey
- **AND** 解密成功时，系统 SHALL 接受该密钥并存储到 keyring
- **AND** 系统 SHALL 提示"密钥验证通过"并执行 reload

#### Scenario: 有加密数据但密钥不匹配
- **GIVEN** Store 中存在 `enc:` 前缀的加密模型数据
- **WHEN** 用户输入有效的 64 字符 hex 编码密钥，但该密钥无法解密现有数据
- **THEN** 系统 SHALL 显示警告"导入的密钥无法解密现有数据，请确认密钥是否正确"
- **AND** 系统 SHALL 提供"仍然导入"和"取消"两个选项
- **AND** 用户选择"仍然导入"时，系统 SHALL 接受该密钥并存储到 keyring

#### Scenario: 无加密数据时跳过验证
- **GIVEN** Store 中不存在 `enc:` 前缀的加密模型数据
- **WHEN** 用户输入有效的 64 字符 hex 编码密钥并确认导入
- **THEN** 系统 SHALL 跳过密钥验证，直接接受该密钥并存储到 keyring
- **AND** 系统 SHALL 执行 reload

#### Scenario: 密钥格式无效
- **GIVEN** 用户在密钥导入界面
- **WHEN** 用户输入的字符串不是有效的 64 字符 hex 编码
- **THEN** 系统 SHALL 拒绝导入
- **AND** 系统 SHALL 显示错误提示"密钥格式无效，请输入 64 字符的 hex 编码字符串"

#### Scenario: 验证过程中 keyring 写入失败
- **GIVEN** 密钥验证通过或用户选择仍然导入
- **WHEN** `storeMasterKey()` 调用失败（如 keyring 不可写）
- **THEN** 系统 SHALL 显示错误提示"密钥导入失败，无法写入安全存储"
- **AND** 系统 SHALL 不执行 reload
