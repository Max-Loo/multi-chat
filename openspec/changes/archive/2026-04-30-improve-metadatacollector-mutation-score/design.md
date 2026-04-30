## Context

`services/chat/metadataCollector.ts`（267 行）是流式响应元数据收集模块，包含 9 个函数（4 异步 + 5 同步）、44 个条件表达式中约 16 个关键分支、5 条错误处理路径。模块负责从 AI 模型的流式响应中提取 usage、token、来源、警告等元数据，并进行敏感数据脱敏。已有 19 个测试用例（metadataCollector.test.ts），覆盖了主要路径但部分条件分支的精确断言不足。

## Goals / Non-Goals

**Goals:**
- 将 metadataCollector.ts 加入变异测试覆盖，得分目标 ≥ 80%
- 杀死 `collectRequestMetadata` 三路分支的变异体（undefined → '{}'、string → 直接返回、object → JSON.stringify + 脱敏）
- 杀死 `collectResponseMetadata` 敏感 header 过滤的变异体（authorization/Authorization/x-api-key/X-API-Key 四个 key，含大小写变体）
- 杀死 `collectSources` 的变异体（sourceType === 'url' 过滤、空数组转 undefined）
- 杀死 `collectWarnings` 的变异体（code/type 字段选择、message 拼接逻辑）
- 精确化所有 `??` 默认值的断言（collectUsageMetadata 的 5 个 ?? 运算符）

**Non-Goals:**
- 不修改源码
- 不改变元数据结构或字段名
- 不涉及 streamProcessor.ts（独立模块，Mock 成本高）

## Decisions

**1. 重点攻击 `collectRequestMetadata`**
- 理由：该函数条件最密集（L173-200 包含 3 个 if/else if/else + 4 个敏感字段删除 + 1 个截断判断 + 1 个 try/catch），约 10 个变异目标
- 策略：为每种 body 类型创建精确断言，验证返回的 body 字符串内容（而非仅验证非 undefined）

**2. 重点攻击敏感数据过滤**
- 理由：`collectResponseMetadata` 过滤 4 个敏感 header key，`collectRequestMetadata` 删除 4 个敏感请求体字段。变异测试可能移除某个 key 的过滤 → 安全回归
- 策略：构造包含所有敏感 key 的输入，逐一验证它们被移除，同时验证非敏感 key 保留

**3. 重点攻击 `collectWarnings` 条件分支**
- 理由：L90-93 的嵌套三元表达式有 4 条路径（有 code → warning.code : warning.type；有 message 且为 string → message : 拼接字符串），需要每个路径的精确输入/输出测试
- 策略：构造 4 种 warning 对象（有 code 有 message / 有 code 无 message / 无 code 有 message / 无 code 无 message）

**4. 预估变异体数量约 100-150 个**

## Risks / Trade-offs

- **[StringLiteral 排除]** 已配置 `excludedMutations: ["StringLiteral"]`，敏感 key 的字符串变异不会被检测 → 可接受，因为敏感 key 的正确性应由代码审查保证
- **[collectStreamStats 硬编码返回]** 该函数返回固定默认值，变异测试价值低 → 不重点关注
- **[collectAllMetadata 编排逻辑]** 纯编排函数无分支 → 不需要额外测试
