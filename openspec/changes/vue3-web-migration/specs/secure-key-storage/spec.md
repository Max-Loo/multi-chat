# Spec Delta

## ADDED Requirements

### Requirement: 使用 Keyring 模块存储主密钥

系统 SHALL 使用 Keyring 运行时模块（IndexedDB + AES-256-GCM 加密）存储主密钥。keyring 仅负责存储，不负责生成密钥。

#### Scenario: 存储新生成的主密钥

- **WHEN** 应用生成新的 256-bit 主密钥
- **THEN** 系统 SHALL 调用 Keyring 模块的 `setPassword(service, user, password)` API
- **AND** 参数 SHALL 为：
  - service: "com.multichat.app"
  - user: "master-key"
  - password: 生成的 256-bit 密钥（hex 编码）
- **AND** 系统 SHALL 使用 AES-256-GCM 算法加密密码
- **AND** 系统 SHALL 将加密后的密文存储到 IndexedDB
- **AND** 存储位置：`multi-chat-keyring` 数据库，`keys` 对象存储
- **AND** 数据 SHALL 在浏览器存储沙箱中隔离

#### Scenario: 从 keyring 读取主密钥

- **WHEN** 应用需要读取主密钥用于加密/解密
- **THEN** 系统 SHALL 调用 Keyring 模块的 `getPassword(service, user)` API
- **AND** 参数 SHALL 为 service="com.multichat.app", user="master-key"
- **AND** 系统 SHALL 从 IndexedDB 读取加密的密文
- **AND** 系统 SHALL 使用相同的加密密钥和 IV 解密密文
- **AND** 系统 SHALL 返回解密后的明文密钥值

### Requirement: 密钥存储访问错误处理

当存储访问失败时，系统 SHALL 显示用户友好的错误信息，并提供适当的恢复建议。

#### Scenario: IndexedDB 访问失败

- **WHEN** 应用尝试通过 IndexedDB 访问密钥存储
- **AND** 访问失败（如不支持 IndexedDB 或存储空间不足）
- **THEN** 系统 SHALL 显示错误提示"浏览器不支持安全存储或存储空间不足，请清理浏览器数据后重试"
- **AND** 系统 SHALL 阻断应用启动，不允许进入主界面
- **AND** 系统 SHALL 提供文档说明如何清理浏览器数据

#### Scenario: 加密/解密失败

- **WHEN** 主密钥加密或解密操作失败
- **THEN** 系统 SHALL 记录详细错误日志（不包含敏感信息）
- **THEN** 系统 SHALL 显示错误提示"密钥操作失败，数据可能已损坏"
- **AND** 系统 SHALL 提供选项让用户重新生成主密钥（警告旧数据将无法解密）

### Requirement: 密钥导出与重生成

系统 SHALL 支持密钥的导出、导入与重新生成，作为用户备份与恢复手段。

#### Scenario: 密钥导出与导入

- **WHEN** 用户需要备份密钥或在设备间迁移密钥
- **THEN** 系统 SHALL 提供密钥导出功能（导出为加密的 JSON 文件）
- **AND** 导出文件包含：加密的密钥、IV、元数据
- **AND** 系统 SHALL 提供密钥导入功能（从加密文件导入到 IndexedDB）

#### Scenario: 密钥重新生成

- **WHEN** 用户主动选择重新生成主密钥（或因密钥丢失而需要重新生成）
- **THEN** 系统 SHALL 警告用户"旧加密数据将无法解密，此操作不可逆"
- **AND** 用户确认后，系统 SHALL 生成新的主密钥
- **AND** 系统 SHALL 将新密钥存储到 IndexedDB（经 Keyring 模块加密）

## MODIFIED Requirements

### Requirement: Web 环境密钥存储安全性

系统 SHALL 确保密钥存储满足适当的安全要求，并提供用户明确的安全警告。

#### Scenario: 安全性警告

