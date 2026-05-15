## ADDED Requirements

### Requirement: 删除零行为价值的重复测试

系统 SHALL 从以下位置删除运行时行为完全相同的重复测试用例：

- `src/__test__/hooks/useDebounce.test.ts` 的"泛型类型测试" describe 块（string/number/object/array 四个测试）
- `src/__test__/components/Layout.test.tsx` 的"子组件位置测试" describe 块（2 个与已有测试重复的用例）
- `src/__test__/components/ChatPanel.test.tsx` 的"组件结构和布局" describe 块（3 个与首测重复的用例）
- `src/__test__/hooks/useBasicModelTable.test.tsx` 的"使用 createMockModel 创建测试模型数据" describe 块（与 2 模型测试走相同路径）

#### Scenario: 泛型测试删除后不影响行为覆盖
- **WHEN** 删除 useDebounce 的 4 个泛型类型测试
- **THEN** 基础功能测试（行 16-63）和参数变化测试（行 68-87）仍然完整覆盖 useDebounce 的所有运行时行为

#### Scenario: Layout 重复测试删除后核心验证仍在
- **WHEN** 删除 Layout 的"子组件位置测试" describe 块
- **THEN** "桌面端应有 Sidebar 和主内容区域并排"测试仍然验证 Sidebar 的 DOM 位置

#### Scenario: ChatPanel 重复测试删除后首测覆盖不变
- **WHEN** 删除 ChatPanel 的"组件结构和布局" describe 块（3 个测试）
- **THEN** "应该渲染单模型聊天面板"测试仍然验证 chat-panel、chat-panel-header、chat-panel-sender 的存在

### Requirement: 重写仅有隐式断言的渲染测试

系统 SHALL 将仅调用 `getByTestId` 或 `getByRole` 而没有 `expect` 的测试重写为有明确断言的测试。重写 SHALL 验证具体的组件行为而非仅"不崩溃"。

涉及文件：
- `src/__test__/components/Layout.test.tsx`：4 个仅 `getByTestId`/`getByRole` 的测试
- `src/__test__/components/Splitter.test.tsx`："应该应用正确的容器样式"测试

#### Scenario: Layout 渲染测试重写为验证具体结构
- **WHEN** 重写"应该正确渲染 Layout 组件"测试
- **THEN** 测试 SHALL 断言 layout-root 元素存在，且包含 role="main" 的子元素

#### Scenario: Layout 布局结构测试合并
- **WHEN** 删除"应该应用正确的布局结构"测试（仅验证 children.length > 0）
- **THEN** 桌面端/移动端布局测试中 SHALL 包含对 DOM 子元素结构的验证

#### Scenario: Splitter 样式测试重写为验证实际行为
- **WHEN** 重写"应该应用正确的容器样式"测试
- **THEN** 测试 SHALL 验证 splitter-container 的实际行为属性（如方向、子面板数量），而非仅检查存在性

### Requirement: 修复守卫空转测试

系统 SHALL 去掉导致断言可能不执行的 `if` 守卫，改为构造必定触发断言的测试数据。

涉及文件：
- `src/__test__/components/ChatPanel.test.tsx`：增加列数和减少列数测试中的 `if` 守卫

#### Scenario: 增加列数测试无守卫执行
- **WHEN** 使用 `renderChatPanel(2)` 渲染并点击增加列数按钮
- **THEN** 测试 SHALL 无条件执行 `expect(parseInt(columnInput.value)).toBe(initialValue + 1)`，不使用 `if` 守卫

#### Scenario: 减少列数测试无守卫执行
- **WHEN** 使用 `renderChatPanel(3)` 渲染并点击减少列数按钮
- **THEN** 测试 SHALL 无条件执行 `expect(parseInt(columnInput.value)).toBe(initialValue - 1)`，不使用 `if` 守卫

### Requirement: 加强弱断言

系统 SHALL 将过于宽松的断言替换为精确断言，确保测试失败时能明确指示问题所在。

涉及文件：
- `src/__test__/hooks/useBasicModelTable.test.tsx`：筛选测试的 `toBeLessThanOrEqual` 断言

#### Scenario: 筛选测试使用精确断言
- **WHEN** 设置筛选文本为 'GPT'，等待防抖完成
- **THEN** 测试 SHALL 断言 `filteredModels.length` 等于精确期望值，且验证筛选结果的 nickname 包含筛选关键词

### Requirement: 加强边界条件测试断言

系统 SHALL 将仅检查元素存在性的边界条件测试重写为验证具体边界行为。

涉及文件：
- `src/__test__/components/ChatPanel.test.tsx`："处理空的 chatModelList"和"处理未命名的聊天"
- `src/__test__/components/Layout.test.tsx`："应该处理空 className"

#### Scenario: 空 chatModelList 边界测试验证具体行为
- **WHEN** 使用 `renderChatPanel(0)` 渲染（无模型的聊天面板）
- **THEN** 测试 SHALL 验证面板在无模型时的具体渲染状态（如显示占位内容或空状态提示），而非仅检查 chat-panel 存在

#### Scenario: 未命名聊天边界测试验证具体行为
- **WHEN** 使用 `renderChatPanel(1, { chatProps: { name: '' } })` 渲染
- **THEN** 测试 SHALL 验证空名称在标题区域的具体显示行为，而非仅检查 chat-panel 存在

#### Scenario: 空 className 边界测试验证具体行为
- **WHEN** 使用 `renderLayout(store, { className: '' })` 渲染
- **THEN** 测试 SHALL 验证空 className 不添加额外 class，或验证渲染结果与无 className 时一致
