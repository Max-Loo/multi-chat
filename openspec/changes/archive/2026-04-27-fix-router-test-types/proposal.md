## Why

react-router-dom 从 7.13.1 升级到 7.14.2 后，`BaseRouteObject` 新增了 `element?: ReactNode | null` 等 React 相关属性（旧版 `AgnosticBaseRouteObject` 不含这些属性）。这导致 `src/__test__/helpers/mocks/router.ts` 中自定义的 `TestRouteObject.element`（`ReactElementLike | undefined`）与 `DataRouteObject.element`（`ReactNode | null`）类型不兼容，`pnpm exec tsc --noEmit` 产生 20 处错误。

## What Changes

- 更新 `src/__test__/helpers/mocks/router.ts` 中的 `TestRouteObject` 类型和辅助函数签名，使其兼容 react-router-dom 7.14.x 的 `DataRouteObject` 类型
- 更新 `getRootRoute` 和 `getRootChildren` 函数的参数类型，接受新版本 `Router` 类型

## Capabilities

### New Capabilities

无

### Modified Capabilities

无（此次变更仅涉及测试辅助代码的类型适配，不改变任何功能需求或 spec 行为）

## Impact

- **受影响文件**：`src/__test__/helpers/mocks/router.ts`（类型定义和辅助函数）
- **受影响测试**：`src/__test__/router/` 下 4 个测试文件（`navigationGuards.test.ts`、`routeConfig.test.ts`、`routeParams.test.ts`、`routerIntegration.test.ts`）
- **依赖变更**：react-router-dom 从 7.13.1 升级到 7.14.2（由 lockfile 删除触发）
- **风险评估**：低风险，仅修改测试类型定义，不影响生产代码
