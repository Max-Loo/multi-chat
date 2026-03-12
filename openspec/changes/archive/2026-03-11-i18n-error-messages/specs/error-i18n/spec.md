# Spec: 错误消息国际化

## ADDED Requirements

### Requirement: 错误消息命名空间

系统 MUST 为错误消息提供独立的 `error.json` 命名空间，支持英文、中文、法文三种语言。

#### Scenario: 英文静态打包错误消息
- **WHEN** 应用初始化时
- **THEN** 英文 error.json MUST 立即可用（静态打包到初始 bundle）
- **AND** 中文和法文 error.json SHOULD 按需动态加载
- **AND** 如果动态加载失败，MUST 显示英文降级文本
- **AND** MUST 不阻塞应用启动流程

#### Scenario: 多语言支持
- **WHEN** 用户切换语言时
- **THEN** 错误消息 MUST 显示为用户选择的语言（en/zh/fr）

### Requirement: 初始化错误翻译

系统 MUST 为所有初始化步骤提供完整的错误消息翻译。

#### Scenario: i18n 初始化失败
- **WHEN** 国际化系统初始化失败时
- **THEN** 系统 MUST 显示 "Failed to initialize internationalization" (英文降级)
- **AND** 错误严重级别 MUST 为 `fatal`

#### Scenario: masterKey 初始化失败
- **WHEN** 主密钥初始化失败时
- **THEN** 系统 MUST 根据 i18n 状态显示翻译或降级文本
- **AND** 错误消息 MUST 包含在 `error.initialization.masterKeyFailed` 键下

#### Scenario: models 加载失败
- **WHEN** 模型数据加载失败时
- **THEN** 系统 MUST 根据 i18n 状态显示翻译或降级文本
- **AND** 错误严重级别 MUST 为 `warning`

#### Scenario: chatList 加载失败
- **WHEN** 聊天列表加载失败时
- **THEN** 系统 MUST 根据 i18n 状态显示翻译或降级文本
- **AND** 错误严重级别 MUST 为 `warning`

#### Scenario: appLanguage 加载失败
- **WHEN** 应用语言配置加载失败时
- **THEN** 系统 MUST 根据 i18n 状态显示翻译或降级文本
- **AND** 错误严重级别 MUST 为 `warning`

#### Scenario: transmitHistoryReasoning 加载失败
- **WHEN** 推理内容配置加载失败时
- **THEN** 系统 MUST 根据 i18n 状态显示翻译或降级文本
- **AND** 错误严重级别 MUST 为 `ignorable`

#### Scenario: autoNamingEnabled 加载失败
- **WHEN** 自动命名配置加载失败时
- **THEN** 系统 MUST 根据 i18n 状态显示翻译或降级文本
- **AND** 错误严重级别 MUST 为 `ignorable`

#### Scenario: modelProvider 加载失败
- **WHEN** 模型供应商数据加载失败时
- **THEN** 系统 MUST 根据 i18n 状态显示翻译或降级文本
- **AND** 错误严重级别 MUST 为 `warning`

### Requirement: 应用配置错误翻译

系统 MUST 为应用配置相关的错误消息提供完整的翻译。

#### Scenario: 语言初始化失败
- **WHEN** 应用语言初始化过程中发生错误
- **THEN** 系统 MUST 显示 `error.appConfig.failToInitializeLanguage` 的翻译
- **AND** 如果翻译不存在，MUST 显示英文降级文本 "Failed to initialize language"

#### Scenario: 推理内容传输初始化失败
- **WHEN** 推理内容传输设置初始化过程中发生错误
- **THEN** 系统 MUST 显示 `error.appConfig.failToInitializeTransmitHistoryReasoning` 的翻译
- **AND** 如果翻译不存在，MUST 显示英文降级文本 "Failed to initialize transmit history reasoning"

#### Scenario: 自动命名初始化失败
- **WHEN** 自动命名设置初始化过程中发生错误
- **THEN** 系统 MUST 显示 `error.appConfig.failToInitializeAutoNamingEnabled` 的翻译
- **AND** 如果翻译不存在，MUST 显示英文降级文本 "Failed to initialize auto naming"

### Requirement: 翻译键值结构

error.json 命名空间 MUST 使用一致的嵌套结构组织翻译键值。

#### Scenario: 两级嵌套结构
- **WHEN** 访问翻译键值时
- **THEN** 键值 MUST 遵循 `error.{category}.{specificError}` 格式
- **AND** 分类 MUST 包括 `initialization` 和 `appConfig`

#### Scenario: 翻译完整性
- **WHEN** 运行翻译完整性检查时
- **THEN** 所有三语言（en/zh/fr）的 error.json MUST 具有相同的键值结构
- **AND** MUST 不存在缺失的翻译键值

### Requirement: 性能约束

error.json 命名空间的大小 MUST 受限，以确保对初始 bundle 大小的影响最小。

#### Scenario: Bundle 大小限制
- **WHEN** 英文 error.json 被打包到初始 bundle 时
- **THEN** 英文 error.json SHOULD 不超过 1KB（未压缩）
- **AND** 中文和法文 error.json 按需动态加载，不影响初始 bundle
- **实际实现**：826 字节（包含 11 个错误消息键值），符合预期
- **性能影响**：对总 bundle 大小的影响微乎其微（< 1%）

#### Scenario: 加载性能
- **WHEN** 应用启动时
- **THEN** 英文 error.json 的加载 MUST 不阻塞主线程超过 10ms
- **AND** 其他语言 error.json 的动态加载 MUST 不阻塞应用启动流程
