## ADDED Requirements

### Requirement: 路由测试辅助函数兼容 react-router-dom 7.14.x

`getRootRoute` 和 `getRootChildren` 函数 SHALL 接受 `react-router-dom` 的 `Router` 类型作为参数，兼容 7.14.x 版本的 `DataRouteObject` 类型结构。

#### Scenario: 传入 createBrowserRouter 返回的 Router 实例
- **WHEN** 调用 `getRootChildren(router)` 其中 `router` 为 `createBrowserRouter()` 返回值
- **THEN** TypeScript 编译 SHALL 通过，无类型错误

#### Scenario: 测试中访问路由节点的 element 属性
- **WHEN** 通过返回的 `TestRouteObject` 访问 `route.element?.type?.name`
- **THEN** SHALL 获得正确的类型推断，无需 `as any`
