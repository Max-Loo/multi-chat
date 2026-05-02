## Why

crypto.ts（5 个存活）、resourceLoader.ts（2 个存活）、chat/index.ts（2 个存活）各自存活数不多，分散在 3 个文件中。crypto.ts 的存活变异体涉及 error.cause 保留和 extractable 布尔参数验证，resourceLoader.ts 涉及 optional chaining 的 null 降级，chat/index.ts 涉及 transmitHistoryReasoning 默认值和 defaultAISDKDependencies 对象字面量。这些都是小范围的精确断言补充，合并为一个变更统一处理。

## What Changes

- crypto.ts error.cause（2 个存活）：验证 base64ToBytes 和 encryptField 抛出错误时 cause 属性保留原始错误
- crypto.ts extractable 布尔参数（2 个存活）：mock `crypto.subtle.importKey` 断言 `extractable` 参数为 `false`（#741 @ L95 encryptField、#773 @ L177 decryptField）
- crypto.ts isNaN 条件（1 个存活）：#715 @ L32 为等价变异体（L20 正则已拦截所有非 hex 字符，isNaN 分支不可达），不计入目标
- resourceLoader.ts optional chaining（2 个存活）：构造 state 为 null 的场景验证不抛异常
- chat/index.ts transmitHistoryReasoning（1 个存活）：验证默认传入 false
- chat/index.ts defaultAISDKDependencies（1 个存活）：#0 ObjectLiteral → `{}` @ L13-16，需测试不注入 dependencies 时默认依赖对象可用

## Capabilities

### New Capabilities

- `mutation-remaining-modules`: crypto/resourceLoader/chat-index 模块变异测试精确断言提升

### Modified Capabilities

（无）

## Constraints

- 变异测试验证时使用针对具体文件的增量命令（如 `pnpm test:mutation --mutate "src/utils/crypto.ts"`），不运行全量变异测试

## Impact

- **测试文件**: `src/__test__/utils/crypto.test.ts`（+3-4 用例）、`src/__test__/utils/resourceLoader.test.ts`（+1-2 用例）、`src/__test__/services/chat/index.integration.test.ts`（+2 用例）
- **源代码**: 无改动
- **构建时间**: 增加可忽略
- **CI/CD**: 无影响
