## Why

`appConfigMiddleware.ts` 注册了 3 个 Listener Middleware 监听器，其中语言持久化和推理内容配置持久化已有测试覆盖，但第 3 个监听器——`setAutoNamingEnabled`（自动命名开关持久化，第 70-78 行）——完全没有测试。如果该监听器的 localStorage key 或持久化逻辑出错，用户重启后会丢失自动命名配置，且没有测试能捕获。

## What Changes

- 为 `setAutoNamingEnabled` 监听器补充单元测试，覆盖启用/禁用两种场景
- 测试模式与已有的 `setTransmitHistoryReasoning` 监听器测试保持一致

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `app-config-middleware-tests`: 补充 `setAutoNamingEnabled` 监听器的持久化测试用例

## Impact

- **测试文件**：`src/__test__/store/middleware/appConfigMiddleware.test.ts`（新增 2-3 个测试用例）
- **源码**：无改动
- **依赖**：无新增依赖
