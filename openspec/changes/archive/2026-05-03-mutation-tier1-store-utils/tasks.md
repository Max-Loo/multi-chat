## 1. Stryker 配置更新

- [x] 1.1 将 `src/store/slices/modelProviderSlice.ts` 和 `src/utils/highlightLanguageManager.ts` 添加到 `stryker.config.json` 的 `mutate` 数组
- [x] 1.2 分别运行每个文件的变异测试基线：`pnpm test:mutation --mutate "src/store/slices/modelProviderSlice.ts"` 和 `pnpm test:mutation --mutate "src/utils/highlightLanguageManager.ts"`，记录存活变异体数量和位置

## 2. modelProviderSlice.ts 变异测试补强

- [x] 2.1 验证 `initializeModelProvider` 缓存快速路径条件：补充测试非数组缓存（降级到远程）、空数组缓存（降级到远程）、有效缓存（快速路径 + lastUpdate: null）的场景
- [x] 2.2 验证 `initializeModelProvider` lastUpdate 差异：补充测试确认缓存路径 lastUpdate 为 null、远程路径 lastUpdate 为 ISO 时间戳的场景
- [x] 2.3 验证 `silentRefreshModelProvider` 静默失败：补充测试 rejected 处理器不修改 providers、lastUpdate、error 的场景
- [x] 2.4 验证 `silentRefreshModelProvider` 条件清除错误：补充测试有错误时 fulfilled 清除 error、无错误时 fulfilled 保持 error 为 null 的场景
- [x] 2.5 验证 `refreshModelProvider` RemoteDataError 类型检查：补充测试 RemoteDataError 使用自定义消息、非 RemoteDataError 使用默认消息的场景
- [x] 2.6 验证 `triggerSilentRefreshIfNeeded` 守卫条件：补充测试 backgroundRefreshing=false 触发、backgroundRefreshing=true 跳过的场景
- [x] 2.7 验证 `backgroundRefreshing` 锁获取和释放：补充测试 pending 设置 true、fulfilled 释放 false、rejected 释放 false 的场景
- [x] 2.8 验证 `initializeModelProvider` rejected 无 payload 处理：补充测试无 payload 时使用 action.error.message 的场景
- [x] 2.9 运行 `pnpm test:mutation --mutate "src/store/slices/modelProviderSlice.ts"` 验证杀死率 ≥ 90%（实际：90.53%）

## 3. highlightLanguageManager.ts 变异测试补强

- [x] 3.1 验证 `resolveAlias` 大小写归一化：补充测试大写 'JS' → 'javascript'、混合大小写 'PY' → 'python' 的场景
- [x] 3.2 验证 `loadLanguageAsync` 四路分发：补充测试已加载直接返回（不调用 loadLanguageModule）、失败过直接抛出、正在加载复用 Promise、首次加载创建新 Promise 的场景
- [x] 3.3 验证 `failedLanguages` 防重试机制：补充测试失败后 hasFailedToLoad=true + isLoaded=false、loadingPromises 清理、阻止重试（loadLanguageModule 调用次数不变）的场景
- [x] 3.4 验证 `doLoadLanguage` 注册语言：补充测试加载成功后调用 hljs.registerLanguage 并传入正确参数的场景
- [x] 3.5 验证 `highlightSync` 未加载守卫：补充测试未加载时抛出包含语言名的错误、已加载时调用 hljs.highlight 的场景
- [x] 3.6 验证 `isSupportedLanguage` 硬编码列表：补充测试支持的语言返回 true、不支持的语言返回 false 的场景
- [x] 3.7 验证单例构造函数守卫：补充测试已有实例时 new 抛出错误、_resetInstance 后 getInstance 返回新实例的场景
- [x] 3.8 验证 `markAsLoaded` 功能：补充测试 markAsLoaded 后 isLoaded 返回 true 的场景
- [x] 3.9 运行 `pnpm test:mutation --mutate "src/utils/highlightLanguageManager.ts"` 验证杀死率 ≥ 90%（实际：94.44%）

## 4. 最终验证

- [x] 4.1 运行 `pnpm test` 确认所有单元测试通过
- [x] 4.2 运行 `pnpm test:mutation` 确认 2 个新增模块的变异测试杀死率均 ≥ 90%
