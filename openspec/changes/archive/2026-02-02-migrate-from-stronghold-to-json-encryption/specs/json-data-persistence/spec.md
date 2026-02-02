## ADDED Requirements

### Requirement: 模型数据 Store 插件存储（.json 文件）
模型配置数据 SHALL 使用 @tauri-apps/plugin-store 存储在应用数据目录下的 `models.json` 文件中，替代原有的 `modelVault.hold` 二进制文件。

#### Scenario: 应用正常保存模型配置
- **WHEN** 用户创建、修改或删除模型配置
- **AND** Redux middleware 触发自动保存
- **THEN** 系统 SHALL 将当前所有模型配置通过 Store 插件保存
- **AND** 系统 SHALL 对敏感字段（apiKey）进行加密处理
- **AND** 系统 SHALL 调用 modelsStore.set() 和 save() 保存到 models.json
- **AND** 系统 SHALL 依赖 Store 插件确保写入的原子性

### Requirement: 聊天数据 Store 插件存储（.json 文件）
聊天记录数据 SHALL 使用 @tauri-apps/plugin-store 存储在应用数据目录下的 `chats.json` 文件中，替代原有的 `chatVault.hold` 二进制文件。

#### Scenario: 应用正常保存聊天记录
- **WHEN** 用户创建新聊天、发送消息或删除聊天
- **AND** Redux middleware 触发自动保存
- **THEN** 系统 SHALL 将当前所有聊天记录通过 Store 插件保存
- **AND** 系统 SHALL 调用 chatsStore.set() 和 save() 保存到 chats.json
- **AND** 系统 SHALL 依赖 Store 插件确保写入的原子性

### Requirement: Store 插件数据读取
应用启动时 SHALL 从 Store 插件管理的 .json 文件中读取模型和聊天数据，并加载到 Redux 状态树中。如果数据不存在，则初始化空数据。

#### Scenario: 应用启动时加载已有数据
- **WHEN** 应用启动
- **AND** modelsStore 中存在数据
- **THEN** 系统 SHALL 调用 modelsStore.get() 读取数据
- **AND** 系统 SHALL 解密所有标记为加密的敏感字段
- **AND** 系统 SHALL 将解析后的数据加载到 Redux store 的 models 状态

#### Scenario: 应用首次启动（无数据文件）
- **WHEN** 应用首次启动
- **AND** modelsStore 或 chatsStore 中不存在数据
- **THEN** 系统 SHALL 初始化空的模型列表和聊天列表
- **AND** 系统 SHALL 在后续数据变更时自动创建并保存数据

### Requirement: .json 文件格式可读性
Store 插件内部使用 JSON 格式，.json 文件可以直接查看和编辑。

#### Scenario: 用户查看数据文件
- **WHEN** 用户打开 `models.json` 或 `chats.json` 文件
- **THEN** 文件内容 SHALL 是 JSON 格式（Store 插件自动处理格式化）
- **AND** 数据结构 SHALL 清晰可读
- **AND** 非敏感字段 SHALL 以明文显示
- **AND** 敏感字段 SHALL 显示为带有 "enc:" 前缀的加密字符串

### Requirement: 数据写入原子性
Store 插件 SHALL 确保数据写入的原子性。

#### Scenario: 应用崩溃时的数据完整性
- **WHEN** 系统在保存数据过程中应用崩溃
- **THEN** 系统 SHALL 使用 Store 插件内置的原子写入机制
- **AND** 系统 SHALL 确保未完成的写入不会破坏已有数据
- **AND** 数据 SHALL 保持最后一次成功保存的状态

### Requirement: 旧数据文件检测
系统 SHALL 在启动时检测是否存在旧版本的 `.hold` 文件，以便提示用户进行数据迁移。

#### Scenario: 检测到旧版本数据文件
- **WHEN** 应用启动
- **AND** 系统发现 `modelVault.hold` 或 `chatVault.hold` 文件存在于应用数据目录
- **AND** 对应的 `.json` 文件不存在
- **THEN** 系统 SHALL 显示迁移提示对话框
- **AND** 提示 SHALL 说明发现旧版本数据并提供迁移选项
