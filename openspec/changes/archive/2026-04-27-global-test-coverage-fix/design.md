## Context

`services/global.ts` 包含两个导出函数：
- `getDefaultAppLanguage()`：三级语言检测（localStorage → 系统语言 → 英文兜底），外层 try-catch 包裹整个逻辑
- `getLanguageLabel()`：语言代码到显示标签的映射

当前测试文件 `src/__test__/services/lib/global.test.ts` 已覆盖 localStorage 有效缓存、迁移、无效缓存清理、系统语言检测等正常路径，但未覆盖外层 catch 块（行 115-139）和 `getLanguageLabel` 函数（行 147-149）。

## Goals / Non-Goals

**Goals:**
- 覆盖 `getDefaultAppLanguage` 外层 catch 的三条路径：系统语言降级、系统语言不可用、locale 本身也失败
- 覆盖 `getLanguageLabel` 的两个分支：有效语言返回标签、无效语言返回原代码
- 将 global.ts 行覆盖率提升至 ~95%，分支覆盖率提升至 ~90%

**Non-Goals:**
- 不修改 `global.ts` 源码
- 不修改现有测试用例
- 不覆盖迁移目标无效的防御性分支（行 76-82，当前数据下不可达）

## Decisions

### 1. 外层 catch 触发方式：mock locale() 在首次调用时抛异常

**选择**：在 `getDefaultAppLanguage` 入口处模拟 `locale()` 抛出异常，使外层 try 块（行 95 的 `await locale()`）抛异常进入 catch。

**理由**：外层 catch 由行 95 的 `locale()` 调用或之前任何未预期的异常触发。mock `locale()` 是最直接的方式，且 `locale()` 已在测试中通过 `vi.mocked(locale)` mock。

**替代方案**：mock `SUPPORTED_LANGUAGE_SET.has()` 抛异常 → 侵入性太强，影响其他测试。

### 2. getLanguageLabel 测试：直接单元测试

**选择**：在现有测试文件中新增 `describe('getLanguageLabel')` 块，直接调用函数验证返回值。

**理由**：纯函数，无副作用，无需 mock。

### 3. 测试组织：追加到现有文件

**选择**：在 `global.test.ts` 中追加新的 describe 块，不创建新文件。

**理由**：测试同一模块，文件已包含 `getDefaultAppLanguage` 和 `interceptClickAToJump` 的测试，保持一致性。

## Risks / Trade-offs

- **[外层 catch 内部也调用 locale()]** → catch 块内行 119 再次调用 `locale()`，需要区分首次调用（触发 catch）和二次调用（catch 内降级）。使用 `mockResolvedValue` / `mockRejectedValue` 控制每次调用的返回值即可。
- **[mock 副作用]** → 确保每个测试在独立的 describe 块中，通过 `beforeEach` 重置 mock 状态，避免跨测试污染。
