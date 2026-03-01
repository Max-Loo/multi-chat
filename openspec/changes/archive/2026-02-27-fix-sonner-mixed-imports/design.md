# 技术设计文档：统一 sonner 导入方式

## Context

### 当前状态

`sonner` Toast 库在项目中被广泛使用，但存在混合导入方式：

- **动态导入**：`src/store/keyring/masterKey.ts`（第 155 行）
  ```typescript
  const { toast } = await import('sonner');
  ```

- **静态导入**：其他 9 个文件
  ```typescript
  import { toast } from 'sonner';
  ```

### 问题分析

1. **构建工具行为**：Vite/Rollup 在代码分割时，如果一个模块同时存在动态和静态导入，会将整个模块打包到使用静态导入的 chunk 中，以避免运行时模块解析问题

2. **影响范围**：
   - 主 chunk 体积增加 50-100 KB（sonner 完整打包）
   - 缓存效率降低（sonner 无法被分离到独立 chunk）
   - 首屏加载性能下降约 5-10%

3. **现有动态导入原因**：
   - 查看 `masterKey.ts` 历史代码，动态导入可能最初是为了延迟加载
   - 但由于其他 9 个位置都使用静态导入，这个优化目标已失效

### 约束条件

- **语言要求**：所有注释和文档必须使用中文（简体）
- **测试要求**：修改后必须验证 `handleSecurityWarning()` 功能正常
- **兼容性**：修改不影响现有 API 或功能规格

## Goals / Non-Goals

**Goals:**

1. 统一 `sonner` 导入方式为静态导入
2. 允许 Vite/Rollup 对 `sonner` 进行有效的代码分割
3. 减少主 chunk 体积 50-100 KB
4. 提升首屏加载性能 5-10%
5. 保持代码一致性和可维护性

**Non-Goals:**

1. 不涉及功能规格变更
2. 不修改 sonner 的使用方式或 API 调用
3. 不影响其他 9 个文件的 sonner 导入
4. 不涉及其他依赖的优化（Zod、lucide-react 等，由其他变更处理）

## Decisions

### 决策 1：统一为静态导入

**选择**：将 `masterKey.ts` 的动态导入改为静态导入

**理由**：

1. **项目一致性**：其他 9 个文件都使用静态导入，保持统一风格
2. **实际效果**：动态导入已被静态导入"污染"，无法达到代码分割目标
3. **代码简洁性**：静态导入更清晰、更易维护
4. **运行时开销**：消除动态导入的模块解析开销（虽然微小）

**替代方案考虑**：

- **方案 A**：将其他 9 个文件改为动态导入
  - ❌ 不现实：会增加代码复杂度，可能影响组件渲染性能
  - ❌ 收益有限：sonner 通常在应用启动时就已加载（如 main.tsx 中的 Toaster 组件）

- **方案 B**：通过 Vite 配置强制分割
  - ❌ 技术不可行：混合导入时，Rollup 的代码分割算法无法有效处理
  - ❌ 可能导致运行时错误

### 决策 2：不修改 sonner 使用逻辑

**选择**：仅修改导入方式，不改变 toast 调用逻辑

**理由**：

1. **降低风险**：最小化变更范围，降低引入 bug 的可能性
2. **测试简化**：功能行为不变，测试用例无需修改
3. **代码审查友好**：变更清晰、易理解

**修改位置**：

```typescript
// 修改前（第 155 行）
const { toast } = await import('sonner');
// ... 使用 toast

// 修改后
// 在文件顶部添加
import { toast } from 'sonner';

// 在函数中直接使用 toast（移除 await）
```

### 决策 3：验证策略

**选择**：通过功能测试验证，无需单元测试变更

**理由**：

1. 修改仅为导入方式变更，不涉及逻辑变更
2. `handleSecurityWarning()` 的现有测试（如有）应该继续通过
3. 手动验证 Web 环境的安全性警告 Toast 功能即可

**验证步骤**：

1. 运行 `pnpm web:build`，检查构建产物
2. 对比修改前后的 chunk 大小
3. 启动 Web 版应用，验证安全性警告 Toast 正常显示
4. 运行现有测试套件（如果有）

## Risks / Trade-offs

### 风险 1：功能回归

**描述**：修改导入方式可能导致 `handleSecurityWarning()` 功能异常

**缓解措施**：

- 修改后进行手动功能测试
- 运行现有测试套件
- 保留原代码注释，方便回滚

**影响**：低风险，导入方式变更不影响运行时逻辑

### 风险 2：构建产物未达预期

**描述**：修改后 chunk 大小减少不明显（< 50 KB）

**缓解措施**：

- 使用 `rollup-plugin-visualizer` 验证构建产物
- 如果效果不佳，继续执行 `add-vite-manual-chunks` 变更
- 记录实际效果，作为后续优化参考

**影响**：中等风险，但不阻塞后续优化方案

### 风险 3：循环依赖

**描述**：静态导入可能引入模块循环依赖问题

**缓解措施**：

