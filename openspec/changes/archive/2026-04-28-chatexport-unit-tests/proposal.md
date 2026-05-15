## Why

`src/services/chatExport.ts` 当前行覆盖率为 0%，是项目中唯一完全未覆盖的业务逻辑模块。现有的 `GeneralSetting.test.tsx` 通过 `vi.mock` 绕过了该模块，仅验证了 UI 组件的调用行为。该模块包含数据过滤（`isDeleted` 判断）和存储遍历逻辑，存在过滤条件错误或索引读取失败的风险。

## What Changes

- 为 `src/services/chatExport.ts` 新增独立单元测试文件
- 覆盖 `loadAllChats()`、`exportAllChats()`、`exportDeletedChats()` 三个导出函数
- Mock 存储层依赖（`loadChatIndex`、`loadChatById`），验证过滤逻辑的正确性
- 覆盖正常路径、空数据、部分加载失败等场景

## Capabilities

### New Capabilities

（无新功能，仅为测试补充）

### Modified Capabilities

- `chat-export`: 补充 `chatExport.ts` 服务层的单元测试覆盖，确保过滤逻辑和错误处理的正确性

## Impact

- 新增测试文件：`src/__test__/services/lib/chatExport.test.ts`
- 不影响任何现有代码或 API
- 预期将 `chatExport.ts` 行覆盖率从 0% 提升至 90%+
