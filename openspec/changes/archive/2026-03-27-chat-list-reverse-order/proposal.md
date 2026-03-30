## Why

当前新建聊天时，新聊天被追加到列表末尾（`Array.push`），用户需要滚动到底部才能看到新创建的聊天。将新聊天插入到列表头部（`Array.unshift`）更符合用户直觉，与主流聊天应用的体验一致。

## What Changes

- 将 `createChat` action 中的 `chatList.push()` 改为 `chatList.unshift()`，使新聊天出现在列表顶部

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

（无 — 此变更为纯实现细节调整，不涉及规格级行为变更）

## Impact

- **代码**: `src/store/slices/chatSlices.ts` 中 `createChat` reducer
- **持久化**: `chats.json` 中聊天的存储顺序会反转（新建的在数组头部）
- **兼容性**: 已有用户的 `chats.json` 文件中聊天顺序不受影响，仅新建的聊天会插入到头部
