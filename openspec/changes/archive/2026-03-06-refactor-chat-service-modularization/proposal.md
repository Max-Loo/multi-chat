# Proposal: chatService 模块化重构

## Why

当前 `src/services/chatService.ts` 文件包含 431 行代码，承担了过多职责，违反了单一职责原则。主要问题包括：

1. **可读性问题**：单个文件过长，难以快速理解整体架构和数据流
2. **可维护性问题**：元数据收集逻辑（290-404 行，共 114 行）嵌入在核心流式处理函数中，修改任何一部分都需要理解整个 216 行的 `streamChatCompletion()` 函数
3. **可测试性问题**：虽然测试覆盖率达到 34.5%（1791 行测试代码），但主要依赖集成测试，单元测试难度大
4. **可扩展性问题**：添加新的元数据类型（如 `cost` 成本统计）或新的供应商支持需要修改核心函数，增加出错风险
5. **错误处理问题**：元数据收集失败时仅记录 `console.warn`，错误被静默吞掉，难以调试

通过模块化重构，可以将 431 行的单文件拆分为 6 个职责清晰的模块，每个模块 60-200 行，显著提升代码质量。

## What Changes

### 代码结构重构

- 创建 `src/services/chat/` 目录，包含 6 个新模块：
  - `types.ts` - 集中管理所有类型定义（60 行）
  - `providerFactory.ts` - 供应商 provider 工厂（70 行）
  - `messageTransformer.ts` - 消息格式转换（80 行）
  - `metadataCollector.ts` - 元数据收集器（200 行）⭐ 核心模块
  - `streamProcessor.ts` - 流式处理编排（150 行）
  - `index.ts` - 统一导出和对外 API（80 行）
- 删除 `src/services/chatService.ts`（431 行）
- 更新所有导入路径（6 个文件）

### 错误处理策略改进

- **从保守策略改为降级策略**：元数据收集失败时抛出 `MetadataCollectionError`，但在顶层捕获并提供降级方案
- **严格错误收集**：每个元数据收集函数独立 try-catch，收集时立即记录错误
- **降级方案**：在 `index.ts` 中提供顶层 try-catch，元数据错误时返回基本消息（`raw: null`）
- 详细的错误信息，包含字段名和原始错误，同时记录到 `raw.errors` 数组

### 测试文件同步重构

- 拆分 `src/__test__/services/chatService.test.ts`（1791 行）为 5 个测试文件：
  - `providerFactory.test.ts`（150 行）
  - `messageTransformer.test.ts`（200 行）
  - `metadataCollector.test.ts`（400 行）
  - `streamProcessor.integration.test.ts`（300 行）
  - `index.integration.test.ts`（500 行）
- 更新所有集成测试文件的导入路径

### API 兼容性

- **对外 API 完全兼容**：`streamChatCompletion()` 函数签名保持不变
- **导入路径变更**：从 `@/services/chatService` 改为 `@/services/chat`
- **工具函数导出**：继续导出 `buildMessages()` 和 `getProvider()`，供测试使用

## Capabilities

### Modified Capabilities

- **chat-service**: 聊天服务的内部实现完全重构，但对外 API 保持兼容
  - 改进点：模块化、可测试性、严格错误处理
  - 保持点：函数签名、返回值格式、行为语义

### New Capabilities

无新增功能级能力，仅重构内部实现。

### Changed Capabilities

无变更现有规范级别的需求。

## Impact

### 受影响的代码

**新增文件（11 个）**:
- `src/services/chat/types.ts`
- `src/services/chat/providerFactory.ts`
- `src/services/chat/messageTransformer.ts`
- `src/services/chat/metadataCollector.ts`
- `src/services/chat/streamProcessor.ts`
- `src/services/chat/index.ts`
- `src/__test__/services/chat/providerFactory.test.ts`
- `src/__test__/services/chat/messageTransformer.test.ts`
- `src/__test__/services/chat/metadataCollector.test.ts`
- `src/__test__/services/chat/streamProcessor.integration.test.ts`
- `src/__test__/services/chat/index.integration.test.ts`

