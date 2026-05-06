# 类型安全指南 (Type Safety Guide)

## 为什么类型安全重要？

类型安全是测试质量的基础，它能：

| 优势 | 说明 |
|------|------|
| **捕获错误** | 在编译时发现类型错误，而非运行时 |
| **提升可维护性** | 类型即文档，代码意图清晰 |
| **重构友好** | 改动代码时，类型系统会自动检查影响范围 |
| **减少 `any`** | 避免使用 `any` 导致的类型丢失 |

## 核心原则

**始终为 Mock 对象定义类型，避免使用 `any`**。

### 量化目标

- **`any` 使用数量 ≤ 50 处**
- **所有 Mock 对象都有类型定义**
- **所有 `any` 使用都有注释说明**

## 为 Mock 对象定义类型

### 基本方法：定义接口

```typescript
// ✅ 定义 Mock 对象的接口
interface MockStreamTextResult {
  stream: ReadableStream;
  metadata: {
    finishReason: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
    };
  };
}

// 使用接口
const mockStreamResult: MockStreamTextResult = {
  stream: new ReadableStream(),
  metadata: {
    finishReason: 'stop',
    usage: {
      promptTokens: 10,
      completionTokens: 20,
    },
  },
};

// ❌ 避免：使用 any
const mockStreamResult: any = {
  stream: new ReadableStream(),
  metadata: { /* ... */ },
};
```

### 使用 Partial 和 Omit

```typescript
// 完整类型
interface Model {
  id: string;
  nickname: string;
  apiKey: string;
  providerKey: string;
  // ... 更多字段
}

// Mock 对象可能只需要部分字段
const mockModel: Partial<Model> = {
  nickname: 'Test Model',
  apiKey: 'sk-test',
};

// 或者明确指定需要的字段
interface MockModelOptions {
  nickname?: string;
  apiKey?: string;
  providerKey?: string;
}

const mockModel: MockModelOptions = {
  nickname: 'Test Model',
  apiKey: 'sk-test',
};
```

## 使用 Vitest 的 Mocked 工具

### mocked() 函数

`mocked()` 函数可以为已 Mock 的模块添加类型。

```typescript
import { vi, mocked } from 'vitest';

// Mock 整个模块
vi.mock('@/utils/api', () => ({
  fetchData: vi.fn(),
}));

// 导入 Mock 的模块
import { fetchData } from '@/utils/api';

// 使用 mocked() 添加类型
const mockFetchData = mocked(fetchData);

// 现在可以享受类型提示和检查
mockFetchData.mockResolvedValue({ data: 'test' });
expect(mockFetchData).toHaveBeenCalledWith('/api/data');
```

### 类型化的 Mock 工厂

```typescript
import { Mock } from 'vitest';

// 定义 Mock 函数类型
interface TauriShellMock {
  open: Mock<(url: string) => Promise<void>>;
  Command: {
    create: Mock<(program: string) => { execute: Mock<() => Promise<{ stdout: string; stderr: string }>> }>;
  };
}

// 创建 Mock 工厂
export const createShellMocks = (): TauriShellMock => ({
  open: vi.fn().mockResolvedValue(undefined),
  Command: {
    create: vi.fn().mockReturnValue({
      execute: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
    }),
  },
});

// 使用
const mocks = createShellMocks();
mocks.open.mockResolvedValue(undefined);
```

## Redux Store 类型安全

### 为 preloadedState 定义类型

```typescript
import type { PreloadedState } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

// 使用 Partial<RootState> 确保 preloadedState 类型正确
const preloadedState: PreloadedState<RootState> = {
  models: {
    models: [],
    loading: false,
    error: null,
  },
  chat: {
    chatList: [],
    selectedChatId: null,
    loading: false,
    error: null,
    initializationError: null,
    runningChat: null,
  },
};

const store = configureStore({
  reducer: rootReducer,
  preloadedState,
});
```

### 类型化的 createTestStore

