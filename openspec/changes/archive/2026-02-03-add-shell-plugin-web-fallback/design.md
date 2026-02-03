## Context

**当前状态**:

- 项目已在 Rust 端初始化 `tauri-plugin-shell` 插件（`src-tauri/src/lib.rs:10`）
- 前端已安装 `@tauri-apps/plugin-shell` 依赖（`package.json:40`）
- 项目支持两种运行模式：
  - 桌面模式：`pnpm dev` / `pnpm build`（使用 Tauri）
  - Web 模式：`pnpm web:dev` / `pnpm web:build`（纯 Vite）
- 目前代码中尚未发现直接使用 Shell 插件的地方，但插件已就绪

**问题**:

- 在 Web 环境下，`@tauri-apps/plugin-shell` 的 API 不可用，直接调用会导致运行时错误
- 缺少统一的兼容层来处理平台差异

**约束**:

- 必须保持向后兼容，不能破坏现有的 Tauri 桌面功能
- 遵循项目代码规范（使用 `@/` 导入路径、中文注释）
- 不引入额外的运行时依赖
- 遵循 KISS、DRY、SOLID 原则

## Goals / Non-Goals

**Goals:**

- 创建统一的 Tauri 插件兼容层，自动检测运行环境并选择合适的实现
- 提供 Web 端的降级实现，确保应用不会因插件缺失而崩溃
- 为 Shell 插件的所有常用 API 提供兼容封装（Command.execute、open 等）
- 建立可复用的模式，为其他 Tauri 插件（如 keyring、store）的 Web 兼容提供参考

**Non-Goals:**

- 实现完整的 Shell 功能 Web 替代方案（如用 child_process 替代 Command）
- 修改 Rust 后端代码
- 支持非现代浏览器（IE、旧版 Edge 等）
- 在 Web 端模拟需要系统权限的敏感操作

## Decisions

### 1. 环境检测策略

**决策**: 使用 `window.__TAURI__` 对象检测运行环境

**理由**:

- Tauri 2.0 会在 window 对象上注入 `__TAURI__` 全局对象
- 这是官方推荐的方式，比检测 UserAgent 更可靠
- 无需额外的配置或环境变量

**替代方案**:

- 使用 Vite 的环境变量（`import.meta.env.TAURI`）: ❌ 需要配置，且在运行时动态检测不够灵活
- 检测 `process.env.NODE_ENV`: ❌ 只能判断开发/生产环境，无法区分 Tauri/Web

**实现**:

```typescript
export const isTauri = (): boolean => {
  return typeof window !== "undefined" && "__TAURI__" in window;
};
```

### 2. 统一 API 封装层设计

**决策**: 创建功能模块（Feature Module），而非单一工厂函数

**理由**:

- 符合 SOLID 的单一职责原则（SRP）
- 易于扩展和维护
- 支持按需导入（Tree-shaking）
- 便于为其他 Tauri 插件复用相同模式

**架构**:

```
src/utils/tauriCompat/
├── index.ts          # 导出所有兼容层 API
├── env.ts            # 环境检测工具
└── shell.ts          # Shell 插件兼容层
```

**替代方案**:

- 单一文件包含所有兼容代码: ❌ 违反 SRP，难以维护
- 使用类（Class）封装: ❌ 增加不必要的复杂度，函数式更简洁

### 3. Web 降级实现策略

**决策**: 使用 Null Object 模式 + 功能标记

**理由**:

- Null Object 模式：Web 端返回不执行任何操作但类型兼容的函数
- 功能标记：暴露 `isSupported()` 方法，让调用者知道功能是否真正可用
- 避免运行时错误，同时保留类型安全

**示例**:

```typescript
// Tauri 环境: 使用真实 API
// Web 环境: 返回 { execute: () => Promise.resolve({ code: 0, signal: 0 }), isSupported: () => false }
```

**替代方案**:

