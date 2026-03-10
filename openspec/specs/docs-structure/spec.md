# 文档结构规范

本文档定义项目的文档结构规范，确保文档的可维护性和可发现性。

## Purpose

建立清晰的文档层次结构，将 AGENTS.md 保留为核心指导文档，同时将详细设计说明和项目约定拆分到专门的子文档中，以提高可维护性和可读性。

## Requirements

### Requirement: AGENTS.md 内容分类规则
AGENTS.md 必须使用内容分类规则来决定信息的保留或迁移，确保文档保持精简（目标 150 行以内）。

#### Scenario: 判断内容是否应保留在 AGENTS.md
- **WHEN** 编写或修改 AGENTS.md 时
- **THEN** 系统应按照以下规则分类：
  - **必要信息**（保留）：项目架构、开发规范、关键约定
  - **可查询信息**（删除，提供文件引用）：Tauri 插件列表、配置项
  - **详细示例**（删除，保留简要说明）：API 使用示例 → 指向源文件
  - **重复内容**（合并）：多处出现的相同说明
  - **过时数据**（删除）：测试覆盖率统计等动态数据
  - **详细设计说明**（移到 docs/design/）：架构设计、流程说明
  - **项目约定**（移到 docs/conventions/）：最佳实践、使用规范

### Requirement: 文档拆分决策树
系统必须提供清晰的决策流程，帮助开发者决定内容应该放置在哪个文档中。

#### Scenario: 使用决策树分类文档内容
- **WHEN** 开发者需要添加新文档内容时
- **THEN** 系统应提供以下决策流程：
  1. 是否为 AGENTS.md 的核心信息？
     - 是 → 保留在 AGENTS.md（项目概述、架构、开发命令、开发规范）
     - 否 → 继续判断
  2. 是否为设计决策或架构说明？
     - 是 → docs/design/
     - 否 → 继续判断
  3. 是否为项目约定或最佳实践？
     - 是 → docs/conventions/
     - 否 → 继续判断
  4. 是否可从代码中直接查询？
     - 是 → 删除，提供文件路径引用
     - 否 → 考虑在代码中添加注释

### Requirement: docs/design/ 目录结构
docs/design/ 目录必须包含架构和设计相关的详细文档，每个文档专注于一个设计主题。

#### Scenario: 创建新的设计文档
- **WHEN** 需要记录架构设计或系统流程时
- **THEN** 开发者应在 docs/design/ 创建文档，使用以下命名规范：
  - 小写字母 + 连字符（kebab-case）
  - 文件名应清晰表达设计主题（如 `initialization.md`）
  - 必须包含：动机、架构图/流程图、关键模块、实现位置

#### Scenario: 设计文档内容完整性
- **WHEN** 创建 docs/design/ 下的文档时
- **THEN** 文档必须包含：
  - 一句话概述（在 AGENTS.md 中引用）
  - 动机或背景
  - 架构或流程说明
  - 关键模块和文件路径
  - 代码示例（如有必要）

### Requirement: docs/conventions/ 目录结构
docs/conventions/ 目录必须包含项目约定和最佳实践文档，指导开发者如何正确使用特定工具或模式。

#### Scenario: 创建新的约定文档
- **WHEN** 需要记录项目约定或使用规范时
- **THEN** 开发者应在 docs/conventions/ 创建文档，使用以下命名规范：
  - 小写字母 + 连字符（kebab-case）
  - 文件名应清晰表达约定主题（如 `timestamps.md`）
  - 必须包含：使用场景、工具函数、代码示例、注意事项

#### Scenario: 约定文档内容完整性
- **WHEN** 创建 docs/conventions/ 下的文档时
- **THEN** 文档必须包含：
  - 一句话概述（在 AGENTS.md 中引用）
  - 约定的使用场景
  - 工具函数或 API
  - 代码示例
  - 常见错误和注意事项

### Requirement: AGENTS.md 行数监控
系统必须建立 AGENTS.md 行数监控机制，确保文档保持精简。

#### Scenario: 检查 AGENTS.md 行数
- **WHEN** 开发者更新 AGENTS.md 后
- **THEN** 系统应检查总行数是否超过 150 行
  - 如果超过 150 行 → 提示考虑拆分到子文档
  - 如果不超过 150 行 → 更新"当前文档状态"中的行数记录

#### Scenario: 文档审查周期
- **WHEN** 每季度进行文档审查时
- **THEN** 开发者应：
  - 检查 AGENTS.md 行数是否在 150 行以内
  - 检查是否有过时或重复内容
  - 检查是否有应迁移到子文档的详细说明

### Requirement: 文档同步要求
当修改代码或文档时，系统必须确保相关文档保持同步。

#### Scenario: 代码修改时的文档同步
- **WHEN** 修改了代码实现时
- **THEN** 开发者应判断：
  - 如果改动影响架构 → 更新 AGENTS.md 或 docs/design/
  - 如果改动影响约定 → 更新 docs/conventions/
  - 如果改动可从代码查询 → 无需更新文档

#### Scenario: 子文档修改时的同步
- **WHEN** 修改了 docs/design/ 或 docs/conventions/ 下的子文档时
- **THEN** 开发者应检查是否需要在 AGENTS.md 中更新索引或概述

### Requirement: docs/README.md 索引
docs/README.md 必须提供完整的文档索引，帮助开发者快速找到所需文档。

#### Scenario: 创建 docs/README.md
- **WHEN** 创建 docs/ 目录结构时
- **THEN** 系统应创建 docs/README.md，包含：
  - docs/ 目录结构说明
  - docs/design/ 下的所有文档索引
  - docs/conventions/ 下的所有文档索引
  - docs/reference/ 下的所有文档索引（如有）
  - 与 AGENTS.md 的关系说明

#### Scenario: 更新 docs/README.md 索引
- **WHEN** 添加新的设计或约定文档时
- **THEN** 开发者必须在 docs/README.md 中添加对应的索引条目
