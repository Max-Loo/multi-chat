# Spec: 测试类型安全改进

## Purpose

定义测试代码的类型安全标准，减少 `any` 类型使用，建立 Mock 对象和测试 Fixtures 的类型定义规范，确保测试能够捕捉类型错误。

## ADDED Requirements

### Requirement: 测试代码必须限制 any 类型的使用

系统 SHALL 将测试代码中的 `any` 类型使用从当前的 336 处减少到 50 处以内（保留 15% 用于必要的测试灵活性）。

**允许使用 `any` 的场景**：
- 测试第三方库的未知类型（如复杂的泛型参数）
- 测试错误处理和边界条件
- 快速原型验证（临时使用，后续必须添加类型）

**禁止使用 `any` 的场景**：
- Mock 对象的类型定义
- 测试 Fixtures 的返回类型
- Redux store 的 preloadedState
- 组件 props 的模拟数据

#### Scenario: 为 Mock 对象定义类型接口
- **WHEN** 创建 Mock 对象（如 `mockStreamTextResult`）
- **THEN** 开发者 SHALL 定义明确的类型接口
- **AND** 接口 SHALL 覆盖 Mock 对象的所有属性
- **AND** Mock 对象 SHALL 使用 `as MockedType` 而非 `as any`

**示例**：
```typescript
// ❌ 错误：使用 any
const mockResult = { fullStream: ... } as any;

// ✅ 正确：定义类型
interface MockStreamTextResult {
  fullStream: AsyncIterable<StreamPart>;
  finishReason: Promise<string>;
  usage: Promise<Usage>;
}
const mockResult = { fullStream: ... } as MockStreamTextResult;
```

#### Scenario: 为 Fixtures 添加完整的类型定义
- **WHEN** 创建测试数据工厂（如 `createMockRemoteProvider`）
- **THEN** 函数返回值 SHALL 明确标注类型
- **AND** 类型 SHALL 与生产代码的类型定义保持一致
- **AND** Fixtures SHALL 使用 Zod 或类似库验证数据结构

**示例**：
```typescript
// ❌ 错误：返回类型为 any
export const createMockModel = (overrides?: any): any => { ... }

// ✅ 正确：明确的类型定义
export const createMockModel = (
  overrides?: Partial<Model>
): Model => { ... }
```

#### Scenario: Redux Store PreloadedState 类型安全
- **WHEN** 配置测试用的 Redux store
- **THEN** `preloadedState` SHALL 使用 `Partial<RootState>` 类型
- **AND** 测试 SHALL NOT 使用 `as any` 绕过类型检查
- **AND** 未提供的 state 片段 SHALL 使用真实的初始状态

**示例**：
```typescript
// ❌ 错误：使用 any
const store = configureStore({
  reducer: rootReducer,
  preloadedState: state as any,
});

// ✅ 正确：使用 Partial
const store = configureStore({
  reducer: rootReducer,
  preloadedState: {
    models: { ... },
    chat: { ... },
  } as Partial<RootState>,
});
```

### Requirement: 测试辅助函数必须提供完整的类型推断

系统 SHALL 为所有测试辅助函数（如 `createTestStore`、`renderWithProviders`）提供完整的类型推断，避免测试代码中的类型断言。

**类型推断原则**：
- 函数参数应使用泛型，根据输入自动推断输出类型
- 避免使用 `unknown` 或 `any` 作为中间类型
- 使用 TypeScript 的 `infer` 关键字提取类型

#### Scenario: createTestStore 支持类型推断
- **WHEN** 创建测试用的 Redux store
- **THEN** `createTestStore()` 函数 SHALL 使用泛型支持状态类型推断
- **AND** 返回的 store 类型 SHALL 包含正确的 dispatch 和 state 类型

**示例**：
```typescript
// ✅ 正确：类型推断
function createTestStore<S extends RootState = RootState>(
  preloadedState?: Partial<S>
): EnhancedStore<S> {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}

// 使用时自动推断类型
const store = createTestStore({
  models: { modelList: [] }
});
// store 的类型自动推断为 EnhancedStore<RootState>
```

#### Scenario: renderWithProviders 保持组件 props 类型
- **WHEN** 使用 `renderWithProviders` 渲染组件
- **THEN** 辅助函数 SHALL 保留组件的 props 类型
- **AND** 测试代码 SHALL 获得完整的 props 类型提示

### Requirement: 必须提供测试专用的类型定义文件

系统 SHALL 在 `src/__test__/types/test-types.ts` 中集中定义测试专用类型，包括 Mock 类型、Fixture 类型、测试工具类型。

**类型定义分类**：
- **Mock 类型**: `MockedStreamTextResult`, `MockedModelProvider`, `MockedChatMessage`
- **Fixture 类型**: `TestModelFactory`, `TestChatFactory`, `TestProviderFactory`
- **工具类型**: `TestStore`, `TestRenderResult`, `TestContext`

