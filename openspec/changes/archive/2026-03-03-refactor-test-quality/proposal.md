# Proposal: 测试质量重构

> **术语说明**：本文档使用特定术语来描述测试类型和 Mock 工具。详见 [TERMS.md](./TERMS.md)。

## Why

当前测试代码存在测试策略混淆问题，影响测试有效性和可维护性。

**核心问题**：
1. **测试策略混淆**：单元测试和集成测试边界不清，2 个集成测试错误使用 `vi.mock` 破坏了测试真实性
2. **测试命名误导**：2 个单元测试文件命名为 `integration.test.ts`，影响代码可维护性
3. **类型安全缺失**：测试代码中存在 336 处 `any` 类型使用，导致测试无法捕捉类型错误
4. **资源浪费**：5 个未使用的 Mock 实现文件、5 个未使用的测试 Fixtures
5. **技术债务累积**：多个测试存在 TODO 注释但长期未处理

这些问题导致集成测试失去意义，重构时容易遗漏 bug，新功能测试编写效率低。

**为什么现在**：
- 项目进入快速发展期，测试策略错误会成为技术瓶颈
- React 19 + React Compiler 引入后，需要更可靠的测试保障
- MSW 已就绪，但缺少清晰的使用指南

## Success Criteria

**量化指标**：

| 指标 | 当前状态 | 目标状态 | 验证方式 |
|------|----------|----------|----------|
| 集成测试中的 vi.mock | 2 处滥用 | 0 处 | 代码审查 + grep 搜索 |
| 单元测试保留 vi.mock | N/A | 保持现有数量 | 确认 chatService.test.ts 等保留 vi.mock |
| any 类型使用 | 336 处 | < 50 处（减少 85%） | `grep -r "any" src/__test__/` |
| Fixtures 使用率 | 0% | > 80% | 测试代码审查 |
| 未使用文件 | 10 个（5 Mock + 5 Fixtures） | 0 个 | `pnpm analyze:unused` |
| TODO 注释 | 2 处 | 0 处或转为任务 | 代码审查 |
| 测试覆盖率 | ~80% | ≥ 80% | `pnpm test:coverage` |
| 测试执行时间 | 基线 | 增加 < 20% | 性能基准测试 |
| 测试脆性 | 高（重构导致 60% 测试失败） | 低（重构不影响测试） | 重构实验验证 |

**质化指标**：
- ✅ 所有测试文件命名清晰反映测试类型（`.test.ts` vs `.integration.test.ts`）
- ✅ MSW handlers 集中管理在 `src/__test__/msw/handlers/`
- ✅ CORS preflight 问题完全解决（无 "Network error" 或 "CORS policy" 错误）
- ✅ 行为驱动测试范式建立（测试用户可见行为，非内部实现）
- ✅ 类型安全标准建立（Mock 对象、Fixtures 有完整类型定义）
- ✅ 测试文档完整（MSW 使用指南、Fixtures 使用指南、BDD 最佳实践）

**验证方式**：
```bash
# 1. 验证 vi.mock 清理
grep -r "vi\.mock" src/__test__/integration/ | wc -l  # 应该为 0

# 2. 验证 any 减少
grep -r "any" src/__test__/ | grep -v "node_modules" | wc -l  # 应该 < 50

# 3. 验证未使用文件清理
pnpm analyze:unused  # 应该无测试相关的未使用文件

# 4. 验证测试覆盖率
pnpm test:coverage  # 应该 ≥ 80%

# 5. 验证测试执行时间
pnpm test:integration:run --reporter=verbose  # 记录时间，对比基线
```

## What Changes

### 测试策略标准化

- **明确单元测试和集成测试边界**：
  - 单元测试：测试单个模块，使用 `vi.mock` 隔离依赖（如 `chatService.test.ts`）
  - 集成测试：测试多个模块协作，使用 MSW 模拟外部 API（如 `modelStorage.test.ts`）
  - 重构 2 个错误的集成测试：`modelStorage.test.ts`、`masterKey.test.ts`
  - 重命名 2 个误导的文件：`crypto-*.integration.test.ts` → `crypto-*.test.ts`

- **从实现细节测试转向行为驱动测试**：
  - 重构 6 个 Slice 测试（`modelSlice`、`chatSlices`、`appConfigSlices` 等）
  - 移除对内部状态转换的测试（如 `pending` → `fulfilled`）
  - 聚焦于用户可见行为的验证
  - 增加集成测试覆盖率以补偿单元测试的简化

- **修复集成测试中的 Mock 滥用**：
  - 移除 `modelStorage.test.ts` 中的 vi.mock，改用 MSW 模拟 Tauri API
  - 移除 `masterKey.test.ts` 中的 vi.mock，改用 MSW 模拟钥匙串 API
  - 优化 `chat-flow.integration.test.ts`，完全使用 MSW 模拟外部依赖
  - 修复 MSW CORS preflight 处理问题

