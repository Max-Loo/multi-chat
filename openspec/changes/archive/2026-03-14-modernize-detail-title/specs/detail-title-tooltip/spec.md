## ADDED Requirements

### Requirement: 标题显示供应商 Logo

系统 SHALL 在聊天面板标题区域显示模型供应商的 Logo。

#### Scenario: 正常显示 Logo
- **WHEN** 模型存在且供应商 Logo 可用
- **THEN** 系统显示供应商 Logo 图片

#### Scenario: Logo 加载失败降级
- **WHEN** 供应商 Logo 加载失败
- **THEN** 系统显示供应商名称首字母作为降级方案

### Requirement: 标题显示用户昵称

系统 SHALL 在聊天面板标题区域显示用户自定义的模型昵称和模型名称。

#### Scenario: 正常显示昵称和模型
- **WHEN** 模型存在且昵称非空
- **THEN** 系统显示格式为「昵称 (模型名)」

#### Scenario: 昵称为空时仅显示模型名称
- **WHEN** 模型的昵称为空字符串
- **THEN** 系统仅显示模型名称（`modelName`），不加括号

#### Scenario: 长文本截断
- **WHEN** 组合文本长度超过容器宽度
- **THEN** 系统截断整体文本并显示省略号（...）

### Requirement: Tooltip 显示完整模型信息

系统 SHALL 在用户与标题交互时，通过 Tooltip 显示完整的模型信息。

**Tooltip 内容格式**（使用 i18n 翻译标签）：
```
{t('supplier')}: {providerName}
{t('model')}: {modelName}
{t('nickname')}: {nickname}
```

#### Scenario: 鼠标 hover 显示 Tooltip
- **WHEN** 用户将鼠标悬停在标题区域
- **THEN** 系统显示 Tooltip，内容格式为三行列表：供应商、模型、昵称

#### Scenario: 键盘聚焦显示 Tooltip
- **WHEN** 用户通过 Tab 键将焦点移至标题区域
- **THEN** 系统显示 Tooltip

#### Scenario: 触屏设备显示 Tooltip
- **WHEN** 用户在触屏设备上长按标题区域
- **THEN** 系统显示 Tooltip

### Requirement: 异常状态显示 Badge

系统 SHALL 在模型处于异常状态时，在标题区域显示状态 Badge。

#### Scenario: 模型已禁用
- **WHEN** 模型的 `isEnable` 属性为 `false`
- **THEN** 系统显示橙色"已禁用" Badge

#### Scenario: 模型已删除
- **WHEN** 模型的 `isDeleted` 属性为 `true`
- **THEN** 系统显示红色"已删除" Badge

#### Scenario: 正常状态无 Badge
- **WHEN** 模型处于正常状态（未禁用、未删除）
- **THEN** 系统不显示任何状态 Badge

### Requirement: 模型不存在时显示错误提示

系统 SHALL 在模型信息无法找到时，显示错误提示。

#### Scenario: 模型 ID 无效
- **WHEN** `chatModel.modelId` 在模型列表中找不到对应模型
- **THEN** 系统显示红色"模型已删除" Badge
