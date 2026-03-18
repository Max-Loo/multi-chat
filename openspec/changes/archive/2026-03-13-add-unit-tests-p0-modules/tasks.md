## 1. ToastQueue 单元测试

- [x] 1.1 创建测试文件 `src/__test__/lib/toast/toastQueue.test.ts`
- [x] 1.2 实现 vi.resetModules() 和动态导入策略实现测试隔离
- [x] 1.3 实现 Mock sonner 库的 toast 函数
- [x] 1.4 测试队列机制：初始化前调用 Toast 入队
- [x] 1.5 测试队列机制：markReady 后队列刷新
- [x] 1.6 测试队列机制：markReady 后新 Toast 立即显示
- [x] 1.7 测试队列机制：空队列调用 markReady
- [x] 1.8 测试响应式位置：移动端强制 top-center
- [x] 1.9 测试响应式位置：桌面端默认 bottom-right
- [x] 1.10 测试响应式位置：桌面端保留用户 position
- [x] 1.11 测试响应式位置：未设置 isMobile 默认桌面端
- [x] 1.12 测试异步 Promise：Toast 方法返回 Promise
- [x] 1.13 测试异步 Promise：Toaster 就绪时 Promise 立即 resolve
- [x] 1.14 测试异步 Promise：Toaster 未就绪时 Promise 延迟 resolve
- [x] 1.15 测试错误处理：action 执行失败不抛出异常
- [x] 1.16 测试错误处理：action 执行失败记录错误日志
- [x] 1.17 测试所有 Toast 类型：success、error、warning、info、loading
- [x] 1.18 测试 dismiss 方法立即执行不经过队列
- [x] 1.19 测试 promise 方法立即执行不经过队列

## 2. Toast API 单元测试

- [x] 2.1 创建测试文件 `src/__test__/lib/toast/index.test.ts`
- [x] 2.2 测试 toastQueue 正确导出
- [x] 2.3 测试 rawToast 正确导出

## 3. useCreateChat Hook 单元测试

- [x] 3.1 创建测试文件 `src/__test__/hooks/useCreateChat.test.ts`
- [x] 3.2 实现 Mock useAppDispatch、useNavigateToChat 和 generateId
- [x] 3.3 测试 Hook 返回 createNewChat 方法
- [x] 3.4 测试 createNewChat 调用 dispatch createChat action
- [x] 3.5 测试 createNewChat 生成正确的 chat 对象（id 非空，name 为空）
- [x] 3.6 测试 createNewChat 调用 navigateToChat 方法
- [x] 3.7 测试 createNewChat 引用稳定（useCallback）

## 4. 验证和清理

- [x] 4.1 运行所有新增测试确保通过
- [x] 4.2 检查测试覆盖率报告
- [x] 4.3 确保 lint 和 typecheck 通过
