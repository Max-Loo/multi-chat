## MODIFIED Requirements

### Requirement: 用户可以导入备份的主密钥
系统 SHALL 提供 `importMasterKey()` 函数，允许用户输入之前导出的主密钥来恢复加密数据。导入成功后系统 SHALL 显示简洁成功提示并立即刷新页面，让应用以新密钥重新初始化。

#### Scenario: 用户通过设置页面导入有效密钥
- **GIVEN** 用户已进入设置页面的密钥管理区域
- **WHEN** 用户粘贴有效的 64 字符 hex 编码密钥字符串并确认导入
- **THEN** 系统 SHALL 验证密钥格式（64 字符 hex）
- **AND** 系统 SHALL 将该密钥存储到 keyring，替换当前密钥
- **AND** 系统 SHALL 显示"密钥导入成功"提示
- **AND** 系统 SHALL 立即刷新页面，让应用以新密钥重新初始化

#### Scenario: 用户导入格式无效的密钥
- **GIVEN** 用户已进入密钥导入界面
- **WHEN** 用户输入的字符串不是有效的 64 字符 hex 编码
- **THEN** 系统 SHALL 拒绝导入
- **AND** 系统 SHALL 显示错误提示"密钥格式无效，请输入 64 字符的 hex 编码字符串"

#### Scenario: 密钥存储到 keyring 失败
- **GIVEN** 用户输入了有效的密钥格式
- **WHEN** `storeMasterKey()` 调用失败（如 keyring 不可访问）
- **THEN** 系统 SHALL 显示错误提示，说明导入失败的原因
- **AND** 系统 SHALL 不刷新页面

#### Scenario: 导入成功后页面刷新
- **GIVEN** 密钥已成功存储到 keyring
- **WHEN** 页面重新加载
- **THEN** 应用 SHALL 使用新导入的密钥重新初始化
- **AND** 模型数据中的加密字段 SHALL 被新密钥解密
- **AND** 用户可通过模型列表直观判断哪些 API Key 已恢复
