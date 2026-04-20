## Context

前一个变更 `dedupe-step-name-type` 已完成：
- 将 9 个独立常量合并为 `STEP_NAMES` 对象
- `StepName` 类型从 `STEP_NAMES` 自动派生
- `dependencies` 值从裸字符串改为 `STEP_NAMES.xxx` 引用

但 `InitStep` 接口中 `dependencies` 的类型声明仍为 `string[]`，未与 `StepName` 关联。

## Goals / Non-Goals

**Goals:**

- 将 `dependencies?: string[]` 收紧为 `dependencies?: StepName[]`，使拼写错误在编译期被捕获

**Non-Goals:**

- 不改变 `InitStep` 其他字段
- 不改变 `ExecutionContext` 中 `getResult`/`setResult`/`isSuccess` 的参数类型（它们接受 `string` 是合理的，因为可能传入动态值）

## Decisions

### D1: 仅修改 `types.ts` 中 `dependencies` 的类型声明

修改 `src/services/initialization/types.ts:21`：

```typescript
// Before
dependencies?: string[];

// After
dependencies?: StepName[];
```

`types.ts` 已从 `@/config/initSteps` 导入 `StepName`（前一个变更完成），无需额外导入。

**理由**: 最小改动，仅修改一处类型声明。由于所有 `dependencies` 值已使用 `STEP_NAMES.xxx`（类型为 `StepName` 的字面量），收紧类型不会引入编译错误。

**替代方案**: 无。这是唯一的改动点。

### D2: 同步放宽 TestInitStep 的 dependencies 类型

修改 `src/__test__/services/lib/initialization/fixtures.ts:13`：

```typescript
// Before
export type TestInitStep = Omit<InitStep, 'name'> & { name: string };

// After
export type TestInitStep = Omit<InitStep, 'name' | 'dependencies'> & { name: string; dependencies?: string[] };
```

**理由**: `TestInitStep` 从 `InitStep` 继承了 `dependencies` 的类型。收紧为 `StepName[]` 后，测试代码中使用 `'step1'`、`'A'` 等非 `StepName` 字符串作为依赖名的地方会产生编译错误。测试工具应保持灵活性，允许使用任意字符串。

**替代方案**: 在每个测试文件中使用 `as unknown as InitStep[]` 强制转换。但不必要地增加了样板代码，且部分测试已因使用 `TestInitStep` 类型而无法通过强制转换解决。

## Risks / Trade-offs

- **风险极低** — 前一个变更已确保所有 `dependencies` 值的类型兼容，此改动仅为接口声明补齐类型约束