#### Scenario: 导出 Mock 类型供测试使用
- **WHEN** 创建 Mock 对象
- **THEN** 开发者 SHALL 从 `@/__test__/types` 导入对应的 Mock 类型
- **AND** Mock 类型 SHALL 包含所有必需属性和可选属性

#### Scenario: Fixture 工厂函数类型定义
- **WHEN** 创建测试数据工厂
- **THEN** 工厂函数 SHALL 使用统一的 `FixtureFactory<T>` 类型
- **AND** 类型 SHALL 支持 `overrides` 参数来部分覆盖数据

**示例**：
```typescript
// 统一的 Fixture 工厂类型
type FixtureFactory<T> = (
  overrides?: Partial<T>
) => T;

// 使用示例
export const createTestModel: FixtureFactory<Model> = (overrides) => ({
  id: 'test-model-id',
  providerKey: ModelProviderKeyEnum.DEEPSEEK,
  ...overrides,
});
```

### Requirement: Vitest Mocked 工具必须替代 as any

系统 SHALL 使用 Vitest 的 `Mocked<T>` 和 `mocked()` 函数来替代 `as any`，确保 Mock 对象的类型安全。

**Vitest Mocked 工具**：
- `import { mocked } from 'vitest'`: 为函数添加 Mock 类型
- `Mocked<T>`: 类型，用于标注 Mock 对象
- `MockedFunction<T>`: 类型，用于标注 Mock 函数

#### Scenario: 使用 mocked() 包装 Mock 函数
- **WHEN** Mock 一个导入的函数
- **THEN** 测试 SHALL 使用 `mocked(func)` 包装函数
- **AND** 包装后的函数 SHALL 保留原始类型签名
- **AND** 测试 SHALL 使用 `mocked(func).mockReturnValue()` 设置返回值

**示例**：
```typescript
// ❌ 错误：使用 as any
import { streamText } from 'ai';
vi.mocked(streamText).mockReturnValueOnce(mockResult as any);

// ✅ 正确：使用 mocked
import { streamText } from 'ai';
const mockStreamText = mocked(streamText);
mockStreamText.mockReturnValueOnce(mockResult);
```

#### Scenario: 使用 Mocked 类型标注 Mock 对象
- **WHEN** 创建复杂的 Mock 对象（如模块 Mock）
- **THEN** 测试 SHALL 使用 `Mocked<OriginalType>` 标注类型
- **AND** Mock 对象 SHALL 包含所有必需的属性和方法

### Requirement: 测试中的 any 使用必须添加注释说明

系统 SHALL 要求测试代码中保留的 `any` 类型使用必须添加注释，说明为什么无法使用具体类型。

**注释格式**：
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Reason: <说明原因>
const obj = someValue as any;
```

**可接受的原因**：
- "第三方库类型定义不完整"
- "测试错误处理，需要构造无效输入"
- "临时原型验证，将在 <issue #xxx> 中添加类型"

#### Scenario: any 使用必须有注释
- **WHEN** 测试代码中必须使用 `any` 类型
- **THEN** 开发者 SHALL 添加 `// Reason:` 注释
- **AND** 注释 SHALL 说明为什么不能使用具体类型
- **AND** ESLint 规则 SHALL 强制执行此要求

#### Scenario: 定期审查 any 使用
- **WHEN** 代码审查或定期检查
- **THEN** 团队 SHALL 检查测试中的 `any` 使用
- **AND** 对于缺少注释的 `any`，要求开发者补充或重构
- **AND** 对于临时原型验证的 `any`，要求在后续迭代中添加类型

### Requirement: 类型改进必须逐步进行并验证

系统 SHALL 要求类型安全改进分阶段进行，每个阶段都验证测试覆盖率未下降。

**分阶段策略**：
1. **第一阶段**：为所有 Fixtures 添加类型定义（减少 ~100 处 any）
2. **第二阶段**：为 Mock 对象添加类型接口（减少 ~150 处 any）
3. **第三阶段**：为 Redux store preloadedState 添加类型（减少 ~50 处 any）
4. **第四阶段**：清理剩余的 any，添加注释说明（减少 ~36 处 any）

#### Scenario: 每个阶段完成后验证测试覆盖率
- **WHEN** 完成一个阶段的类型安全改进
- **THEN** 开发者 SHALL 运行 `pnpm test:coverage`
- **AND** 覆盖率报告 SHALL 显示覆盖率未下降
- **AND** 所有测试 SHALL 继续通过

#### Scenario: 阶段性提交避免大规模冲突
- **WHEN** 进行类型安全改进
- **THEN** 开发者 SHALL 按阶段提交 PR（而非一次性改动 336 处）
- **AND** 每个 PR SHALL 包含明确的范围（如 "Fix: 添加 Fixtures 类型定义"）
- **AND** 代码审查者 SHALL 重点检查类型定义的准确性
