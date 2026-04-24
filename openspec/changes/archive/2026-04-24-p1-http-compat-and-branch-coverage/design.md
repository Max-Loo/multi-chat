## Context

`tauriCompat/http.ts` 是全项目 HTTP 层基础，核心逻辑为 `createFetch()` 函数的三路环境分支（DEV / 生产-Tauri / 生产-Web）。该模块使用顶层 `await` 初始化，测试需要特殊处理模块加载时序。

已有 `http-fetch-compat` spec 定义了 11 个详细需求，但无对应测试文件。

`store/slices` 的分支覆盖率偏低，需要补充异步错误分支测试。

## Goals / Non-Goals

**Goals:**

- 为 `tauriCompat/http.ts` 新建测试文件，覆盖三路环境分支和降级路径
- 补充 `store/slices` 异步 thunk 错误分支

**Non-Goals:**

- 不为全局 mock 的 `tauriCompat/env.ts`、`os.ts`、`shell.ts` 补充测试（设计决策）
- 不修改源代码
- 不修改 `tauriCompat` 的全局 mock 策略
- 不覆盖 `components/ui` 条件渲染分支（需独立 change 规划）
- 不推进 skip 用例（需独立 change 规划）

## Decisions

### D1: http.ts 测试使用文件级 `vi.mock` 覆盖全局 mock

`setup.ts` 对 `@/utils/tauriCompat/http` 做了全局 mock（返回固定 stub），Vitest 中文件级 `vi.mock` 优先于 setup 全局 mock。测试文件需声明 `vi.mock('@/utils/tauriCompat/http')` 覆盖全局 mock，并配合 `vi.resetModules()` + 动态 `import()` 在每个测试中重新加载真实模块。

同时需要 mock 两个依赖：
- `@/utils/tauriCompat/env`：控制 `isTauri()` 返回值（通过 `vi.mock` 工厂函数）
- `@tauri-apps/plugin-http`：控制动态导入的成功/失败（通过 `vi.mock` 工厂函数）

### D2: 使用 `vi.stubEnv` + `vi.resetModules()` + 动态 `import()` 控制环境分支

由于 `createFetch()` 在模块顶层通过 `await` 执行（第 121 行），且 `import.meta.env.DEV` 是编译期注入的值，**不能通过 `vi.mock` 控制**。需要使用以下模式：

```typescript
it('DEV 环境使用原生 fetch', async () => {
  // 1. 设置环境变量（必须在 vi.resetModules 之前）
  vi.stubEnv('DEV', true);

  // 2. 重置模块缓存，使下次 import 重新执行 top-level await
  vi.resetModules();

  // 3. mock 依赖模块（必须在动态 import 之前）
  vi.mock('@/utils/tauriCompat/env', () => ({
    isTauri: vi.fn(() => false),
  }));
  vi.mock('@tauri-apps/plugin-http', () => ({
    fetch: vi.fn(),
  }));

  // 4. 动态导入被测模块，触发 top-level await
  const http = await import('@/utils/tauriCompat/http');

  // 5. 断言返回的是 window.fetch 的绑定版本
  expect(http.getFetchFunc()).toBe(originFetch);

  // 6. 清理环境
  vi.unstubAllEnvs();
});
```

每个测试用例（DEV / 生产-Tauri-成功 / 生产-Tauri-失败 / 生产-Web）都需要独立的 `vi.resetModules()` + 动态 `import()` 循环，因为模块加载后 `_fetchInstance` 会被缓存。

### D3: slices 分支覆盖通过增加错误场景用例实现

在现有测试文件的 `describe` 块中补充 `rejectedValue` 场景，验证错误状态下 store 的 behavior。

## Risks / Trade-offs

- **[风险]** 顶层 `await` 模块在 Vitest 中需要 `vi.resetModules()` + 动态 `import()` 模式，每个测试用例都需重载模块 → 已在 D2 中给出具体模式，`vi.stubEnv` 控制编译期变量已有项目先例（`FatalErrorScreen.test.tsx`）
- **[风险]** slices 测试补充可能发现现有 bug → 记录并作为后续修复项