- 抛出错误（throw Error）: ❌ 需要调用者处理 try-catch，增加复杂度
- 完全不导出该 API: ❌ 导致类型不一致，需要条件类型

### 4. 类型系统设计

**决策**: 使用条件类型（Conditional Types）保持 API 一致性

**理由**:

- 调用者无需修改代码即可在不同环境下运行
- TypeScript 编译时保证类型正确
- 开发者体验更好（无需手动类型断言）

**实现**:

```typescript
import type { Command as TauriCommand } from "@tauri-apps/plugin-shell";

// 统一的 Command 类型
interface ShellCommand {
  execute: () => Promise<CommandOutput>;
  isSupported: () => boolean;
}
```

**替代方案**:

- 使用 any: ❌ 失去类型安全
- 创建重复的类型定义: ❌ 违反 DRY 原则

### 5. 目录结构

**决策**: 将兼容层放在 `src/utils/tauriCompat/`

**理由**:

- `utils/` 是项目工具函数的约定位置
- `tauriCompat` 明确表达用途（Tauri 兼容层）
- 易于发现和维护

**替代方案**:

- `src/lib/tauriCompat/`: ❌ lib 通常用于第三方库或可复用组件
- `src/services/tauriCompat/`: ❌ services 更适合业务逻辑层
- `src/composables/`: ❌ composables 通常是 Vue React 的概念

## Risks / Trade-offs

**风险 1**: Web 端功能降级导致用户体验不一致
**缓解**:

- 在 `isSupported()` 返回 false 时，UI 应该禁用相关功能或显示提示
- 在 AGENTS.md 中明确说明哪些功能在 Web 端不可用

**风险 2**: Tauri API 更新导致兼容层失效
**缓解**:

- 兼容层只封装必要的 API，减少维护成本
- 定期检查 Tauri 更新日志
- 编写集成测试确保兼容层正常工作

**风险 3**: 类型定义不匹配导致编译错误
**缓解**:

- 使用 Tauri 官方类型定义作为源
- 通过单元测试验证类型兼容性
- 在 `package.json` 中固定 Tauri 版本范围

**权衡**: 代码复杂度 vs. 可维护性

- 决策：选择稍微增加抽象层（兼容层），换取更好的可维护性和可扩展性
- 理由：一次性投入，长期受益；其他 Tauri 插件可复用相同模式

## Migration Plan

**阶段 1: 创建兼容层基础设施**

1. 创建 `src/utils/tauriCompat/` 目录结构
2. 实现环境检测函数（`env.ts`）
3. 创建 Shell 插件兼容层（`shell.ts`）
4. 编写单元测试

**阶段 2: 更新现有代码（如有）**

1. 搜索所有直接使用 `@tauri-apps/plugin-shell` 的代码
2. 替换为兼容层 API
3. 运行测试确保功能正常

**阶段 3: 文档和验证**

1. 更新 AGENTS.md，说明 Tauri 插件的 Web 兼容模式
2. 在两种环境下测试应用
3. 验证构建流程（`pnpm dev` 和 `pnpm web:dev`）

**回滚策略**:

- 如果出现严重问题，可以直接移除兼容层导入，恢复原始代码
- 兼容层是独立模块，不影响核心功能
- 使用 Git 分支隔离变更，便于回滚

## Open Questions

1. **是否需要为所有 Tauri 插件创建兼容层？**
   - 建议：先实现 Shell 插件，验证模式可行性
   - 后续根据实际需求决定是否扩展到其他插件（keyring、store 等）

2. **Web 端是否需要实现部分功能？**
   - 建议：本次实现 Null Object 降级, 使用 `window.open` 替代 `shell.open`
   - 如需真实功能替代，在后续变更中处理

3. **是否需要在构建时自动注入环境检测？**
   - 建议：使用运行时检测（`window.__TAURI__`），保持灵活性
   - 如果性能成为问题，考虑使用 Vite 插件在构建时处理
