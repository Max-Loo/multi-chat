## ADDED Requirements

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

### Requirement: 应用启动时读取主密钥
应用在每次启动时 SHALL 根据运行环境从相应的存储位置读取主密钥。如果主密钥存在，则正常加载；如果不存在，则生成新的主密钥。

#### Scenario: Tauri 环境应用正常启动（主密钥已存在）
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 应用启动
- **AND** keyring 中已存在主密钥
- **THEN** 系统 SHALL 调用 `@tauri-plugin-keyring-api` 的 `getPassword(service, user)` 从系统存储读取主密钥
- **AND** 应用 SHALL 正常进入主界面

#### Scenario: Web 环境应用正常启动（主密钥已存在）
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 应用启动
- **AND** IndexedDB 中已存在主密钥
- **THEN** 系统 SHALL 调用 Keyring 兼容层的 `getPassword(service, user)` 从 IndexedDB 读取主密钥（自动解密）
  - service: "com.multichat.app"
  - user: "master-key"
- **AND** 应用 SHALL 正常进入主界面

#### Scenario: Tauri 环境应用启动时密钥丢失
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 应用启动
- **AND** keyring 中不存在主密钥（可能因系统重置或首次使用）
- **THEN** 系统 SHALL 使用 Web Crypto API 生成新的 256-bit 随机密钥
- **AND** 系统 SHALL 调用 `@tauri-plugin-keyring-api` 的 `setPassword` 将新密钥存储到系统级安全存储
- **AND** 应用 SHALL 显示警告提示用户旧加密数据将无法解密
- **AND** 应用 SHALL 正常进入主界面

#### Scenario: Web 环境应用启动时密钥丢失
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 应用启动
- **AND** IndexedDB 中不存在主密钥（可能因浏览器数据清除或首次使用）
- **THEN** 系统 SHALL 使用 Web Crypto API 生成新的 256-bit 随机密钥
- **AND** 系统 SHALL 调用 Keyring 兼容层的 `setPassword` 将新密钥存储到 IndexedDB（加密）
- **AND** 应用 SHALL 显示警告提示用户旧加密数据将无法解密
- **AND** 应用 SHALL 正常进入主界面

### Requirement: 主密钥不可直接暴露
主密钥 SHALL 仅通过兼容层 API 读取（Tauri 端使用 `@tauri-plugin-keyring-api`，Web 端使用 Keyring 兼容层），不应以明文形式暴露在日志、调试工具或用户界面中。

#### Scenario: 调试应用状态
- **WHEN** 开发者查看应用状态或日志
- **THEN** 系统 SHALL 确保主密钥不会以明文形式出现在任何日志输出中
- **AND** 系统 SHALL 确保主密钥不会暴露在 Redux DevTools 等调试工具中
- **AND** 系统 SHALL 按需从存储读取密钥，不长期保留在内存中

### Requirement: 跨环境主密钥存储策略
系统 SHALL 根据运行环境自动选择主密钥存储策略，对开发者透明。

#### Scenario: 自动选择存储策略
- **WHEN** 应用初始化主密钥存储
- **THEN** 系统 SHALL 检测运行环境（通过 `isTauri()`）
- **AND** Tauri 环境使用 `@tauri-plugin-keyring-api` 原生实现
- **AND** Web 环境使用 Keyring 兼容层（IndexedDB + 加密）
- **AND** 调用者无需关心底层实现差异

#### Scenario: 统一的 API 接口
- **WHEN** 应用代码需要存储或读取主密钥
- **THEN** 系统 SHALL 通过 Keyring 兼容层提供统一 API
- **AND** API 签名为：`setPassword(service, user, password)` 和 `getPassword(service, user)`
- **AND** 在两种环境中使用相同的 API 调用方式

### Requirement: Web 环境主密钥安全性
系统 SHALL 确保 Web 端的主密钥存储满足适当的安全要求，尽管无法达到系统钥匙串的安全级别。

