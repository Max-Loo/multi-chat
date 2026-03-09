## Why

将 `fake-indexeddb` 从 5.0.2 升级到 6.2.5，以获得以下改进：

- **符合规范**：使用 `DOMException` 错误（符合 IndexedDB 规范要求）
- **新功能支持**：`getAllRecords`、`forceCloseDatabase` API、事件捕获等
- **性能提升**：某些操作性能提升高达 13 倍（通过二叉搜索树优化）
- **测试覆盖**：从 2019 年升级到 2025 年的 Web Platform Tests
- **Bug 修复**：修复 Date 对象、Blob/File、事务时序等多个边缘情况

当前版本 5.0.2 发布于 2020 年，缺少对新 IndexedDB 特性的支持和最新的规范兼容性修复。

## What Changes

- **依赖升级**：`fake-indexeddb` 从 `5.0.2` → `6.2.5`
- **Breaking Changes**（可能影响）：
  - 错误类型变更：普通 `Error` → `DOMException`（符合 IndexedDB 规范）
  - `autoIncrement` + `keyPath` 为 `undefined` 时现在会抛出错误（之前静默失败）
- **新功能**（需评估是否使用）：
  - `getAllRecords()` - 同时查询 keys 和 values
  - `getAll()/getAllKeys()` 支持 `descending` 方向
  - `forceCloseDatabase()` - 模拟数据库异常关闭
  - 事件支持 `handleEvent` 和 `capture`
- **性能优化**：
  - 使用二叉搜索树存储数据（multiEntry 索引插入性能提升 13 倍）
  - 非 Safari 浏览器使用 `scheduler.postTask` 替代 `setTimeout`
- **Bug 修复**：
  - Date 对象边缘情况处理
  - Blob/File 对象处理改进
  - 事务时序边缘情况修复
  - CommonJS `require('fake-indexeddb/auto')` 导入修复

## Capabilities

### New Capabilities
- **无新增能力**：此变更为依赖升级，不引入新的业务能力

### Modified Capabilities
- **无需求变更**：依赖升级不改变现有功能需求，主要提升性能、规范兼容性和稳定性

## Impact

**受影响的代码**：
- 测试文件中使用 `fake-indexeddb` 的代码（`src/__test__/`）
- 依赖 `fake-indexeddb` API 的测试工具函数

**受影响的依赖**：
- `package.json` 中的 `fake-indexeddb` 版本
- `pnpm-lock.yaml` 锁文件

**潜在风险**：
- **错误类型变更**：如果测试代码依赖特定错误类型或消息格式，可能需要调整
- **autoIncrement 行为变更**：`undefined` keyPath 值现在抛出错误而非静默失败
- **事件调度变更**：`setImmediate` 使用方式的改进可能影响测试时序

**测试策略**：
- 运行所有单元测试和集成测试（`pnpm test:all`）
- 检查 `fake-indexeddb` 相关测试是否需要调整
- 验证 IndexedDB 加密存储功能（`src/store/keyring/masterKey.ts`）
- 验证通用存储功能（`src/store/storage/`）
