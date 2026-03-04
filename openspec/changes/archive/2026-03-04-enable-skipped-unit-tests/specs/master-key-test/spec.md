## ADDED Requirements

### Requirement: 主密钥生成测试
generateMasterKey 函数 SHALL 生成符合密码学安全要求的主密钥。

#### Scenario: 成功生成主密钥
- **WHEN** 调用 generateMasterKey
- **THEN** 返回 32 字节长度的 Uint8Array

#### Scenario: 生成的主密钥随机性
- **WHEN** 多次调用 generateMasterKey
- **THEN** 每次返回的密钥值都不相同

### Requirement: 主密钥存储测试
storeMasterKey 函数 SHALL 安全存储主密钥。

#### Scenario: Tauri 环境下存储到系统钥匙串
- **WHEN** isTauri() 返回 true 时调用 storeMasterKey
- **THEN** 使用 setPassword 将密钥存储到系统钥匙串

#### Scenario: Web 环境下存储到 localStorage
- **WHEN** isTauri() 返回 false 时调用 storeMasterKey
- **THEN** 使用 localStorage 存储加密后的密钥

#### Scenario: 存储失败错误处理
- **WHEN** 存储操作失败
- **THEN** 抛出包含详细错误信息的异常

### Requirement: 主密钥获取测试
getMasterKey 函数 SHALL 从存储中安全获取主密钥。

#### Scenario: 从系统钥匙串获取（Tauri）
- **WHEN** isTauri() 返回 true 且密钥存在
- **THEN** 从系统钥匙串获取并返回 Uint8Array 格式的密钥

#### Scenario: 从 localStorage 获取（Web）
- **WHEN** isTauri() 返回 false 且密钥存在
- **THEN** 从 localStorage 解密并返回密钥

#### Scenario: 密钥不存在返回 null
- **WHEN** 存储中没有主密钥
- **THEN** 返回 null

#### Scenario: 密钥损坏错误处理
- **WHEN** 存储的密钥数据损坏或格式无效
- **THEN** 抛出错误提示密钥可能已损坏

### Requirement: 主密钥存在性检查测试
isMasterKeyExists 函数 SHALL 正确检查主密钥是否存在。

#### Scenario: 密钥存在返回 true
- **WHEN** 主密钥已存储
- **THEN** 返回 true

#### Scenario: 密钥不存在返回 false
- **WHEN** 主密钥未存储
- **THEN** 返回 false

#### Scenario: Tauri 环境检查
- **WHEN** 在 Tauri 环境下检查
- **THEN** 使用 getPassword 检查系统钥匙串

#### Scenario: Web 环境检查
- **WHEN** 在 Web 环境下检查
- **THEN** 检查 localStorage 中是否存在密钥

### Requirement: 主密钥初始化测试
initializeMasterKey 函数 SHALL 管理主密钥的初始化流程。

#### Scenario: 首次初始化生成新密钥
- **WHEN** 主密钥不存在时调用 initializeMasterKey
- **THEN** 生成新密钥并存储，返回密钥值

#### Scenario: 已存在密钥直接返回
- **WHEN** 主密钥已存在时调用 initializeMasterKey
- **THEN** 获取并返回现有密钥，不生成新密钥

#### Scenario: 初始化过程错误处理
- **WHEN** 初始化过程中发生错误
- **THEN** 抛出错误并提供清晰的错误信息

### Requirement: 安全警告处理测试
handleSecurityWarning 函数 SHALL 处理主密钥相关的安全警告。

#### Scenario: Web 环境安全警告
- **WHEN** 在 Web 环境下初始化主密钥
- **THEN** 显示安全警告提示用户数据存储在浏览器中

#### Scenario: Tauri 环境无警告
- **WHEN** 在 Tauri 环境下初始化主密钥
- **THEN** 不显示安全警告（系统钥匙串是安全的）

#### Scenario: 用户确认后继续
- **WHEN** 用户确认安全警告
- **THEN** 继续初始化流程

#### Scenario: 用户取消后中止
- **WHEN** 用户取消安全警告
- **THEN** 中止初始化并返回错误

### Requirement: 主密钥导出测试
exportMasterKey 函数 SHALL 支持导出主密钥（用于备份或迁移）。

#### Scenario: 成功导出密钥
- **WHEN** 调用 exportMasterKey
- **THEN** 返回 Base64 编码的密钥字符串

#### Scenario: 导出前验证身份
- **WHEN** 尝试导出密钥
- **THEN** 先验证用户身份（如需要密码）

#### Scenario: 密钥不存在时导出失败
- **WHEN** 尝试导出不存在的主密钥
- **THEN** 抛出错误提示密钥不存在

### Requirement: 主密钥轮换测试
密钥轮换功能 SHALL 支持安全更换主密钥。

#### Scenario: 成功轮换密钥
- **WHEN** 调用密钥轮换功能
- **THEN** 生成新密钥，使用旧密钥解密数据后使用新密钥重新加密

#### Scenario: 轮换失败回滚
- **WHEN** 密钥轮换过程中发生错误
- **THEN** 保持旧密钥不变，确保数据不丢失

#### Scenario: 轮换后旧密钥失效
- **WHEN** 密钥轮换成功完成
- **THEN** 旧密钥不再能用于解密数据

### Requirement: 跨平台兼容性测试
主密钥管理 SHALL 在 Tauri 和 Web 环境下都能正常工作。

#### Scenario: Tauri 环境完整流程
- **WHEN** 在 Tauri 环境中执行生成、存储、获取、检查操作
- **THEN** 所有操作都使用系统钥匙串，流程完整成功

#### Scenario: Web 环境完整流程
- **WHEN** 在 Web 环境中执行生成、存储、获取、检查操作
- **THEN** 所有操作都使用 localStorage + 加密，流程完整成功

#### Scenario: 环境检测正确性
- **WHEN** 运行环境变化（如从 Web 切换到 Tauri 桌面版）
- **THEN** isTauri() 正确反映当前环境

#### Scenario: 环境切换数据处理
- **WHEN** 从 Web 切换到 Tauri 环境
- **THEN** 提供数据迁移机制或清晰的迁移指导
