# Spec Delta

## REMOVED Requirements

### Requirement: 共享 mockMatchMedia 辅助函数

**Reason**: `helpers/mocks/matchMedia.ts` 整文件零引用（任务 2.1 删除，`rg "createMockMatchMedia|setupMatchMediaMock" src/` 零结果）：`useMediaQuery.test.ts` 与 `useResponsive.test.ts` 各自维护局部 `window.matchMedia` 替换与还原，共享工厂无任何消费者。

**Migration**: 响应式断点测试沿用文件内局部 matchMedia 管理；如再次出现跨文件复用需求（≥3 文件），按 shared-mock-factories 既有模式上移共享层。
