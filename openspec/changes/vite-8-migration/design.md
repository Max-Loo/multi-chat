# Vite 8 迁移技术设计

## Context

**当前状态：**
- Vite 版本：7.3.1
- 构建工具：esbuild（转译/压缩） + Rollup（打包）
- 代码分割：使用 `build.rollupOptions.output.manualChunks` 函数形式
- 测试框架：Vitest 4.0.18
- CSS 工具：@tailwindcss/vite 4.2.1（使用 Lightning CSS）

**约束条件：**
- Tauri 应用需要兼容 Vite 8 的构建产物
- GitHub Pages 部署路径 `/multi-chat/` 需要保持
- API 代理配置（deepseek, kimi, zhipuai）必须继续工作
- 测试覆盖率要求不能降低

**利益相关者：**
- 开发团队：需要保持开发体验（HMR、构建速度）
- 最终用户：应用功能不能受影响

## Goals / Non-Goals

**Goals:**
1. 成功升级到 Vite 8.0.0，保持所有现有功能
2. 迁移构建配置到 Rolldown 选项
3. 验证开发服务器、生产构建和测试套件正常运行
4. 保持或改善构建性能

**Non-Goals:**
1. 重新设计代码分割策略（保持现有分组逻辑）
2. 优化现有依赖或组件架构
3. 修改应用业务逻辑

## Decisions

### 决策 1：使用 Rolldown 作为默认打包工具

**选择：** 迁移到 `build.rolldownOptions`

**理由：**
- Vite 8 默认使用 Rolldown，是官方推荐方向
- Rolldown 提供更好的性能和更一致的 esbuild/Rollup 行为
- 长期维护性更好

**替代方案：** 保留 Rollup（使用 `build.minify: 'esbuild'` 和 CSS 压缩配置）
- 不选原因：这会是临时方案，Vite 9 可能完全移除 Rollup

### 决策 2：保留 manualChunks 函数形式

**选择：** 继续使用 `manualChunks` 函数形式（在 `rolldownOptions.output.manualChunks` 中）

**理由：**
- Rolldown 仍然完全支持 `manualChunks` 函数形式
- 函数形式更灵活，便于使用复杂的条件逻辑
- 避免了 `codeSplitting.strategies` 数组格式的学习成本
- 迁移风险更低，保持与现有代码分割逻辑的一致性

**替代方案：** 迁移到 `codeSplitting.strategies` 数组格式
- 不选原因：函数形式功能完备且稳定，数组格式未带来明显收益

### 决策 3：渐进式迁移和验证

**选择：** 按顺序执行：依赖升级 → 配置迁移 → 开发验证 → 生产验证 → 测试验证

**理由：**
- 每步失败可以快速回滚
- 便于定位问题根源
- 确保不会破坏现有功能

**风险：** 如果某个步骤失败，需要回滚整个迁移

### 决策 3：简化代码分割策略

**选择：** 仅对大型核心库进行显式分割，其他依赖由 Rolldown 自动处理

**分割策略：**
| Chunk 名称 | 匹配规则 | 说明 |
|------------|----------|------|
| vendor-react | `react`, `react-dom` | React 核心框架 |
| vendor-redux | `@reduxjs`, `react-redux`, `redux`, `immer`, `reselect` | 状态管理 |
| vendor-router | `react-router`, `@remix-run` | 路由系统 |
| vendor-antd-x | `@ant-design/x` | AI 聊天组件 |
| vendor-highlight | `highlight.js` | 代码高亮 |
| vendor-ai | `ai`, `@ai-sdk` | AI SDK |

**理由：**
- Rolldown 的自动代码分割已经足够智能
- 仅对已知大型库进行显式分割，减少配置复杂度
- 避免过度分割导致的 HTTP 请求数量增加

**替代方案：** 为每个依赖单独配置分割策略
- 不选原因：增加维护成本，收益不明显

## Risks / Trade-offs

### 风险 1：codeSplitting 正则表达式错误

**描述：** 正则表达式配置错误可能导致构建失败或代码分割不正确

**缓解措施：**
- 在开发环境充分测试
- 使用 `rollup-plugin-visualizer` 验证代码分割结果（已确认与 Vite 8/Rolldown 兼容）
- 对比迁移前后的构建产物

### 风险 2：CommonJS 依赖解析问题

**描述：** Vite 8 修复了 CJS 模块默认导入的不一致性，可能影响运行时行为

**缓解措施：**
- 全面测试应用功能
- 检查控制台错误和警告
- 如有问题，可临时使用 `legacy.inconsistentCjsInterop`（已废弃，仅用于回退）

### 风险 3：第三方依赖不兼容

**描述：** @vitejs/plugin-react 或其他插件可能不兼容 Vite 8

**缓解措施：**
- 查看各插件的兼容性声明
- 如有严重问题，可暂时回退到 Vite 7，等待插件更新

