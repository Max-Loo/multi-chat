## Purpose

变异测试审计（Mutation Testing Audit）能力：通过在源码中引入预定义的变异并运行测试套件，评估测试套件对代码缺陷的捕获能力，生成包含盲区分析和改进建议的综合报告。

## Requirements

### Requirement: 变异测试执行流程

系统 SHALL 按照预定义的变异列表逐一执行变异测试，每次只修改一个源码文件中的一个变异点，运行完整测试套件后记录结果，再还原代码。

#### Scenario: 单个变异的完整执行周期
- **WHEN** 对源码文件 A 引入变异 M01
- **THEN** 系统 SHALL 运行 `pnpm test:all --no-cache`
- **THEN** 系统 SHALL 记录测试结果（通过/失败、失败的测试文件和用例名）
- **THEN** 系统 SHALL 执行 `git checkout -- <file>` 还原源码文件 A
- **THEN** 系统 SHALL 验证 `git status` 确认还原成功

#### Scenario: 变异执行顺序
- **WHEN** 开始变异测试流程
- **THEN** 系统 SHALL 按照 M01 → M12 的顺序串行执行
- **THEN** 每次执行 SHALL 等待前一个变异完全还原后再开始下一个

### Requirement: 变异点定义

系统 SHALL 在以下 8 个模块中预定义 12 个变异点，每个变异点 SHALL 包含：目标文件路径、具体修改内容、变异类型分类、预期捕获信心等级。

#### Scenario: 预定义变异列表完整性
- **WHEN** 变异测试开始
- **THEN** 系统 SHALL 包含恰好 12 个预定义变异（M01-M12）
- **THEN** 变异 SHALL 覆盖以下模块：utils.ts、crypto.ts、chatSlices.ts、useDebounce.ts、messageTransformer.ts、storeUtils.ts、initSteps.ts、i18n.ts
- **THEN** 变异 SHALL 包含以下类型：边界条件变异、条件逻辑变异、缺失守卫变异、React 模式变异、枚举值变异、比较/匹配变异

#### Scenario: 变异分类信心等级
- **WHEN** 查看变异列表
- **THEN** 系统 SHALL 包含 4 个高信心变异（预期被测试捕获）
- **THEN** 系统 SHALL 包含 3 个中信心变异（可能被测试捕获）
- **THEN** 系统 SHALL 包含 5 个低信心变异（预期测试盲区）

### Requirement: 测试结果记录

系统 SHALL 对每个变异记录详细的测试执行结果，包括是否被捕获、失败的具体测试文件和用例、以及与变异的相关性分析。

#### Scenario: 变异被捕获（杀死）
- **WHEN** 变异 M01 引入后运行测试
- **THEN** 如果任何测试用例失败，系统 SHALL 记录该变异为「已被杀死」
- **THEN** 系统 SHALL 记录所有失败的测试文件路径和用例名称
- **THEN** 系统 SHALL 分析失败测试与变异点的相关性（直接相关 / 间接相关 / 偶然捕获）

#### Scenario: 变异未被捕获（存活）
- **WHEN** 变异 M01 引入后运行测试
- **THEN** 如果所有测试用例通过，系统 SHALL 记录该变异为「存活」
- **THEN** 系统 SHALL 标记该变异对应的测试盲区

### Requirement: 变异测试报告生成

系统 SHALL 在所有变异执行完成后生成一份 Markdown 格式的综合报告，包含概览统计、逐变异详情、盲区分析和改进建议。

#### Scenario: 报告概览统计
- **WHEN** 报告生成
- **THEN** 报告 SHALL 包含：总变异数、被杀死数、存活数、杀死率（百分比）
- **THEN** 报告 SHALL 按信心等级分组统计杀死率

#### Scenario: 报告逐变异详情
- **WHEN** 报告生成
- **THEN** 每个变异 SHALL 包含：变异编号、目标模块、变异内容描述、预期信心、实际结果（杀死/存活）、失败的测试列表、相关性分析

#### Scenario: 盲区分析
- **WHEN** 报告生成
- **THEN** 报告 SHALL 列出所有存活的变异
- **THEN** 对每个存活变异 SHALL 提供测试盲区原因分析
- **THEN** 对每个盲区 SHALL 提供具体的测试改进建议（建议新增的测试用例或断言）

### Requirement: 代码还原验证

系统 SHALL 确保所有变异在流程结束后完全还原，不留下任何代码变更。

#### Scenario: 全部还原后的状态验证
- **WHEN** 所有 12 个变异执行完毕
- **THEN** `git status` SHALL 显示无任何未提交的变更（或仅包含 openspec 相关的新增文件）
- **THEN** `git diff` SHALL 显示为空（针对源码文件）

#### Scenario: 单个变异还原失败处理
- **WHEN** 某个变异的 `git checkout` 执行失败
- **THEN** 系统 SHALL 立即报告错误并暂停后续变异
- **THEN** 系统 SHALL 提示用户手动检查并还原
