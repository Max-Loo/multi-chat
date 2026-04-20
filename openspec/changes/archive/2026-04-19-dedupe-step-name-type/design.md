## Context

当前步骤名存在两处独立维护：

1. `src/config/initSteps.ts` 中 9 个 `*_STEP_NAME` 导出常量
2. `src/services/initialization/types.ts` 中 `StepName` 联合类型手动列举

新增步骤需同时修改两处，无编译期关联。外部仅 `FatalErrorScreen` 导入了 `MASTER_KEY_STEP_NAME`，`StepName` 仅在 `types.ts` 内部使用。

## Goals / Non-Goals

**Goals:**

- 将步骤名常量合并为单一 `as const` 对象，自动派生 `StepName` 类型
- 消除双处维护风险，新增步骤只需在一处操作
- `dependencies` 字段使用 `STEP_NAMES.xxx` 替代裸字符串

**Non-Goals:**

- 不改变 `InitStep`、`InitError` 等接口结构
- 不改变 `dependencies` 字段的类型（已由另一个变更处理为 `StepName[]`）
- 不重构 `InitializationManager` 的结果提取逻辑

## Decisions

### D1: 使用 `as const` 对象作为单一事实来源

```typescript
export const STEP_NAMES = {
  keyringMigration: 'keyringMigration',
  i18n: 'i18n',
  masterKey: 'masterKey',
  models: 'models',
  chatList: 'chatList',
  appLanguage: 'appLanguage',
  transmitHistoryReasoning: 'transmitHistoryReasoning',
  autoNamingEnabled: 'autoNamingEnabled',
  modelProvider: 'modelProvider',
} as const;
```

**理由**: 对象的键名即为步骤名，值与键名相同，TypeScript 可从中派生精确的联合类型。比 enum 更轻量，与现有字符串风格一致。

**替代方案**: `enum StepName { ... }` — 引入新概念且运行时产物多余；保持现状双处维护 — 不解决根本问题。

### D2: `StepName` 类型从 `initSteps.ts` 导出

```typescript
export type StepName = (typeof STEP_NAMES)[keyof typeof STEP_NAMES];
```

`types.ts` 删除手动定义，改为从 `initSteps.ts` 导入。

**理由**: 类型和值定义在同一个文件中，天然同步。`types.ts` 保持为接口定义文件，仅移除重复的类型定义。

### D3: 删除旧 `*_STEP_NAME` 常量，统一使用 `STEP_NAMES.xxx`

`STEP_NAMES.masterKey` 替代 `MASTER_KEY_STEP_NAME`。

**理由**: 减少导出符号数量，访问路径 `STEP_NAMES.xxx` 清晰表明来源是统一的常量对象。

### D4: `dependencies` 字段使用 `STEP_NAMES.xxx` 引用

```typescript
dependencies: [STEP_NAMES.keyringMigration],
```

替代当前裸字符串 `['keyringMigration']`。

## Risks / Trade-offs

- **[导入路径变更]** `FatalErrorScreen` 需从 `MASTER_KEY_STEP_NAME` 改为 `STEP_NAMES.masterKey` → 影响仅 1 个文件，变更简单
- **[类型重导出]** `types.ts` 不再定义 `StepName`，需确认其他文件通过 `types.ts` 间接导入的情况 → grep 显示无外部通过 `types.ts` 导入 `StepName`，所有使用方已直接使用 `InitStep` / `InitError` 接口