**修改文件（5 个）**:
- `src/store/slices/chatSlices.ts` - 更新导入路径
- `src/__test__/integration/chat-flow.integration.test.ts` - 更新导入路径
- `src/__test__/integration/model-config.integration.test.ts` - 更新导入路径
- `src/__test__/integration/settings-change.integration.test.ts` - 更新导入路径
- `src/__test__/store/slices/chatSlices.test.ts` - 更新导入路径

**删除文件（2 个）**:
- `src/services/chatService.ts`
- `src/__test__/services/chatService.test.ts`

### 依赖项

- **无新增依赖**：仅使用现有依赖（Vercel AI SDK、供应商 SDK）
- **无移除依赖**：保持所有现有依赖
- **兼容性**：与 Redux、Tauri 兼容层完全兼容

### 用户体验

- **无直接影响**：用户侧功能和行为完全不变
- **间接正面影响**：
  - 更快的 bug 修复（模块化便于定位问题）
  - 更稳定的服务（严格错误处理）
  - 更容易添加新功能（如成本统计）

### 开发者体验

- **正面影响**：
  - 新开发者更容易理解代码架构（每个模块职责清晰）
  - 修改元数据逻辑更安全（只需修改 `metadataCollector.ts`）
  - 测试编写更容易（每个模块独立测试）
  - 添加新供应商更简单（只需修改 `providerFactory.ts`）
- **短期负面影响**：
  - 需要适应新的导入路径（6 个文件）
  - 需要理解新模块结构

### 技术架构

- **遵循项目规范**：
  - 使用 `@/` 别名导入
  - 使用中文注释
  - TypeScript 严格模式
  - React 19 + Redux Toolkit
- **架构模式**：
  - 单一职责原则（Single Responsibility Principle）
  - 依赖注入（Dependency Injection）
  - 工厂模式（Factory Pattern）
  - 编排者模式（Orchestration Pattern）
- **代码质量**：
  - 平均文件长度：60-200 行（当前 431 行）
  - 测试覆盖率目标：>50%（当前 34.5%）
  - 所有函数添加 JSDoc 注释

## Migration Guide

### 对于 Redux Thunk 调用者

**变更前**：
```typescript
import { streamChatCompletion } from '@/services/chatService';

const response = streamChatCompletion(params, { signal });
```

**变更后**：
```typescript
import { streamChatCompletion } from '@/services/chat';

const response = streamChatCompletion(params, { signal });
```

### 对于测试文件

**变更前**：
```typescript
import { buildMessages, getProvider, streamChatCompletion } from '@/services/chatService';
```

**变更后**：
```typescript
import { buildMessages, getProvider, streamChatCompletion } from '@/services/chat';
```

### 迁移步骤

1. 全局搜索替换 `from '@/services/chatService'` → `from '@/services/chat'`
2. 运行 `pnpm tsc` 检查类型错误
3. 运行 `pnpm test` 确保所有测试通过
4. 手动测试聊天功能验证行为一致

## Rollback Plan

如果重构后出现严重问题，回滚步骤：

1. 删除 `src/services/chat/` 目录
2. 恢复 `src/services/chatService.ts`（从 Git 历史记录）
3. 恢复 `src/__test__/services/chatService.test.ts`
4. 全局搜索替换 `from '@/services/chat'` → `from '@/services/chatService'`
5. 重启应用

预计回滚时间：< 10 分钟

## Success Criteria

- [ ] 所有 6 个新模块创建完成，总计 ~640 行代码
- [ ] 所有 5 个新测试文件创建完成，总计 ~1550 行测试代码
- [ ] 所有现有测试通过（单元测试 + 集成测试）
- [ ] TypeScript 类型检查通过（`pnpm tsc`）
- [ ] Lint 检查通过（`pnpm lint`）
- [ ] 手动测试聊天功能正常（创建聊天、发送消息、多模型对话）
- [ ] 代码覆盖率 >50%（当前 34.5%）
- [ ] 所有函数添加 JSDoc 注释（中文）
- [ ] 所有导入路径使用 `@/` 别名

## Timeline

- **预估工作量**：6-9 小时（取决于测试完整度）
- **关键里程碑**：
  - 阶段 1-4（基础设施 + 核心模块）：4.5 小时
  - 阶段 5-6（流式处理 + 统一 API）：2.5 小时
  - 阶段 7-10（集成 + 验证）：2 小时

详细时间分解见 `tasks.md` 第 375-392 行。
