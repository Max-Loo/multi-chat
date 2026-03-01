# 模型配置集成测试规范

## ADDED Requirements

### Requirement: 添加模型配置完整流程
系统必须验证添加模型配置的完整流程，包括用户填写表单、API Key 加密存储、Redux 状态更新和持久化。

**验收标准**:
- API Key 使用主密钥加密
- 加密后的数据安全存储
- 模型配置正确添加到 Redux store
- 模型列表正确显示新添加的模型

#### Scenario: 用户填写模型配置表单并提交
- **WHEN** 用户在"添加模型"页面填写完整信息（昵称、API 地址、API Key、模型 Key、模型名称）
- **AND** 用户点击"保存"按钮
- **THEN** Redux store 必须触发 `addModelPending` action
- **AND** UI 必须显示加载状态

#### Scenario: API Key 加密和存储
- **WHEN** 模型配置表单提交
- **THEN** 系统必须调用 masterKey 模块获取主密钥
- **AND** 系统必须使用主密钥加密 API Key
- **AND** 加密后的 API Key 必须存储到 modelStorage
- **AND** 原始 API Key 不得以明文形式存储

#### Scenario: 模型配置持久化存储
- **WHEN** 模型配置添加成功
- **THEN** modelStorage 必须将模型配置保存到 IndexedDB（Web 环境）或文件系统（Tauri 环境）
- **AND** 保存的数据必须包含：id、昵称、providerName、providerKey、加密的 apiKey、apiAddress、modelKey、modelName、isEnable、时间戳
- **AND** 数据必须通过 modelStorage.saveModels() 方法保存

#### Scenario: Redux 状态更新
- **WHEN** 模型配置存储成功
- **THEN** Redux store 必须触发 `addModelFulfilled` action
- **AND** Redux store 中的 models 数组必须包含新添加的模型
- **AND** UI 必须在模型列表中显示新模型
- **AND** 表单必须重置或导航回模型列表页

### Requirement: 使用模型配置进行聊天
系统必须验证使用已配置的模型进行聊天的完整流程，包括解密 API Key、调用 API、验证响应。

**验收标准**:
- API Key 正确解密
- 解密后的 API Key 用于 API 调用
- API 调用成功返回响应
- 聊天流程正常完成

#### Scenario: 解密 API Key 并调用 API
- **WHEN** 用户选择一个已配置的模型
- **AND** 用户发送聊天消息
- **THEN** chatService 必须从 Redux store 中获取模型配置
- **AND** 系统必须调用 masterKey 模块获取主密钥
- **AND** 系统必须使用主密钥解密 API Key
- **AND** 解密后的 API Key 必须用于 API 调用

#### Scenario: API 调用成功
- **WHEN** chatService 使用解密后的 API Key 调用模型 API
- **AND** API 返回成功响应
- **THEN** Redux store 必须更新聊天状态
- **AND** UI 必须显示 API 返回的消息

#### Scenario: API Key 解密失败
- **WHEN** 主密钥无法获取或解密失败
- **THEN** Redux store 必须触发 `sendMessageFailed` action
- **AND** UI 必须显示错误提示："无法解密 API Key，请重新配置模型"
- **AND** 用户必须被引导到模型配置页面

### Requirement: 编辑模型配置
系统必须验证编辑模型配置的完整流程，包括加载配置、修改信息、更新加密存储。

**验收标准**:
- 正确加载现有模型配置
- 修改后的配置正确加密存储
- API Key 变更时重新加密
- UI 更新显示修改后的信息

#### Scenario: 加载现有模型配置
- **WHEN** 用户点击"编辑"按钮
- **THEN** 系统必须从 Redux store 中获取模型配置
- **AND** 表单必须预填充现有配置信息
- **AND** API Key 字段必须显示为掩码或空（出于安全考虑）

#### Scenario: 修改模型配置（不修改 API Key）
- **WHEN** 用户修改昵称或模型名称
- **AND** 用户点击"保存"按钮
- **THEN** Redux store 必须触发 `updateModel` action
- **AND** modelStorage 必须更新模型配置
- **AND** API Key 必须保持加密状态，无需重新加密

#### Scenario: 修改 API Key
- **WHEN** 用户输入新的 API Key
- **AND** 用户点击"保存"按钮
- **THEN** 系统必须使用主密钥加密新的 API Key
- **AND** modelStorage 必须更新加密后的 API Key
- **AND** 旧的加密 API Key 必须被替换

### Requirement: 删除模型配置
系统必须验证删除模型配置的完整流程，包括清理加密数据、更新 Redux 状态、UI 反馈。

**验收标准**:
- 模型配置从存储中删除
- 加密的 API Key 被清理
- Redux 状态正确更新
- UI 不再显示已删除的模型

