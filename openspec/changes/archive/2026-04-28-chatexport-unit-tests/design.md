## Context

`src/services/chatExport.ts` 是聊天导出服务层，包含 3 个函数：
- `loadAllChats()` — 从 IndexedDB 读取所有聊天完整数据（内部函数）
- `exportAllChats()` — 导出所有活跃聊天（`isDeleted !== true`）
- `exportDeletedChats()` — 导出所有已删除聊天（`isDeleted === true`）

该模块依赖 `chatStorage` 的 `loadChatIndex()` 和 `loadChatById()`，当前行覆盖率 0%。现有测试（`GeneralSetting.test.tsx`）通过 `vi.mock` 绕过了该模块。

## Goals / Non-Goals

**Goals:**
- 为 `chatExport.ts` 建立独立单元测试，行覆盖率达到 90%+
- 验证 `isDeleted` 过滤逻辑在边界条件下的正确性
- 覆盖存储层返回异常时的错误传播行为

**Non-Goals:**
- 不修改 `chatExport.ts` 本身的实现
- 不修改 `ChatExportSetting.tsx` 的组件测试
- 不引入新的测试工具或 Mock 框架

## Decisions

### 决策 1：Mock chatStorage 依赖，而非使用真实 IndexedDB

**选择**：`vi.mock("@/store/storage/chatStorage")` Mock 存储层
**理由**：这是 `chatExport` 的单元测试，应隔离存储层实现细节。使用真实 IndexedDB 属于集成测试范畴。
**替代方案**：使用 `fake-indexeddb` + 真实存储 → 耦合度过高，维护成本大

### 决策 2：测试文件放置于 `src/__test__/services/lib/`

**选择**：`src/__test__/services/lib/chatExport.test.ts`
**理由**：`chatExport.ts` 位于 `src/services/` 根目录，对应测试目录结构为 `services/lib/`（与 `global.test.ts`、`i18n.test.ts` 同级）。

### 决策 3：测试用例结构

按函数 + 场景组织 `describe` 块：
- `loadAllChats`：正常加载、索引为空、部分聊天加载失败返回 `undefined`
- `exportAllChats`：过滤已删除聊天、全部活跃、全部已删除、空数据
- `exportDeletedChats`：仅返回已删除聊天、无已删除聊天、混合数据
- 共同验证：`exportedAt` 格式、`version` 字段

## Risks / Trade-offs

- **[Mock 与实现不同步]** → Mock 的 `loadChatIndex`/`loadChatById` 返回值可能与真实行为不一致 → 通过保持 Mock 简单（仅返回数据）降低风险
- **[version 导入]** → `chatExport.ts` 从 `package.json` 导入 `version`，测试环境可能需要处理 → 已有先例，`vi.mock` 即可
