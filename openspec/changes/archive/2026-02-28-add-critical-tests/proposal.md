# Proposal: 添加关键模块测试

## Why

当前项目的测试覆盖率为 **48.94%**，关键的跨平台兼容层和数据持久化层模块**几乎完全没有测试覆盖**（覆盖率 0%）。这些模块是项目的基础设施，影响所有功能，一旦失败会导致数据丢失、跨平台功能失效等严重问题。立即为这些高风险模块添加测试，可以显著提升项目稳定性和可维护性。

## What Changes

为以下 6 个 P0 优先级模块添加完整的单元测试和集成测试：

1. **HTTP 兼容层测试** (`src/utils/tauriCompat/http.test.ts`)
   - 测试环境检测逻辑（开发/生产、Tauri/Web）
   - 测试 fetch 函数的请求和响应处理
   - 测试 Tauri fetch 导入失败时的降级逻辑
   - 测试 getFetchFunc 的功能

2. **OS 兼容层测试** (`src/utils/tauriCompat/os.test.ts`)
   - 测试 locale() 函数的语言获取逻辑
   - 测试 Tauri 环境和 Web 环境的不同行为
   - 测试降级逻辑（Tauri API 返回 null 时）

3. **Shell 兼容层测试** (`src/utils/tauriCompat/shell.test.ts`)
   - 测试 Command.create() 的环境检测
   - 测试 TauriShellCommand 和 WebShellCommand 的执行
   - 测试 shell.open() 的跨平台行为
   - 测试 isSupported() 的返回值

4. **Store 兼容层测试** (`src/utils/tauriCompat/store.test.ts`)
   - 测试 createLazyStore 的环境检测
   - 测试 CRUD 操作（get、set、delete、keys、save）
   - 测试 IndexedDB 初始化和错误处理
   - 测试复杂对象和大数据的存储
   - 测试 Tauri 和 Web 环境的行为一致性

5. **Store 工具函数测试** (`src/store/storage/storeUtils.test.ts`)
   - 测试 saveToStore 的保存和错误处理
   - 测试 loadFromStore 的加载和默认值逻辑
   - 测试 SettingStore 类的功能
   - 测试日志输出和错误消息

6. **聊天存储测试** (`src/store/storage/chatStorage.test.ts`)
   - 测试 saveChatsToJson 的保存逻辑
   - 测试 loadChatsFromJson 的加载逻辑
   - 测试空列表和错误处理

**测试覆盖目标**：
- 语句覆盖率 ≥ **85%**
- 分支覆盖率 ≥ **80%**
- 函数覆盖率 ≥ **90%**

## Capabilities

### New Capabilities
- `tauri-compat-tests`: 跨平台兼容层测试能力，包括 HTTP、OS、Shell 兼容层的完整测试套件
- `storage-tests`: 数据持久化层测试能力，包括 Store 兼容层、工具函数和聊天存储的完整测试套件

### Modified Capabilities
无。此变更是添加测试，不修改现有功能的需求。

## Impact

**影响的代码**：
- `src/utils/tauriCompat/` - 新增 4 个测试文件（http、os、shell、store）
- `src/store/storage/` - 新增 2 个测试文件（storeUtils、chatStorage）

**新增依赖**（测试依赖）：
- 可能需要 `fake-indexeddb` 或 `idb` 来模拟 IndexedDB
- 已有的 Vitest、React Testing Library 等测试框架

**对现有系统的影响**：
- **零影响**：仅添加测试代码，不修改任何生产代码
- CI/CD 流程需要更新以包含新的测试用例

**预期收益**：
- 数据持久化模块的测试覆盖率从 18.75% 提升到 **90%+**
- 跨平台兼容层测试覆盖率从 0% 提升到 **85%+**
- 整体测试覆盖率预计从 48.94% 提升到 **60%+**
- 大幅降低数据丢失和跨平台功能失效的风险
