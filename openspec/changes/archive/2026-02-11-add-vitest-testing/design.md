# 设计：Vitest 测试系统集成

## Context

**当前状态**：
- 项目没有任何测试框架，代码质量保障仅依赖手动测试和代码审查
- 使用 Tauri 2.0 + React 19 + Vite 7 + TypeScript 5.9 现代化技术栈
- 使用 shadcn/ui 组件库，基于 Tailwind CSS
- 项目结构清晰，有独立的 `src/` 前端代码和 `src-tauri/` 后端代码

**约束条件**：
- 必须与现有 Vite 配置无缝集成，避免配置冲突
- 测试环境需要支持 React 组件渲染和 DOM 操作
- 需要提供良好的开发者体验（快速反馈、UI 界面）
- Tauri 特定 API 需要适当的 Mock 策略
- 测试代码应与业务代码分离，易于维护

**利益相关者**：
- 前端开发者：需要编写组件测试、集成测试
- 项目维护者：需要测试覆盖率报告评估代码质量

## Goals / Non-Goals

**Goals:**
- 建立完整的测试框架，支持单元测试、集成测试和组件测试
- 提供便捷的测试脚本和 UI 界面，提升开发者体验
- 集成代码覆盖率报告，建立质量衡量标准
- 为 Tauri API 提供 Mock 策略，支持隔离测试
- 配置测试环境，支持 React 组件和 DOM 操作

**Non-Goals:**
- 不涉及 Tauri 后端（Rust）的测试（后续可考虑添加 Rust 测试）
- 不包含端到端（E2E）测试框架（如 Playwright）
- 不强制要求特定测试覆盖率目标（初期建立框架即可）
- 不包含性能测试或负载测试

## Decisions

### 1. 测试框架选择：Vitest

**决策**：使用 Vitest 作为测试框架

**理由**：
- **原生 Vite 集成**：复用 Vite 配置（路径别名、插件、转译规则），零配置成本
- **极快的执行速度**：基于 ESM 和 Vite HMR，比 Jest 快 2-10 倍
- **现代化**：开箱即支持 TypeScript、JSX、ESM，无需复杂配置
- **UI 界面**：提供可视化测试界面，查看测试状态和覆盖率
- **社区活跃**：与 Vite 生态深度集成，文档完善

**替代方案**：
- **Jest**：配置复杂，与 Vite 集成需要 `vite-jest` 等桥接工具，启动慢
- **Karma**：已过时，不再维护

### 2. DOM 环境：happy-dom

**决策**：使用 happy-dom 作为测试 DOM 环境

**理由**：
- **性能优势**：比 jsdom 快 3-10 倍，测试执行更快
- **现代化 API 支持**：对现代 Web API（如 Fetch、Custom Elements）支持更好
- **Vitest 官方推荐**：与 @testing-library/react 配合更佳
- **资源占用低**：内存和包体积更小

**替代方案**：
- **jsdom**：成熟但性能较差，配置复杂
- **Vitest Browser Mode**：真实浏览器环境，但速度慢且配置复杂（适合 E2E 测试）

### 3. React 组件测试：@testing-library/react

**决策**：使用 Testing Library 系列工具进行 React 组件测试

**理由**：
- **行业标准**：React 官方推荐的测试方案
- **用户视角测试**：关注用户交互而非实现细节
- **工具链完整**：
  - `@testing-library/react`：组件渲染和查询
  - `@testing-library/jest-dom`：DOM 断言扩展（如 `toBeInTheDocument()`）
  - `@testing-library/user-event`：真实用户交互模拟（点击、输入等）

### 4. 覆盖率工具：@vitest/coverage-v8

**决策**：使用 v8 作为覆盖率提供者

**理由**：
- **性能最优**：基于 V8 引擎内置的覆盖率收集，无需额外编译
- **Vitest 官方默认**：配置简洁，报告格式丰富（HTML、JSON、终端）

**替代方案**：
- **istanbul**：传统方案，性能较差，已不再推荐

### 5. 测试代码组织

**决策**：采用 **就近放置** 策略，在 `src/__test__/` 目录集中管理测试文件

**目录结构**：
```
src/
├── __test__/          # 测试代码根目录
│   ├── components/    # 组件测试
│   ├── utils/         # 工具函数测试
│   └── fixtures/      # 测试夹具（共享测试数据）
├── __mock__/          # Mock 数据和模拟对象
│   ├── data/          # JSON/TS Mock 数据
│   └── tauriCompat/   # Tauri API Mock
└── ...                # 业务代码
```

**理由**：
- **清晰分离**：测试代码与业务代码目录分离，易于查找和维护
- **IDE 友好**：测试文件集中管理，支持批量运行
- **构建优化**：Vitest 可自动排除 `__test__/` 目录，避免打包测试代码

**替代方案**：
- **就近放置**：测试文件与源码文件同目录（如 `Button.tsx` + `Button.test.tsx`）
  - 优点：测试文件容易找到
  - 缺点：业务代码目录混乱，打包时需排除测试文件

### 6. Tauri API Mock 策略

