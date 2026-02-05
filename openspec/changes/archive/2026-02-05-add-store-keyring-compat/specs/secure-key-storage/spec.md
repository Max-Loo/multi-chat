# 安全密钥存储规范 - Delta

本规范修改安全密钥存储的实现方式，支持 Web 端使用 IndexedDB 加密存储，同时保持 Tauri 端使用系统钥匙串。

## MODIFIED Requirements

### Requirement: 使用 tauri-plugin-keyring 存储主密钥

系统 SHALL 根据运行环境选择主密钥存储方式：Tauri 端使用 `tauri-plugin-keyring` 插件将主密钥存储到系统级安全存储，Web 端使用 Keyring 兼容层存储到 IndexedDB（加密存储）。keyring 仅负责存储，不负责生成密钥。

#### Scenario: Tauri 环境存储新生成的主密钥
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 应用生成新的 256-bit 主密钥
- **THEN** 系统 SHALL 调用 `@tauri-plugin-keyring-api` 的 `setPassword(service, user, password)` API
- **AND** 参数 SHALL 为：
  - service: "com.multichat.app"
  - user: "master-key"  
  - password: 生成的 256-bit 密钥（hex 编码）
- **AND** 插件 SHALL 根据当前操作系统自动存储到：
  - macOS: Keychain
  - Windows: DPAPI
  - Linux: Secret Service
- **AND** 访问权限 SHALL 限制为当前应用

#### Scenario: Web 环境存储新生成的主密钥（**修改**）
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 应用生成新的 256-bit 主密钥
- **THEN** 系统 SHALL 调用 Keyring 兼容层的 `setPassword(service, user, password)` API
- **AND** 参数 SHALL 为：
  - service: "com.multichat.app"
  - user: "master-key"
  - password: 生成的 256-bit 密钥（hex 编码）
- **AND** 系统 SHALL 使用 AES-256-GCM 算法加密密码
- **AND** 系统 SHALL 将加密后的密文存储到 IndexedDB
- **AND** 存储位置：`multi-chat-keyring` 数据库，`keys` 对象存储
- **AND** 数据 SHALL 在浏览器存储沙箱中隔离

#### Scenario: Tauri 环境从 keyring 读取主密钥
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 应用需要读取主密钥用于加密/解密
- **THEN** 系统 SHALL 调用 `@tauri-plugin-keyring-api` 的 `getPassword(service, user)` API
- **AND** 参数 SHALL 为 service="com.multichat.app", user="master-key"
- **AND** 系统 SHALL 返回存储的密钥值

#### Scenario: Web 环境从 keyring 读取主密钥（**修改**）
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 应用需要读取主密钥用于加密/解密
- **THEN** 系统 SHALL 调用 Keyring 兼容层的 `getPassword(service, user)` API
- **AND** 参数 SHALL 为 service="com.multichat.app", user="master-key"
- **AND** 系统 SHALL 从 IndexedDB 读取加密的密文
- **AND** 系统 SHALL 使用相同的加密密钥和 IV 解密密文
- **AND** 系统 SHALL 返回解密后的明文密钥值

### Requirement: keyring 访问错误处理

当存储访问失败时，系统 SHALL 显示用户友好的错误信息，并提供适当的恢复建议。

#### Scenario: Tauri 环境 keyring 访问被拒绝
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 应用尝试通过 keyring 访问密钥存储
- **AND** 访问被拒绝（如用户拒绝了钥匙串权限请求）
- **THEN** 系统 SHALL 显示错误提示"无法访问系统安全存储，请检查钥匙串权限设置"
- **AND** 系统 SHALL 提供按钮打开系统钥匙串设置（如适用）
- **AND** 系统 SHALL 允许用户选择退出应用并手动修复权限

#### Scenario: Web 环境 IndexedDB 访问失败（**新增**）
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 应用尝试通过 IndexedDB 访问密钥存储
- **AND** 访问失败（如不支持 IndexedDB 或存储空间不足）
- **THEN** 系统 SHALL 显示错误提示"浏览器不支持安全存储或存储空间不足，请清理数据或使用桌面版"
- **AND** 系统 SHALL 阻断应用启动，不允许进入主界面
- **AND** 系统 SHALL 提供文档说明如何清理浏览器数据

#### Scenario: Web 环境加密/解密失败（**新增**）
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 主密钥加密或解密操作失败
- **THEN** 系统 SHALL 记录详细错误日志（不包含敏感信息）
- **THEN** 系统 SHALL 显示错误提示"密钥操作失败，数据可能已损坏"
- **AND** 系统 SHALL 提供选项让用户重新生成主密钥（警告旧数据将无法解密）

## ADDED Requirements

### Requirement: Web 环境密钥存储加密

在 Web 环境中，系统 SHALL 使用强加密算法保护存储在 IndexedDB 中的密钥。

#### Scenario: 加密算法选择
- **WHEN** 在 Web 环境中加密密钥
- **THEN** 系统 SHALL 使用 AES-256-GCM 算法
- **AND** 密钥长度为 256 位
- **AND** IV（初始化向量）长度为 12 字节
- **AND** 每次加密操作使用唯一的 IV

#### Scenario: 加密密钥派生
- **WHEN** 初始化 Web 环境的密钥存储
- **THEN** 系统 SHALL 使用 PBKDF2 算法从设备指纹派生加密密钥
- **AND** 派生参数：
  - 基础密钥：`navigator.userAgent` + 浏览器唯一标识
  - 迭代次数：100,000 次
  - 哈希算法：SHA-256
  - 输出密钥长度：256 bits
