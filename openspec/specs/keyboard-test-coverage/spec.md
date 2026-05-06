# Spec: 键盘交互测试覆盖

## Purpose

定义键盘交互测试要求，确保带有 `tabIndex={0}` 和 `onKeyDown` 处理器的可交互元素有对应的键盘事件测试覆盖。

## Requirements

### Requirement: onKeyDown 键盘交互须有对应测试
组件中添加了 `tabIndex={0}` 和 `onKeyDown` 处理器的可交互元素 SHALL 有对应的键盘交互测试覆盖。

#### Scenario: ChatButton Enter 键触发点击
- **WHEN** ChatButton 组件的容器 div 具有 tabIndex={0} 和 onKeyDown 处理器
- **THEN** 测试 SHALL 验证按下 Enter 键时触发与点击相同的行为（导航到对应聊天）
- **THEN** 测试 SHALL 验证按下 Space 键时同样触发该行为

#### Scenario: ProviderCard Enter 键触发展开
- **WHEN** ProviderCard 组件的容器 div 具有 tabIndex={0} 和 onKeyDown 处理器
- **THEN** 测试 SHALL 验证按下 Enter 键时调用 onToggle 回调
- **THEN** 测试 SHALL 验证按下 Space 键时同样调用 onToggle 回调

### Requirement: onKeyDown 测试须验证 preventDefault 调用
键盘事件处理中的 `e.preventDefault()` SHALL 在测试中验证，防止浏览器默认行为（如 Space 键滚动页面）干扰用户体验。

#### Scenario: Space 键 preventDefault 验证
- **WHEN** 组件的 onKeyDown 处理器对 Enter 和 Space 键调用 `e.preventDefault()`
- **THEN** 测试 SHALL 验证 Space 键事件被 preventDefault（防止页面滚动）
