# 实施任务清单

## 1. 代码修改

- [x] 1.1 修改 `src/store/keyring/masterKey.ts` 导入方式
  - 在文件顶部添加 `import { toast } from 'sonner';`
  - 移除第 155 行的动态导入 `const { toast } = await import('sonner');`
  - 更新 `handleSecurityWarning()` 函数中的 toast 调用，移除 await 关键字
  - 添加中文注释说明修改原因

## 2. 代码质量检查

- [x] 2.1 运行 ESLint 检查
  ```bash
  pnpm lint
  ```
  确保无 ESLint 错误

- [x] 2.2 运行 TypeScript 类型检查
  ```bash
  pnpm tsc
  ```
  确保无类型错误

## 3. 构建验证

- [x] 3.1 执行 Web 版构建
  ```bash
  pnpm web:build
  ```
  确保构建成功无错误

- [x] 3.2 分析构建产物
  - ✅ 打开 `dist/stats.html` 查看可视化报告
  - ✅ 定位 `sonner` 库所在的 chunk：位于 `index-BVd_5d6H.js` (1,065.70 KB)
  - ❌ **sonner 未从主 chunk 中分离**（原因：vite.config.ts 缺少 manualChunks 配置）
  - ❌ **主 chunk 体积几乎无变化**：1,065 KB → 1,065.70 KB（增加 0.70 KB）
  - 📊 **实际减少量**：未达到预期目标（-50-100 KB）

## 4. 功能测试

- [ ] 4.1 测试安全性警告 Toast 功能
  - 启动 Web 版应用：`pnpm web:dev`
  - 清除浏览器 localStorage（模拟首次使用）
  - 验证安全性警告 Toast 正常显示
  - 验证"I Understand"按钮功能正常

- [ ] 4.2 运行现有测试套件（如果有）
  ```bash
  pnpm test
  ```
  确保所有测试通过

## 5. 文档更新

- [ ] 5.1 更新 AGENTS.md（如需要）
  - 检查是否需要记录此次构建优化
  - 如需记录，添加到"构建性能"或"代码优化"相关章节

- [ ] 5.2 更新 README.md（如需要）
  - 通常不记录此类代码级优化
  - 除非有显著的性能提升需要向用户说明

## 6. Git 提交（手动）

- [ ] 6.1 手动创建 git commit
  - Commit message 建议：
    ```
    fix: 统一 sonner 导入方式以优化构建产物

    - 将 masterKey.ts 中的 sonner 动态导入改为静态导入
    - 允许 Vite/Rollup 对 sonner 进行有效的代码分割
    - 预计减少主 chunk 体积 50-100 KB

    Refs: openspec/changes/fix-sonner-mixed-imports
    ```
  - 确认只提交 `src/store/keyring/masterKey.ts` 文件

## 7. 实施后验证

- [x] 7.1 对比构建产物大小
  - ✅ 修改前主 chunk 大小：1,338 KB + 1,065 KB = 2,403 KB
  - ✅ 修改后主 chunk 大小：1,338.14 KB + 1,065.70 KB = 2,403.84 KB
  - ✅ 变化：+0.84 KB（增加，未达到预期减少目标）

- [x] 7.2 记录优化效果
  - ❌ **实际减少量**：未减少，反而增加 0.84 KB
  - ❌ **是否达到预期目标**：否（目标：50-100 KB）
  - 📋 **原因分析**：
    1. **缺少 Vite manualChunks 配置**：vite.config.ts 中未配置 `build.rollupOptions.output.manualChunks`
    2. **Vite 默认分割策略限制**：Vite 不会自动将单个大型库（如 sonner）分离到独立 chunk
    3. **混合导入已非主要问题**：统一导入方式后，仍需配置 manualChunks 才能实现有效分割
  - 🚀 **下一步建议**：
    - 继续执行 `add-vite-manual-chunks` 变更（配置 Vite manualChunks）
    - 预计效果：主 chunk 减少 60-70%（从 2,403 KB 降至 ~600-800 KB）
