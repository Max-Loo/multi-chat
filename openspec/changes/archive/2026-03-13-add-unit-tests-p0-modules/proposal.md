## Why

项目中存在多个 P0 级别的核心模块完全没有单元测试覆盖，尤其是 `lib/toast/toastQueue.ts`（224 行核心队列逻辑）和 `hooks/useCreateChat.ts`。这些模块涉及关键业务逻辑（Toast 队列管理、响应式位置、Redux 状态操作），缺少测试会导致回归风险高、重构困难、错误难以早期发现。

## What Changes

- 为 `lib/toast/toastQueue.ts` 添加完整的单元测试覆盖
  - 队列机制：初始化前调用 → 消息入队 → markReady 后刷新
  - 响应式位置：移动端强制 `top-center`，桌面端默认 `bottom-right`
  - 异步 Promise：`enqueueOrShow` 返回 Promise，action 执行时 resolve
  - 错误处理：action 执行失败时 resolve undefined
  - flush 间隔：队列刷新时每个 action 间隔 500ms

- 为 `lib/toast/index.ts` 添加单元测试覆盖
  - 导出的 API 是否正确代理到 toastQueue
  - rawToast 暴露是否正确

- 为 `hooks/useCreateChat.ts` 添加单元测试覆盖
  - createNewChat 正确调用 dispatch
  - createNewChat 正确调用 navigateToChat
  - 生成的 chat 对象包含正确的 id 和 name

## Capabilities

### New Capabilities

- `toast-queue-unit-tests`: ToastQueue 类的单元测试规范，覆盖队列机制、响应式位置、异步行为、错误处理
- `toast-api-unit-tests`: Toast API 封装层的单元测试规范，验证代理行为和 rawToast 暴露
- `create-chat-hook-tests`: useCreateChat Hook 的单元测试规范，验证 Redux dispatch 和路由导航集成

### Modified Capabilities

无现有 spec 需要修改。

## Impact

**新增文件**:
- `src/__test__/lib/toast/toastQueue.test.ts`
- `src/__test__/lib/toast/index.test.ts`
- `src/__test__/hooks/useCreateChat.test.ts`

**依赖**:
- 需要使用 `vitest` 的 `vi.fn()`, `vi.spyOn()`, `vi.useFakeTimers()` 等 API
- 需要使用 `@testing-library/react` 的 `renderHook` 测试 hooks
- 需要使用现有的 `createMockStore` 等测试辅助工具

**不受影响**:
- 源代码逻辑不变，仅添加测试文件
- 现有测试不受影响
