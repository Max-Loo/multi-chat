## ADDED Requirements

### Requirement: 测试文件中不得存在重复测试用例
同一测试文件中 SHALL NOT 存在两个 describe 块包含相同 mock、相同 render 调用和相同断言的测试用例。

#### Scenario: NoProvidersAvailable 重复 alert 角色测试
- **WHEN** NoProvidersAvailable.test.tsx 的"可访问性"和"样式和布局"两个 describe 块中存在相同的 `render + screen.getByRole('alert')` 断言
- **THEN** SHALL 删除"样式和布局"中的重复测试，仅保留"可访问性"中的原始测试

#### Scenario: ChatButton 重复 aria-selected 测试
- **WHEN** ChatButton.test.tsx 的"组件渲染"和"组件结构和样式"两个 describe 块中存在相同的 `renderChatButton + getByTestId + toHaveAttribute('aria-selected', 'true')` 断言
- **THEN** SHALL 删除"组件结构和样式"中的重复测试，仅保留"组件渲染"中的原始测试

### Requirement: 布局模式测试中不得包含与布局无关的断言
参数化布局模式测试 SHALL 仅包含与布局模式相关的断言。已由独立测试覆盖的通用功能（如菜单按钮存在性）SHALL NOT 出现在布局模式测试中。

#### Scenario: ChatButton 布局模式测试中的冗余菜单按钮断言
- **WHEN** ChatButton.test.tsx 的 4 个布局模式测试（desktop、compact、compressed、mobile）均包含 `screen.getByRole('button', { name: '更多操作' })` 断言
- **THEN** SHALL 移除布局模式测试中的菜单按钮断言，因为第 122-128 行已有独立测试覆盖

### Requirement: 骨架屏测试须验证组件 props 的实际效果
骨架屏组件测试 SHALL 验证传入的 props 对渲染结果的实际影响，而非仅断言容器存在。

#### Scenario: SkeletonList count 验证
- **WHEN** SkeletonList 测试传入 `count={3}`
- **THEN** 测试 SHALL 验证实际渲染了 3 个骨架项（通过子元素数量或 aria-hidden 元素数量）
- **THEN** SHALL NOT 仅断言 `container.firstChild` 存在

#### Scenario: SkeletonMessage isSelf 验证
- **WHEN** SkeletonMessage 测试传入 `isSelf`
- **THEN** 测试 SHALL 验证 isSelf 对布局方向或样式的影响（如 flex-row-reverse 或 data-variant 属性）
- **THEN** SHALL NOT 仅断言 `container.firstChild` 存在

### Requirement: 测试断言须完整表达测试意图
测试的断言 SHALL 完整表达注释中描述的意图。若注释声称验证某个条件，测试 SHALL 包含对应的断言。

#### Scenario: Layout 桌面端测试的"无底部导航"断言
- **WHEN** Layout.test.tsx 桌面端测试注释声称"桌面端只有侧边栏导航，无底部导航"
- **THEN** 测试 SHALL 包含 `expect(screen.queryByRole('navigation', { name: '底部导航' })).toBeNull()` 断言
- **THEN** SHALL NOT 仅断言侧边栏导航存在而忽略底部导航不存在

### Requirement: 测试不得依赖 DOM 子元素顺序假设
测试 SHALL NOT 使用 `container.firstElementChild` 等 API 依赖 DOM 子元素顺序。SHALL 使用语义化查询或 `data-testid` 替代。

#### Scenario: GeneralSetting 滚动容器查询
- **WHEN** GeneralSetting.test.tsx 需要获取滚动容器以触发 scroll 事件
- **THEN** SHALL 通过 `data-testid` 或语义化角色查询滚动容器
- **THEN** SHALL NOT 使用 `container.firstElementChild`
