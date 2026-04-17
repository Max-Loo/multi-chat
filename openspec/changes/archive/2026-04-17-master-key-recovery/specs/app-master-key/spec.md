## MODIFIED Requirements

### Requirement: 应用启动时读取主密钥
应用在每次启动时 SHALL 根据运行环境从相应的存储位置读取主密钥。如果主密钥存在，则正常加载；如果不存在，则生成新的主密钥，并在返回值中标记密钥为新生成。

#### Scenario: Tauri 环境应用正常启动（主密钥已存在）
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 应用启动
- **AND** keyring 中已存在主密钥
- **THEN** 系统 SHALL 调用 `@tauri-plugin-keyring-api` 的 `getPassword(service, user)` 从系统存储读取主密钥
- **AND** 系统 SHALL 返回 `{ key: string, isNewlyGenerated: false }`
- **AND** 应用 SHALL 正常进入主界面

#### Scenario: Web 环境应用正常启动（主密钥已存在）
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 应用启动
- **AND** IndexedDB 中已存在主密钥
- **THEN** 系统 SHALL 调用 Keyring 兼容层的 `getPassword(service, user)` 从 IndexedDB 读取主密钥（自动解密）
  - service: "com.multichat.app"
  - user: "master-key"
- **AND** 系统 SHALL 返回 `{ key: string, isNewlyGenerated: false }`
- **AND** 应用 SHALL 正常进入主界面

#### Scenario: Tauri 环境应用启动时密钥丢失
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 应用启动
- **AND** keyring 中不存在主密钥（可能因系统重置或首次使用）
- **THEN** 系统 SHALL 使用 Web Crypto API 生成新的 256-bit 随机密钥
- **AND** 系统 SHALL 调用 `@tauri-plugin-keyring-api` 的 `setPassword` 将新密钥存储到系统级安全存储
- **AND** 系统 SHALL 返回 `{ key: string, isNewlyGenerated: true }`
- **AND** 应用 SHALL 正常进入主界面

#### Scenario: Web 环境应用启动时密钥丢失
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 应用启动
- **AND** IndexedDB 中不存在主密钥（可能因浏览器数据清除或首次使用）
- **THEN** 系统 SHALL 使用 Web Crypto API 生成新的 256-bit 随机密钥
- **AND** 系统 SHALL 调用 Keyring 兼容层的 `setPassword` 将新密钥存储到 IndexedDB（加密）
- **AND** 系统 SHALL 返回 `{ key: string, isNewlyGenerated: true }`
- **AND** 应用 SHALL 正常进入主界面

## ADDED Requirements

### Requirement: 密钥重新生成时通知用户
当初始化过程中检测到主密钥为新生成，且存储中存在因密钥变更而无法解密的加密数据时，系统 SHALL 在初始化完成后向用户显示通知。如果密钥为新生成但存储中不存在加密数据（首次使用），系统 SHALL 不显示通知。

#### Scenario: 密钥重新生成且存在加密数据时显示通知
- **GIVEN** 应用初始化完成
- **AND** `initializeMasterKey()` 返回 `isNewlyGenerated: true`
- **AND** 存储中存在 `enc:` 前缀的加密模型数据（说明是密钥丢失而非首次使用）
- **WHEN** 主界面加载完成
- **THEN** 系统 SHALL 显示通知："检测到加密密钥已重新生成，之前保存的 API 密钥无法解密。如有备份密钥请先导入恢复，在此之前请勿修改模型配置，否则加密数据将无法恢复。"
- **AND** 通知 SHALL 提供"导入密钥"操作跳转到密钥导入流程（作为主要操作，视觉优先级高于关闭按钮）
- **AND** 通知 SHALL 提供"我知道了"操作关闭通知
- **AND** 通知 SHALL 持续显示直到用户主动操作（不自动消失）

#### Scenario: 首次使用（密钥新生成但无加密数据）时不显示通知
- **GIVEN** 应用初始化完成
- **AND** `initializeMasterKey()` 返回 `isNewlyGenerated: true`
- **AND** 存储中不存在 `enc:` 前缀的加密数据（首次使用）
- **WHEN** 主界面加载完成
- **THEN** 系统 SHALL 不显示密钥变更通知

#### Scenario: 密钥未重新生成时不显示通知
- **GIVEN** 应用初始化完成
- **AND** `initializeMasterKey()` 返回 `isNewlyGenerated: false`
- **WHEN** 主界面加载完成
- **THEN** 系统 SHALL 不显示密钥变更通知