**决策**：为 `@/utils/tauriCompat` 创建 Null Object Mock，提供与真实 API 一致的接口

**Mock 实现**：
```typescript
// src/__mock__/tauriCompat/shell.ts
export const shell = {
  open: vi.fn(),
};

export const Command = {
  create: vi.fn(() => ({
    execute: vi.fn(),
  })),
};
```

**使用方式**：
```typescript
// 测试文件中
vi.mock('@/utils/tauriCompat/shell');
import { shell } from '@/utils/tauriCompat/shell';

test('open URL', () => {
  shell.open('https://example.com');
  expect(shell.open).toHaveBeenCalledWith('https://example.com');
});
```

**理由**：
- **隔离测试**：避免在测试中调用真实 Tauri API（仅桌面环境可用）
- **快速反馈**：Mock 执行比真实 API 快
- **Web 环境兼容**：确保测试在 Web 环境中也能运行

### 7. 配置集成方式

**决策**：在 `vite.config.ts` 中添加 `test` 配置块，复用主配置的 `resolve.alias`

**配置示例**：
```typescript
// vite.config.ts
export default defineConfig({
  // ... 主配置
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/__test__/setup.ts'], // 全局测试设置
    include: ['src/__test__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/__test__/**', 'src/__mock__/**', 'src/main.tsx'],
    },
    resolve: {
      // 复用主配置的别名（自动继承）
    },
  },
});
```

**全局测试设置**（`src/__test__/setup.ts`）：
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 自动 Mock Tauri 兼容层
vi.mock('@/utils/tauriCompat/shell');
vi.mock('@/utils/tauriCompat/os');
```

## Risks / Trade-offs

### Risk 1: Tauri API Mock 可能与真实行为不一致
**风险**：Mock 实现可能与真实 Tauri API 行为有差异，导致测试通过但实际运行失败

**缓解措施**：
- 定期运行桌面环境的集成测试验证
- 在 Mock 注释中标注真实 API 行为
- 关键场景编写端到端测试（后续可引入 Playwright）

### Risk 2: 测试覆盖率可能成为负担
**风险**：追求高覆盖率可能导致编写无意义的测试，增加维护成本

**缓解措施**：
- 关注测试质量而非覆盖率数字
- 优先测试核心业务逻辑和用户交互
- 允许 Mock 数据和类型定义文件保持低覆盖率

### Risk 3: happy-dom 可能不支持某些浏览器 API
**风险**：happy-dom 对某些 Web API 支持不完整，测试可能失败

**缓解措施**：
- 优先测试组件逻辑和用户交互，避免依赖特定浏览器 API
- 如需真实浏览器环境，可切换至 Vitest Browser Mode 或 Playwright

### Trade-off: 测试启动时间 vs 测试环境真实性
**权衡**：happy-dom 速度快但不完全等同于真实浏览器，jsdom 更真实但更慢

**选择**：优先选择 happy-dom，牺牲少量真实性换取更快的反馈速度

## Migration Plan

### 实施步骤

1. **安装依赖**
   ```bash
   pnpm add -D vitest @vitest/ui @vitest/coverage-v8
   pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
   pnpm add -D happy-dom
   ```

2. **配置 Vitest**
   - 修改 `vite.config.ts`，添加 `test` 配置块
   - 创建 `src/__test__/setup.ts` 全局测试设置文件
   - 配置测试环境、覆盖率、文件匹配模式

3. **创建目录结构**
   ```bash
   mkdir -p src/__test__/{components,utils,fixtures}
   mkdir -p src/__mock__/{data,tauriCompat}
   ```

4. **添加测试脚本**
   - 在 `package.json` 中添加 `test`、`test:run`、`test:ui`、`test:coverage` 脚本

5. **创建 Tauri API Mock**
   - 在 `src/__mock__/tauriCompat/` 下为各兼容层模块创建 Mock 实现
   - 在 `src/__test__/setup.ts` 中自动导入这些 Mock

6. **编写示例测试**
   - 为现有组件编写至少 2-3 个示例测试，验证配置正确性
   - 示例：`Button.test.tsx`、`encryptField.test.ts`

7. **验证测试运行**
   ```bash
   pnpm test:run        # 运行所有测试
   pnpm test:coverage   # 生成覆盖率报告
   pnpm test:ui         # 启动 UI 界面
   ```

### 回滚策略

如果测试框架引入问题：
1. 删除 `src/__test__/` 和 `src/__mock__/` 目录
2. 恢复 `vite.config.ts`（移除 `test` 配置块）
3. 从 `package.json` 移除测试脚本
4. 卸载测试依赖：`pnpm remove vitest @vitest/ui ...`

## Open Questions

1. **是否需要在 CI/CD 中集成测试？**
   - 待定：项目目前未配置 CI/CD，后续可考虑 GitHub Actions 集成

2. **是否需要设定最低测试覆盖率目标？**
   - 建议：初期不设定目标，先建立测试文化，逐步提升覆盖率

3. **是否需要为 Tauri 后端（Rust）添加测试？**
   - 待定：Rust 测试不在本次变更范围，后续可单独规划
