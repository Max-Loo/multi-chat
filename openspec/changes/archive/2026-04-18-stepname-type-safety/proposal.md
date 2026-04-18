## Context

当前初始化系统有 9 个步骤，名称散布在 `types.ts`（类型定义）、`initSteps.ts`（步骤配置）、`FatalErrorScreen/index.tsx`（错误匹配）中。`InitStep.name` 类型为 `string`，`InitError.stepName` 类型为 `string | undefined`。仅 `MASTER_KEY_STEP_NAME` 有导出常量，其余 8 个步骤名均为硬编码字面量。

## Goals / Non-Goals

**Goals:**
- 通过 `StepName` 联合类型在编译期捕获步骤名拼写错误
- 为所有步骤名提供导出常量，消除硬编码字面量
- 保持向后兼容，不改变运行时行为

**Non-Goals:**
- 不重构 `InitStep` 接口的其他字段（如 `dependencies: string[]`）
- 不重构 `ExecutionContext.setResult` / `getResult` 的 key 类型
- 不处理 `onError` 回调中重复的结构模式

## Decisions

### 1. 使用联合类型而非枚举

**选择**：`type StepName = 'keyringMigration' | 'i18n' | ...` 联合类型

**替代方案**：TypeScript `enum` 或 `const enum`

**理由**：联合类型与现有 `ErrorSeverity`（`'fatal' | 'warning' | 'ignorable'`）风格一致，且 tree-shaking 友好，不会生成额外的运行时代码。

### 2. 常量定义位置

**选择**：在 `src/config/initSteps.ts` 中定义所有 `STEP_NAME` 常量并导出

**替代方案**：新建 `src/config/stepNames.ts` 专用文件

**理由**：步骤名与 `initSteps` 配置紧密耦合，放在一起方便维护。文件已包含 `MASTER_KEY_STEP_NAME`，扩展为完整集合最自然。若后续步骤名独立变化，可再拆分。

### 3. 类型定义位置

**选择**：在 `src/services/initialization/types.ts` 中定义 `StepName` 类型

**理由**：`InitStep` 和 `InitError` 接口在此文件中定义，类型与接口同文件便于引用和理解。

### 4. 测试辅助函数策略

**选择**：定义 `TestInitStep = Omit<InitStep, 'name'> & { name: string }`，测试辅助函数使用此类型

**替代方案**：在测试中直接使用 `as InitStep` 类型断言，或更新所有测试用例的步骤名为合法 `StepName`

**理由**：测试代码使用 `'step1'`、`'A'` 等抽象步骤名进行通用逻辑测试，这些名称与业务步骤无关。使用 `TestInitStep` 类型保持测试的灵活性和可读性，避免将测试耦合到具体的步骤名列表。

## Risks / Trade-offs

- **步骤增减需同步更新类型** → 新增或删除步骤时，需同时更新 `StepName` 联合类型和对应常量。这是预期行为——编译器会提示遗漏。
- **`dependencies` 字段仍为 `string[]`** → 暂不约束依赖名的类型，保持本次变更范围可控。
- **测试代码需使用 `TestInitStep` 类型** → 测试辅助函数使用 `'step1'`、`'A'` 等非 `StepName` 字符串作为步骤名。通过定义 `TestInitStep = Omit<InitStep, 'name'> & { name: string }` 保持测试的灵活性，避免大量测试用例需要修改。
