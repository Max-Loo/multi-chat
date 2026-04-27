## 1. 类型适配

- [x] 1.1 更新 `getRootRoute` 和 `getRootChildren` 的参数类型，从 `{ routes: Array<TestRouteObject> }` 改为接受 react-router-dom 的 `Router` 类型，内部用 `as unknown as TestRouteObject` 做类型转换
- [x] 1.2 在文件顶部添加 `Router` 类型的导入语句

## 2. 验证

- [x] 2.1 执行 `pnpm exec tsc --noEmit` 确认 20 处类型错误全部消除
- [x] 2.2 执行 `pnpm test:run` 确认所有路由测试通过
- [x] 2.3 修复 `src/__test__/router/navigationGuards.test.ts:31-32` 中的类型断言
  - 将 `router.routes as TestRouteObject[]` 改为使用 `getRootChildren(router)` 或通过辅助函数访问
  - 确保修复后 `hasRouteProperty` 调用的类型安全
