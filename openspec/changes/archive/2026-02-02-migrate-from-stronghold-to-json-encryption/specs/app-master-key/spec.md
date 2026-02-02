## ADDED Requirements

### Requirement: 应用首次启动时生成并存储主密钥
应用在首次启动时 SHALL 使用 Web Crypto API 生成 256-bit 随机密钥，并使用 `tauri-plugin-keyring` 存储到系统级安全存储中。

#### Scenario: 首次启动应用
- **WHEN** 应用首次启动且 keyring 中不存在主密钥
- **THEN** 系统 SHALL 使用 Web Crypto API 的 `crypto.getRandomValues()` 生成 256-bit 随机密钥
- **AND** 系统 SHALL 调用 `tauri-plugin-keyring` 的 `setPassword(service, user, key)` 将密钥存储到系统级安全存储
  - service: "com.multichat.app"
  - user: "master-key"
- **AND** 应用 SHALL 正常进入主界面

### Requirement: 应用启动时读取主密钥
应用在每次启动时 SHALL 通过 `tauri-plugin-keyring` 从系统级安全存储读取主密钥。如果主密钥存在，则正常加载；如果不存在，则生成新的主密钥。

#### Scenario: 应用正常启动（主密钥已存在）
- **WHEN** 应用启动
- **AND** keyring 中已存在主密钥
- **THEN** 系统 SHALL 调用 `tauri-plugin-keyring` 的 `getPassword(service, user)` 从系统存储读取主密钥
- **AND** 应用 SHALL 正常进入主界面

#### Scenario: 应用启动时密钥丢失
- **WHEN** 应用启动
- **AND** keyring 中不存在主密钥（可能因系统重置或首次使用）
- **THEN** 系统 SHALL 使用 Web Crypto API 生成新的 256-bit 随机密钥
- **AND** 系统 SHALL 调用 `tauri-plugin-keyring` 的 `setPassword` 将新密钥存储到系统级安全存储
- **AND** 应用 SHALL 显示警告提示用户旧加密数据将无法解密
- **AND** 应用 SHALL 正常进入主界面

### Requirement: 主密钥不可直接暴露
主密钥 SHALL 仅通过 `tauri-plugin-keyring` API 读取，不应以明文形式暴露在日志、调试工具或用户界面中。

#### Scenario: 调试应用状态
- **WHEN** 开发者查看应用状态或日志
- **THEN** 系统 SHALL 确保主密钥不会以明文形式出现在任何日志输出中
- **AND** 系统 SHALL 确保主密钥不会暴露在 Redux DevTools 等调试工具中
- **AND** 系统 SHALL 按需从 keyring 读取密钥，不长期保留在内存中