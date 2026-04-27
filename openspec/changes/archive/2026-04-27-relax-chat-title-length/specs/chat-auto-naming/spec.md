## MODIFIED Requirements

### Requirement: 标题格式要求
系统生成的标题必须符合以下规范：
- 长度：5-20 个字符
- 风格：简洁、专业、概括主题
- 不包含标点符号
- 直接输出，无冒号前缀

#### Scenario: 标题长度在规定范围内
- **WHEN** AI 生成原始标题
- **THEN** 系统截取或保留前 20 个字符
- **AND** 移除超长部分

#### Scenario: 移除标点符号
- **WHEN** AI 生成包含标点的标题（如 "TypeScript 学习方法。"）
- **THEN** 系统移除所有标点符号
- **AND** 返回 "TypeScript 学习方法"

#### Scenario: 严肃型标题风格
- **WHEN** 对话内容为技术讨论
- **THEN** 生成的标题为专业、概括性描述
- **EXAMPLES**:
  - "如何学习 TypeScript？" → "TypeScript 学习方法"
  - "优化 React 性能" → "React 性能优化"

---

### Requirement: 禁止空标题命名
系统必须不允许用户将聊天标题设置为空字符串，手动命名标题不得超过 20 个字符。

#### Scenario: UI 层验证
- **WHEN** 用户在重命名输入框中清空标题
- **AND** 点击确认按钮
- **THEN** 系统显示验证错误
- **AND** 阻止提交空标题

#### Scenario: Redux 层防御
- **WHEN** `editChatName` action 接收到空字符串
- **THEN** 系统 reject 该 action 或保持原标题不变
- **AND** 不触发持久化

#### Scenario: 手动命名超长截断
- **WHEN** `editChatName` action 接收到超过 20 个字符的标题
- **THEN** 系统静默截断到前 20 个字符
- **AND** 使用截断后的标题进行更新和持久化

## ADDED Requirements

### Requirement: 侧边栏标题溢出省略显示
当聊天标题在侧边栏容器中超出可用宽度时，系统必须使用省略号显示截断的标题。

#### Scenario: 标题超出容器宽度
- **WHEN** 聊天标题文本宽度超过侧边栏聊天项的可用显示宽度
- **THEN** 系统使用 CSS `text-overflow: ellipsis` 显示省略号
- **AND** 标题不换行、不破坏侧边栏布局

#### Scenario: 标题在容器宽度内完整显示
- **WHEN** 聊天标题文本宽度未超出侧边栏聊天项的可用显示宽度
- **THEN** 系统完整显示标题内容
- **AND** 不显示省略号
