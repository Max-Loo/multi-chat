## MODIFIED Requirements

### Requirement: 测试命名规范
测试名称 SHALL 描述用户可见结果而非内部实现。格式为"应该 [预期行为] 当 [条件]"（中文）或 "should [expected behavior] when [condition]"（英文）。

#### Scenario: 语义状态测试命名
- **WHEN** 测试验证组件的语义状态（如选中、活跃、展开）
- **THEN** 测试名称 SHALL 描述用户可见的行为变化，而非引用 ARIA 属性名
- **EXAMPLE** "应该高亮显示当前聊天 当聊天被选中" 而非 "应该设置 aria-selected 为 true"

#### Scenario: 展示变体测试命名
- **WHEN** 测试验证组件的展示变体（如紧凑模式）
- **THEN** 测试名称 SHALL 描述展示效果的变化
- **EXAMPLE** "应该使用紧凑布局 当空间受限" 而非 "应该设置 data-variant 为 compact"

## ADDED Requirements

### Requirement: 断言分类标准
测试断言 SHALL 按三层语义模型分类：ARIA 标准语义、data-variant 自定义语义、纯装饰（不测试）。

#### Scenario: ARIA 标准语义断言适用范围
- **WHEN** 被测状态有对应的 ARIA 标准定义（如选中、活跃、展开、加载、错误）
- **THEN** SHALL 使用 ARIA 属性断言（`aria-selected`、`aria-current`、`aria-expanded`、`role` 等）
- **THEN** SHALL NOT 使用 `toHaveClass` 或 `container.querySelector` 替代

#### Scenario: data-variant 断言适用范围
- **WHEN** 被测状态没有对应的 ARIA 标准定义（如尺寸变体、布局模式）
- **THEN** SHALL 使用 `data-variant` 属性断言
- **THEN** SHALL NOT 直接断言 Tailwind CSS 类名

#### Scenario: 纯装饰样式排除
- **WHEN** 被测样式仅为布局实现细节（如 `flex`、`border-t`、`overflow-y-auto`）
- **THEN** SHALL NOT 出现在测试断言中
