## ADDED Requirements

### Requirement: 可疑的 as any SHALL 被类型安全的替代方案替换

测试代码中缺乏充分理由的 `as any` SHALL 被以下类型安全的替代方案替换：

**按类别的替换策略**：

| 类别 | 替换方案 |
|------|---------|
| mock 路由 hooks 返回值 | 使用 `helpers/mocks/router.ts` 中的 `mockRouter` 工具 |
| `null as any` / `undefined as any` | 使用 `as unknown as Type` 或 `null!` |
| 构造 mock store state | 使用 `createTestRootState()` 工厂函数 |
| 传入不匹配的枚举值 | 使用 `as unknown as Type` + 类型断言链 |
| mock children/react element | 使用正确的 React 类型（`React.ReactNode`） |

#### Scenario: mock 路由 hooks 使用类型安全工具
- **WHEN** 测试需要 mock React Router 的 hooks（如 `useParams`、`useNavigate`）
- **THEN** 测试 SHALL 使用 `helpers/mocks/router.ts` 中提供的类型安全 mock 工具
- **AND** 测试 SHALL NOT 手动构造 `as any` 的路由 mock 对象

#### Scenario: 测试边界值使用类型安全断言
- **WHEN** 测试需要传入 null 或 undefined 作为边界值
- **THEN** 测试 SHALL 使用 `as unknown as Type` 类型断言链
- **AND** 测试 SHALL NOT 使用 `as any`

#### Scenario: 构造测试状态使用工厂函数
- **WHEN** 测试需要构造 Redux state 或其他复杂状态对象
- **THEN** 测试 SHALL 使用已有的工厂函数（如 `createTestRootState`）
- **AND** 测试 SHALL NOT 手动构造 `as any` 的状态对象

## MODIFIED Requirements

### Requirement: 测试代码必须限制 any 类型的使用

系统 SHALL 将测试代码中的 `any` 类型使用从当前的约 61 处减少到 40 处以内（保留合理使用的约 20 处 + `setup.ts` 中的约 5 处 + 其余有注释的约 15 处）。

**允许使用 `any` 的场景**（保持不变）：
- 测试第三方库的未知类型（如复杂的泛型参数）
- 测试错误处理和边界条件
- `setup.ts` 中 AI SDK mock 的 `stream: [] as any`

**新增禁止使用 `any` 的场景**：
- mock 路由 hooks 的返回值 → 使用 `helpers/mocks/router.ts`
- 测试边界值（null/undefined 输入） → 使用 `as unknown as Type`
- 构造 mock store state → 使用工厂函数
- mock 子组件 → 应直接渲染真实组件

#### Scenario: 为 Mock 对象定义类型接口
- **WHEN** 创建 Mock 对象（如 `mockStreamTextResult`）
- **THEN** 开发者 SHALL 定义明确的类型接口
- **AND** 接口 SHALL 覆盖 Mock 对象的所有属性
- **AND** Mock 对象 SHALL 使用 `as MockedType` 而非 `as any`

#### Scenario: any 使用必须有注释
- **WHEN** 测试代码中必须使用 `any` 类型
- **THEN** 开发者 SHALL 添加 `// Reason:` 注释
- **AND** 注释 SHALL 说明为什么不能使用具体类型