### 风险 4：浏览器目标变更影响用户

**描述：** 默认浏览器目标提高（Chrome 107 → 111）可能影响旧版浏览器用户

**缓解措施：**
- 本项目是 Tauri 桌面应用，不受浏览器限制
- Web 部署（GitHub Pages）用户群体较新，影响有限

## Migration Plan

### 步骤 1：依赖升级

```bash
# 在 package.json 中更新
"vite": "^8.0.0"

# 安装依赖
pnpm install
```

### 步骤 2：配置文件迁移

**文件：** `vite.config.ts`

1. 重命名 `build.rollupOptions` → `build.rolldownOptions`
2. 将 `manualChunks` 函数转换为 `codeSplitting.strategies` 数组

**关键变更：**
```typescript
// 旧配置（Vite 7 + Rollup）
rollupOptions: {
  output: {
    manualChunks: (id) => {
      if (id.includes('react') && !id.includes('react-router')) {
        return 'vendor-react';
      }
      // ...
    }
  }
}

// 新配置（Vite 8 + Rolldown）
rolldownOptions: {
  output: {
    manualChunks: (id) => {
      if (id.includes('node_modules')) {
        // 使用更精确的正则表达式避免误匹配
        if (/node_modules\/(react(?![\w-])|react-dom(?![\w-]))/.test(id)) {
          return 'vendor-react';
        }
        // ... 更多策略
      }
    }
  }
}
```

**实际实现的分割策略：**
- `vendor-react`: React 核心框架
- `vendor-redux`: Redux 状态管理
- `vendor-router`: 路由系统
- `vendor-antd-x`: AI 聊天组件
- `vendor-highlight`: 代码高亮
- `vendor-ai`: AI SDK
- 其他依赖由 Rolldown 自动处理

### 步骤 3：验证顺序

1. **开发服务器**：`pnpm web:dev`
2. **生产构建**：`pnpm web:build`
3. **Tauri 构建**：`pnpm build`
4. **测试套件**：`pnpm test:run && pnpm test:integration:run`

### 回滚策略

如果迁移失败，可以快速回滚：

```bash
# 1. 恢复 package.json
git checkout package.json

# 2. 恢复 vite.config.ts
git checkout vite.config.ts

# 3. 重新安装依赖
pnpm install
```

## Open Questions

**Q1:** Vitest 是否需要单独配置变更？

**A1:** Vitest 4.0.18 应该与 Vite 8 兼容。如果测试失败，可能需要调整 `test.deps.optimizer` 配置。

**Q2:** Lightning CSS 是否需要调整？

**A2:** @tailwindcss/vite 4.2.1 已使用 Lightning CSS，应该与 Vite 8 兼容。如有 CSS 压缩问题，可临时使用 `cssMinify: 'esbuild'`。

**Q3:** 迁移后构建产物大小是否会变化？

**A3:** 可能会有小幅变化，因为 Rolldown 的 tree-shaking 和压缩算法不同。需要对比迁移前后的 `dist/stats.html` 报告。

## 测试失败应对策略

如果测试套件在迁移后失败，按以下步骤排查：

### 1. Vitest 配置调整

**问题**: Vite 8 的依赖预构建行为变化可能影响测试环境

**解决方案**:
```typescript
// vite.config.ts - test.deps.optimizer
test: {
  deps: {
    optimizer: {
      web: {
        // 增加需要预构建的依赖
        include: ['antd', '@ant-design/x', 'ai', '@ai-sdk/*']
      }
    }
  }
}
```

### 2. CommonJS 互操作变更

**问题**: CJS 模块默认导入行为变化可能影响 mock

**症状**: 测试中 `require()` 或 `import` 行为不一致

**解决方案**:
- 检查失败的测试是否涉及 CJS 模块的 mock
- 使用 `vi.mock()` 替代直接导入
- 如有需要，临时启用 `legacy.inconsistentCjsInterop: true`（仅用于调试）

### 3. 环境变量处理

**问题**: Vite 8 的环境变量处理可能有细微变化

**症状**: `import.meta.env` 相关测试失败

**解决方案**:
- 检查测试 setup 文件中的环境变量配置
- 使用 `vi.stubEnv()` 或 `vi.stubGlobal()` 明确设置环境变量

### 4. 隔离和调试失败测试

**命令**:
```bash
# 单独运行失败的测试文件
pnpm test:run <test-file-pattern>

# 使用 watch 模式调试
pnpm test --watch <test-file-pattern>

# 显示详细输出
pnpm test:run --reporter=verbose
```

### 5. MSW Mock 行为变化

**问题**: Vite 8 的模块解析变化可能影响 MSW（Mock Service Worker）

**解决方案**:
- 检查 `src/__test__/mocks/` 中的 handlers 定义
- 确认 MSW 的 `setupServer` 在测试环境中正确初始化
- 查看是否有网络请求被 Rolldown 的模块解析影响