- **WHEN** 用户首次使用应用
- **THEN** 系统 SHALL 显示安全性警告对话框
- **AND** 警告内容：
  - "应用使用浏览器本地存储加密密钥"
  - "安全级别低于操作系统级钥匙串"
  - "清除浏览器数据会导致密钥丢失"
  - 建议用户妥善保管密钥备份（使用密钥导出功能）
- **AND** 用户可以选择"不再显示此警告"

#### Scenario: 密钥生命周期管理

- **WHEN** 应用运行
- **THEN** 系统 SHALL 确保主密钥仅在需要时从 IndexedDB 读取和解密
- **AND** 解密后的明文密钥 SHALL 存储在内存中的闭包或私有变量中
- **AND** 应用关闭时，内存中的明文密钥 SHALL 被清除
- **AND** 密钥 SHALL 不出现在日志、控制台或调试工具中

#### Scenario: 密钥存储隔离

- **WHEN** 多个应用实例运行在同一浏览器中
- **THEN** 每个 SHALL 使用相同的 IndexedDB 数据库
- **AND** 不同 SHALL 实例的密钥 SHALL 通过 `service` 和 `user` 参数隔离
- **AND** 主密钥使用固定的 service="com.multichat.app" 和 user="master-key"

### Requirement: Web 环境密钥存储浏览器兼容性

系统 SHALL 确保密钥存储在支持 Web Crypto API 的主流浏览器中正常工作。

#### Scenario: Chrome/Edge 支持

- **GIVEN** 用户使用 Chrome 或 Edge 浏览器
- **WHEN** 使用密钥存储功能
- **THEN** 所有 Keyring API 正常工作
- **AND** 加密/解密性能良好

#### Scenario: Firefox 支持

- **GIVEN** 用户使用 Firefox 浏览器
- **WHEN** 使用密钥存储功能
- **THEN** 所有 Keyring API 正常工作
- **AND** 加密/解密性能良好

#### Scenario: Safari 支持

- **GIVEN** 用户使用 Safari 浏览器
- **WHEN** 使用密钥存储功能
- **THEN** 所有 Keyring API 正常工作
- **AND** 注意 Safari 的 IndexedDB 存储配额限制

#### Scenario: 不支持的浏览器

- **GIVEN** 用户使用不支持 Web Crypto API 的旧版浏览器
- **WHEN** 启动应用
- **THEN** 系统 SHALL 显示错误提示"浏览器版本过低，不支持安全存储，请升级浏览器"
- **AND** `isSupported()` 返回 `false`

## REMOVED Requirements

### Requirement: 使用 tauri-plugin-keyring 存储主密钥
**Reason**: 原 requirement 描述"Tauri 端使用系统钥匙串、Web 端使用兼容层"的双环境存储选择；Tauri 桌面端移除后仅保留 Web 加密存储，故以新名 requirement 承接。
**Migration**: 上方 ADDED 的 "使用 Keyring 模块存储主密钥" 保持 API 参数（service/user/password）与加密方案不变。

### Requirement: keyring 访问错误处理
**Reason**: 原含"Tauri 环境 keyring 访问被拒绝"场景，且 Web 错误文案包含"使用桌面版"的引导；Tauri 移除后场景与文案均失效，故以更新后的同名 requirement 整体替换。
**Migration**: 上方 ADDED 的同名 requirement 保持错误处理流程与阻断启动行为不变，仅调整文案。

### Requirement: 密钥存储数据迁移
**Reason**: 原"从 Tauri 导出到 Web"场景基于桌面版存在的前提；Tauri 移除后导出/导入定位为备份与设备间迁移手段，故以更新后的同名 requirement 整体替换。
**Migration**: 上方 ADDED 的同名 requirement 保持导出文件格式与重新生成流程不变。

### Requirement: 跨环境密钥存储兼容性
**Reason**: Tauri 桌面端移除后仅存在 Web 一种运行环境，"Tauri/Web 双环境统一 API 与自动选择"不再有对应行为。
**Migration**: Keyring 模块继续以 `setPassword(service, user, password)` / `getPassword(service, user)` 统一 API 提供服务，调用方代码无需修改。
