# Spec: 测试代码清理规范

## Purpose

定义测试代码的清理和维护流程，包括未使用代码的检测、Fixtures 的激活或删除、Mock 实现的整合，确保测试代码库的整洁和可维护性。

## ADDED Requirements

### Requirement: 必须删除未使用的 Mock 实现文件

系统 SHALL 删除 6 个未使用的 Mock 实现文件（`src/__mock__/tauriCompat/*.ts`），或在测试套件中激活使用它们。

**当前未使用的 Mock 文件**：
- `src/__mock__/tauriCompat/http.ts`
- `src/__mock__/tauriCompat/keyring.ts`
- `src/__mock__/tauriCompat/os.ts`
- `src/__mock__/tauriCompat/shell.ts`
- `src/__mock__/tauriCompat/store.ts`

**决策流程**：
1. 检查是否有测试使用了这些 Mock（通过 `knip` 或手动搜索）
2. 如果未使用，删除文件
3. 如果使用了，整合到 `src/__test__/mocks/` 目录（统一管理 Mock）

#### Scenario: 检测 Mock 文件是否被使用
- **WHEN** 清理 Mock 文件前
- **THEN** 开发者 SHALL 运行 `pnpm analyze:unused`
- **AND** 工具 SHALL 报告哪些文件未被导入
- **AND** 开发者 SHALL 手动搜索文件名，确认无引用

#### Scenario: 删除未使用的 Mock 文件
- **WHEN** 确认 Mock 文件未被使用
- **THEN** 开发者 SHALL 删除文件
- **AND** 提交信息 SHALL 格式为 "chore: remove unused mock file <filename>"
- **AND** 删除后运行所有测试，确保没有遗漏的引用

#### Scenario: 整合使用的 Mock 文件
- **WHEN** Mock 文件被测试使用
- **THEN** 开发者 SHALL 将文件移动到 `src/__test__/mocks/` 目录
- **AND** 更新所有导入路径
- **AND** 在 `README.md` 中记录 Mock 的用途和用法

### Requirement: 必须删除或激活未使用的测试 Fixtures

系统 SHALL 删除 4 个未使用的测试 Fixtures（`src/__test__/fixtures/*.ts`），或在现有测试中激活使用它们。

**当前未使用的 Fixtures**：
- `src/__test__/fixtures/index.ts`
- `src/__test__/fixtures/chatPanel.ts`
- `src/__test__/fixtures/modelProvider.ts` (114 行，包含高价值工厂函数)
- `src/__test__/fixtures/models.ts`
- `src/__test__/fixtures/store.ts`

**优先级**：
1. **高价值**：`modelProvider.ts` - 包含完整的工厂函数，应优先激活
2. **中价值**：`models.ts`, `store.ts` - 可能对某些测试有用
3. **低价值**：`index.ts`, `chatPanel.ts` - 评估后决定删除或激活

#### Scenario: 优先激活 modelProvider Fixtures
- **WHEN** 激活未使用的 Fixtures
- **THEN** 开发者 SHALL 优先激活 `modelProvider.ts`
- **AND** 在相关测试中替换手动构造的数据（如 `modelProviderSlice.test.ts`）
- **AND** 验证 Fixture 生成的数据符合预期

#### Scenario: 评估中等价值 Fixtures
- **WHEN** 评估 `models.ts`, `store.ts` 的价值
- **THEN** 开发者 SHALL 搜索是否有测试可以受益于这些 Fixtures
- **AND** 如果有，在测试中激活使用
- **AND** 如果没有，删除文件

#### Scenario: 删除低价值 Fixtures
- **WHEN** Fixture 被评估为低价值（未使用且无潜在用途）
- **THEN** 开发者 SHALL 删除文件
- **AND** 在 `CHANGELOG.md` 中记录删除原因

### Requirement: 必须删除未使用的 Redux Action

系统 SHALL 删除 1 个未使用的 Redux action（`clearSelectChatId`），简化 API。

**当前问题**：
- `src/store/slices/chatSlices.ts:423` 导出了 `clearSelectChatId` action
- `knip` 报告该 action 未被使用
- 可能是重构遗留的代码

#### Scenario: 验证 Action 是否未使用
- **WHEN** 删除 Redux action 前
- **THEN** 开发者 SHALL 全局搜索 `clearSelectChatId`
- **AND** 确认无代码引用（包括生产代码和测试代码）
- **AND** 确认不是公共 API（未在文档中提及）

#### Scenario: 删除未使用的 Action
- **WHEN** 确认 Action 未被使用
- **THEN** 开发者 SHALL 从 slice 文件中删除 action
- **AND** 运行所有测试，确保没有遗漏的引用
- **AND** 提交信息 SHALL 格式为 "refactor: remove unused action clearSelectChatId"

### Requirement: 必须建立定期清理流程

系统 SHALL 建立定期的测试代码清理流程，防止技术债务累积。

