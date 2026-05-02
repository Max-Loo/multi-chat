## Tasks

### Task 1: isMasterKeyExists 条件链变异体（杀 2 个，2 个等价无法杀死）

- [x] **修改现有 `null` 测试**（约第 93 行 `应该返回 false 当密钥不存在时`）：补充 `console.error` 未调用断言
- [x] **新增 `undefined` 测试**：返回 undefined 时走正常路径（第二个条件短路），不触发 console.error
- [x] **验证**: 移除 `key !== null` 和移除 `key !== undefined` 两个变异体从 Survived → Killed

### Task 2: 密钥验证正则锚点变异体（杀 2 个）

- [x] 测试 1: `key = 'xx' + 'a'.repeat(64)`（前缀多余字符）→ importMasterKey 拒绝（杀死移除 `^` 的变异体）
- [x] 测试 2: `key = 'a'.repeat(64) + 'xx'`（后缀多余字符）→ importMasterKey 拒绝（杀死移除 `$` 的变异体）
- [x] **验证**: 2 个锚点相关变异体从 Survived → Killed

### Task 3: isTauri 环境分支验证（杀 1 个变异体）

- [x] 修改现有 Tauri 环境测试，增加 Tauri 特有内容的断言，确保与 Web 分支可区分
- [x] **验证**: 1 个变异体从 Survived → Killed

### Task 4: 运行变异测试验证

- [x] 运行 `pnpm test:mutation`
- [x] **验证**: masterKey.ts 变异得分 99.03%（102 killed, 0 survived, 1 no coverage），超过 97% 目标
