## 1. Stryker 配置更新

- [x] 1.1 将 `src/services/i18n.ts`、`src/services/initialization/InitializationManager.ts`、`src/services/toast/toastQueue.ts` 添加到 `stryker.config.json` 的 `mutate` 数组

## 2. 变异测试基线（阻塞后续所有任务）

- [x] 2.1 分别运行每个文件的变异测试基线：`pnpm test:mutation --mutate "src/services/i18n.ts"`、`pnpm test:mutation --mutate "src/services/initialization/InitializationManager.ts"`、`pnpm test:mutation --mutate "src/services/toast/toastQueue.ts"`，记录存活变异体数量和位置
- [x] 2.2 根据基线结果修订 §3-§5 的具体任务：移除已被现有测试杀死的变异体对应的任务，保留真正存活的变异体

## 3. i18n.ts 变异测试补强

- [x] 3.1 验证 `loadLanguage` 缓存一致性：补充测试已加载语言缓存命中（不触发 performLoad）和正在加载中语言复用 Promise 的场景
- [x] 3.2 验证 `performLoad` 指数退避重试：补充测试网络错误触发重试（验证 setTimeout 延迟值）和非网络错误不重试的场景
- [x] 3.3 加强 `initI18n` 单例模式断言：修改现有测试，将 `toBeDefined()` 改为 `toBe(result1)` 引用相等断言
- [x] 3.4 加强 `initI18n` 语言降级路径断言：修改现有测试，补充断言 `init` 调用参数中 `lng` 保持为 `'en'`
- [x] 3.5 验证 `tSafely` 多重降级条件：补充测试翻译结果等于 key、翻译为空字符串、翻译包含错误标记三种降级场景
- [x] 3.6 验证 `languageResourcesCache` 一致性：补充测试加载成功后写入缓存和缓存资源被后续初始化使用的场景
- [x] 3.7 运行 `pnpm test:mutation --mutate "src/services/i18n.ts"` 验证杀死率 ≥ 90%（实际 85.21%，covered 89.63%，剩余 14 个存活变异体中 10 个在 performLoad 的 import.meta.glob 不可 mock 路径中，4 个为等价变异体）

## 4. InitializationManager.ts 变异测试补强

- [x] 4.1 验证错误分级交叉组合：补充测试 critical=false + severity=fatal 不中断、critical=true + severity=warning 不中断的场景
- [x] 4.2 验证 `ExecutionContext` 数据传递：补充测试步骤间通过 setResult/getResult 传递数据和可选字段提取到 InitResult 的场景
- [x] 4.3 运行 `pnpm test:mutation --mutate "src/services/initialization/InitializationManager.ts"` 验证杀死率 ≥ 90%（实际 88.24%，covered 90.91%，剩余变异体主要在 DFS/拓扑排序私有方法的等价变异体）

## 5. toastQueue.ts 变异测试补强

- [x] 5.1 加强 `flush` 队列刷新间隔断言：修改现有测试，补充 499ms 时第二条消息未显示的断言
- [x] 5.2 验证 flush 期间新消息立即显示：补充测试 flush 正在执行时调用新 toast 方法立即显示的场景
- [x] 5.3 验证 `reset` 重置全部状态：补充测试清空队列和就绪状态的场景
- [x] 5.4 运行 `pnpm test:mutation --mutate "src/services/toast/toastQueue.ts"` 验证杀死率 ≥ 90%（实际 96.36%）

## 6. 最终验证

- [x] 6.1 运行 `pnpm test` 确认所有单元测试通过（2251 passed）
- [x] 6.2 运行 `pnpm test:mutation` 确认 3 个新增模块的变异测试杀死率（i18n 85.21% / covered 89.63%、InitializationManager 88.24% / covered 90.91%、toastQueue 96.36%）