**清理频率**：每个迭代结束时
**清理范围**：
- 运行 `pnpm analyze:unused` 检测未使用的代码
- 审查测试中的 TODO 注释，评估是否仍需处理
- 检查是否有可整合的重复代码

#### Scenario: 每个迭代结束运行清理检查
- **WHEN** 每个迭代结束时
- **THEN** 团队 SHALL 运行 `pnpm analyze:unused`
- **AND** 检查报告中的未使用文件和导出
- **AND** 评估哪些可以删除，哪些需要保留

#### Scenario: 测试 TODO 注释审查
- **WHEN** 审查测试中的 TODO 注释
- **THEN** 团队 SHALL 判断 TODO 是否仍有效
- **AND** 如果 TODO 已过时，删除注释并关闭相关 issue
- **AND** 如果 TODO 仍有效，创建任务卡片追踪

**示例**：
```typescript
// ❌ 过时的 TODO
// TODO: 重新实现以使用 MSW 替代 vi.mock
// (如果已完成迁移，删除此注释)

// ✅ 有效的 TODO
// TODO: 重构以使用行为驱动测试 (Issue #123)
// (保留，并确保在任务列表中)
```

#### Scenario: 重复代码整合
- **WHEN** 发现测试中有重复的代码（如相同的 setup 逻辑）
- **THEN** 开发者 SHALL 提取为共享的辅助函数
- **AND** 函数 SHALL 放置在 `src/__test__/utils/` 目录
- **AND** 更新所有测试使用新的辅助函数

### Requirement: 清理操作必须保证测试覆盖率

系统 SHALL 确保清理操作不会降低测试覆盖率，所有删除和重构都必须验证测试通过。

**验证流程**：
1. 清理前记录测试覆盖率基线
2. 执行清理操作
3. 运行 `pnpm test:coverage` 对比覆盖率
4. 如果覆盖率下降，恢复修改或补充测试

#### Scenario: 清理前记录覆盖率基线
- **WHEN** 执行清理操作前
- **THEN** 开发者 SHALL 运行 `pnpm test:coverage`
- **AND** 记录当前覆盖率百分比
- **AND** 如果覆盖率低于目标，先补充测试再进行清理

#### Scenario: 清理后验证覆盖率未下降
- **WHEN** 完成清理操作
- **THEN** 开发者 SHALL 再次运行 `pnpm test:coverage`
- **AND** 对比覆盖率基线，确保未下降
- **AND** 如果下降，评估是否可以接受（如删除了无效测试）

### Requirement: 清理操作必须有清晰的文档记录

系统 SHALL 要求所有清理操作在 `CHANGELOG.md` 或 PR 描述中记录，说明清理的原因和影响。

**记录内容**：
- 清理的文件或导出名称
- 清理原因（未使用、过时、重复等）
- 影响评估（是否有破坏性变更）
- 相关的 issue 或 PR 编号

#### Scenario: PR 描述记录清理操作
- **WHEN** 提交清理相关的 PR
- **THEN** PR 描述 SHALL 包含 "清理" 部分
- **AND** 列出所有删除的文件和导出
- **AND** 说明验证步骤（如 "运行 `pnpm test` 验证无引用"）

**示例**：
```markdown
## 清理

删除未使用的测试代码：
- `src/__mock__/tauriCompat/keyring.ts`: 未被引用
- `src/__test__/fixtures/chatPanel.ts`: 低价值，无潜在用途

验证步骤：
1. 运行 `pnpm analyze:unused` 确认无引用
2. 运行 `pnpm test:run` 确保所有测试通过
3. 运行 `pnpm test:coverage` 确认覆盖率未下降
```

#### Scenario: CHANGELOG 记录重大清理
- **WHEN** 清理操作影响公共 API 或多个模块
- **THEN** `CHANGELOG.md` SHALL 在 "Removed" 部分记录
- **AND** 记录 SHALL 包含迁移指南（如 "如果使用了 X，请改用 Y"）

### Requirement: 必须建立测试代码健康度指标

系统 SHALL 建立测试代码的健康度指标，定期监控和报告。

**健康度指标**：
- **未使用代码比例**：未使用的文件和导出占总数的百分比（目标：< 5%）
- **Fixture 使用率**：使用 Fixtures 的测试占总数的百分比（目标：> 80%）
- **any 类型密度**：测试代码中 `any` 使用次数 per 千行代码（目标：< 10）
- **测试覆盖率**：整体测试覆盖率（目标：> 80%）

#### Scenario: 定期生成健康度报告
- **WHEN** 每个迭代结束时
- **THEN** 团队 SHALL 运行 `pnpm test:health` (自定义脚本)
- **AND** 脚本 SHALL 输出健康度报告，包含所有指标
- **AND** 报告 SHALL 标识低于目标的指标

#### Scenario: 健康度指标纳入团队目标
- **WHEN** 设定团队 OKR 或季度目标
- **THEN** 测试代码健康度 SHALL 作为技术指标纳入目标
- **AND** 团队 SHALL 定义改进计划（如 "将 any 类型密度从 25 降到 10"）
