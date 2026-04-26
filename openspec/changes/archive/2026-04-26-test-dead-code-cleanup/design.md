## Context

测试辅助代码库经过多轮迭代后，部分早期设计的模块和函数已不再被任何测试消费，但仍然通过 barrel 导出链和 setup 注册流程保留在系统中。这些死代码的来源主要有两类：

1. **历史遗留**：工厂函数（如 `createTauriMocks`）在之前的清理中已删除，但配套的类型接口被遗漏
2. **过度设计**：性能测试工具（`performance.ts`）和自定义断言（`assertions/`）在 spec 阶段被规划实现，但测试用例从未实际使用

当前状态：
- 159 个测试文件，1793 个测试用例全部通过
- 死代码分布在 `helpers/isolation/`、`helpers/mocks/`、`helpers/assertions/`、`fixtures/` 四个目录
- 死代码通过三级 barrel 导出链暴露，但实际上零消费

## Goals / Non-Goals

**Goals:**

- 删除所有经 grep 验证确认无运行时消费者的测试辅助代码
- 同步清理 barrel 导出链和 setup 注册流程中的对应引用
- 更新 README.md 文档，移除对已删除功能的描述
- 保持所有 1793 个测试用例继续通过

**Non-Goals:**

- 不重构现有测试的导入路径或 mock 模式
- 不新增任何测试用例或辅助函数
- 不处理中低优先级的其他测试问题（`any` 类型、硬编码延时、缺少隔离的测试文件）
- 不修改 Vitest 配置或覆盖率阈值

## Decisions

### D1: 整文件删除 vs 函数级删除

**决策**：对整体无消费者的文件（`performance.ts`、`types.ts`、`assertions/` 目录）执行整文件删除；对混合文件的未使用函数（`fixtures/chat.ts`、`fixtures/router.ts`）执行函数级删除。

**理由**：`fixtures/chat.ts` 中有 3 个活跃使用的函数（`createMockMessage`、`createUserMessage`、`createAssistantMessage`），不能整文件删除。`fixtures/router.ts` 同理有 2 个活跃函数。

### D2: barrel 清理策略

**决策**：删除整文件后，从 barrel 中移除对应的 `export * from` 行；删除部分函数后，barrel 的 `export *` 会自动只暴露剩余函数，无需修改。

**理由**：TypeScript 的 `export *` 是动态的，源文件删减导出后 barrel 会自动同步。

### D3: 自定义断言的清理范围

**决策**：删除整个 `helpers/assertions/` 目录（4 个文件），同时从 `cleanup.ts` 中移除 `setupCustomAssertions()` 调用和 import，并从 `helpers/index.ts` 中移除对 `assertions` 的 re-export。

**理由**：3 个自定义 matcher（`toBeEncrypted`、`toBeValidMasterKey`、`toHaveBeenCalledWithService`）全部零消费者。`cleanup.ts` 中的 `setupCustomAssertions()` 在每次 afterEach 周期都会执行注册，是纯浪费。如果要重新引入自定义断言，可以在需要时再从 spec 重新生成。

### D4: README 文档同步

**决策**：移除 README.md 中 `## 性能测试工具` 和 `## 自定义断言` 两个章节，以及快速开始中对 `assertions` 的引用。

**理由**：这些章节描述的功能已不存在，保留会误导开发者。

## Risks / Trade-offs

**[低风险] 未来可能需要这些函数** → 这些函数已经存在数月没有任何消费者使用，属于 YAGNI 范畴。如果未来需要类似功能，可以从 git 历史中恢复或重新实现。

**[低风险] barrel 导出链断裂** → 所有被删除的导出均经过全项目 grep 验证为零消费者，不存在导入断裂的可能性。

**[无风险] 测试回归** → 纯删除操作不修改任何测试逻辑，`pnpm test:run` 即可验证无回归。