#### Scenario: 删除模型配置
- **WHEN** 用户点击"删除"按钮
- **AND** 用户确认删除操作
- **THEN** Redux store 必须触发 `deleteModel` action
- **AND** modelStorage 必须从存储中删除模型配置
- **AND** 加密的 API Key 必须被永久删除
- **AND** UI 必须从模型列表中移除该模型

#### Scenario: 删除正在使用的模型
- **WHEN** 用户删除当前正在使用的模型
- **THEN** 系统必须显示警告："该模型正在使用中，删除后需要切换到其他模型"
- **AND** 用户必须确认后才能删除
- **AND** 删除后系统必须切换到默认模型或提示用户选择新模型

### Requirement: 模型配置跨平台兼容性
系统必须验证模型配置在不同平台（Tauri 和 Web）的加密存储差异。

**验收标准**:
- Tauri 环境使用系统钥匙串存储主密钥
- Web 环境使用 IndexedDB 存储加密的主密钥
- 加密算法在两个平台保持一致
- 数据可以在两个平台间迁移（理论上）

#### Scenario: Tauri 环境的模型配置
- **WHEN** 应用运行在 Tauri 环境
- **THEN** masterKey 必须使用系统钥匙串存储主密钥
- **AND** API Key 必须使用系统钥匙串中的主密钥加密
- **AND** 加密后的数据必须存储在文件系统中

#### Scenario: Web 环境的模型配置
- **WHEN** 应用运行在 Web 环境
- **THEN** masterKey 必须使用 IndexedDB 存储加密的主密钥
- **AND** API Key 必须使用 IndexedDB 中的主密钥加密
- **AND** 加密后的数据必须存储在 IndexedDB 中

#### Scenario: 加密算法一致性
- **WHEN** 相同的 API Key 在不同平台加密
- **THEN** 必须使用相同的加密算法（如 AES-GCM）
- **AND** 加密参数（IV、salt）必须在同一平台保持一致
- **AND** 解密必须在同一平台完成（不支持跨平台解密）

### Requirement: 模型配置数据完整性
系统必须验证模型配置的数据完整性，包括必填字段验证、格式验证、重复检测。

**验收标准**:
- 必填字段不能为空
- API 地址格式正确
- 不允许重复的模型配置（相同的 providerKey + modelKey）
- API Key 加密后的数据完整性

#### Scenario: 必填字段验证
- **WHEN** 用户提交不完整的表单（缺少必填字段）
- **THEN** 表单必须显示验证错误
- **AND** 不允许提交表单
- **AND** 必填字段必须高亮显示

#### Scenario: API 地址格式验证
- **WHEN** 用户输入无效的 API 地址（如不是 URL 格式）
- **THEN** 表单必须显示格式错误
- **AND** 不允许提交表单
- **AND** 必须提供正确的格式示例

#### Scenario: 重复模型检测
- **WHEN** 用户添加已存在的模型配置（相同的 providerKey + modelKey）
- **THEN** 系统必须显示错误："该模型已存在"
- **AND** 不允许提交表单
- **AND** 必须引导用户编辑现有配置而非重复添加

#### Scenario: 加密数据完整性验证
- **WHEN** 模型配置保存后重新加载
- **THEN** 系统必须能够成功解密 API Key
- **AND** 解密后的数据必须与原始数据一致
- **AND** 如果解密失败，必须显示错误并标记模型为"配置错误"

### Requirement: 模型配置导入导出（可选）
系统必须支持模型配置的导入导出功能，方便用户批量管理模型。

**验收标准**:
- 导出的配置文件不包含明文 API Key
- 导入的配置文件必须重新加密 API Key
- 导入时检测重复配置
- 支持常见的配置文件格式（JSON、CSV）

#### Scenario: 导出模型配置
- **WHEN** 用户点击"导出"按钮
- **THEN** 系统必须生成配置文件
- **AND** 配置文件不得包含明文 API Key
- **AND** 配置文件必须包含：昵称、providerKey、modelKey、apiAddress 等（不含 apiKey）
- **AND** 文件必须下载到用户本地

#### Scenario: 导入模型配置
- **WHEN** 用户上传配置文件
- **THEN** 系统必须解析配置文件
- **AND** 用户必须为每个模型输入 API Key
- **AND** 系统必须使用主密钥加密 API Key
- **AND** 系统必须检测重复配置并提示用户

#### Scenario: 导入时的冲突处理
- **WHEN** 导入的模型与现有模型重复
- **THEN** 系统必须列出所有冲突
- **AND** 用户必须选择"跳过"、"覆盖"或"重命名"
- **AND** 根据用户选择执行相应操作
