# Spec: Model Management Testing

本规格定义了模型管理相关组件和功能的测试要求，确保模型配置、列表展示和操作的可靠性。

## Purpose

确保模型管理功能（ModelConfigForm、ModelTable、CreateModel、EditModelModal 等）具有完整的单元测试覆盖，验证表单验证、数据处理、Redux 集成和用户交互的正确性。

## Requirements

### Requirement: ModelConfigForm 表单渲染和验证
系统 SHALL 提供模型配置表单，支持新建和编辑模型，包含字段验证和提交逻辑。

#### Scenario: 渲染新建模型表单
- **WHEN** 用户访问创建模型页面
- **THEN** 系统应显示表单包含以下字段：
  - 模型昵称（nickname）
  - API Key（apiKey）
  - API 地址（apiAddress）
  - 备注（remark，可选）
  - 模型选择（modelKey）
- **AND** 应显示提供商名称
- **AND** 应显示"是否启用"开关

#### Scenario: 渲染编辑模型表单
- **WHEN** 用户打开编辑模型弹窗
- **AND** 传入 modelParams 参数（包含现有模型数据）
- **THEN** 系统应预填充表单字段
- **AND** 按钮文本应显示"更新"而非"创建"

#### Scenario: 表单验证 - 必填字段
- **WHEN** 用户尝试提交空表单
- **THEN** 系统应显示验证错误：
  - 模型昵称为必填项
  - API Key 为必填项
  - API 地址为必填项
  - 模型为必填项

#### Scenario: 表单验证 - 字符串去空格
- **WHEN** 用户输入包含前后空格的昵称（"  DeepSeek  "）
- **THEN** 系统应在验证时自动去除空格
- **AND** 验证应基于去空格后的值

#### Scenario: API 地址失焦回填默认值
- **WHEN** 用户清空 API 地址字段并失焦
- **THEN** 系统应自动回填为提供商的默认 API 地址
- **AND** 不应显示验证错误

#### Scenario: 模型选择下拉框
- **WHEN** 用户点击模型选择字段
- **THEN** 系统应显示当前提供商的所有可用模型
- **AND** 列表应包含 modelKey 和 modelName

---

### Requirement: ModelConfigForm 提交逻辑
系统 SHALL 能够处理表单提交，生成完整的模型对象并调用相应的 Redux action。

#### Scenario: 新建模型提交
- **WHEN** 用户填写完整表单并点击提交
- **THEN** 系统应生成包含以下字段的 Model 对象：
  - id: 自动生成的唯一 ID（使用 generateId()）
  - nickname: 表单输入的昵称
  - apiKey: 表单输入的 API Key
  - apiAddress: 表单输入的 API 地址
  - remark: 表单输入的备注（可选）
  - modelKey: 表单选择的模型标识
  - modelName: 根据 modelKey 查找的模型名称
  - providerName: 当前提供商的名称
  - providerKey: 当前提供商的标识
  - isEnable: 表单开关状态
  - createdAt: 当前时间戳
  - updateAt: 当前时间戳
- **AND** 应调用 createModel Redux action

#### Scenario: 编辑模型提交
- **WHEN** 用户编辑现有模型并提交
- **THEN** 系统应保留原模型的 id 和 createdAt
- **AND** 应更新 updateAt 为当前时间戳
- **AND** 应调用 editModel Redux action

#### Scenario: 新建模型切换提供商时重置表单
- **WHEN** 用户在新建模式下切换模型提供商
- **THEN** 系统应重置表单字段为默认值
- **AND** 应更新 API 地址为新提供商的默认地址
- **AND** 应更新模型列表为新提供商的模型

#### Scenario: 编辑模型切换提供商时不重置表单
- **WHEN** 用户在编辑模式下切换模型提供商
- **THEN** 系统应保留当前表单值
- **AND** 不应重置表单字段

#### Scenario: 提交成功后的回调
- **WHEN** 表单提交成功
- **THEN** 系统应调用 onFinish 回调函数
- **AND** 应传入完整的 Model 对象
- **AND** 父组件可以执行后续操作（如导航、显示 Toast）

---

### Requirement: ModelTable 模型列表展示和操作
系统 SHALL 能够展示模型列表，支持搜索、编辑、删除操作，并显示加载和错误状态。

#### Scenario: 渲染模型列表
- **WHEN** 模型数据加载完成
- **THEN** 系统应显示数据表格
- **AND** 每行应包含模型的昵称、提供商、模型名称、API 地址、备注、启用状态
- **AND** 应包含操作列（编辑、删除按钮）

#### Scenario: 显示加载状态
- **WHEN** 模型数据正在加载（loading=true）
- **THEN** 系统应显示骨架屏或加载动画
- **AND** 应禁用表格交互

#### Scenario: 显示初始化错误
- **WHEN** 模型初始化失败（initializationError 存在）
- **THEN** 系统应显示错误提示 Alert
- **AND** 应提示用户"数据加载失败"
- **AND** 应显示具体错误信息

#### Scenario: 显示操作错误
- **WHEN** 模型操作失败（如删除失败，error 存在）
- **THEN** 系统应显示错误提示 Alert
- **AND** 应提示用户"操作失败"
- **AND** 应显示具体错误信息

