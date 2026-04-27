## ADDED Requirements

### Requirement: 文档 URL 生成
系统 SHALL 根据 providerKey 生成正确的文档链接 URL。

#### Scenario: DeepSeek 文档链接
- **WHEN** providerKey 为 'deepseek'
- **THEN** getDocUrl 返回 'https://platform.deepseek.com/api-docs/'

#### Scenario: Moonshot 文档链接
- **WHEN** providerKey 为 'moonshotai'
- **THEN** getDocUrl 返回 'https://platform.moonshot.cn/docs'

#### Scenario: 智谱文档链接
- **WHEN** providerKey 为 'zhipu'
- **THEN** getDocUrl 返回 'https://open.bigmodel.cn/dev/api'

#### Scenario: 未知供应商的 fallback 链接
- **WHEN** providerKey 不在预定义列表中
- **THEN** getDocUrl 返回 `https://docs.${providerKey}.com`

### Requirement: 元数据信息展示
系统 SHALL 展示 API 端点和供应商 ID 信息。

#### Scenario: 显示 API 端点
- **WHEN** 组件渲染时
- **THEN** 显示 apiEndpoint 属性值

#### Scenario: 显示供应商 ID
- **WHEN** 组件渲染时
- **THEN** 显示 providerKey 属性值

### Requirement: 文档链接按钮
系统 SHALL 提供外部文档链接按钮。

#### Scenario: 链接指向正确 URL
- **WHEN** 组件渲染时
- **THEN** 链接的 href 属性为 getDocUrl() 的返回值
- **AND** 链接在新标签页打开

#### Scenario: 点击链接不触发父级事件
- **WHEN** 用户点击文档链接
- **THEN** 调用 stopPropagation 阻止事件冒泡
