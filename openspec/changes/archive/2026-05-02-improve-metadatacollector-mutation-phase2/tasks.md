## Tasks

- [x] ### Task 1: 敏感字段 falsy 值测试（杀 4 个变异体：ID:94,96,98,100）

  - **文件**: `src/__test__/services/chat/metadataCollector.test.ts`
  - **目标**: L189-192 的 4 个 `if(parsedBody.field) delete` 条件被变异为 `if(true)` 后存活
  - **原理**: 传入 falsy 值的敏感字段时，原始代码条件为 false 不删除，变异体 `if(true)` 会删除，产生可观测差异
  - **操作**: 新增 `describe('collectRequestMetadata - 敏感字段 falsy 值处理')`
    - 测试 1: 传入 `{ apiKey: '', api_key: 0, authorization: false, Authorization: null, model: 'gpt-4' }`，验证 falsy 敏感字段**保留**（原始行为），非敏感字段保留
    - 测试 2: 传入 `{ apiKey: '', model: 'gpt-4' }`（单一 falsy 敏感字段），验证 `'apiKey' in parsedBody` 为 true，值为 `''`
    - 测试 3: 传入 truthy + falsy 混合 `{ apiKey: 'secret', api_key: '', model: 'gpt-4' }`，验证 truthy 的 apiKey 被删除，falsy 的 api_key 保留
  - **验证**: 4 个 delete 条件变异体（ID:94,96,98,100）从 Survived → Killed

- [x] ### Task 2: requestBody 安全检查测试（杀 3 个变异体 + 覆盖 1 个 NoCoverage：ID:83,84,88,91）

  - **文件**: `src/__test__/services/chat/metadataCollector.test.ts`
  - **目标**: L182 安全检查的 3 个存活变异体 + 1 个 NoCoverage
  - **原理**: body 为字符串 `'undefined'` 时，经过 L175 分支赋值后触发 L182 的 `requestBody === 'undefined'` 重置
  - **操作**: 新增测试
    - 测试 1: 传入 `body: 'undefined'`（字符串），验证结果为 `'{}'`（被 L182 安全网重置）
    - 测试 2: 传入 `body: { some: 'object' }`（object 类型，触发 L178 JSON.stringify 后进入 L182 检查），验证正确序列化且 L182 安全网未误触发
  - **验证**: ID:83（整体条件→false）、ID:84（||→&&）、ID:88（==='undefined'→false）从 Survived → Killed；ID:91 从 NoCoverage → Covered/Killed

- [x] ### Task 3: warning message 非字符串测试（杀 2 个变异体：ID:28,30）

  - **文件**: `src/__test__/services/chat/metadataCollector.test.ts`
  - **目标**: L91 `'message' in warning && typeof warning.message === 'string'` 的 2 个存活变异体
  - **原理**: 当 message 为非 string（如数字 123）时，原始代码走 fallback，变异体走 message 字段
  - **操作**: 新增测试
    - 测试 1: 传入 `{ code: 'rate_limit', message: 123 }`，验证 message 不等于 123（走了 fallback 拼接路径）
    - 测试 2: 传入 `{ type: 'test', feature: 'feat', message: null }`，验证 message 走 fallback 而非使用 null 值
  - **验证**: ID:28（&&→||）、ID:30（typeof==='string'→true）从 Survived → Killed

- [x] ### Task 4: 运行测试验证

  - **操作**:
    1. `pnpm test` — 确认所有测试通过
    2. `pnpm test:mutation` — 验证变异得分
  - **验证**: metadataCollector.ts 变异得分 ≥91%（杀死 9 个 + 覆盖 1 个 NoCoverage = 剩余 3 个等价变异体 + 2 个 requestBody 等价）
  - **预期**: 71+9 = 80 killed / (80 + 3 survived + 0 NoCoverage) = 80/83 ≈ 96.4%（若 NoCoverage 也被覆盖杀死则为 81/83 ≈ 97.6%）
