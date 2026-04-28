## Context

`src/__test__/integration/README.md` 是集成测试的唯一指导文档，当前约 600 行。文档中约 40% 的内容描述了基于 MSW 的 Mock 架构，但项目从未安装 MSW。

实际集成测试使用的 Mock 模式：
- **模块级 Mock**：`vi.mock()` + `vi.hoisted()` 静态替换整个模块
- **部分保留**：`vi.importActual()` 保留模块的其他导出，仅替换目标函数
- **运行时替换**：`vi.mocked(fn).mockResolvedValue()` 在测试用例中动态控制返回值

现有的 9 个集成测试文件（`auto-naming`、`app-loading`、`model-config` 等）全部遵循此模式。

## Goals / Non-Goals

**Goals:**
- 删除所有 MSW 相关内容，消除文档与代码的不一致
- 用实际使用的 `vi.mock` 模式替换测试模板
- 删除对不存在文件的引用
- 保持文档中仍然有效的部分（命名规范、隔离原则、Q&A 等）

**Non-Goals:**
- 不引入 MSW（方向 A：仅更新文档）
- 不重构现有集成测试代码
- 不修改 `src/__test__/README.md`（单元测试文档）
- 不修改 `src/__test__/helpers/integration/` 下的辅助文件

## Decisions

### D1: 直接删除 MSW 段落，而非替换为 MSW 实现

**选择**: 删除所有 MSW 内容，用实际 `vi.mock` 模式替换
**备选**: 引入 MSW 并保留文档
**理由**: 方向 A 已确认。`vi.mock` 模式已在 9 个测试中验证，足够满足当前需求；MSW 增加外部依赖和学习成本，投入产出比不高

### D2: 测试模板从实际测试文件中提取模式

**选择**: 基于 `auto-naming.integration.test.ts` 和 `model-config.integration.test.ts` 提取通用模板
**备选**: 基于抽象原则编写理想化模板
**理由**: 从真实代码提取的模板不会出现"文档与代码不符"的问题

### D3: 保留 Mock Service 层和 Mock 存储层小节

**选择**: 保留但修正代码示例
**理由**: 这两个小节描述的 `vi.mock` 模式与实际代码一致，只需将 `vi.doMock` 示例替换为实际使用的 `vi.mock` + `vi.hoisted` 模式

### D4: Mock 策略表格替换为实际分层

**选择**: 外部 API 行从"MSW Mock HTTP"改为"vi.mock Service 层模块替换"
**理由**: 准确反映当前实现

## Risks / Trade-offs

- **[文档更新后再次过时]** → 集成测试 README 中增加注释，标注"本文档中的代码示例均从实际测试文件提取，修改测试模式时需同步更新此文档"
- **[未来引入 MSW 时需重写]** → 风险可接受，MSW 迁移本身需要较大改动，重写文档是其中一小部分
