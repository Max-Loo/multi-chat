## Purpose

定义 `src/__test__/README.md` 测试文档的结构和内容标准，确保文档保持精简、准确且与代码库一致。

## Requirements

### Requirement: README 总行数控制在 800 行以内

`src/__test__/README.md` 的总行数 SHALL 不超过 800 行。

#### Scenario: 精简后行数验证
- **WHEN** 完成所有精简操作
- **THEN** `wc -l src/__test__/README.md` 返回值不超过 800

### Requirement: 测试原则不重复阐述

README 中关于"测试行为而非实现细节"的原则 SHALL 只在一个章节中出现，不得在多个章节重复阐述同一原则。

#### Scenario: 原则只出现一次
- **WHEN** 搜索 README 中包含"测试行为"或"Mock 系统边界"的内容
- **THEN** 这些核心原则仅在「测试原则」章节中出现，不散布在其他章节

### Requirement: AI SDK Mock API 文档在代码注释中提供

AI SDK Mock 工厂函数（`createMockStreamResult`、`createMockAIProvider` 等）的参数说明和返回值文档 SHALL 通过 JSDoc 代码注释提供，README 仅保留导入示例和基本用法。

#### Scenario: aiSdk.ts 导出函数具有完整 JSDoc
- **WHEN** 查看 `src/__test__/helpers/mocks/aiSdk.ts` 中导出函数的 JSDoc
- **THEN** 每个导出函数都有 `@param`、`@returns` 和使用示例

#### Scenario: README 中 AI SDK 章节不包含函数参数列表
- **WHEN** 查看 README 的 AI SDK Mock 章节
- **THEN** 不包含 `createMockStreamResult`、`createMockStreamResultWithMetadata` 等函数的逐参数说明

### Requirement: 删除引用不存在的 MSW 基础设施的章节

README 中 `src/__test__/msw/` 目录和 `msw` 依赖均不存在，README SHALL 不包含引用这些不存在文件路径的 MSW 章节，也不得在其他章节中散落引用 MSW。

#### Scenario: MSW 章节已删除
- **WHEN** 搜索 README 中 "Mock Service Worker" 或 `src/__test__/msw/` 或 `msw/handlers`
- **THEN** 未找到匹配内容

#### Scenario: 散落的 MSW 引用已清理
- **WHEN** 搜索 README 中 "使用 MSW" 或 "MSW 请求"
- **THEN** 未找到匹配内容

### Requirement: 删除已完成的历史迁移说明

README SHALL 不包含已完成的"测试目录结构重组说明"章节。

#### Scenario: 历史迁移说明已移除
- **WHEN** 搜索 README 中"测试目录结构重组说明"或"从"按文件结构组织"改为"关键词
- **THEN** 未找到匹配内容

### Requirement: 删除不适用的通用建议

README SHALL 不包含后端专属建议（内存数据库、HTTP 录制工具）或无关的通用性内容。

#### Scenario: 后端建议已移除
- **WHEN** 搜索 README 中"内存数据库"或"MongoDB Memory Server"或"Nock"或"VCR"
- **THEN** 未找到匹配内容

### Requirement: 目录结构树反映实际布局

README 的目录结构树 SHALL 与 `src/__test__/` 下的实际文件和目录一致。

#### Scenario: 目录树中的目录实际存在
- **WHEN** 逐项检查 README 目录结构树中列出的路径
- **THEN** 每个路径在文件系统中实际存在
