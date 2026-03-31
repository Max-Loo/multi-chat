## Context

当前 `src/lib/` 目录包含 5 个模块，职责混杂：纯工具函数（`cn`）、有状态服务（`i18n`、`global`）、UI 基础设施（`toast`）、编排服务（`initialization`）。而 `src/services/` 已承载了 `chat/` 和 `modelRemote/` 两个业务服务模块。`src/utils/` 已有 20+ 纯工具文件。

项目已约定：纯工具函数放 `src/utils/`，业务服务放 `src/services/`。`src/lib/` 的存在打破了这一约定。

当前 lib 内部依赖关系（无循环依赖）：

```
i18n.ts ──▶ global.ts        (getDefaultAppLanguage, getLanguageLabel)
i18n.ts ──▶ toast/toastQueue (toastQueue)
global.ts  ─ 无内部依赖
toast/     ─ 无内部依赖
initialization/ ─ 无内部依赖
utils.ts    ─ 无内部依赖
```

## Goals / Non-Goals

**Goals:**
- 消除 `src/lib/` 目录，统一目录语义
- `src/utils/` = 纯工具函数（无状态、无副作用）
- `src/services/` = 所有业务服务（有状态、有副作用、外部交互）
- 保持所有现有功能和测试不变

**Non-Goals:**
- 不重构任何模块的内部实现
- 不改变公开 API 或函数签名
- 不合并或拆分现有模块

## Decisions

### D1：`cn()` 合入 `src/utils/utils.ts`

**选择**：将 `cn()` 函数追加到已有 `src/utils/utils.ts`，删除 `lib/utils.ts`。

**理由**：`cn()` 是纯工具函数（twMerge + clsx），与 `utils.ts` 中已有的 `getCurrentTimestamp` 等纯函数性质一致。单独创建 `cn.ts` 文件对于单行函数过于碎片化。

**替代方案**：创建 `src/utils/cn.ts` → 被否决，因为一个 3 行函数不值得独立文件。

### D2：所有 lib 模块迁移到 `src/services/` 对应子目录

**选择**：
- `lib/global.ts` → `services/global.ts`
- `lib/i18n.ts` → `services/i18n.ts`
- `lib/toast/` → `services/toast/`
- `lib/initialization/` → `services/initialization/`

**理由**：这些模块都有状态或副作用（localStorage 读写、i18n 初始化、Toast 队列管理、启动编排），符合 service 语义。

**替代方案**：保留 `lib/` 作为 "基础设施" 层 → 被否决，因为 lib vs service 的语义边界在实践中容易混乱，不如统一为一个 services 目录。

### D3：迁移顺序 — 原子化批量迁移

**选择**：分 4 批迁移，每批内原子操作（移动文件 + 更新所有 import）：
1. `utils.ts`（`cn` → `src/utils/utils.ts`）— 独立模块，无内部依赖
2. **批量迁移** `global.ts` + `toast/` + `i18n.ts`（→ `services/`）— 三者有相对路径依赖，必须原子迁移
3. `initialization/`（→ `services/initialization/`）— 独立模块
4. 清理和验证

**理由**：`i18n.ts` 使用相对路径 `./global` 和 `./toast/toastQueue` 引用同目录模块。如果分开迁移 global/toast 和 i18n，中间态会导致 `i18n.ts` 的相对 import 失效，构建失败。批量迁移确保中间态不会断裂。

### D4：import 路径替换策略

**选择**：使用 IDE 全局替换，逐模块替换。

**映射表**：
| 旧路径 | 新路径 |
|--------|--------|
| `@/lib/utils` | `@/utils/utils` |
| `@/lib/global` | `@/services/global` |
| `@/lib/toast` | `@/services/toast` |
| `@/lib/i18n` | `@/services/i18n` |
| `@/lib/initialization` | `@/services/initialization` |

**内部相对路径**：`i18n.ts` 中 `./global` 和 `./toast/toastQueue` 在迁移到 `services/` 后仍为同目录相对路径，无需修改。但必须与 `global.ts`、`toast/` 同批迁移，否则中间态会断裂。

## Risks / Trade-offs

- **[风险] 大量文件的 import 路径变更** → 每个模块迁移后立即运行 `pnpm tsc` 验证类型正确性，确保无遗漏
- **[风险] 测试文件的 import 路径需同步更新** → 迁移文件时一起移动测试文件或更新 import
- **[风险] 文档中引用的路径过时** → 同步更新 `docs/` 和 `CLAUDE.md` 中的文件路径引用
- **[Trade-off] global.ts 混合职责** → `global.ts` 同时包含纯工具函数（`interceptClickAToJump`、`getLanguageLabel`）和有状态服务（`getDefaultAppLanguage`），整体归入 `services/`。未来可考虑拆分，但本次变更范围内不处理（遵循 Non-Goals）
