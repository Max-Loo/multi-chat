## ADDED Requirements

### Requirement: 使用 tauri-plugin-keyring 存储主密钥
系统 SHALL 使用 `tauri-plugin-keyring` 插件将主密钥存储到系统级安全存储。keyring 仅负责存储，不负责生成密钥。

#### Scenario: 存储新生成的主密钥
- **WHEN** 应用生成新的 256-bit 主密钥
- **THEN** 系统 SHALL 调用 `tauri-plugin-keyring` 的 `setPassword(service, user, password)` API
- **AND** 参数 SHALL 为：
  - service: "com.multichat.app"
  - user: "master-key"  
  - password: 生成的 256-bit 密钥（hex 编码）
- **AND** 插件 SHALL 根据当前操作系统自动存储到：
  - macOS: Keychain
  - Windows: DPAPI
  - Linux: Secret Service
- **AND** 访问权限 SHALL 限制为当前应用

#### Scenario: 从 keyring 读取主密钥
- **WHEN** 应用需要读取主密钥用于加密/解密
- **THEN** 系统 SHALL 调用 `tauri-plugin-keyring` 的 `getPassword(service, user)` API
- **AND** 参数 SHALL 为 service="com.multichat.app", user="master-key"
- **AND** 系统 SHALL 返回存储的密钥值

### Requirement: keyring 访问错误处理
当 `tauri-plugin-keyring` 访问失败时，系统 SHALL 显示用户友好的错误信息，并提供适当的恢复建议。

#### Scenario: keyring 访问被拒绝
- **WHEN** 应用尝试通过 keyring 访问密钥存储
- **AND** 访问被拒绝（如用户拒绝了钥匙串权限请求）
- **THEN** 系统 SHALL 显示错误提示"无法访问系统安全存储，请检查钥匙串权限设置"
- **AND** 系统 SHALL 提供按钮打开系统钥匙串设置（如适用）
- **AND** 系统 SHALL 允许用户选择退出应用并手动修复权限