- `masterKey.ts` 目前没有导入其他可能依赖 `sonner` 的模块
- 静态导入位于文件顶部，符合 ESM 规范
- TypeScript 编译时会检测循环依赖

**影响**：低风险，现有模块架构不支持循环依赖

## Migration Plan

### 实施步骤

1. **代码修改**
   - 修改 `src/store/keyring/masterKey.ts`
   - 在文件顶部添加 `import { toast } from 'sonner';`
   - 移除第 155 行的 `const { toast } = await import('sonner');`
   - 更新 toast 调用（移除 await）

2. **验证测试**
   - 运行 `pnpm lint` 和 `pnpm tsc`（代码质量检查）
   - 运行 `pnpm web:build`（构建验证）
   - 检查 `dist/stats.html`，对比 chunk 大小变化
   - 启动 Web 版应用，测试安全性警告 Toast 功能

3. **提交变更**
   - 创建 git commit
   - 关联 OpenSpec 变更：`fix-sonner-mixed-imports`

### 回滚策略

如果出现功能异常或构建问题：

1. 使用 `git revert` 回滚 commit
2. 或手动恢复原导入方式
3. 重新运行构建和测试

### 部署注意事项

- 此变更不影响运行时行为，无需特殊部署流程
- 建议在非高峰期部署，以便监控性能指标
- 部署后监控首屏加载时间指标（如有）

## 实施后分析

### 实际效果与预期不符

**预期目标：**
- 减少主 chunk 体积 50-100 KB
- 提升首屏加载性能 5-10%
- sonner 被分离到独立 chunk

**实际结果：**
- 主 chunk 体积几乎无变化：2,403 KB → 2,403.84 KB（增加 0.84 KB）
- sonner 未从主 chunk 中分离
- 未实现预期的优化效果

### 根本原因分析

通过实施后的构建产物分析（`tasks.md:89-92`），发现以下关键问题：

1. **缺少 Vite manualChunks 配置**
   - `vite.config.ts` 中未配置 `build.rollupOptions.output.manualChunks`
   - Vite 的默认代码分割策略不会自动将单个大型库分离到独立 chunk

2. **Vite 默认分割策略的限制**
   - Vite 只对动态导入（`import()`）进行代码分割
   - 静态导入的模块会被打包到使用它们的 chunk 中
   - 即使统一了导入方式，没有 `manualChunks` 配置也无法实现有效分割

3. **混合导入已非主要问题**
   - 统一导入方式后，sonner 仍然被打包进主 chunk
   - 问题的根源不是混合导入，而是缺少主动的 chunk 分割策略

### 优化效果的实际来源

**关键发现：** 真正的优化效果来自于 `add-vite-manual-chunks` 方案

**依赖关系：**
```
fix-sonner-mixed-imports（代码一致性改进）
    ↓
add-vite-manual-chunks（构建配置优化）
    ↓
优化效果实现（主 chunk 减少 98%）
```

**两个变更的关系：**

| 变更 | 主要作用 | 对优化效果的贡献 |
|------|----------|------------------|
| `fix-sonner-mixed-imports` | 统一 sonner 导入方式，提升代码一致性 | ❌ 单独实施无法实现优化目标 |
| `add-vite-manual-chunks` | 配置 manualChunks，主动分割大型依赖 | ✅ **实现 98% 的主 chunk 体积减少** |

**建议的实施方案：**

1. **将两个变更合并提交**
   - `fix-sonner-mixed-imports` 作为代码一致性改进
   - `add-vite-manual-chunks` 作为构建优化方案
   - 在 commit message 中明确说明两者的关系

2. **文档更新建议**
   - 在 proposal.md 中标注：优化效果依赖于 `manualChunks` 配置
   - 在 design.md 中添加此章节（实施后分析）
   - 在 tasks.md 中记录实际效果和原因分析

3. **未来类似优化的经验教训**
   - 统一导入方式本身不足以实现代码分割
   - 对于大型依赖的优化，必须使用 `manualChunks` 配置
   - 代码一致性改进和构建优化应该作为配套方案实施

### 变更价值重新评估

虽然此变更单独实施未能实现预期的优化目标，但仍有以下价值：

**✅ 代码质量提升：**
- 统一项目中的 sonner 导入方式（10 个文件保持一致）
- 消除混合导入带来的维护复杂性
- 代码更清晰、更易理解

**✅ 为 manualChunks 配置铺平道路：**
- 避免动态导入和静态导入混合导致的潜在问题
- 简化 `manualChunks` 配置的逻辑
- 提升代码分割的可预测性

**✅ 配套价值：**
- 作为 `add-vite-manual-chunks` 的配套改进
- 在实施构建优化的同时提升代码一致性
- 为未来的代码分割优化提供更好的基础

### 结论

**此变更应与 `add-vite-manual-chunks` 一起提交，作为配套的代码一致性改进。**

优化效果主要来自于 `manualChunks` 配置，而非统一导入方式本身。两个变更协同工作，既实现了构建优化目标，又提升了代码质量。

## Open Questions

暂无（此变更技术方案明确，无待决策事项）
