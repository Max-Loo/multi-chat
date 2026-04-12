## Why

`isTestEnvironment()` 每次调用都执行 4 项环境检测（`globalThis.vitest`、`globalThis.__VITEST__`、`process.env.VITEST`、`import.meta.env.VITEST`），但运行时环境在应用生命周期内不会改变。虽然当前调用频率较低（仅在密钥派生时），但作为公共导出函数，调用方无法预知其成本，应将结果缓存以消除不必要的重复计算。

## What Changes

- 将 `isTestEnvironment()` 的检测结果在模块加载时计算一次并缓存
- `getPBKDF2Iterations()` 直接使用缓存值，不再每次调用 `isTestEnvironment()`
- 保持函数签名和导出不变，行为完全兼容

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `tauri-plugin-web-compat`: `isTestEnvironment()` 从每次调用重新检测改为模块级缓存

## Impact

- **代码**: `src/utils/tauriCompat/env.ts`（仅此一个文件）
- **行为**: 无变化——返回值与缓存前完全一致
- **测试**: 现有 mock 策略（`vi.mock` 在模块加载前覆盖）不受影响
