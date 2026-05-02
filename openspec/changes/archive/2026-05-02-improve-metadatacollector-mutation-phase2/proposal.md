## Why

metadataCollector.ts 变异测试得分 84.52%（报告显示 12 Survived + 1 NoCoverage，共 84 个可测变异体）。

12 个存活变异体的实际分布（经二次校验确认）：

**敏感字段删除条件（4 个，均为 `if(true)` 变异体）**：
- ID:94 L189 `if(parsedBody.apiKey)` → `if(true)`
- ID:96 L190 `if(parsedBody.api_key)` → `if(true)`
- ID:98 L191 `if(parsedBody.authorization)` → `if(true)`
- ID:100 L192 `if(parsedBody.Authorization)` → `if(true)`

这些变异体存活的原因是：现有测试传入的敏感字段值都是 truthy（如 `'secret-key'`），原始代码 `if(field) delete` 和变异体 `if(true) delete` 行为完全一致。要杀死它们需要传入 falsy 值（如 `apiKey: ''`），使原始代码不删除而变异体删除，产生可观测差异。

**requestBody 安全检查（6 个，其中 3 个为等价变异体）**：
- ID:83 L182 整体条件 → `false`：可杀死（body='undefined' 触发）
- ID:84 L182 `||` → `&&`：可杀死（body='undefined' 触发）
- ID:88 L182 `==='undefined'` → `false`：可杀死（body='undefined' 触发）
- ID:72 L173 `body===undefined` → `false`：**等价变异体**（L182 安全网兜底，结果一致）
- ID:74 L173-174 块体清空：**等价变异体**（L182 安全网兜底）
- ID:85 L182 `typeof!=='string'` → `false`：**等价变异体**（所有分支均产出 string，该子条件永远为 false）

**warning message 提取（2 个）**：
- ID:28 L91 `&&` → `||`：可杀死（message=123 时原始走 fallback，变异体走 message）
- ID:30 L91 `typeof==='string'` → `true`：可杀死（同上）

另有 1 个 NoCoverage：
- ID:91 L182-184 块体 → `{}`：需增加覆盖

**等价变异体说明**：ID:72、74、85 因 L182 安全网的存在，与原始代码行为完全一致，任何测试都无法杀死。要消除它们需要修改源码移除冗余安全网（L172-179 已保证 requestBody 为 string，L181-184 的检查实际上是冗余的）。本方案选择不修改源码，将这 3 个标记为已知等价变异体。

## What Changes

- 敏感字段删除条件（杀 4 个）：传入 falsy 值的敏感字段（`apiKey: ''`、`api_key: 0` 等），验证它们不被删除（原始行为），而变异体 `if(true)` 会删除它们
- requestBody 安全检查（杀 3 个）：测试 body 为字符串 `'undefined'`，验证被重置为 `'{}'`
- requestBody NoCoverage（覆盖 1 个）：测试非 string 类型的 body 触发 L182 安全网
- warning message 提取（杀 2 个）：测试 warning 的 message 为非 string 类型（如数字 123），验证走 fallback 路径
- 等价变异体（3 个）：ID:72、74、85 标记为已知等价变异体，不做处理

## Capabilities

### New Capabilities

- `metadatacollector-mutation-phase2`: metadataCollector.ts 第二轮变异测试提升，目标从 84.52% → ≥91%

### Modified Capabilities

（无）

## Impact

- **测试文件**: `src/__test__/services/chat/metadataCollector.test.ts` — 新增约 6-8 个测试用例
- **源代码**: 无改动（3 个等价变异体作为已知限制保留）
- **构建时间**: 变异测试运行时间预计增加约 30 秒
- **CI/CD**: 无影响

## 已知限制

- 3 个等价变异体（ID:72、74、85）无法通过测试杀死，因 L182 安全网与 L173-179 的分支逻辑形成冗余保护。若需达到更高变异得分，需修改源码移除 L181-184 的安全检查。
