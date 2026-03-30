## Why

当前创建新聊天后，通过 URL 参数 → useEffect → Redux 的异步链路设置 `selectedChatId`，存在以下问题：

1. **双重状态源**：URL 和 Redux store 都表示"当前选中的聊天"，需要保持同步
2. **异步延迟**：useEffect 在渲染后执行，`selectedChatId` 更新有 20-50ms 延迟
3. **竞态条件风险**：在 useEffect 执行完成前，依赖 `selectedChatId` 的代码可能读取到旧值
4. **不必要的预加载**：`setSelectedChatIdWithPreload` 对新聊天无意义（新聊天没有模型）

## What Changes

- **修改** `useCreateChat` hook：创建新聊天时直接调用 `setSelectedChatId`（同步），而非仅依赖 URL → useEffect 链路
- **简化** 选中逻辑：新聊天不需要预加载 SDK，使用简单的同步 reducer 即可
- **保留** URL 参数同步机制：ChatPage 中的 useEffect 仍然保留，作为 URL 变化时的同步机制

## Capabilities

### New Capabilities

无。这是实现层面的优化，不引入新的功能能力。

### Modified Capabilities

无。这是实现层面的优化，不改变 spec 级别的需求。现有的 `chat-redirect-on-not-found` 和相关聊天页面的行为需求不变。

## Impact

**直接影响的文件**：

- `src/hooks/useCreateChat.ts` - 添加 `setSelectedChatId` 调用
- `src/store/slices/chatSlices.ts` - 导出 `setSelectedChatId`（已导出）

**不受影响的部分**：

- ChatPage 的 useEffect 逻辑保持不变，继续处理 URL → Redux 同步
- Sidebar 点击聊天列表的选中逻辑保持不变
- 聊天删除后的选中逻辑保持不变

**测试影响**：

- `src/__test__/hooks/useCreateChat.test.ts` - 需要更新测试用例
