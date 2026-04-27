## Context

react-router-dom 7.14.x 对路由类型进行了重构：将框架无关的 `AgnosticBaseRouteObject`（无 `element` 属性）替换为包含 React 属性的 `BaseRouteObject`（含 `element?: ReactNode | null`、`Component`、`ErrorBoundary` 等）。这使得 `Router.routes` 的返回类型从 `AgnosticDataRouteObject[]` 变为 `DataRouteObject[]`。

`src/__test__/helpers/mocks/router.ts` 中的 `TestRouteObject.element` 类型为 `ReactElementLike | undefined`，而新版 `DataRouteObject.element` 为 `ReactNode | null`，两者不兼容（`null` 无法赋值给 `ReactElementLike | undefined`）。

## Goals / Non-Goals

**Goals:**
- 修复 `pnpm exec tsc --noEmit` 的 20 处类型错误
- 保持测试辅助函数的类型安全性（避免 `as any`）
- 适配 react-router-dom 7.14.x 的新类型结构

**Non-Goals:**
- 不回退 react-router-dom 版本
- 不修改生产代码
- 不改变测试的行为逻辑

## Decisions

### 决策 1：修改辅助函数参数类型，接受 Router 类型

**方案**：将 `getRootRoute` 和 `getRootChildren` 的参数从 `{ routes: Array<TestRouteObject> }` 改为接受 react-router-dom 导出的 `Router` 类型，内部通过类型断言转换。

**理由**：辅助函数的调用者传入的就是 `createBrowserRouter` 返回的 `Router` 实例。直接接受 `Router` 类型消除了手动构造中间类型的需要，也跟随 react-router-dom 版本演进。

**替代方案**：
- A) 修改 `TestRouteObject.element` 为 `ReactNode | null` — 会失去测试中对 `ReactElementLike` 的类型信息访问
- B) 使用 `as any` 绕过 — 牺牲类型安全
- C) 让参数类型使用泛型 — 过度设计，辅助函数只用于这一个场景

### 决策 2：保留 TestRouteObject 和 ReactElementLike 用于测试内部

**方案**：`TestRouteObject` 和 `ReactElementLike` 继续保留，作为函数返回值的类型。辅助函数内部通过 `as unknown as TestRouteObject` 做类型转换。

**理由**：测试代码需要访问 `element.type.name` 等 React 内部结构，`ReactElementLike` 提供了这个类型约定。保留它让测试代码保持类型安全，只在辅助函数边界做一次转换。

## Risks / Trade-offs

- **[未来 react-router 版本可能再次变更 Router 类型]** → 影响范围仅限 `getRootRoute`/`getRootChildren` 两个函数的参数类型，修复成本低
- **[类型断言隐藏运行时风险]** → 测试辅助函数本身不涉及运行时逻辑，断言仅在类型层面生效，风险可接受
