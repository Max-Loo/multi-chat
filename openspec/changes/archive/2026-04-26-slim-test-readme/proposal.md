## Why

`src/__test__/README.md` 达到 2085 行，严重超出项目文档精简规范（AGENTS.md 要求 150 行以内）。同一条测试原则（"测试行为而非实现"）在四个章节中重复阐述，AI SDK Mock 函数的 API 文档占 385 行却更适合放在代码注释中，已完成的历史迁移说明和不适用的后端建议仍然保留。

## What Changes

- 合并四个重复章节（"行为驱动测试原则"、"Before/After 对比示例"、"常见反模式和解决方案"、"测试最佳实践"）为一个精简的「测试原则」章节
- 将 AI SDK Mock API 文档（`createMockStreamResult` 等函数的参数说明）从 README 迁移到 `helpers/mocks/aiSdk.ts` 的代码注释中，README 仅保留导入示例和链接
- 删除已完成的历史迁移说明（"测试目录结构重组说明"）
- 删除不适用的通用建议（内存数据库、HTTP 录制工具、"终极检验标准"）
- 精简 Mock 注释规范为简短规则 + 一个示例
- 精简常见问题排查指南为问题摘要 + 解决方向
- 删除 MSW 章节（引用的 `src/__test__/msw/` 目录和 `msw` 依赖均不存在于项目中）并清理散落在其他章节的 MSW 引用
- 更新目录结构树以反映实际文件布局

## Capabilities

### New Capabilities

- `test-doc-structure`: 测试文档的精简结构规范，定义 README 应包含哪些章节、哪些内容应放在代码注释或独立文档中

### Modified Capabilities

（无既有 spec 需要修改）

## Impact

- 仅影响文档文件 `src/__test__/README.md` 和 `src/__test__/helpers/mocks/aiSdk.ts`
- 不影响任何测试代码或运行时行为
- 所有测试继续通过，无需修改
