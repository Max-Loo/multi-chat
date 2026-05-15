## Context

当前 `src/__test__/setup.ts` 是一个 378 行的单体文件，承载了 6 种职责：

1. **Polyfill** — ResizeObserver（行 19-23）
2. **vi.mock()** — 11 个全局模块 mock（行 33-294），包括 Tauri API、AI SDK、Skeleton 组件
3. **globalThis 注册** — 9 个 mock 工厂函数（行 254-302）
4. **断言扩展** — jest-dom + 自定义断言（行 13、308）
5. **afterEach 清理** — cleanup + clearAllMocks（行 315-318）
6. **错误抑制** — unhandledrejection 处理（行 327-377）

集成测试的 `integration/setup.ts`（27 行）仅复制了部分注册，缺少 cleanup、Polyfill、自定义断言、错误抑制。

## Goals / Non-Goals

**Goals:**

- 将 setup.ts 的 6 种职责拆分为 3 个独立模块（base/mocks/cleanup）
- 集成测试自动获得完整的清理能力和断言扩展
- 消除两个 setup 文件之间的重复注册（5 个 globalThis）
- 修正过时注释和注释掉的代码
- 统一 globals 配置

**Non-Goals:**

- 不改变任何 vi.mock 的默认行为或返回值
- 不重构单个测试文件的 mock 覆盖方式
- 不处理 4 个已跳过的测试（那是独立的测试基础设施问题）
- 不引入新的 mock 工厂或辅助函数
- 不改动 `vitest.d.ts` 类型定义

## Decisions

### 决策 1：拆分为 base / mocks / cleanup 三层

**选择**：按职责边界拆分为三个文件，而非按环境拆分。

**理由**：

| 方案 | 优点 | 缺点 |
|---|---|---|
| A. 按环境拆分（unit-setup / integration-setup） | 每个环境自包含 | 仍有大量共享代码重复 |
| B. 按职责拆分（base / mocks / cleanup） | 零重复，灵活组合 | 多一层文件 |
| C. 只修补 integration setup | 改动最小 | 不解决 setup.ts 单体问题 |

选 B：三个文件的职责边界清晰——base 是纯声明（无副作用），mocks 是 vi.mock 静态调用，cleanup 是运行时钩子。

**各层内容分配**：

```
setup/base.ts (~60 行)
├── fake-indexeddb/auto 导入
├── ResizeObserver polyfill
├── jest-dom 断言扩展
├── __VITEST__ 环境标识
└── 9 个 globalThis mock 工厂注册

setup/mocks.ts (~170 行)
├── createDefaultMockStream 辅助函数
├── createDefaultMockStreamResult 辅助函数
├── createMockAIProvider 辅助函数
├── 7 个 vi.mock(tauriCompat 相关)
├── 4 个 vi.mock(AI SDK 相关)
└── 1 个 vi.mock(Skeleton)

setup/cleanup.ts (~70 行)
├── setupCustomAssertions()
├── afterEach(() => { cleanup(); vi.clearAllMocks(); })
└── unhandledrejection 抑制逻辑
```

### 决策 2：集成测试只引入 base + cleanup，不引入 mocks

**选择**：`integration/setup.ts` 只引入 `base.ts` + `cleanup.ts`。

**理由**：集成测试需要更真实的存储行为（使用真实 Map 而非空 mock），它们在文件级别自己 mock `@/utils/tauriCompat`。如果加载全局 `mocks.ts`，`vi.mock` 的 hoisting 会覆盖集成测试的自定义 mock，导致测试行为改变。

### 决策 3：统一 globals: true

**选择**：在 `vite.config.ts` 的 test 配置中添加 `globals: true`。

**理由**：集成测试配置已启用 globals。统一后两个环境的测试文件风格一致，无需在每个单元测试文件中 `import { describe, it, expect, vi } from 'vitest'`。需同步在 `tsconfig.json` 或 `vitest.d.ts` 中配置类型引用。

### 决策 4：过时代码清理

**选择**：删除注释掉的 `setupGlobalMocks` 调用，修正 "jsdom" → "happy-dom" 注释。

**理由**：`setupGlobalMocks` 已注释并标注"临时禁用"，没有关联的 TODO 或 issue。如果未来需要恢复，可以从 git 历史中找回。

## Risks / Trade-offs

- **vi.mock hoisting 兼容性** → `mocks.ts` 中的 `vi.mock()` 调用被移到独立文件后，Vitest 仍然会正确 hoisting，因为 Vitest 处理的是模块加载时的静态 `vi.mock` 调用，无论是直接在 setup 文件还是通过 import 引入的模块中。验证方式：重构后运行 `pnpm test:run` 确认全部通过。

- **集成测试行为变化** → 引入 `cleanup.ts` 后，集成测试会多出 `afterEach(() => cleanup())` 调用。对于不渲染 React 的测试（4 个纯 Redux 测试），`cleanup()` 是空操作。对于渲染 React 的测试（5 个），这是修复而非破坏。验证方式：运行 `pnpm test:integration:run` 确认全部通过。

- **新增文件路径** → 新建 `src/__test__/setup/` 目录。需要更新 `vitest.d.ts` 或相关引用。影响极小。
