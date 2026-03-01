# 设置变更集成测试规范

## Purpose

定义应用设置的集成测试要求，确保语言切换、推理内容开关等设置的完整流程能够正确处理 Redux 状态更新、i18n 库集成、localStorage 持久化和跨平台兼容性。

## Requirements

### Requirement: 语言切换流程集成
系统必须验证语言切换的完整流程，包括用户切换语言、Redux 状态更新、i18n 库更新、localStorage 持久化、UI 重新渲染。

**验收标准**:
- Redux store 正确更新语言设置
- i18next 库成功切换语言
- localStorage 持久化语言设置
- 所有 UI 组件重新渲染为新语言

#### Scenario: 用户切换语言
- **WHEN** 用户在设置页面选择新语言（如从"中文"切换到"English"）
- **AND** 用户确认切换
- **THEN** Redux store 必须触发 `setAppLanguage` action
- **AND** Redux store 中的 `appConfig.language` 必须更新为新语言代码

#### Scenario: i18next 语言更新
- **WHEN** Redux store 中的语言设置更新
- **THEN** appConfigMiddleware 必须监听到 `setAppLanguage` action
- **AND** middleware 必须调用 `changeAppLanguage(newLang)` 函数
- **AND** `changeAppLanguage` 必须调用 `i18next.changeLanguage(newLang)`
- **AND** i18next 必须返回 Promise 并成功切换

#### Scenario: 语言设置持久化存储
- **WHEN** 语言切换成功
- **THEN** appConfigMiddleware 必须将新语言保存到 localStorage
- **AND** localStorage 必须使用键 `LOCAL_STORAGE_LANGUAGE_KEY` 保存
- **AND** 保存的值必须是语言代码（如 'en', 'zh'）

#### Scenario: UI 重新渲染为新语言
- **WHEN** 语言切换完成
- **THEN** 所有使用 `useTranslation()` hook 的组件必须重新渲染
- **AND** UI 必须显示新语言的文本
- **AND** 不得显示旧语言的文本
- **AND** 翻译缺失时必须显示 key 或 fallback 文本

#### Scenario: 刷新页面后语言保持
- **WHEN** 用户刷新页面或重新打开应用
- **THEN** 系统必须从 localStorage 加载语言设置
- **AND** 系统必须使用加载的语言初始化 i18next
- **AND** UI 必须显示上次选择的语言

### Requirement: 推理内容开关集成
系统必须验证"包含推理内容"开关的完整流程，包括用户切换开关、Redux 状态更新、localStorage 持久化、聊天应用。

**验收标准**:
- Redux store 正确更新开关状态
- localStorage 持久化开关状态
- 聊天时应用开关设置
- 刷新页面后开关状态保持

#### Scenario: 用户切换推理内容开关
- **WHEN** 用户在设置页面切换"包含推理内容"开关
- **THEN** Redux store 必须触发 `setIncludeReasoningContent` action
- **AND** Redux store 中的 `appConfig.includeReasoningContent` 必须更新为 true 或 false

#### Scenario: 推理内容设置持久化
- **WHEN** 推理内容开关状态更新
- **THEN** appConfigMiddleware 必须监听到 `setIncludeReasoningContent` action
- **AND** middleware 必须将设置保存到 localStorage
- **AND** localStorage 必须使用键 `LOCAL_STORAGE_INCLUDE_REASONING_CONTENT_KEY` 保存
- **AND** 保存的值必须是字符串 'true' 或 'false'

#### Scenario: 聊天时应用推理内容设置
- **WHEN** 用户发送聊天消息
- **AND** 用户开启了"包含推理内容"开关
- **THEN** chatService 必须在 API 请求中设置 `include_reasoning: true`
- **AND** API 响应必须包含推理内容

#### Scenario: 关闭推理内容开关
- **WHEN** 用户关闭"包含推理内容"开关
- **AND** 用户发送聊天消息
- **THEN** chatService 必须在 API 请求中设置 `include_reasoning: false`
- **AND** API 响应不应包含推理内容

#### Scenario: 刷新页面后开关状态保持
- **WHEN** 用户刷新页面或重新打开应用
- **THEN** 系统必须从 localStorage 加载推理内容设置
- **AND** Redux store 中的 `includeReasoningContent` 必须恢复为上次的状态
- **AND** UI 中的开关必须显示正确的状态

### Requirement: 跨平台设置持久化一致性
系统必须验证设置在不同平台（Tauri 和 Web）的持久化一致性。

**验收标准**:
- Tauri 和 Web 环境使用相同的持久化逻辑
- localStorage 在两个平台都可用
- 设置值格式在两个平台保持一致
- 平台切换时设置可以迁移

#### Scenario: Tauri 环境的设置持久化
- **WHEN** 应用运行在 Tauri 环境
- **THEN** localStorage 必须可用（通过 Tauri 插件）
- **AND** 设置必须保存到 localStorage
- **AND** 设置值格式必须与 Web 环境一致

#### Scenario: Web 环境的设置持久化
- **WHEN** 应用运行在 Web 环境
- **THEN** localStorage 必须使用原生浏览器 API
- **AND** 设置必须保存到 localStorage
- **AND** 设置值格式必须与 Tauri 环境一致

#### Scenario: 平台切换时设置迁移
- **WHEN** 用户从 Tauri 环境切换到 Web 环境（或反之）
- **THEN** 系统必须能够读取 localStorage 中的设置
- **AND** 设置必须正确加载到 Redux store
- **AND** UI 必须显示迁移后的设置