#### Scenario: 加密强度
- **WHEN** 主密钥在 Web 环境中存储
- **THEN** 系统 SHALL 使用 AES-256-GCM 算法加密主密钥
- **AND** 加密密钥从设备指纹派生（PBKDF2，100,000 次迭代）
- **AND** 每次加密使用唯一的 IV（初始化向量）

#### Scenario: 安全性警告
- **WHEN** 用户首次在 Web 环境中使用应用
- **THEN** 系统 SHALL 显示安全性提示
- **AND** 提示内容："Web 版本的安全存储级别低于桌面版，建议在桌面版中处理敏感数据"
- **AND** 用户可以选择"不再提示"

#### Scenario: 主密钥生命周期管理
- **WHEN** 应用在 Web 环境中运行
- **THEN** 系统 SHALL 确保主密钥仅在需要时从 IndexedDB 读取
- **AND** 主密钥 SHALL 存储在内存中的加密状态或闭包中
- **AND** 应用关闭时，内存中的主密钥 SHALL 被清除

### Requirement: 主密钥存储错误处理
系统 SHALL 提供健壮的错误处理机制，确保主密钥存储失败时的优雅降级。

#### Scenario: Tauri 环境 keyring 访问失败
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** `@tauri-plugin-keyring-api` 访问失败（如权限被拒绝）
- **THEN** 系统 SHALL 显示错误提示"无法访问系统安全存储，请检查钥匙串权限设置"
- **AND** 系统 SHALL 提供按钮打开系统钥匙串设置（如适用）
- **AND** 应用 SHALL 阻断启动，不允许用户进入主界面

#### Scenario: Web 环境 IndexedDB 访问失败
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** IndexedDB 访问失败（如不支持或存储空间不足）
- **THEN** 系统 SHALL 显示错误提示"浏览器不支持安全存储或存储空间不足"
- **AND** 系统 SHALL 建议用户使用桌面版或清理浏览器数据
- **AND** 应用 SHALL 阻断启动，不允许用户进入主界面

#### Scenario: Web 环境加密/解密失败
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 主密钥加密或解密操作失败
- **THEN** 系统 SHALL 记录详细错误日志
- **AND** 系统 SHALL 显示错误提示"密钥操作失败，请重试或使用桌面版"
- **AND** 应用 SHALL 允许用户重新生成主密钥（将导致旧数据无法解密）

### Requirement: 主密钥存储性能
系统 SHALL 确保主密钥的存储和读取操作满足性能要求，不阻塞应用启动。

#### Scenario: Tauri 环境性能
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 读取主密钥
- **THEN** 操作 SHALL 在 100ms 内完成
- **AND** 不阻塞应用启动流程

#### Scenario: Web 环境性能
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 读取主密钥（包括 IndexedDB 查询和解密）
- **THEN** 操作 SHALL 在 200ms 内完成
- **AND** 不阻塞应用启动流程
- **AND** 密钥派生（首次） SHALL 在 500ms 内完成

### Requirement: 主密钥迁移支持
系统 SHALL 支持主密钥在不同环境或存储位置之间的迁移。

#### Scenario: 从 Tauri 迁移到 Web
- **WHEN** 用户需要从桌面版迁移数据到 Web 版
- **THEN** 系统 SHALL 提供主密钥导出功能（导出为加密文件）
- **AND** 系统 SHALL 提供主密钥导入功能（从加密文件导入到 IndexedDB）
- **AND** 导入导出功能在两种环境中均可使用

#### Scenario: 主密钥重新生成
- **WHEN** 用户主动选择重新生成主密钥（或因密钥丢失而需要重新生成）
- **THEN** 系统 SHALL 警告用户"旧加密数据将无法解密"
- **AND** 用户确认后，系统 SHALL 生成新的主密钥
- **AND** 系统 SHALL 将新密钥存储到对应环境的存储位置