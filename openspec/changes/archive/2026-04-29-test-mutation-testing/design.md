## Context

变更 1（清理伪测试）和变更 2（补强分支覆盖）提升了测试的广度，但无法量化验证测试的有效性——是否存在"代码被执行了但断言没有检查到关键变化"的情况。

突变测试通过自动注入代码变异来检验测试套件的真实缺陷发现能力，是验证变更 1、2 成果的终极手段。

## Goals / Non-Goals

**Goals:**

- 引入 Stryker 突变测试基础设施
- 在核心业务模块试点运行突变测试
- 输出突变测试报告，识别测试盲区
- 为后续持续使用提供配置和脚本

**Non-Goals:**

- 不要求全项目突变测试——成本太高
- 不在 CI 中设置严格的突变率门槛（仅报告）
- 不改变现有测试框架（继续使用 Vitest）
- 不在本次变更中修复发现的测试盲区（单独跟进）

## Decisions

### 决策 1：选择 Stryker

**选型结论**：使用 Stryker + `@stryker-mutator/vitest-runner`。

**对比分析**：

| 方案 | Vitest 支持 | 维护状态 | 适用场景 |
|------|------------|---------|---------|
| Stryker + vitest-runner | v4 支持（v7.0+） | 活跃维护（2026-04 最新发布） | 标准 Node 模式测试 |
| AI Agent 手动突变 | 任意 | 无工具依赖 | Vitest browser mode（Stryker 不支持） |
| vitest-mutation-testing | 不存在 | N/A | — |

本项目使用 `happy-dom` 环境（非 browser mode），Stryker 的 vitest-runner 完全适用。

**安装包**：
- `@stryker-mutator/core` — 核心引擎
- `@stryker-mutator/vitest-runner` — Vitest 运行器

### 决策 2：试点范围

先在核心业务模块试点，控制运行时间：

```
试点文件（预估突变数量可控）：
├── src/services/chat/index.ts          ← 聊天服务核心
├── src/services/chat/providerLoader.ts ← 供应商加载
├── src/store/slices/chatSlices.ts      ← 聊天状态管理
└── src/utils/crypto.ts                 ← 加密工具
```

不包含：
- 组件文件（突变测试对 UI 组件意义有限）
- 类型定义文件（无行为可突变）
- 大型服务文件（modelRemoteService 300+ 行，突变数量爆炸）

### 决策 3：配置策略

```json
{
  "testRunner": "vitest",
  "vitest": {
    "configFile": "vite.config.ts",
    "related": true
  },
  "mutate": [
    "src/services/chat/index.ts",
    "src/services/chat/providerLoader.ts",
    "src/store/slices/chatSlices.ts",
    "src/utils/crypto.ts"
  ],
  "reporters": ["html", "clear-text", "progress"],
  "thresholds": {
    "high": 80,
    "low": 60
  },
  "concurrency": 2,
  "timeoutMS": 15000,
  "mutator": {
    "excludedMutations": ["StringLiteral"]
  }
}
```

**关键配置决策**：

- `related: true`：只运行与变异文件相关的测试，大幅减少运行时间
- `concurrency: 2`：与 vitest 配置的 `maxForks: 2` 保持一致
- `excludedMutations: ["StringLiteral"]`：排除字符串字面量突变（对中文消息等无意义）
- `thresholds`：高 80 / 低 60，不设 `break` 门槛（不阻断 CI）

### 决策 4：脚本命名

在 `package.json` 中添加：

```json
{
  "test:mutation": "stryker run",
  "test:mutation:core": "stryker run --mutate 'src/services/chat/**/*.ts' 'src/store/slices/chatSlices.ts'"
}
```

## Risks / Trade-offs

- **运行时间长** → 突变测试对每个变异逐一运行测试套件，4 个文件可能产生 200+ 突变，运行 5-15 分钟 → 使用 `related: true` 限制测试范围，仅作为手动触发的质量检查
- **等效突变噪音** → 某些变异不改变行为（如 `a < b` → `a <= b` 在特定场景），产生误报 → `excludedMutations` 减少无效变异，人工审查存活变异
- **Vitest 配置冲突** → Stryker 会覆盖部分 Vitest 配置（强制 `singleThread: true`、禁用 coverage）→ 已确认 Stryker vitest-runner 正确处理这些覆盖
- **试点结果可能暴露大量问题** → 这是期望结果，但修复工作量大 → 单独跟进，不在本次变更中修复