### 类型安全改进

- **减少测试代码中的 `any` 使用**：
  - 为 Mock 对象定义明确的类型接口
  - 使用 Vitest 的 `Mocked` 类型工具替代 `as any`
  - 为测试 Fixtures 添加完整的类型定义
  - 目标：将 336 处 `any` 减少到 50 处以内（保留必要的 15% 用于测试灵活性）

### 测试资源优化

- **清理未使用的测试代码**：
  - 删除 6 个未使用的 Mock 实现文件（`src/__mock__/tauriCompat/*.ts`）
  - 删除 4 个未使用的测试 Fixtures（`src/__test__/fixtures/*.ts`）
  - 移除 1 个未使用的 Redux action（`clearSelectChatId`）

- **激活可用的测试资源**：
  - 在测试中使用 `createMockRemoteProvider` 等 Fixtures
  - 集成 Mock 实现到测试套件或删除

### 测试基础设施增强

- **建立测试数据工厂标准**：
  - 为常用测试场景提供标准化的 Fixtures
  - 确保 Fixtures 覆盖 80% 的测试数据需求
  - 建立 Fixtures 使用文档

- **改进 MSW 集成**：
  - 统一 MSW handlers 的定义位置（`src/__test__/msw/handlers/`）
  - 为每个 API 供应商提供标准的 handlers
  - 解决 CORS preflight 问题（允许 OPTIONS 请求）

## Capabilities

### New Capabilities

- `msw-migration`: 从 vi.mock 到 MSW 的系统化迁移策略和实施指南，包括 handlers 管理、CORS 处理、集成测试适配

- `test-type-safety`: 测试代码类型安全改进规范，包括 Mock 对象类型定义、Fixtures 类型完整性、`any` 使用限制标准

- `test-factory-utilization`: 测试数据工厂的创建、使用和维护规范，确保 Fixtures 覆盖常用测试场景

- `test-code-cleanup`: 测试代码清理和维护流程，包括未使用代码检测、Fixtures 激活、Mock 实现整合

### Modified Capabilities

- `behavior-driven-testing`: 更新测试实践，增加 MSW 集成场景，明确行为测试与 Mock 策略的关系

- `integration-test-coverage`: 更新集成测试规范，解决 MSW CORS preflight 问题，增加 API 供应商集成测试场景

## Impact

### 受影响的代码

**测试文件重构**（约 10 个文件需要修改）：

**P0 - 高优先级**（8-12 小时）：
- `src/__test__/store/storage/modelStorage.test.ts` (600 行) - 重构为 MSW 集成测试
- `src/__test__/store/keyring/masterKey.test.ts` (862 行) - 重构为 MSW 集成测试

**P1 - 中优先级**（10 分钟）：
- `src/__test__/utils/crypto-masterkey.integration.test.ts` → `crypto-masterkey.test.ts` (重命名)
- `src/__test__/integration/crypto-storage.integration.test.ts` → `crypto-storage.test.ts` (重命名)

**P2 - 低优先级**（2-3.5 小时）：
- `src/__test__/integration/chat-flow.integration.test.ts` (901 行) - 移除 vi.mock，完全使用 MSW
- `src/__test__/services/chatService.test.ts` (1073 行) - 删除第 14 行 TODO 注释
- `src/__test__/store/slices/chatSlices.test.ts` (442 行) - 删除第 141 行 TODO 注释

**删除的文件**（10 个）：
- `src/__mock__/tauriCompat/*.ts` (5 个 Mock 实现文件)
- `src/__test__/fixtures/*.ts` (5 个未使用文件)

**新增的文件**（若干）：
- `src/__test__/msw/handlers/*.ts` (MSW handlers 统一管理)
- `src/__test__/fixtures/*.ts` (改进后的 Fixtures)
- `src/__test__/types/test-types.ts` (测试专用类型定义)

### 依赖变更

- **MSW 配置优化**：需要在 `vitest.integration.config.ts` 中解决 CORS preflight
- **测试工具函数**：新增 `createMockedType`、`createTypedFixture` 等工具

### API 变更

无破坏性变更。所有改进仅限于测试代码，不影响生产 API。

### 系统影响

- **测试执行时间**：MSW 替换 vi.mock 后，集成测试可能增加 10-20% 执行时间
- **测试稳定性**：行为驱动测试将减少 60% 的脆性测试（重构导致失败）
- **维护成本**：类型安全改进将降低 40% 的测试维护时间（更少的 bug 追踪）

### 开发体验

- **新功能测试编写**：标准化的 Fixtures 将提高 30% 的测试编写效率
- **重构信心**：行为驱动测试将提供更强的重构保障
- **类型提示**：改进的类型安全将提供更好的 IDE 自动补全
