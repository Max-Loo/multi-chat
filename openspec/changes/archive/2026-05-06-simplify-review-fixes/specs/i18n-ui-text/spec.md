## ADDED Requirements

### Requirement: 无障碍标签翻译键分组

系统 SHALL 在 `common.json` 命名空间中新增 `a11y` 分组，存放所有无障碍相关的翻译键。每种语言的 `common.json` SHALL 包含完整的 `a11y` 分组。

键值列表：
- `a11y.bottomNav`: 底部导航区域标签
- `a11y.mainNav`: 主导航区域标签
- `a11y.userMessage`: 用户消息气泡标签
- `a11y.assistantMessage`: 助手消息气泡标签
- `a11y.chatMessages`: 聊天消息区域标签
- `a11y.clearSelection`: 清除选中操作标签
- `a11y.modelToolbar`: 模型工具栏标签
- `a11y.chatList`: 聊天列表区域标签
- `a11y.modelProvider`: 模型供应商区域标签
- `a11y.modelProviderNav`: 模型供应商导航标签
- `a11y.settingsNav`: 设置导航标签

#### Scenario: 三种语言均包含 a11y 分组
- **WHEN** 检查 `zh/common.json`、`en/common.json`、`fr/common.json`
- **THEN** 每个文件 SHALL 包含 `a11y` 分组
- **AND** 每个文件 SHALL 包含上述全部 11 个键值
- **AND** 每个键值 SHALL 为对应语言的翻译文本

#### Scenario: TypeScript 类型声明同步
- **WHEN** `common.json` 新增 `a11y` 分组
- **THEN** `src/@types/translationResources.d.ts` 中 `common` 接口 SHALL 包含 `a11y` 子接口
- **AND** 子接口 SHALL 包含上述全部 11 个字符串属性

## MODIFIED Requirements

### Requirement: 用户界面文本必须使用国际化配置

所有用户可见的界面文本必须通过 i18next 配置提供，不得在代码中硬编码中英文字符串。

**适用范围**新增：
- HTML `aria-label` 属性中的无障碍文本 SHALL 通过 i18n 获取

#### Scenario: 组件中硬编码的中文按钮文本
- **WHEN** 组件包含硬编码的中文文本
- **THEN** 系统必须将该文本提取到对应的命名空间并使用 `t()` 替换

#### Scenario: aria-label 使用 i18n 翻译
- **WHEN** 组件需要设置 `aria-label` 属性
- **THEN** `aria-label` 的值 SHALL 通过 `t()` 翻译函数获取
- **THEN** SHALL NOT 使用硬编码字符串
