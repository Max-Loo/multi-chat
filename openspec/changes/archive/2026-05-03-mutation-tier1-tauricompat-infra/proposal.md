## Why

`store.ts`（306 行）、`http.ts`（219 行）、`shell.ts`（176 行）是 tauriCompat 兼容层的基础设施模块，合计 701 行代码。三者都采用 Tauri/Web 双环境分发模式，包含大量环境检测条件分支和 IndexedDB/Web API 适配逻辑。当前有完善单元测试但**未纳入 Stryker 变异测试**。

风险分析：
- `store.ts` 的 WebStoreCompat 实现包含完整的 IndexedDB CRUD，事务边界变异 = 数据丢失
- `http.ts` 的三环境分发（DEV/Tauri/Web）条件分支，`import.meta.env.DEV` 和 `isTauri()` 的组合路径容易漏覆盖
- `shell.ts` 的 Null Object 模式和 `window.open` 降级，`isSupported()` 返回值变异可能导致功能误判
- **[P0 阻断]** `store.test.ts` 和 `shell.test.ts` 受 `setup/mocks.ts` 全局 mock 拦截，测试实际运行在 `createMemoryStorageMock`（Map 实现）和 `vi.fn()` 桩上，不覆盖真实代码。所有变异体将标记为 NoCoverage，分数接近 0%。需先添加 `vi.unmock()` 并按 `http.test.ts` 模式（`vi.resetModules` + 动态 `import`）重写测试框架

## What Changes

- **前置修复**：为 `store.test.ts` 和 `shell.test.ts` 添加 `vi.unmock()` 绕过全局 mock，按 `http.test.ts` 模式重写测试框架（`vi.resetModules` + 动态 `import`）
- 将 `src/utils/tauriCompat/store.ts`、`src/utils/tauriCompat/http.ts`、`src/utils/tauriCompat/shell.ts` 添加到 `stryker.config.json` 的 `mutate` 数组
- 运行变异测试基线，统计存活变异体
- 针对存活变异体补充精确断言，目标杀死率 ≥ 90%

### 预期变异热点

**store.ts（306 行）**：
- `createLazyStore` 的环境分发 `isTauri() ? TauriStoreCompat : WebStoreCompat`
- `WebStoreCompat.get()` 的 `result.value !== undefined` 条件
- `WebStoreCompat.set()` / `delete()` / `keys()` 的 IndexedDB 事务成功/失败事件处理
- `TauriStoreCompat.get()` 的 `value ?? null` 空值合并
- `WebStoreCompat.isSupported()` 的 `typeof indexedDB !== 'undefined'`

**http.ts（219 行）**：
- `createFetch` 的三路条件分支：`import.meta.env.DEV` → `isTauri()` → fallback
- Tauri 环境动态导入失败降级 `catch → originFetch`
- `_fetchInstance` 的顶层 await 初始化
- `getFetchFunc()` 返回的函数引用一致性

**shell.ts（176 行）**：
- `Command.create` 的环境分发
- `WebShellCommand.execute()` 的模拟返回值（code: 0, signal: null, stdout: '', stderr: ''）
- `WebShell.open()` 的 `window.open` 参数（'_blank', 'noopener,noreferrer'）
- 各 `isSupported()` 方法的返回值常量（true/false）
- `shell` 实例的环境分发 `isTauri() ? TauriShell : WebShell`

## Capabilities

### New Capabilities

- `store-mutation-coverage`: store.ts 变异测试覆盖，目标杀死率 ≥ 90%
- `http-mutation-coverage`: http.ts 变异测试覆盖，目标杀死率 ≥ 90%
- `shell-mutation-coverage`: shell.ts 变异测试覆盖，目标杀死率 ≥ 90%

### Modified Capabilities

（无）

## Constraints

- 变异测试验证时使用针对具体文件的增量命令，不运行全量变异测试
- `http.ts` 中 `import.meta.env.DEV` 的变异需要通过 Vite 环境变量 mock 来控制
- `shell.ts` 中 `window.open` 的参数变异需要通过 `vi.spyOn(window, 'open')` 捕获调用参数
- IndexedDB 相关测试使用 `fake-indexeddb` 模拟
- **[P0 阻断]** `store.test.ts` 和 `shell.test.ts` 必须先调用 `vi.unmock()` 绕过 `setup/mocks.ts` 的全局 mock，否则变异体全部 NoCoverage（Stryker 将 NoCoverage 计入分母，分数 ≈ 0%）
- `shell.ts` 中 `window.open` 的字符串参数（`'_blank'`、`'noopener,noreferrer'`）受 Stryker `excludedMutations: ["StringLiteral"]` 排除，不会被变异。相关 spec 要求调整为验证函数调用本身而非字符串参数

## Impact

- **测试文件**: `src/__test__/utils/tauriCompat/store.test.ts`（+若干用例）、`src/__test__/utils/tauriCompat/http.test.ts`（+若干用例）、`src/__test__/utils/tauriCompat/shell.test.ts`（+若干用例）
- **源代码**: 无改动
- **构建时间**: 增加可忽略
- **CI/CD**: 无影响
