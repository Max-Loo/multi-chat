## Why

`/simplify` 代码审查在 feat/test 分支（55 个源码文件）中发现 10 类问题：10 个组件的 `aria-label` 硬编码中文绕过 i18n 系统（另 1 个组件 NoProvidersAvailable 已使用 i18n）、`sendMessage` 异步化后缺少异常处理与并发守卫、多处效率问题（网络恢复无条件全量预加载、重复 store 实例创建、双重磁盘刷写）以及代码重复（键盘交互处理器）。这些问题在合入 main 前修复，可避免技术债累积。

## What Changes

- 10 个组件的 `aria-label` 从硬编码中文迁移为 i18n 翻译键（另 1 个组件 NoProvidersAvailable 已使用 i18n，仅做验证），新增 `common.json` 中 `a11y` 分组键（3 种语言 + 类型声明）
- `Sender.tsx` 的 `sendMessage` 调用点添加异步异常 `.catch()` 处理（并发守卫已由调用点的 `isSending` 检查覆盖，无需额外守卫）
- `Chat/index.tsx` 的 `data-testid="chat-sidebar"` 重命名为 `chat-sidebar-wrapper`，消除与 `Sidebar/index.tsx` 的重复
- `ProviderLoader.handleNetworkRecover` 只重试处于 error 状态的 provider，不再无条件全量预加载
- `ResourceLoader.load()` 缓存检查从 `this.get(key)` 改为 `this.cache.has(key)`，语义更清晰且避免不必要的函数调用（注意：`get()` 会触发 LRU 位置更新，改为 `cache.has()` 后缓存命中不再更新 LRU 顺序，因默认缓存容量 10 远大于实际 provider 数量，实际影响可忽略）
- `modelRemote/index.ts` 的 `createCacheStore()` 改为模块级单例，避免每次调用创建新 Store 实例
- `chatStorage.ts` 的 `saveChatAndIndex` 和 `deleteChatFromStorage` 合并为一次 `init()` + 批量 `set()` + 一次 `save()`，减少双重磁盘刷写
- `ToolsBar.tsx` 空 `<div></div>` 替换为 `<span aria-hidden="true" />`
- 提取 `ChatButton.tsx` 和 `ProviderCard.tsx` 重复的 Enter/Space 键盘处理器到 `src/utils/a11y.ts`
- 删除无调用者的废弃导出 `resetInitI18nForTest`

## Capabilities

### New Capabilities
- `a11y-utils`: 可复用的无障碍工具函数（键盘激活处理器），供需要模拟按钮行为的自定义交互元素使用

### Modified Capabilities
- `component-accessibility`: aria-label 从硬编码迁移为 i18n 翻译键，覆盖 10 个组件（另 1 个验证）
- `sender-form-submit`: sendMessage 异步化后补充异常处理
- `chat-message-sending`: 与 sender-form-submit 同步调整
- `i18n-ui-text`: 新增 a11y 相关翻译键（common.json 中 a11y 分组）
- `lazy-resource-loading`: ResourceLoader 缓存检查优化
- `remote-model-fetch`: modelRemote store 单例化
- `chat-per-key-storage`: saveChatAndIndex 合并磁盘刷写

## Impact

- **前端组件**：10 个 UI 组件（BottomNav、Sidebar、ChatBubble、ModelSelect、Panel/Detail、Chat/index、CreateModel、Setting 等）+ 1 个验证（NoProvidersAvailable 已使用 i18n）
- **服务层**：providerLoader.ts、modelRemote/index.ts、i18n.ts
- **存储层**：chatStorage.ts（saveChatAndIndex 签名变更）
- **工具层**：新增 a11y.ts，修改 resourceLoader.ts
- **国际化资源**：3 个语言的 common.json + 类型声明文件
- **测试文件**：ChatPage.test.tsx 中 `chat-sidebar` 相关查询需同步更新