### Requirement: 设置变更影响的模块验证
系统必须验证设置变更对所有相关模块的影响，确保设置正确应用。

**验收标准**:
- 语言切换影响所有使用 i18next 的组件
- 推理内容开关影响所有聊天请求
- 设置变更后立即生效，无需重启应用

#### Scenario: 语言切换影响所有组件
- **WHEN** 用户切换语言
- **THEN** 所有使用 `useTranslation()` hook 的组件必须更新
- **AND** 导航栏、按钮、提示信息等必须显示新语言
- **AND** 不得有组件仍显示旧语言

#### Scenario: 推理内容开关影响所有聊天
- **WHEN** 用户切换推理内容开关
- **AND** 用户发送多条聊天消息
- **THEN** 所有聊天请求都必须应用最新的开关设置
- **AND** 不得有聊天请求使用旧的设置

#### Scenario: 设置变更即时生效
- **WHEN** 用户修改任何设置
- **THEN** 设置必须立即生效
- **AND** 不得需要重启应用
- **AND** 不得需要刷新页面

### Requirement: 设置初始化流程集成
系统必须验证应用启动时的设置初始化流程，包括从 localStorage 加载设置、初始化 Redux store、初始化 i18next。

**验收标准**:
- 应用启动时正确加载所有设置
- 设置按正确顺序初始化（考虑依赖关系）
- 初始化失败时有合理的降级策略

#### Scenario: 应用启动时加载设置
- **WHEN** 应用首次启动
- **THEN** 系统必须按顺序执行初始化步骤：
  1. 初始化 i18n（加载语言资源）
  2. 初始化主密钥
  3. 加载模型数据
  4. 加载应用语言设置
  5. 加载推理内容设置
- **AND** 每个步骤必须等待前一个步骤完成

#### Scenario: 设置缺失时使用默认值
- **WHEN** localStorage 中没有设置数据
- **THEN** 系统必须使用默认值
- **AND** 语言默认值必须是系统语言或 'zh'
- **AND** 推理内容开关默认值必须是 false

#### Scenario: 设置格式错误时降级处理
- **WHEN** localStorage 中的设置数据格式错误
- **THEN** 系统必须忽略错误数据
- **AND** 系统必须使用默认值
- **AND** 系统必须记录错误日志

### Requirement: 设置变更的副作用验证
系统必须验证设置变更的副作用，确保不会引入意外行为。

**验收标准**:
- 设置变更不影响用户数据
- 设置变更不影响正在进行的聊天
- 设置变更不影响其他设置

#### Scenario: 语言切换不影响聊天历史
- **WHEN** 用户切换语言
- **THEN** 聊天历史必须保持不变
- **AND** 聊天消息内容不得被翻译
- **AND** 只有 UI 文本（按钮、提示等）被翻译

#### Scenario: 推理内容开关不影响历史聊天
- **WHEN** 用户切换推理内容开关
- **THEN** 历史聊天消息必须保持不变
- **AND** 已有的推理内容不得被删除或添加
- **AND** 开关仅影响新发送的聊天消息

#### Scenario: 设置重置功能
- **WHEN** 用户点击"重置设置"按钮
- **AND** 用户确认重置
- **THEN** 所有设置必须恢复为默认值
- **AND** localStorage 必须更新为默认值
- **AND** Redux store 必须更新为默认值
- **AND** UI 必须反映默认设置

### Requirement: 设置 UI 响应性验证
系统必须验证设置变更后 UI 的响应性，确保用户得到及时反馈。

**验收标准**:
- 设置变更后 UI 立即更新
- 提供视觉反馈（Toast、加载状态等）
- 错误时有明确的错误提示

#### Scenario: 设置变更的视觉反馈
- **WHEN** 用户修改设置
- **THEN** UI 必须显示加载状态（如果操作需要时间）
- **AND** 设置成功后必须显示成功提示（Toast）
- **AND** UI 必须立即反映新设置

#### Scenario: 设置变更失败时的错误提示
- **WHEN** 设置变更失败（如 localStorage 不可用）
- **THEN** UI 必须显示错误提示
- **AND** 错误提示必须说明失败原因
- **AND** 设置必须保持原值不变
- **AND** 必须提供重试选项

#### Scenario: 设置页面的实时预览
- **WHEN** 设置页面支持实时预览（如语言切换）
- **THEN** 用户切换设置时必须能够立即看到效果
- **AND** 不得需要保存后才生效
- **AND** 必须提供"保存"按钮确认更改

### Requirement: 多设置同时变更验证
系统必须验证多个设置同时变更时的行为，确保设置间不会相互干扰。

**验收标准**:
- 多个设置可以同时变更
- 设置间相互独立，不相互影响
- 所有设置正确持久化

#### Scenario: 同时修改语言和推理内容开关
- **WHEN** 用户同时修改语言和推理内容开关
- **AND** 用户点击"保存"按钮
- **THEN** 两个设置都必须正确保存到 localStorage
- **AND** Redux store 必须更新两个设置
- **AND** UI 必须反映两个新设置

#### Scenario: 设置变更的原子性
- **WHEN** 用户修改多个设置
- **AND** 其中一个设置保存失败
- **THEN** 系统必须回滚所有设置
- **AND** 所有设置必须保持原值
- **AND** 必须显示错误提示
- **AND** 不得出现部分设置更新、部分未更新的情况
