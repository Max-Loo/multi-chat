## Why

masterKey.ts 变异测试得分 92.23%，7 个存活变异体集中在三处：

1. `isMasterKeyExists` 的 `key !== null && key !== undefined && key.length > 0` 条件链（4 个存活）：其中 2 个为移除单个条件检查的变异体（移除 `key !== null` 或 `key !== undefined`），另 2 个为 `!==` → `!=` 等价变异体（无法杀死）。前者的存活原因是 try-catch 吞掉了 TypeError，仅断言返回值无法区分正常路径与异常捕获路径，必须通过 `console.error` 否定性断言来杀死。此外，现有的 `null` 测试同样缺少此断言，需一并补充。
2. 密钥验证正则 `/^[0-9a-f]{64}$/`（2 个存活）：没有测试包含前后缀额外字符的密钥，导致 `^` 和 `$` 锚点变异体存活。
3. `isTauri()` 环境分支（1 个存活）：现有 Tauri 环境测试仅断言了两个分支共有的文本，无法区分分支差异。

## What Changes

- `isMasterKeyExists` 条件链（2 个可杀死）：新增 `undefined` 测试并附加 `console.error` 未调用断言；补充现有 `null` 测试的 `console.error` 断言。另有 2 个 `!==` → `!=` 等价变异体无法杀死。
- 密钥验证正则（2 个存活）：测试前缀/后缀含额外字符的密钥被拒绝
- `isTauri()` 环境分支（1 个存活）：断言 Tauri 分支特有内容 `"system secure storage"`，确保与 Web 分支 `"browser secure storage"` 可区分

## Capabilities

### New Capabilities

- `masterkey-mutation-phase2`: masterKey.ts 第二轮变异测试提升，目标从 92.23% → ≥97%（杀 5 个变异体：2 条件链 + 2 正则 + 1 isTauri，剩余 2 个等价变异体）

### Modified Capabilities

（无）

## Impact

- **测试文件**: `src/__test__/store/keyring/masterKey.test.ts` — 新增约 3 个测试用例，修改 2 个现有测试用例
- **源代码**: 无改动
- **构建时间**: 变异测试运行时间增加可忽略
- **CI/CD**: 无影响
