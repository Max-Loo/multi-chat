## Context

`/simplify` 代码审查在 feat/test 分支（55 个源码文件变更）中识别出 10 类问题。这些问题涉及三类领域：无障碍国际化（10 个组件 aria-label 硬编码中文，另 1 个组件 NoProvidersAvailable 已使用 i18n 仅做验证）、运行时正确性（sendMessage 异步异常/竞态）、以及效率优化（网络恢复全量预加载、重复 store 实例、双重磁盘刷写、LRU 冗余更新）。此外还有代码重复（键盘处理器）和死代码清理。

## Goals / Non-Goals

**Goals:**
- 10 个组件的 aria-label 迁移到 i18n 系统，确保英文/法语用户屏幕阅读器正确朗读
- 修复 sendMessage 异步化后的异常处理和并发竞态
- 优化 ProviderLoader、ResourceLoader、modelRemote、chatStorage 的效率问题
- 提取重复键盘处理器为共享工具，消除代码重复
- 清理无调用者的废弃导出

**Non-Goals:**
- 不重构 aria-label 之外的其他 i18n 问题
- 不修改测试框架或测试基础设施
- 不改动 store/加密层的核心架构
- 不引入新的外部依赖

## Decisions

### D1: aria-label 国际化使用 common 命名空间 a11y 分组

**决策**: 在 `common.json` 中新增 `a11y` 分组（如 `a11y.bottomNav`、`a11y.mainNav` 等），而非散落在各功能命名空间。

**理由**: aria-label 属于跨组件复用的 UI 文本，符合 `common` 命名空间的定位。使用 `a11y` 分组可避免与现有键值冲突，且便于批量审查。

**替代方案**: 为每个功能模块（如 `chat.bottomNavA11y`）各自定义 → 键值分散，维护成本高。

### D2: 键盘激活处理器提取为纯函数

**决策**: 在 `src/utils/a11y.ts` 中创建 `handleActivationKeyDown(callback: () => void): KeyboardEventHandler`，返回处理 Enter/Space 的键盘事件处理器。

**理由**: ChatButton 和 ProviderCard 的逻辑完全相同（检测 Enter/Space → preventDefault → 调用回调），是典型的 DRY 候选。纯函数不引入 React 依赖，测试简单。

**替代方案**: 创建 `ClickableDiv` 包装组件 → 过度抽象，现有组件结构差异大不适合统一包装。

### D3: sendMessage 仅添加异常捕获，不加并发守卫

**决策**: 在 `sendMessage` 的两个调用点（`onClickSendBtn`、`onPressEnterBtn`）添加 `.catch(console.error)`，不添加并发守卫。

**理由**: 两个调用点已有 `isSending` 检查（`onClickSendBtn` line 149、`onPressEnterBtn` line 173），并发场景不存在。`abortSendEventRef.current` 在发送完成后不会被清除（仅在用户手动停止时置 null），若用作守卫会导致发送功能在首次使用后永久失效。

**替代方案**: 使用 `abortSendEventRef.current` 作为守卫 → 发送完成后 ref 不清空，后续发送被永久阻止，属于致命回归。

### D4: modelRemote store 改为模块级单例

**决策**: 将 `createCacheStore()` 函数替换为模块顶层 `const remoteCacheStore = createLazyStore('remote-cache.json')`，所有函数直接引用该单例。

**理由**: `createLazyStore` 返回的 Store 实例本身就是带缓存的（`init()` 是幂等的），无需每次创建新实例。与 `chatStorage.ts` 中 `chatsStore` 的模式一致。

### D5: saveChatAndIndex 和 deleteChatFromStorage 合并磁盘刷写

**决策**: 重构为 `await chatsStore.init()` → 批量 `await chatsStore.set()` → 单次 `await chatsStore.save()`。同时修复 `saveChatAndIndex` 和 `deleteChatFromStorage` 两个函数。

**理由**: 原实现中 `saveChatById` 和 `saveChatIndex` 各自独立调用 `init()` + `save()`，产生两次磁盘刷写。两个函数存在相同问题，需一并修复以保持代码风格一致。

**风险**: 需确保 `set()` 不触发自动 `save()`——当前 `createLazyStore` 的 `set` 仅更新内存，`save` 才刷盘，所以安全。

### D6: ProviderLoader 网络恢复仅重试失败项

**决策**: `handleNetworkRecover` 中过滤出 `status === 'error'` 的 provider key，仅对这些 key 调用 `preloadProviders`。

**理由**: 网络恢复事件可能在短时间内多次触发（如网络抖动），全量预加载会产生大量无用的 Promise 创建和缓存查找。仅重试失败项可将工作量从 O(n) 降到 O(failed)。

## Risks / Trade-offs

- **[aria-label 迁移]** → 需在 10 个组件中添加 `useTranslation` hook，部分组件可能尚未引入。缓解：逐组件验证，确保 hook 在组件树中可用。
- **[sendMessage 异常捕获]** → 仅添加 `.catch(console.error)`，不引入额外守卫。现有 `isSending` 检查已覆盖并发场景。注意：RTK `dispatch(thunk)` 永远 resolve 为 action 对象不会 throw，因此 `.catch()` 仅防御极端边缘情况（如中间件错误），实际触发概率极低。错误信息已通过 store 的 `sendMessage.rejected` handler 写入 `runningChat` 状态供 UI 展示。
- **[saveChatAndIndex/deleteChatFromStorage 合并]** → 修改了存储层函数的内部实现（签名不变），需确保行为等价。缓解：该函数是内部函数，调用点有限且已知。
- **[data-testid 重命名]** → 测试文件需同步更新查询。缓解：全局搜索 `chat-sidebar` 确保无遗漏。
- **[ResourceLoader 缓存检查]** → `this.get(key)` 改为 `this.cache.has(key)` 会跳过 LRU 位置更新，缓存命中时不再刷新最近使用排序。缓解：默认 `maxCacheSize=10` 远大于实际 provider 数量（通常 <5），LRU 淘汰几乎不触发，实际影响可忽略。
