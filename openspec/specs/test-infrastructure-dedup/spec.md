## ADDED Requirements

### Requirement: ResizeObserver polyfill 集中注册
ResizeObserver 空 polyfill SHALL 在 `setup.ts` 中全局注册一次，各测试文件 SHALL NOT 重复定义。

#### Scenario: 测试文件不再包含 ResizeObserver 定义
- **WHEN** 查看 `Grid.test.tsx`、`Splitter.test.tsx`、`ChatPanelContentDetail.test.tsx`、`Chat/Detail.test.tsx` 四个文件
- **THEN** 这些文件中 SHALL NOT 包含任何 ResizeObserver 的 class 定义或赋值

#### Scenario: setup.ts 提供全局 ResizeObserver
- **WHEN** 运行任何需要 ResizeObserver 的测试
- **THEN** 测试 SHALL 正常通过，不抛出 ResizeObserver is not defined 错误

### Requirement: highlight.js mock 共享
`highlight.js` 的 `vi.mock` 定义 SHALL 提取到共享的 mock 模块文件 `helpers/mocks/highlight.ts` 中。

#### Scenario: ChatBubble 和 ThinkingSection 使用共享 highlight.js mock
- **WHEN** 查看 `ChatBubble.test.tsx` 和 `ThinkingSection.test.tsx` 中的 highlight.js mock 定义
- **THEN** 两个文件 SHALL 使用相同的共享 mock，而非各自独立定义

### Requirement: setup.ts 不包含 barrel export
`setup.ts` SHALL NOT 包含 `export * from './helpers'` 形式的 barrel export。

#### Scenario: helpers 导入方式
- **WHEN** 测试文件需要使用 helpers 中的工具
- **THEN** 该文件 SHALL 直接从 helpers 文件导入，而非通过 setup.ts 间接导入

### Requirement: 手动构造对象替换为工厂调用
测试文件中手动构造 `StandardMessage`、`Model` 等 fixture 对象的代码 SHALL 替换为对应的 mock 工厂调用。

#### Scenario: messageTransformer.test.ts 使用 createMockMessage
- **WHEN** 查看 `messageTransformer.test.ts` 中的 fixture 构造代码
- **THEN** SHALL 使用 `createMockMessage` 工厂替代手动构造 `StandardMessage`

#### Scenario: ChatPanelContentDetail.test.tsx 使用工厂
- **WHEN** 查看 `ChatPanelContentDetail.test.tsx` 中的 fixture 构造代码
- **THEN** SHALL 使用 `createMockMessage` 和对应 Model 工厂替代手动构造

#### Scenario: modelMiddleware.test.ts 使用工厂
- **WHEN** 查看 `modelMiddleware.test.ts` 中的 fixture 构造代码
- **THEN** SHALL 使用对应 mock 工厂替代手动构造

### Requirement: RTK 样板测试移除
`chatPageSlices.test.ts` 中验证 RTK 框架保证（不可变性、action type 生成、typeof reducer）的测试 SHALL 被移除。

#### Scenario: 框架保证测试不再存在
- **WHEN** 查看 `chatPageSlices.test.ts` 行 57-85
- **THEN** 验证 RTK 框架行为（非应用逻辑）的测试 SHALL NOT 存在
