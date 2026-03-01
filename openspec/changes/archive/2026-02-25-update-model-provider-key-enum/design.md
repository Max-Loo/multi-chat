# Design: 更新 ModelProviderKeyEnum 定义

## Context

### 当前状态

**类型定义不一致问题**：

1. **`ModelProviderKeyEnum` 当前定义** (`src/utils/enums.ts`):
   ```typescript
   export const enum ModelProviderKeyEnum {
     DEEPSEEK = 'deepseek',
     KIMI = 'kimi',           // ❌ 错误值
     BIG_MODEL = 'bigmodel',  // ❌ 错误值
   }
   ```

2. **`ALLOWED_MODEL_PROVIDERS` 白名单** (`src/utils/constants.ts`):
   ```typescript
   export const ALLOWED_MODEL_PROVIDERS: readonly string[] = [
     "moonshotai",            // ✅ 正确值（对应 Kimi）
     "deepseek",              // ✅ 正确值
     "zhipuai",               // ✅ 正确值（对应 Zhipu）
     "zhipuai-coding-plan",   // ✅ 正确值
   ] as const;
   ```

3. **远程 API 返回的 providerKey**:
   - `moonshotai` (Kimi 的官方标识)
   - `deepseek` (DeepSeek 的官方标识)
   - `zhipuai` (Zhipu 的官方标识)
   - `zhipuai-coding-plan` (Zhipu Coding Plan 的官方标识)

**类型系统影响**：

- `SystemConfigModel.providerKey` 字段使用 `ModelProviderKeyEnum` 类型
- 远程数据返回 `providerKey: string`，值是 `"moonshotai"`、`"zhipuai"` 等
- 枚举值与实际数据不匹配，导致类型约束失效

### 约束条件

- **不改变运行时行为**: 这是纯类型层面的修正
- **保持向后兼容**: 需要查找并更新所有使用旧枚举值的代码
- **通过类型检查**: 修改后必须通过 `pnpm tsc` 检查
- **不破坏现有功能**: 不影响 Redux 状态管理、数据持久化或网络请求

## Goals / Non-Goals

**Goals:**
- ✅ 使 `ModelProviderKeyEnum` 的值与 `ALLOWED_MODEL_PROVIDERS` 和 models.dev API 完全一致
- ✅ 确保类型系统能正确约束 `providerKey` 字段
- ✅ 更新所有使用旧枚举值的代码引用
- ✅ 通过 TypeScript 类型检查验证修改

**Non-Goals:**
- ❌ 不修改 `ALLOWED_MODEL_PROVIDERS` 白名单
- ❌ 不改变 models.dev API 集成逻辑
- ❌ 不改变 Redux 状态管理或数据持久化
- ❌ 不引入新的运行时逻辑或功能

## Decisions

### 1. 枚举值命名策略

**决策**: 使用 models.dev API 的原始标识符作为枚举值

**原因**:
- 避免双重映射（不需要维护 API 标识符 → 枚举名称 → 枚举值的映射）
- 简化代码，减少转换逻辑
- 与远程数据源保持一致，降低出错风险

**映射关系**:
```typescript
// 旧值 → 新值
DEEPSEEK = 'deepseek'              → DEEPSEEK = 'deepseek' (保持不变)
KIMI = 'kimi'                      → MOONSHOTAI = 'moonshotai' (改名)
BIG_MODEL = 'bigmodel'             → ZHIPUAI = 'zhipuai' (改名)
-                                → ZHIPUAI_CODING_PLAN = 'zhipuai-coding-plan' (新增)
```

**备选方案（未采纳）**:
- **方案 A**: 保持枚举名称，仅修改值（如 `KIMI = 'moonshotai'`）
  - ❌ 枚举名称与值不匹配，造成困惑
- **方案 B**: 创建映射函数进行转换
  - ❌ 增加复杂度，维护双重映射逻辑

### 2. 枚举成员命名规范

**决策**: 使用大写蛇形命名法（UPPER_SNAKE_CASE）

**原因**:
- 遵循 TypeScript 枚举命名约定
- 与现有代码风格保持一致（如 `DEEPSEEK`）

**命名映射**:
```typescript
export const enum ModelProviderKeyEnum {
  DEEPSEEK = 'deepseek',
  MOONSHOTAI = 'moonshotai',           // 替换 KIMI
  ZHIPUAI = 'zhipuai',                 // 替换 BIG_MODEL
  ZHIPUAI_CODING_PLAN = 'zhipuai-coding-plan',  // 新增
}
```

### 3. 类型兼容性处理

**决策**: 不使用类型断言，依赖 TypeScript 字面量类型推断

**原因**:
- `ALLOWED_MODEL_PROVIDERS` 使用 `as const` 断言，类型为 `readonly ["moonshotai", "deepseek", "zhipuai", "zhipuai-coding-plan"]`
- `ModelProviderKeyEnum` 的值类型为字面量联合类型 `'moonshotai' | 'deepseek' | 'zhipuai' | 'zhipuai-coding-plan'`
- 如果枚举值与白名单完全一致，TypeScript 会自动推断类型兼容性

**验证方式**:
```typescript
// 类型守卫函数（可选，用于运行时验证）
function isValidProviderKey(key: string): key is ModelProviderKeyEnum {
  return Object.values(ModelProviderKeyEnum).includes(key as ModelProviderKeyEnum);
}
```

