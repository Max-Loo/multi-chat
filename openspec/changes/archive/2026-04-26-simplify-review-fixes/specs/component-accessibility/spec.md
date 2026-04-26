## MODIFIED Requirements

### Requirement: 图标按钮须有 aria-label
仅包含图标的按钮（无可见文本） SHALL 设置 `aria-label` 描述按钮功能。`aria-label` 的文本 SHALL 通过 i18n 翻译函数获取，SHALL NOT 硬编码。

#### Scenario: 菜单触发器按钮
- **WHEN** 按钮仅包含图标（如三点菜单、加号、减号）
- **THEN** SHALL 设置 `aria-label` 描述功能
- **THEN** `aria-label` 的值 SHALL 通过 `t()` 翻译函数获取（如 `aria-label={t(($) => $.chat.moreActions)}`）
- **THEN** SHALL NOT 使用硬编码中文字符串（如 `aria-label="更多操作"`）

#### Scenario: 滚动到底部按钮
- **WHEN** 聊天面板有"滚动到底部"按钮
- **THEN** SHALL 设置 `aria-label` 通过 i18n 获取文本

#### Scenario: 错误图标
- **WHEN** 错误提示中的图标使用 `role="img"`
- **THEN** `aria-label` SHALL 通过 i18n 获取文本
- **THEN** SHALL NOT 使用硬编码字符串（如 `aria-label="错误"`）
