## Tasks

- [x] ### Task 1: crypto.ts — error.cause 保留验证（杀 2 个变异体）

  - **文件**: `src/__test__/utils/crypto.test.ts`
  - **目标**: base64ToBytes 的 `{ cause: error }` → `{}` 存活（#730）、encryptField 的 `{ cause: error }` → `{}` 存活（#750）
  - **操作**:
    - 测试 1: base64ToBytes 传入无效 Base64（如 `'!!!'`），验证抛出错误的 `error.cause` 存在且为原始错误对象
    - 测试 2: encryptField 传入无效 hex 密钥（如 `'g'.repeat(64)`），验证抛出错误的 `error.cause` 存在且为原始错误对象
  - **验证**: 2 个变异体从 Survived → Killed

- [x] ### Task 2: crypto.ts — extractable 布尔参数验证（杀 2 个变异体）

  - **文件**: `src/__test__/utils/crypto.test.ts`
  - **目标**: encryptField 中 `importKey(... false, ...)` 的 `false` → `true` 存活（#741 @ L95）、decryptField 中 `importKey(... false, ...)` 的 `false` → `true` 存活（#773 @ L177）
  - **操作**:
    - 测试 1: mock `crypto.subtle.importKey`，调用 `encryptField`，验证 `importKey` 调用参数中 `extractable` 为 `false`
    - 测试 2: mock `crypto.subtle.importKey`，调用 `decryptField`（需先准备有效密文），验证 `importKey` 调用参数中 `extractable` 为 `false`
  - **注意**: 不能通过验证加密结果格式来间接断言——`extractable` 仅控制密钥是否可导出，不影响加密/解密输出
  - **验证**: 2 个变异体从 Survived → Killed

- [x] ### Task 3: crypto.ts — isNaN 等价变异体（不计入目标）

  - **文件**: `src/utils/crypto.ts`（可选源码清理，非必需）
  - **目标**: hexToBytes 的 `if (isNaN(byteValue))` → `if (false)` 存活（#715 @ L32）
  - **分析**: L20 正则 `/^[0-9a-fA-F]+$/` 已拦截所有非 hex 字符，isNaN 分支在数学上不可达。这是等价变异体，无法通过任何输入测试杀死。
  - **可选操作**: 删除 L32-34 的 isNaN 死代码分支（消除变异体产生源），或接受其为等价变异体
  - **验证**: 如果删除死代码，变异体不再生成；否则保持 Survived 但不影响真实覆盖率

- [x] ### Task 4: resourceLoader.ts — optional chaining null 降级（杀 2 个变异体）

  - **文件**: `src/__test__/utils/resourceLoader.test.ts`
  - **目标**: `currentState?.retryCount` → `currentState.retryCount` 存活（#895 @ L334）、`state?.preloadFailed` → `state.preloadFailed` 存活（#899 @ L340）
  - **操作**:
    - 测试 1（`currentState?.retryCount`）: 对从未加载过的资源调用 `preload` 并使其失败（`this.states.get(key)` 返回 undefined），验证错误状态被正确设置且不抛异常。具体步骤：注册资源 → loader mock reject → `preload(['key'])` → 验证 `getState('key')` 包含 `preloadFailed: true` 且 `retryCount: undefined`
    - 测试 2（`state?.preloadFailed`）: 预加载失败后通过 `reset(key)` 删除 state，然后推进 fake timer 5 秒触发 setTimeout 回调，验证不抛异常。具体步骤：注册资源 → loader mock reject → `preload(['key'])` → `reset('key')` → `vi.advanceTimersByTime(5000)` → 验证无异常抛出
  - **验证**: 2 个变异体从 Survived → Killed

- [x] ### Task 5: chat/index.ts — transmitHistoryReasoning 默认值（杀 1 个变异体）

  - **文件**: `src/__test__/services/chat/index.integration.test.ts`
  - **目标**: `transmitHistoryReasoning = false` → `= true` 存活（#2 @ L84）
  - **操作**:
    - 测试 1: 构造包含 `reasoningContent` 的 historyList，不传 `transmitHistoryReasoning` 参数调用 `streamChatCompletion`，mock `streamText` 验证调用参数中 messages 数组不包含 `{ type: 'reasoning' }` 部分
  - **验证**: 1 个变异体从 Survived → Killed

- [x] ### Task 6: chat/index.ts — defaultAISDKDependencies 对象字面量（杀 1 个变异体）

  - **文件**: `src/__test__/services/chat/index.integration.test.ts`
  - **目标**: `defaultAISDKDependencies` → `{}` 存活（#0 @ L13-16）
  - **操作**:
    - 测试 1: 不注入 `dependencies` 选项调用 `streamChatCompletion`，验证默认依赖对象 `defaultAISDKDependencies` 中的 `streamText` 和 `generateId` 属性存在且为函数（通过 mock `streamText` 模块并验证其被调用）
  - **注意**: 此变异体因测试始终注入 dependencies 而存活，需要一个不覆盖 dependencies 的测试路径
  - **验证**: 1 个变异体从 Survived → Killed

- [x] ### Task 7: 运行变异测试验证

  - **操作**: `pnpm test:mutation`
  - **验证**: crypto.ts 目标变异体全部 Killed、resourceLoader.ts 目标变异体全部 Killed、chat/index.ts 目标变异体全部 Killed
