## 1. 依赖安装与构建配置

- [x] 1.1 安装 virtua 依赖：`pnpm add virtua`
- [x] 1.2 确认 virtua 被正确归入 vendor chunk（当前 vite.config.ts 中未匹配到特定分组的 node_modules 依赖归入 vendor chunk，virtua ~3kB 无需单独分组）

## 2. ChatBubble memo 优化

- [x] 2.1 将 `ChatBubble` 组件用 `React.memo` 包裹，自定义比较函数比较 `role`、`content`、`reasoningContent`、`isRunning` 四个 props
- [x] 2.2 验证流式生成时历史消息的 ChatBubble 不会重新渲染

## 3. RunningBubble selector 收窄

- [x] 3.1 将 RunningBubble 的 selector 从 `state.chat.runningChat` 改为 `state.chat.runningChat[selectedChatId]?.[modelId]`，只订阅当前面板数据
- [x] 3.2 验证多面板场景下其他面板的流式更新不会触发当前面板的 RunningBubble 重渲染

## 4. 消息列表虚拟化（Detail）— 使用 Virtualizer

- [x] 4.1 引入 `Virtualizer` 组件，将 `historyList.map()` 的 ChatBubble 列表作为 Virtualizer 的 children
- [x] 4.2 保留外部 `div` 作为滚动容器（保留 `scrollContainerRef`），将 Title 放在 Virtualizer 外部作为固定头部
- [x] 4.3 配置 Virtualizer 的 `startMargin` 为 Title 组件的高度（用 ResizeObserver 动态获取或设置固定值）
- [x] 4.4 将 RunningBubble 和错误 Alert 放在 Virtualizer 外部，不参与虚拟化
- [x] 4.5 实现 `shouldStickToBottom` ref 模式：在 `onScroll` 中检测是否在底部并更新 ref
- [x] 4.6 实现流式自动跟随：流式更新时检查 `shouldStickToBottom`，为 true 则调用 `scrollToBottom()`
- [x] 4.7 保留 `isAtBottom` + `needsScrollbar` 的检测逻辑，在外部 div 的 scroll 事件中计算
- [x] 4.8 保留 `scrollToBottom()` 方法（使用外部 div 的 `scrollTop = scrollHeight`）
- [x] 4.9 将"回到底部"按钮保持在外部 div 内部（Virtualizer 外部），使用 absolute 定位
- [x] 4.10 对接 `useAdaptiveScrollbar`：保留外部 div 的 scroll 事件监听，同时确保 Virtualizer 的 scroll 同步

## 5. 对话列表虚拟化（Sidebar）— 使用 VList

- [x] 5.1 将 `filteredChatList.map()` 替换为 `VList` 组件（对话列表结构简单，适合使用 VList）
- [x] 5.2 使用 VList 的 `onScroll` 回调替代 `sidebarRef` + `addEventListener('scroll')`，对接 `useAdaptiveScrollbar`
- [x] 5.3 确保 skeleton 加载状态（`chatListLoading`）在 VList 外部处理，不参与虚拟化
- [x] 5.4 移除原有的 `sidebarRef` 及其 `addEventListener` 代码

## 6. 测试与验证

- [x] 6.1 验证消息列表基本功能：打开对话、发送消息、流式生成、多面板
- [x] 6.2 验证自动滚到底部行为：新消息到来时自动跟随、向上滚动后显示回到底部按钮、点击回到底部
- [x] 6.3 验证对话列表功能：滚动、搜索过滤、新建对话、删除对话
- [x] 6.4 验证滚动条自适应显示/隐藏行为
- [x] 6.5 验证多面板模式下各面板独立虚拟化，无跨面板重渲染
- [x] 6.6 验证 Title 始终渲染，不被虚拟化回收
- [x] 6.7 验证 RunningBubble 在 Virtualizer 外部正常渲染，流式高度变化不影响虚拟化测量
- [x] 6.8 检查现有单元测试是否通过，按需更新测试用例
