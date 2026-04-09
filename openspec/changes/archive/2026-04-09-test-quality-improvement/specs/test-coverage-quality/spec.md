## ADDED Requirements

### Requirement: 永真断言零容忍
测试套件中 MUST NOT 包含 `expect(true).toBe(true)` 等永真断言。每个测试用例 MUST 验证真实的行为或状态。

#### Scenario: 检测永真断言
- **WHEN** 审查 `providerFactory.test.ts` 中的 SDK 加载失败测试
- **THEN** 测试 MUST Mock 动态导入使其抛出错误，并验证错误消息内容

### Requirement: 组件交互测试深度
组件测试 MUST 验证用户可感知的交互行为，而非仅验证组件渲染不崩溃。

#### Scenario: Splitter 面板结构验证
- **WHEN** 测试 Splitter 组件
- **THEN** MUST 验证多行/多列面板正确渲染、面板嵌套结构符合 board 数据（注：Splitter 当前为纯渲染组件，未使用 onLayout 回调）

#### Scenario: ModelSelect 模型数据渲染和选择验证
- **WHEN** 测试 ModelSelect 组件
- **THEN** MUST 验证模型数据正确渲染到界面，且用户选择交互正常工作

### Requirement: Hook 回调触发验证
Hook 回调测试 MUST 验证回调在用户交互后被实际调用，而非仅验证回调函数存在。

#### Scenario: useConfirm onOk 回调验证
- **WHEN** 测试 useConfirm 的 onOk 回调
- **THEN** MUST 模拟点击确认按钮，验证 onOk 回调被调用

#### Scenario: useConfirm onCancel 回调验证
- **WHEN** 测试 useConfirm 的 onCancel 回调
- **THEN** MUST 模拟点击取消按钮，验证 onCancel 回调被调用

### Requirement: 中间件测试关注数据状态
中间件测试 SHOULD 优先验证操作后的数据状态，而非 Mock 函数的调用次数。

#### Scenario: modelMiddleware 数据状态验证
- **WHEN** 测试模型保存中间件
- **THEN** SHOULD 验证保存后的数据可通过再次读取获取，或验证最终数据状态正确
