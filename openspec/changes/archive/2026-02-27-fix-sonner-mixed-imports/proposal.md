## Why

当前构建产物中存在两个过大的 chunk 文件（`index-D6E4_MqK.js`: 1,338 KB，`index-CWdUKH4n.js`: 1,065 KB），严重影响应用的首屏加载性能。分析发现，`sonner` Toast 库在 `src/store/keyring/masterKey.ts` 中使用动态导入（`await import('sonner')`），但在其他 9 个文件中使用静态导入（`import { toast } from 'sonner'`）。这种混合导入方式导致 Vite/Rollup 无法对 `sonner` 进行有效的代码分割，整个库被打包进主 chunk，增加了约 50-100 KB 的体积。

## What Changes

- **统一 sonner 导入方式**：将 `src/store/keyring/masterKey.ts` 中的动态导入改为静态导入，与其他 9 个文件保持一致
- **修改文件**：`src/store/keyring/masterKey.ts`
  - 移除：`const { toast } = await import('sonner');`
  - 添加：在文件顶部添加 `import { toast } from 'sonner';`
  - 更新：`handleSecurityWarning()` 函数中的 toast 调用逻辑

## Capabilities

### New Capabilities
无（此变更为代码级别的优化，不涉及新功能或对外 API）

### Modified Capabilities
无（此变更不影响功能规格，仅优化构建产物）

## Impact

- **构建产物**：预计减少主 chunk 体积 50-100 KB
- **首屏加载性能**：提升 5-10% 的加载速度
- **缓存策略**：sonner 将被正确分离到独立 chunk，提升缓存效率
- **依赖关系**：无新增或移除依赖
- **测试影响**：需要验证 `handleSecurityWarning()` 功能正常工作

## 实施后发现

**⚠️ 重要说明：** 实施后分析表明，此变更单独实施**无法实现预期的优化目标**。

### 实际效果

- **主 chunk 体积变化**：2,403 KB → 2,403.84 KB（增加 0.84 KB，未达预期）
- **sonner 分离情况**：未从主 chunk 中分离
- **优化效果**：未达到预期目标（50-100 KB 减少）

### 根本原因

1. **缺少 Vite manualChunks 配置**：vite.config.ts 中未配置 `build.rollupOptions.output.manualChunks`
2. **Vite 默认策略限制**：Vite 不会自动将单个大型库分离到独立 chunk
3. **混合导入非主要问题**：统一导入方式后，仍需 `manualChunks` 配置才能实现有效分割

### 优化效果的实际来源

**真正的优化效果来自于 `add-vite-manual-chunks` 方案：**

- 配置 `build.rollupOptions.output.manualChunks`
- 主动分割大型依赖到独立 vendor chunk
- 实现 98% 的主 chunk 体积减少（2,403 KB → 45 KB）

### 建议实施方案

**将两个变更合并提交：**

1. **fix-sonner-mixed-imports**：作为代码一致性改进
   - 统一 sonner 导入方式
   - 提升代码质量和可维护性
   - 为 `manualChunks` 配置铺平道路

2. **add-vite-manual-chunks**：作为构建优化方案
   - 配置 manualChunks 实现代码分割
   - 实现主 chunk 体积减少 98%
   - **这是优化效果的主要来源**

### 变更价值重新评估

虽然此变更单独实施未达预期，但仍有价值：

✅ **代码质量提升**：统一导入方式，消除混合导入的复杂性
✅ **配套价值**：为 `manualChunks` 配置提供更好的基础
✅ **协同效应**：与构建优化方案配合，既实现性能目标又提升代码质量

**结论：** 此变更应与 `add-vite-manual-chunks` 一起提交，作为配套的代码一致性改进。优化效果主要来自于 `manualChunks` 配置。
