## Context

tauriCompat 基础设施层包含 3 个模块（store.ts 306 行、http.ts 219 行、shell.ts 176 行），合计 701 行代码。三者均采用 Tauri/Web 双环境分发模式。现有测试覆盖了主要路径，但存在以下差距：

- **[P0 阻断]** store.test.ts 和 shell.test.ts 受 `setup/mocks.ts` 全局 mock 拦截，实际测试 `createMemoryStorageMock`（Map 实现）和 `vi.fn()` 桩，不覆盖真实源代码。必须先添加 `vi.unmock()` 绕过全局 mock，再按 http.test.ts 模式（`vi.resetModules` + 动态 `import`）重写测试
- store.test.ts：多为"不抛异常"式断言，缺少精确的值验证（如 set→get roundtrip 值比对）
- http.test.ts：三路分支覆盖较好，但 DEV 分支的"不检查 isTauri"行为未精确验证
- shell.test.ts：测试最薄弱——isSupported() 只检查 typeof 未检查实际值、execute() 未验证返回结构、window.open 参数未捕获

## Goals / Non-Goals

**Goals:**
- 将 3 个文件加入 Stryker 变异测试配置
- 修复 store.test.ts 和 shell.test.ts 的全局 mock 阻断问题
- 运行基线测试，识别存活变异体
- 补充精确断言，目标杀死率 ≥ 90%
- 不修改任何源代码

**Non-Goals:**
- 不重构源代码或测试架构
- 不追求 100% 杀死率
- 不调整 Stryker 全局配置

## Decisions

### 0. 前置修复：store.test.ts 和 shell.test.ts 全局 mock 阻断

**决策**：为 store.test.ts 和 shell.test.ts 添加 `vi.unmock()` 绕过全局 mock，按 http.test.ts 模式重写测试框架

**理由**：
- `setup/mocks.ts` 全局 mock 了 `@/utils/tauriCompat/store`（返回 Map 实现的 `createMemoryStorageMock`）和 `@/utils/tauriCompat/shell`（返回 `vi.fn()` 桩）
- 这意味着当前 store.test.ts 和 shell.test.ts 测试的是 mock 而非真实代码
- Stryker 变异后真实代码从不被执行，所有变异体标记为 NoCoverage
- Stryker 将 NoCoverage 计入分母（`#undetected = #survived + #no-coverage`），分数接近 0%
- http.test.ts 已有正确的模式：`vi.unmock()` + `vi.mock(env)` + `vi.resetModules()` + 动态 `import()`

**实施方案**：
- store.test.ts：添加 `vi.unmock('@/utils/tauriCompat/store')`，使用 `vi.mock('@/utils/tauriCompat/env')` 控制 isTauri，通过 `vi.resetModules()` + 动态 `import()` 隔离模块状态
- shell.test.ts：添加 `vi.unmock('@/utils/tauriCompat/shell')`，使用 `vi.mock('@/utils/tauriCompat/env')` 控制 isTauri，通过 `vi.resetModules()` + 动态 `import()` 隔离模块状态

### 1. store.ts：补充精确值断言

**决策**：将"不抛异常"式测试升级为精确值断言（set→get roundtrip、delete→get null、keys 包含已设置键）

**理由**：
- 当前 `get` 测试仅检查 `toBeDefined()`，无法杀死 `result.value !== undefined` 的条件变异
- 当前 `keys` 测试仅检查空数组，无法杀死 `request.result as string[]` 的类型转换变异
- `isSupported()` 在 Web 环境测试中从未被断言

**关键变异热点与应对**：
- `WebStoreCompat.get()` 的 `result.value !== undefined` → 补充 set('key','value') 后 get('key') 返回精确值
- `WebStoreCompat.get()` 的 error handler `resolve(null)` → 补充 error 场景验证返回 null
- `WebStoreCompat.close()` 的 `if (this.db)` → 补充 close 后操作应抛错的场景
- `WebStoreCompat.isSupported()` → 在 fake-indexedDB 环境下验证返回 true

### 2. http.ts：补充环境分支边界验证

**决策**：在现有三路分支测试基础上，补充 DEV 环境不检查 isTauri 的精确验证

**理由**：
- 现有测试验证了各分支返回正确的 fetch 函数，但 DEV 分支的短路行为（跳过 isTauri 检查）需要通过副作用验证
- `fetch()` 函数的参数透传已测试，但需要补充无 init 参数的调用路径

**关键变异热点与应对**：
- `import.meta.env.DEV` 条件 → 补充 DEV=true + isTauri=true 时仍使用原生 fetch 的测试
- `isTauri()` 条件 → 补充 PROD + isTauri=false 直接返回原生 fetch（不尝试动态导入）
- `fetch(input, init)` 的参数透传 → 补充无 init 参数调用

### 3. shell.ts：大幅补强测试精度

**决策**：补充精确的返回值断言、isSupported() 布尔值断言、window.open 调用验证

**理由**：
- 现有 shell.test.ts 只有 6 个测试，是最薄弱的模块
- `isSupported()` 仅检查 `typeof` 为 boolean，无法杀死 `return true` → `return false` 变异
- `execute()` 返回值未验证结构，无法杀死 `code: 0` → `code: 1` 变异
- `window.open` 调用未验证——注意：Stryker 配置 `excludedMutations: ["StringLiteral"]` 排除了字符串字面量变异，`'_blank'` → `'_self'` 等变异不会被生成。测试改为验证 `window.open` 被正确调用（函数调用本身），而非字符串参数精确匹配

**关键变异热点与应对**：
- `WebShellCommand.execute()` 返回值 → 验证 code=0, signal=null, stdout='', stderr=''
- `WebShellCommand.isSupported()` → 验证返回 false
- `WebShell.open()` 的 `window.open(path, '_blank', 'noopener,noreferrer')` → spyOn 捕获参数
- `WebShell.isSupported()` → 验证返回 true
- `Command.create` 环境分发 → 验证 Web 环境创建 WebShellCommand

## Risks / Trade-offs

- **[P0 - 全局 mock 阻断]** store.test.ts 和 shell.test.ts 受 `setup/mocks.ts` 全局 mock 拦截，测试不覆盖真实代码 → 必须先添加 `vi.unmock()` 并重写测试框架（按 http.test.ts 模式），否则 Stryker 变异分数 ≈ 0%
- **[NoCoverage 计分]** Stryker 将 NoCoverage 计入分母（`#undetected = #survived + #no-coverage`），未覆盖的变异体直接拉低分数 → 通过 vi.unmock 修复后，Web 路径变异体可获得覆盖
- **[Tauri 环境覆盖]** store.ts/http.ts/shell.ts 的 Tauri 实现路径（TauriStoreCompat、TauriShellCommand）在 Web 测试环境中无法直接实例化 → 通过环境 mock 模拟 Tauri 路径，或接受为等效存活变异体
- **[StringLiteral 排除]** Stryker `excludedMutations: ["StringLiteral"]` 排除了字符串字面量变异。shell.ts 中 `window.open` 的字符串参数（`'_blank'`、`'noopener,noreferrer'`）不会被变异 → 测试验证函数调用本身，不验证字符串参数
- **[顶层 await]** http.ts 使用顶层 await 初始化 `_fetchInstance`，测试需要通过 `vi.resetModules` + 动态导入来隔离 → 已有模式可用
- **[IndexedDB mock]** store.ts 的 IndexedDB 操作依赖 fake-indexeddb，错误路径难以触发 → 通过 mock IDBDatabase 的 transaction 方法模拟错误
- **[运行时间]** 3 个文件合计 701 行，预计 6-15 分钟 → 分批运行