- **AND** 派生密钥 SHALL 存储在内存中，不持久化

#### Scenario: 加密数据格式
- **WHEN** 存储加密后的密钥到 IndexedDB
- **THEN** 存储格式 SHALL 为：
  ```typescript
  {
    service: string,
    user: string,
    encryptedPassword: string, // base64 编码的密文
    iv: string, // base64 编码的 IV
    createdAt: number // 时间戳
  }
  ```
- **AND** 复合主键为 `service` + `user`

### Requirement: Web 环境密钥存储性能

系统 SHALL 确保 Web 环境的密钥存储操作满足性能要求。

#### Scenario: 加密性能
- **WHEN** 执行密钥加密操作（AES-256-GCM）
- **THEN** 加密操作 SHALL 在 50ms 内完成
- **AND** 不阻塞 UI 线程

#### Scenario: 解密性能
- **WHEN** 执行密钥解密操作
- **THEN** 解密操作 SHALL 在 50ms 内完成
- **AND** 不阻塞 UI 线程

#### Scenario: 存储查询性能
- **WHEN** 从 IndexedDB 查询密钥
- **THEN** 查询操作 SHALL 在 100ms 内完成
- **AND** 不阻塞 UI 线程

### Requirement: Web 环境密钥存储安全性

系统 SHALL 确保 Web 端的密钥存储满足适当的安全要求，并提供用户明确的安全警告。

#### Scenario: 安全性警告
- **WHEN** 用户首次在 Web 环境中使用应用
- **THEN** 系统 SHALL 显示安全性警告对话框
- **AND** 警告内容：
  - "Web 版本使用浏览器本地存储加密密钥"
  - "安全级别低于桌面版的系统钥匙串"
  - "建议在桌面版中处理高度敏感的数据"
  - "清除浏览器数据会导致密钥丢失"
- **AND** 用户可以选择"不再显示此警告"

#### Scenario: 密钥生命周期管理
- **WHEN** 应用在 Web 环境中运行
- **THEN** 系统 SHALL 确保主密钥仅在需要时从 IndexedDB 读取和解密
- **AND** 解密后的明文密钥 SHALL 存储在内存中的闭包或私有变量中
- **AND** 应用关闭时，内存中的明文密钥 SHALL 被清除
- **AND** 密钥 SHALL 不出现在日志、控制台或调试工具中

#### Scenario: 密钥存储隔离
- **WHEN** 多个 Web 应用实例运行在同一浏览器中
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
- **THEN** 系统 SHALL 显示错误提示"浏览器版本过低，不支持安全存储，请升级浏览器或使用桌面版"
- **AND** `isSupported()` 返回 `false`

### Requirement: 跨环境密钥存储兼容性

系统 SHALL 提供统一的 API 接口，确保代码在 Tauri 和 Web 环境中无需修改即可工作。

#### Scenario: 统一的 API 接口
- **WHEN** 应用代码需要存储或读取密钥
- **THEN** 系统 SHALL 通过 Keyring 兼容层提供统一 API
- **AND** API 签名为：`setPassword(service, user, password)` 和 `getPassword(service, user)`
- **AND** 在两种环境中使用相同的 API 调用方式
- **AND** 返回值类型一致

#### Scenario: 环境检测和自动选择
- **WHEN** 应用初始化密钥存储
- **THEN** 系统 SHALL 检测运行环境（通过 `isTauri()`）
- **AND** Tauri 环境自动使用 `@tauri-plugin-keyring-api` 原生实现
- **AND** Web 环境自动使用 Keyring 兼容层（IndexedDB + 加密）
- **AND** 调用者无需关心底层实现差异

### Requirement: 密钥存储数据迁移

系统 SHALL 支持密钥在不同环境或存储位置之间的迁移。

#### Scenario: 从 Tauri 导出到 Web
- **WHEN** 用户需要从桌面版迁移密钥到 Web 版
- **THEN** 系统 SHALL 提供密钥导出功能（导出为加密的 JSON 文件）
- **AND** 导出文件包含：加密的密钥、IV、元数据
- **AND** 系统 SHALL 提供密钥导入功能（从加密文件导入到 IndexedDB）

#### Scenario: 密钥重新生成
- **WHEN** 用户主动选择重新生成主密钥（或因密钥丢失而需要重新生成）
- **THEN** 系统 SHALL 警告用户"旧加密数据将无法解密，此操作不可逆"
- **AND** 用户确认后，系统 SHALL 生成新的主密钥
- **AND** 系统 SHALL 将新密钥存储到对应环境的存储位置（Tauri: keyring, Web: IndexedDB）

### Requirement: Web 环境密钥存储测试和验证

系统 SHALL 在 Web 环境中验证密钥存储的正确性和安全性。

#### Scenario: 单元测试覆盖
- **WHEN** 编写密钥存储的单元测试
- **THEN** 系统 SHALL 测试以下场景：
  - 加密和解密的正确性
  - 密钥派生的一致性
  - IndexedDB 存储和读取
  - 错误处理（密钥不存在、加密失败、解密失败）
- **AND** 测试 SHALL 在 CI/CD 流程中运行

#### Scenario: 集成测试覆盖
- **WHEN** 编写密钥存储的集成测试
- **THEN** 系统 SHALL 测试以下场景：
  - 应用启动时读取主密钥
  - 应用首次启动时生成并存储主密钥
  - 使用主密钥进行数据加密/解密
- **AND** 测试 SHALL 在真实的浏览器环境中运行
