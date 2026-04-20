## MODIFIED Requirements

### Requirement: 应用首次启动时生成并存储主密钥
应用在首次启动时 SHALL 使用 Web Crypto API 生成 256-bit 随机密钥，并根据运行环境选择存储方式：Tauri 端使用 `tauri-plugin-keyring` 存储到系统级安全存储，Web 端使用兼容层存储到 IndexedDB（加密存储）。

#### Scenario: Tauri 环境首次启动应用
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 应用首次启动且 keyring 中不存在主密钥
- **THEN** 系统 SHALL 使用 Web Crypto API 的 `crypto.getRandomValues()` 生成 256-bit 随机密钥
- **AND** 系统 SHALL 调用 `@tauri-plugin-keyring-api` 的 `setPassword(service, user, key)` 将密钥存储到系统级安全存储
  - service: "com.multichat.app"
  - user: "master-key"
- **AND** 应用 SHALL 正常进入主界面

#### Scenario: Web 环境首次启动应用
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 应用首次启动且 IndexedDB 中不存在主密钥
- **THEN** 系统 SHALL 使用 Web Crypto API 的 `crypto.getRandomValues()` 生成 256-bit 随机密钥
- **AND** 系统 SHALL 调用 Keyring 兼容层的 `setPassword(service, user, key)` 将密钥存储到 IndexedDB（AES-256-GCM 加密）
  - service: "com.multichat.app"
  - user: "master-key"
- **AND** 应用 SHALL 正常进入主界面

### Requirement: 主密钥存储错误处理
系统 SHALL 提供健壮的错误处理机制，确保主密钥存储失败时的优雅降级。

#### Scenario: Tauri 环境 keyring 访问失败
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** `@tauri-plugin-keyring-api` 访问失败（如权限被拒绝）
- **THEN** 系统 SHALL 在 FatalErrorScreen 中显示错误提示"无法访问系统安全存储，请检查钥匙串权限设置"
- **AND** 系统 SHALL 在 FatalErrorScreen 中提供"导入密钥"按钮作为恢复选项
- **AND** 应用 SHALL 阻断启动，不允许用户进入主界面

#### Scenario: Web 环境 IndexedDB 访问失败
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** IndexedDB 访问失败（如不支持或存储空间不足）
- **THEN** 系统 SHALL 在 FatalErrorScreen 中显示错误提示"浏览器不支持安全存储或存储空间不足"
- **AND** 系统 SHALL 在 FatalErrorScreen 中提供"导入密钥"按钮作为恢复选项
- **AND** 应用 SHALL 阻断启动，不允许用户进入主界面

#### Scenario: Web 环境加密/解密失败（seed 丢失）
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 主密钥加密或解密操作失败（如 seed 丢失导致无法解密旧密文）
- **THEN** 系统 SHALL 在 FatalErrorScreen 中显示错误提示
- **AND** 系统 SHALL 在 FatalErrorScreen 中提供"导入密钥"按钮（导入操作可用新 seed 完成）
- **AND** 应用 SHALL 阻断启动，不允许用户进入主界面

## REMOVED Requirements

### Requirement: 设置页面提供密钥导入入口
**Reason**: 密钥导入仅在错误恢复场景下有意义，正常使用时不应提供导入功能。导入入口已迁移到 FatalErrorScreen 和 Toast 恢复对话框。
**Migration**: 设置页面 `KeyManagementSetting` 中的密钥导入 UI（输入框和按钮）已移除，仅保留导出和重置功能。
