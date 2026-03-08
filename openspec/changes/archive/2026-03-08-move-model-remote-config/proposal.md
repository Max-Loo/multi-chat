## Why

当前 `src/utils/constants.ts` 中的 `NETWORK_CONFIG`、`CACHE_CONFIG`、`ALLOWED_MODEL_PROVIDERS` 配置项专为 `modelRemoteService.ts` 服务，违反了单一职责原则，导致通用工具文件耦合了特定业务逻辑。

## What Changes

- **BREAKING** 从 `src/utils/constants.ts` 移除 `NETWORK_CONFIG`、`CACHE_CONFIG`、`ALLOWED_MODEL_PROVIDERS` 导出
- **BREAKING** 重命名配置项，使其更具语义化：
  - `NETWORK_CONFIG` → `REMOTE_MODEL_NETWORK_CONFIG`
  - `CACHE_CONFIG` → `REMOTE_MODEL_CACHE_CONFIG`
  - `ALLOWED_MODEL_PROVIDERS` → `ALLOWED_REMOTE_MODEL_PROVIDERS`
- 创建 `src/services/modelRemote/` 目录
- 在 `src/services/modelRemote/` 中创建 `config.ts` 文件，包含三个重命名后的配置项
- 更新 `src/services/modelRemoteService.ts` 的导入路径和引用：从 `@/utils/constants` 改为 `./config`，并更新变量名

## Capabilities

### New Capabilities
（无 - 此变更为代码重构，不引入新功能能力）

### Modified Capabilities
（无 - 此变更仅调整代码组织结构，不改变系统行为或需求）

## Impact

**受影响的代码**：
- `src/utils/constants.ts` - 移除三个配置导出（减少 29 行）
- `src/services/modelRemoteService.ts` - 更新导入路径和所有变量引用（约 10 处）
- `src/services/modelRemote/config.ts` - 新建文件（约 30 行）

**Breaking Changes**：
- 任何直接从 `@/utils/constants` 导入 `NETWORK_CONFIG`、`CACHE_CONFIG`、`ALLOWED_MODEL_PROVIDERS` 的代码需要更新
- 目前仅 `modelRemoteService.ts` 使用这些配置

**不受影响**：
- 无外部依赖变更
- 无运行时行为变化
- 配置内容和值保持不变，仅移动位置和重命名