```typescript
import type { EnhancedStore } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

/**
 * 创建测试用 Redux Store
 * @param preloadedState 预加载的状态
 * @returns 配置好的 Redux Store
 */
export const createTestStore = (
  preloadedState?: PreloadedState<RootState>
): EnhancedStore<RootState> => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
};

// 使用
const store = createTestStore({
  models: {
    models: createMockModels(3),
    loading: false,
    error: null,
  },
});

// 类型推断正确
const models = selectModels(store.getState());
// models 的类型为 Model[]
```

## 何时使用 `any`

### 允许使用 `any` 的场景

仅在以下情况使用 `any`，并**必须添加注释说明**：

#### 1. 第三方库类型过于复杂

```typescript
// 使用 any 的原因：第三方库类型定义过于复杂，定义完整类型收益低
const complexThirdPartyMock: any = createComplexThirdPartyMock();
```

#### 2. 测试框架限制

```typescript
// 使用 any 的原因：测试框架无法推断正确的泛型类型
const store: any = configureStore({
  reducer: rootReducer,
  preloadedState: complexState,
});
```

#### 3. 临时调试（应尽快修复）

```typescript
// 使用 any 的原因：临时调试，后续需要定义正确的类型
const tempMock: any = { /* ... */ };
// TODO: 定义正确的类型接口
```

### `any` 注释规范

所有 `any` 使用必须遵循以下格式：

```typescript
// 使用 any 的原因：<具体原因>
const variableName: any = value;
```

**示例**：

```typescript
// 使用 any 的原因：Vercel AI SDK 的 streamText 返回类型过于复杂，定义完整类型收益低
const mockStreamResult: any = createMockStreamResult();

// 使用 any 的原因：Redux Toolkit 的 configureStore 在某些情况下无法正确推断 preloadedState 类型
const store: any = configureStore({ /* ... */ });
```

### ESLint 规则

项目可以配置 ESLint 规则强制要求 `any` 注释：

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-explicit-any": ["warn", {
      "allowRestOfAnyStatement": false
    }]
  }
}
```

## 实用模式

### 模式 1：使用类型工厂

```typescript
/**
 * 创建 Mock 流式响应
 * @param options 配置选项
 * @returns Mock 流式响应对象
 */
export const createMockStreamResult = (
  options: {
    text?: string;
    finishReason?: string;
    usage?: { promptTokens: number; completionTokens: number };
  } = {}
): MockStreamTextResult => {
  return {
    stream: createMockStream(options.text || 'Hello'),
    metadata: {
      finishReason: options.finishReason || 'stop',
      usage: options.usage || { promptTokens: 0, completionTokens: 0 },
    },
  };
};

// 使用
const mockResult = createMockStreamResult({
  text: 'Test response',
  finishReason: 'length',
});
```

### 模式 2：使用泛型

```typescript
/**
 * 创建 Mock 对象的通用工厂
 * @param defaults 默认值
 * @param overrides 覆盖值
 * @returns Mock 对象
 */
export const createMockObject = <T extends object>(
  defaults: T,
  overrides?: Partial<T>
): T => {
  return { ...defaults, ...overrides };
};

// 使用
interface Model {
  id: string;
  nickname: string;
  apiKey: string;
}

const mockModel = createMockObject<Model>(
  {
    id: 'default-id',
    nickname: 'Default Model',
    apiKey: 'sk-default',
  },
  {
    nickname: 'Custom Model', // 类型安全
  }
);
```

### 模式 3：使用 Zod Schema

```typescript
import { z } from 'zod';

// 定义 Schema
const ModelSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  apiKey: z.string(),
  providerKey: z.string(),
});

// 推断类型
type Model = z.infer<typeof ModelSchema>;

// 验证数据
function createMockModel(data: unknown): Model {
  return ModelSchema.parse(data);
}

// 使用
const mockModel = createMockModel({
  id: 'test-id',
  nickname: 'Test Model',
  apiKey: 'sk-test',
  providerKey: 'deepseek',
});
```

## 常见错误和解决方案

### 错误 1：类型不匹配

**问题**：Mock 对象的类型与真实类型不匹配。

```typescript
// ❌ 错误：类型不匹配
const mockModel: Model = {
  id: 'test-id',
  nickname: 'Test Model',
  // 缺少必需字段 apiKey
};
```

**解决方案**：使用 `Partial` 或提供完整的默认值。

```typescript
// ✅ 使用 Partial
const mockModel: Partial<Model> = {
  id: 'test-id',
  nickname: 'Test Model',
};

