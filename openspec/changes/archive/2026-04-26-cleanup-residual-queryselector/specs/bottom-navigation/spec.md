## MODIFIED Requirements

### Requirement: 底部导航栏可访问性

底部导航栏必须符合可访问性标准。

#### Scenario: 底部导航栏 ARIA 角色
- **WHEN** 底部导航栏渲染
- **THEN** 容器使用原生 `<nav>` 元素（隐式 `role="navigation"`）
- **AND** 有 `aria-label="底部导航"`，与 Sidebar 的"主导航"区分

#### Scenario: 导航项按钮可访问性
- **WHEN** 导航项按钮渲染
- **THEN** 每个按钮有 `aria-label` 描述（如 "导航到聊天"）
- **AND** 使用 `<button>` 元素（可键盘访问）
- **AND** 支持焦点样式

#### Scenario: 键盘导航支持
- **WHEN** 用户使用 Tab 键
- **THEN** 可以在导航项之间导航
- **AND** 焦点样式明显可见
- **AND** 支持焦点 trap（可选）

#### Scenario: 语义化查询可定位
- **WHEN** 测试中使用 `screen.getByRole('navigation', { name: '底部导航' })`
- **THEN** 能唯一匹配到底部导航栏组件
- **AND** 不会与 Sidebar 的 `<nav aria-label="主导航">` 混淆