### 4. 代码更新策略

**决策**: 分两步进行代码更新

**步骤 1**: 修改枚举定义
- 更新 `src/utils/enums.ts` 中的 `ModelProviderKeyEnum`

**步骤 2**: 全局替换引用
- 使用全局搜索替换更新所有使用旧枚举值的代码：
  - `ModelProviderKeyEnum.KIMI` → `ModelProviderKeyEnum.MOONSHOTAI`
  - `ModelProviderKeyEnum.BIG_MODEL` → `ModelProviderKeyEnum.ZHIPUAI`
- 如果存在使用字符串字面量的代码，也需要更新（如 `'kimi'` → `'moonshotai'`）

**验证步骤**:
```bash
# 1. 类型检查
pnpm tsc

# 2. 搜索旧枚举值的引用
rg "ModelProviderKeyEnum\.(KIMI|BIG_MODEL)" --type ts
rg "['\"](kimi|bigmodel)['\"]" --type ts
```

## Risks / Trade-offs

### 风险 1: 硬编码字符串遗漏

**描述**: 代码中可能存在使用字符串字面量（如 `'kimi'`）而非枚举值的代码

**影响**: 类型检查无法捕获，导致运行时错误

**缓解措施**:
- 使用 ripgrep 搜索所有 `'kimi'` 和 `'bigmodel'` 的字符串字面量
- 检查搜索结果，确认是否需要替换
- 考虑添加 ESLint 规则禁止使用 providerKey 的字符串字面量

### 风险 2: 第三方库或插件依赖

**描述**: 如果有外部代码依赖旧的枚举值名称

**影响**: 外部集成可能失效

**缓解措施**:
- 检查是否有第三方代码或插件使用 `ModelProviderKeyEnum`
- 如果有，需要提供迁移指南或兼容层

### 风险 3: 数据持久化中的旧值

**描述**: 本地存储的数据可能包含旧的枚举值（如 `'kimi'`）

**影响**: 加载历史数据时可能不匹配新的枚举定义

**缓解措施**:
- 检查数据持久化逻辑（`src/store/storage/modelStorage.ts`）
- 如果存储了 `providerKey` 字段，需要添加数据迁移逻辑
- 或者验证存储的数据格式（可能已经使用正确的值）

### Trade-off: 枚举名称可读性

**描述**: `MOONSHOTAI` 比 `KIMI` 更正式但可能不够直观

**权衡**:
- ✅ 优点: 与 API 标识符一致，避免混淆
- ❌ 缺点: 需要学习成本（开发者需要知道 Moonshot AI = Kimi）

**决策**: 选择技术正确性而非命名便利性

## Migration Plan

### 实施步骤

**阶段 1: 修改枚举定义** (src/utils/enums.ts)
1. 备份当前文件
2. 修改 `ModelProviderKeyEnum` 的定义：
   - 删除 `KIMI` 和 `BIG_MODEL`
   - 添加 `MOONSHOTAI`、`ZHIPUAI`、`ZHIPUAI_CODING_PLAN`
3. 保存文件

**阶段 2: 查找并更新引用**
1. 搜索所有使用 `ModelProviderKeyEnum.KIMI` 的代码
2. 替换为 `ModelProviderKeyEnum.MOONSHOTAI`
3. 搜索所有使用 `ModelProviderKeyEnum.BIG_MODEL` 的代码
4. 替换为 `ModelProviderKeyEnum.ZHIPUAI`
5. 搜索硬编码字符串 `'kimi'` 和 `'bigmodel'`，评估是否需要替换

**阶段 3: 类型检查验证**
1. 运行 `pnpm tsc` 进行类型检查
2. 如果有类型错误，逐个修复
3. 确保所有错误都已解决

**阶段 4: 运行时验证（可选）**
1. 启动应用 `pnpm tauri dev`
2. 检查模型供应商数据是否正常加载
3. 验证 Redux store 中的 `providerKey` 字段值正确

**阶段 5: 数据迁移检查（如需要）**
1. 检查本地存储的数据文件
2. 如果发现旧的枚举值，添加数据迁移逻辑
3. 测试迁移逻辑是否正确

### 回滚策略

如果发现问题，可以快速回滚：
1. 恢复 `src/utils/enums.ts` 的备份
2. 恢复所有被修改的代码引用
3. 重新运行 `pnpm tsc` 确认类型检查通过

## Open Questions

### Q1: 是否需要保留旧的枚举值作为别名？

**问题**: 是否保留 `KIMI` 和 `BIG_MODEL` 作为别名以保持向后兼容？

**分析**:
- ✅ 优点: 旧代码无需修改，平滑迁移
- ❌ 缺点: 增加维护成本，可能导致命名混乱

**建议**: 不保留别名，直接替换所有引用
- 理由: 这是类型定义的修正，不是 API 变更
- 迁移成本较低（主要是全局搜索替换）

### Q2: 是否需要添加类型守卫函数？

**问题**: 是否需要添加运行时类型验证函数？

**分析**:
- TypeScript 在编译时提供类型安全
- 远程数据已经通过白名单过滤，理论上不需要额外验证
- 但如果需要处理不可信数据源，可以考虑

**建议**: 不添加类型守卫，理由：
- 数据来源可信（已通过 `ALLOWED_MODEL_PROVIDERS` 过滤）
- 不引入不必要的运行时开销
- 如有需要，可以在后续迭代中添加
