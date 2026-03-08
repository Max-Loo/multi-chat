## Context

当前 `src/utils/constants.ts` 包含三个专门用于 `modelRemoteService.ts` 的配置项：
- `NETWORK_CONFIG`
- `CACHE_CONFIG`
- `ALLOWED_MODEL_PROVIDERS`

这些配置项名称过于通用，且放置在通用工具文件中，违反了单一职责原则。目前只有 `modelRemoteService.ts` 使用这些配置。

## Goals / Non-Goals

**Goals:**
- 将模型远程服务相关配置移动到专用目录 `src/services/modelRemote/`
- 重命名配置项，使其更具语义化和域特异性
- 更新所有引用，确保代码正常运行
- 保持配置值和结构不变，仅调整位置和命名

**Non-Goals:**
- 不改变配置项的值或结构
- 不改变缓存机制或网络请求行为
- 不优化性能或添加新功能

## Decisions

### 1. 目录结构：`src/services/modelRemote/` 而非 `src/services/modelRemoteService/`

**决策**: 创建 `src/services/modelRemote/` 目录而非 `modelRemoteService/`

**理由**:
- `modelRemote` 作为域名更简洁，与 `chat/` 目录命名风格一致
- 未来可能在该目录下添加其他远程模型相关文件（如类型定义、工具函数等）
- `config.ts` 是该目录的第一个文件，但不是唯一文件

**替代方案**:
- `modelRemoteService/` - 过于冗长，与文件名 `modelRemoteService.ts` 重复

### 2. 配置重命名策略

**决策**: 添加 `REMOTE_MODEL_` 前缀到所有配置项

**理由**:
- 明确标识这些是远程模型服务的配置
- 避免与未来可能添加的其他网络或缓存配置冲突
- 提高代码可读性，无需查看导入语句即可理解配置用途

**映射关系**:
- `NETWORK_CONFIG` → `REMOTE_MODEL_NETWORK_CONFIG`
- `CACHE_CONFIG` → `REMOTE_MODEL_CACHE_CONFIG`
- `ALLOWED_MODEL_PROVIDERS` → `ALLOWED_REMOTE_MODEL_PROVIDERS`

### 3. 导入路径更新

**决策**: 使用相对导入 `./config` 而非别名导入 `@/services/modelRemote/config`

**理由**:
- 配置文件与使用者在同一目录层级，相对导入更简洁
- 与现有代码风格一致（如 `chat/` 目录内的导入）

## Risks / Trade-offs

### 风险 1: 遗漏其他引用

**风险**: 可能有其他文件从 `@/utils/constants` 导入这些配置

**缓解措施**:
- 使用全局搜索确认仅 `modelRemoteService.ts` 使用这些配置
- TypeScript 编译器会在导入失败时报错，确保所有引用被更新

### 风险 2: 运行时错误

**风险**: 配置移动后导致运行时查找失败

**缓解措施**:
- 这是一个编译时变更（导入路径），不影响运行时行为
- 所有配置都是常量，编译时内联

### 权衡: 破坏性变更

**权衡**: 重命名配置是破坏性变更

**缓解**:
- 仅影响一个文件（`modelRemoteService.ts`）
- 在同一 change 中完成移动和重命名，避免中间状态
- 无外部使用者，影响范围可控

## Migration Plan

**步骤**:
1. 创建 `src/services/modelRemote/config.ts`，包含重命名后的配置
2. 更新 `modelRemoteService.ts` 的导入和所有引用
3. 从 `src/utils/constants.ts` 移除旧配置
4. 运行类型检查和构建验证
5. 运行测试确保无回归

**回滚策略**:
- Git 可轻松回滚此变更
- 保留 git 历史便于必要时恢复

## Open Questions

无 - 这是一个简单的代码重构，所有决策已明确。
