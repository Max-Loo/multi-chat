## ADDED Requirements

### Requirement: 内联 action dispatch SHALL 使用 action creator

测试中 dispatch action 时 SHALL 使用从 slice 导出的 action creator，SHALL NOT 手写内联 action 对象并附加 `as any`。

#### Scenario: useTypedSelectedChat 使用 action creator

- **WHEN** 检查 `src/__test__/hooks/useTypedSelectedChat.test.tsx` 中的 dispatch 调用
- **THEN** 文件 SHALL 从 `@/store/slices/chatSlices` 导入 `setSelectedChatId` 等 action creator（按名称逐个导入，与项目现有模式一致）
- **AND** 文件 SHALL NOT 包含 `{ type: 'chat/setSelectedChatId' } as any` 模式

#### Scenario: useIsChatSending 使用 action creator

- **WHEN** 检查 `src/__test__/hooks/useIsChatSending.test.ts` 中的 dispatch 调用
- **THEN** 文件 SHALL 从 `@/store/slices/chatSlices` 导入 `setSelectedChatId` 等 action creator（按名称逐个导入）
- **AND** 文件 SHALL NOT 包含内联 action 对象附加 `as any` 的模式

**例外**：`sendMessage` thunk 未从 slice 导出（为内部实现），因此 `chatModel/sendMessage/pending` 类型的内联 action 无法通过 action creator 替代。该处 `as any` SHALL 保留并添加注释说明原因（如 `// sendMessage 未导出，无法使用 sendMessage.pending`）。

### Requirement: mock 函数签名 SHALL 匹配 prop 类型

当 mock 组件的 callback prop 时，mock 函数签名 SHALL 与 prop 的类型定义匹配，SHALL NOT 使用 `as any` 绕过类型不匹配。

#### Scenario: ModelConfigForm onFinish mock 类型匹配

- **WHEN** 检查 `src/__test__/components/ModelConfigForm.test.tsx` 中的 `onFinish` mock
- **THEN** mock 函数 SHALL 使用 `vi.fn<(model: Model) => void>()` 或等效的类型化写法（`Model` 类型从 `@/types/model` 导入）
- **AND** 文件 SHALL NOT 包含 `onFinish={mockOnFinish as any}` 模式

## MODIFIED Requirements

### Requirement: 测试代码必须限制 any 类型的使用

系统 SHALL 将测试代码中的 `any` 类型使用从当前的约 40 处减少到 33 处以内（保留合理使用的约 20 处 + `setup.ts` 中的约 5 处 + 有注释的约 8 处）。

**允许使用 `any` 的场景**：
- 测试第三方库的未知类型（如 AI SDK 的复杂泛型、Canvas API、浏览器 API）
- 测试错误处理和边界条件（如 `chatMiddleware.test.ts` 中构造不符合 payload 类型的对象）
- `setup.ts` 中 AI SDK mock 的 `stream: [] as any`
- 第三方库内部类型不完整（如 TanStack Table 的 `accessorKey`、ProviderSDKLoaderClass）

**禁止使用 `any` 的场景**：
- Mock 对象的类型定义
- 测试 Fixtures 的返回类型
- Redux store 的 preloadedState
- 组件 props 的模拟数据
- mock 路由 hooks 的返回值
- 测试边界值（null/undefined 输入）
- 构造 mock store state
- mock 子组件
- 内联 action 对象 dispatch → 使用 action creator
- callback prop 的 mock 函数签名 → 使用正确的泛型参数

#### Scenario: 为 Mock 对象定义类型接口
- **WHEN** 创建 Mock 对象（如 `mockStreamTextResult`）
- **THEN** 开发者 SHALL 定义明确的类型接口
- **AND** 接口 SHALL 覆盖 Mock 对象的所有属性
- **AND** Mock 对象 SHALL 使用 `as MockedType` 而非 `as any`

#### Scenario: 测试中的 any 使用必须添加注释说明
- **WHEN** 测试代码中必须使用 `any` 类型
- **THEN** 开发者 SHALL 添加注释说明为什么无法使用具体类型
- **AND** 注释 SHALL 说明为什么不能使用具体类型
