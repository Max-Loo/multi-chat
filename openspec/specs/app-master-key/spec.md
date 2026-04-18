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

### Requirement: 主密钥不可直接暴露
主密钥 SHALL 仅通过兼容层 API 读取（Tauri 端使用 `@tauri-plugin-keyring-api`，Web 端使用 Keyring 兼容层），不应以明文形式暴露在日志、调试工具或用户界面中。

#### Scenario: 调试应用状态
- **WHEN** 开发者查看应用状态或日志
- **THEN** 系统 SHALL 确保主密钥不会以明文形式出现在任何日志输出中
- **AND** 系统 SHALL 确保主密钥不会暴露在 Redux DevTools 等调试工具中
- **AND** 系统 SHALL 按需从存储读取密钥，不长期保留在内存中

### Requirement: 跨环境主密钥存储策略
系统 SHALL 根据运行环境自动选择主密钥存储策略，对开发者透明。所有临时创建的 Store 实例 MUST 在使用完毕后关闭，防止文件句柄泄漏和连接冲突。

#### Scenario: 自动选择存储策略
- **WHEN** 应用初始化主密钥存储
- **THEN** 系统 SHALL 检测运行环境（通过 `isTauri()`）
- **AND** Tauri 环境使用 `@tauri-plugin-keyring-api` 原生实现
- **AND** Web 环境使用 Keyring 兼容层（IndexedDB + 加密）
- **AND** 调用者无需关心底层实现差异

#### Scenario: 密钥验证的 Store 生命周期
- **WHEN** `verifyMasterKey()` 执行密钥验证操作
- **THEN** 系统 SHALL 创建独立的 Store 实例读取模型数据
- **AND** 验证完成后（无论成功或失败）SHALL 关闭该 Store 实例
- **AND** 系统 SHALL 使用 try/finally 确保 Store 在异常时也被关闭
- **AND** 验证期间 SHALL 不影响 `modelStorage` 的模块级单例

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
系统 SHALL 提供健壮的错误处理机制，确保主密钥存储失败时的优雅降级。初始化步骤的 `onError` 回调 SHALL NOT 手动设置 `stepName`——`InitializationManager` SHALL 在调用 `onError` 后自动注入 `stepName = step.name`。

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

#### Scenario: 初始化步骤错误自动关联步骤名
- **GIVEN** 初始化步骤定义了 `onError` 回调
- **WHEN** 步骤执行失败且 `onError` 被调用
- **THEN** `InitializationManager` SHALL 自动设置返回的 `InitError.stepName = step.name`
- **AND** 各步骤的 `onError` 回调 SHALL NOT 包含 `stepName` 字段

#### Scenario: FatalErrorScreen 使用步骤名常量
- **GIVEN** `FatalErrorScreen` 需要检测 masterKey 步骤的错误
- **WHEN** 代码引用步骤名进行比较
- **THEN** 系统 SHALL 使用从 `initSteps.ts` 导出的常量（如 `MASTER_KEY_STEP_NAME`）
- **AND** 严禁使用硬编码字符串 `'masterKey'`

#### Scenario: Web 环境加密/解密失败（seed 丢失）
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 主密钥加密或解密操作失败（如 seed 丢失导致无法解密旧密文）
- **THEN** 系统 SHALL 在 FatalErrorScreen 中显示错误提示
- **AND** 系统 SHALL 在 FatalErrorScreen 中提供"导入密钥"按钮（导入操作可用新 seed 完成）
- **AND** 应用 SHALL 阻断启动，不允许用户进入主界面

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

#### Scenario: 导出密钥单阶段交互
- **WHEN** 用户点击导出密钥按钮
- **THEN** 系统 SHALL 立即打开对话框并开始获取主密钥
- **AND** 获取期间对话框 SHALL 展示加载状态
- **AND** 获取成功后对话框 SHALL 展示密钥值和复制按钮
- **AND** 获取失败后对话框 SHALL 展示错误提示并自动关闭

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

### Requirement: 检查加密数据存在的函数归属模型存储模块
系统 SHALL 在模型存储模块（而非密钥管理模块）中提供检查存储中是否存在加密数据的函数，复用已有的模型存储单例。

#### Scenario: 调用加密数据检查函数
- **GIVEN** 模型存储中存在加密数据
- **WHEN** 调用模型存储模块提供的加密数据检查函数
- **THEN** 系统 SHALL 复用已有的模型存储单例读取数据
- **AND** 系统 SHALL 返回 `true`

#### Scenario: 存储中不存在加密数据
- **GIVEN** 模型存储中不存在数据或不存在加密字段
- **WHEN** 调用加密数据检查函数
- **THEN** 系统 SHALL 返回 `false`

#### Scenario: 存储读取失败
- **GIVEN** 模型存储不可访问
- **WHEN** 调用加密数据检查函数
- **THEN** 系统 SHALL 返回 `false` 而非抛出错误