// ✅ 提供完整默认值
const mockModel: Model = {
  id: 'test-id',
  nickname: 'Test Model',
  apiKey: 'sk-default',
  providerKey: 'deepseek',
};
```

### 错误 2：类型断言滥用

**问题**：过度使用 `as` 类型断言。

```typescript
// ❌ 错误：滥用类型断言
const mockData = someComplexData as Model;
```

**解决方案**：使用类型收窄或类型守卫。

```typescript
// ✅ 使用类型守卫
function isModel(data: unknown): data is Model {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'nickname' in data
  );
}

if (isModel(someComplexData)) {
  // data 的类型为 Model
  const model: Model = someComplexData;
}
```

### 错误 3：忽略类型错误

**问题**：使用 `@ts-ignore` 忽略类型错误。

```typescript
// ❌ 错误：忽略类型错误
// @ts-ignore
const mockData = createMockData();
```

**解决方案**：修复类型错误或使用 `any` 并添加注释。

```typescript
// ✅ 使用 any 并添加注释
// 使用 any 的原因：createMockData 的类型定义过于复杂
const mockData: any = createMockData();
```

## 类型检查工具

### TypeScript 编译器

```bash
# 运行类型检查
pnpm tsc

# 检查特定文件
pnpm tsc --noEmit src/__test__/example.test.ts
```

### Vitest 类型检查

```bash
# Vitest 会自动进行类型检查
pnpm test

# 仅类型检查（不运行测试）
pnpm test --typecheck
```

### 统计 `any` 使用数量

```bash
# 统计所有 any 的使用
grep -r "any" src/__test__/ --exclude-dir=node_modules | wc -l

# 查找未注释的 any 使用
grep -r ": any" src/__test__/ --exclude-dir=node_modules | grep -v "使用 any 的原因"
```

## 最佳实践

### 1. 始终定义 Mock 对象的类型

```typescript
// ✅ 定义类型
interface MockApiResponse {
  data: string;
  status: number;
}

const mockResponse: MockApiResponse = {
  data: 'test',
  status: 200,
};

// ❌ 使用 any
const mockResponse: any = {
  data: 'test',
  status: 200,
};
```

### 2. 使用类型工厂

```typescript
// ✅ 使用类型工厂
const mockModel = createMockModel({
  nickname: 'Test Model',
});

// ❌ 手动构造对象
const mockModel = {
  id: 'test-id',
  nickname: 'Test Model',
  apiKey: 'sk-test',
  // ... 更多字段
};
```

### 3. 优先使用 Partial

```typescript
// ✅ 使用 Partial
const mockState: Partial<RootState> = {
  models: {
    models: [],
    loading: false,
    error: null,
  },
};

// ❌ 使用 any
const mockState: any = {
  models: {
    models: [],
    loading: false,
    error: null,
  },
};
```

### 4. 添加详细的 JSDoc 注释

```typescript
/**
 * 创建测试用的 Redux Store
 * @param preloadedState 预加载的状态（部分字段）
 * @returns 配置好的 Redux Store
 * @example
 * const store = createTestStore({
 *   models: { models: [], loading: false },
 * });
 */
export const createTestStore = (
  preloadedState?: PreloadedState<RootState>
): EnhancedStore<RootState> => {
  // ...
};
```

## 检查清单

编写测试时，使用以下检查清单：

- [ ] 所有 Mock 对象都有类型定义
- [ ] 不使用 `as any`（除非有注释说明）
- [ ] `any` 使用数量 ≤ 项目目标（50 处）
- [ ] 所有 `any` 使用都有注释说明
- [ ] Redux Store 的 `preloadedState` 类型正确
- [ ] Mock 函数使用 `mocked()` 或定义接口
- [ ] 复杂 Mock 对象使用类型工厂
- [ ] 运行 `pnpm tsc` 确认无类型错误

## 相关文档

- [测试辅助工具文档](../README.md)
- [Vitest 类型检查](https://vitest.dev/guide/why.html#type-checking)
- [TypeScript 文档](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Zod 文档](https://zod.dev/)
