## Why

深度审查发现两个测试覆盖缺口：(1) `chatStorage.ts` 的数据迁移逻辑（`migrateOldChatStorage`）和删除不存在聊天的边界路径完全未测试，这是数据安全的关键路径；(2) `ChatButton` 组件的重命名、删除确认、Shift 快捷删除三大核心交互只有占位测试，52% 行覆盖率远低于组件阈值。这两个缺口分别属于 P0 和 P1 级别风险。

## What Changes

- 补充 `chatStorage.test.ts` 中 `migrateOldChatStorage` 的完整迁移路径测试：旧数据存在时的三步迁移、updatedAt 补充、索引已存在时跳过、旧 key 清理
- 补充 `deleteChatFromStorage` 聊天不存在时的 console.warn + 提前返回路径测试
- 补充 `ChatButton.test.tsx` 中缺失的交互测试：下拉菜单打开→重命名完整流程（输入→确认→取消）、删除确认对话框触发与执行、Shift+Hover 快捷删除按钮条件渲染与直接删除执行、发送中状态禁用删除按钮

## Capabilities

### New Capabilities
- `chatstorage-migration-testing`: chatStorage 迁移逻辑和边界路径的测试覆盖
- `chatbutton-interaction-testing`: ChatButton 组件重命名、删除、快捷删除交互的测试覆盖

### Modified Capabilities
（无需求变更，仅补充测试）

## Impact

- **测试文件**：`src/__test__/store/storage/chatStorage.test.ts`、`src/__test__/pages/Chat/components/ChatSidebar/components/ChatButton.test.tsx`
- **覆盖率影响**：chatStorage 行覆盖率预计从 74% 提升至 90%+；ChatButton 行覆盖率预计从 52% 提升至 75%+
- **无生产代码变更**：纯测试补充