#### Scenario: 过滤模型列表
- **WHEN** 用户在搜索框输入过滤文本
- **THEN** 系统应实时过滤模型列表
- **AND** 过滤应匹配昵称、提供商、模型名称、备注字段

#### Scenario: 点击添加模型按钮
- **WHEN** 用户点击"添加模型"按钮
- **THEN** 系统应导航到 /model/add 路由

#### Scenario: 点击编辑按钮
- **WHEN** 用户点击某行的编辑按钮
- **THEN** 系统应打开编辑弹窗
- **AND** 应传入当前模型的完整数据
- **AND** 应传入模型的 providerKey

#### Scenario: 删除模型 - 确认操作
- **WHEN** 用户点击删除按钮
- **THEN** 系统应显示删除确认弹窗
- **AND** 应提示"确认删除「模型昵称」？"
- **AND** 应显示警告描述

#### Scenario: 删除模型 - 确认删除
- **WHEN** 用户在确认弹窗中点击"确认"按钮
- **THEN** 系统应调用 deleteModel Redux action
- **AND** 应显示成功 Toast（"删除成功"）
- **AND** 应关闭确认弹窗

#### Scenario: 删除模型 - 取消操作
- **WHEN** 用户在确认弹窗中点击"取消"按钮
- **THEN** 系统应关闭弹窗
- **AND** 不应执行删除操作

#### Scenario: 删除模型 - 操作失败
- **WHEN** 删除操作抛出异常
- **THEN** 系统应显示错误 Toast（"删除失败"）
- **AND** 应保留当前模型列表

---

### Requirement: CreateModel 创建模型页面
系统 SHALL 提供创建新模型的页面，包含模型提供商侧边栏和配置表单。

#### Scenario: 页面布局
- **WHEN** 用户访问创建模型页面
- **THEN** 系统应显示左侧提供商选择侧边栏
- **AND** 应显示右侧模型配置表单

#### Scenario: 选择模型提供商
- **WHEN** 用户点击侧边栏的提供商选项
- **THEN** 系统应更新 selectedModelProviderKey 状态
- **AND** 应更新表单的提供商上下文
- **AND** 应更新可用模型列表

#### Scenario: 默认选中 DeepSeek 提供商
- **WHEN** 用户首次访问创建模型页面
- **THEN** 系统应默认选中 DeepSeek 提供商

#### Scenario: 表单提交成功后导航
- **WHEN** 用户提交表单成功
- **THEN** 系统应显示成功 Toast（"添加成功"）
- **AND** 应导航到 /model/table 页面

#### Scenario: 表单提交失败
- **WHEN** 表单提交抛出异常
- **THEN** 系统应显示错误 Toast（"添加失败"）
- **AND** 应保留在当前页面

---

### Requirement: EditModelModal 编辑模型弹窗
系统 SHALL 提供编辑模型的弹窗，包含模型配置表单和弹窗控制逻辑。

#### Scenario: 弹窗打开条件
- **WHEN** isModalOpen 为 true 或 modelProviderKey 存在
- **THEN** 系统应显示编辑弹窗

#### Scenario: 弹窗关闭
- **WHEN** 用户点击弹窗外部或按 ESC 键
- **THEN** 系统应调用 onModalCancel 回调
- **AND** 应关闭弹窗

#### Scenario: 编辑提交成功
- **WHEN** 用户修改模型配置并提交
- **THEN** 系统应调用 editModel Redux action
- **AND** 应显示成功 Toast（"编辑成功"）
- **AND** 应关闭弹窗

#### Scenario: 编辑提交失败
- **WHEN** 编辑操作抛出异常
- **THEN** 系统应显示错误 Toast（"编辑失败"）
- **AND** 应保持弹窗打开状态

#### Scenario: 缺少 modelProviderKey 时不渲染表单
- **WHEN** EditModelModal 未传入 modelProviderKey
- **THEN** 系统应显示空弹窗内容
- **AND** 不应渲染 ModelConfigForm

---

### Requirement: TanStack Form 集成
系统 SHALL 正确集成 TanStack Form 库，处理表单状态和验证。

#### Scenario: 表单字段绑定
- **WHEN** 用户输入表单字段
- **THEN** 系统应更新 TanStack Form 的字段状态
- **AND** 应触发 onChange 验证器

#### Scenario: Zod Schema 验证
- **WHEN** 用户提交表单
- **THEN** 系统应使用 Zod schema 验证所有字段
- **AND** 验证失败时应显示对应的错误消息

#### Scenario: 字段级验证
- **WHEN** 用户在字段输入时触发 onChange 验证
- **THEN** 系统应实时显示字段验证错误
- **AND** 应在字段下方显示错误消息

---

### Requirement: 国际化支持
系统 SHALL 支持多语言，所有文本应使用 i18n 翻译。

#### Scenario: 表单标签翻译
- **WHEN** 用户切换应用语言
- **THEN** 表单字段标签应显示对应语言的文本

#### Scenario: 验证错误翻译
- **WHEN** 表单验证失败
- **THEN** 错误消息应使用当前语言显示

#### Scenario: Toast 消息翻译
- **WHEN** 操作成功或失败
- **THEN** Toast 消息应使用当前语言显示
