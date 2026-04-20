## Context

测试质量审查报告（2026-04-15）识别出三类反模式：mock 子组件（3 个组件测试文件）、spyOn 内部实现（4 个文件）、可疑 `as any`（约 25 处）。项目已有 `behavior-driven-testing` 和 `test-type-safety` 两个规范，但部分测试未遵守。

当前测试环境使用 `happy-dom`（在 `vitest.config.ts` 中全局配置），已具备真实 DOM 操作能力。

### 当前状态

**Mock 子组件（3 个文件）**：

| 文件 | mock 的子组件 | 验证方式 |
|------|-------------|---------|
| `GeneralSetting.test.tsx` | LanguageSetting, ModelProviderSetting, AutoNamingSetting | 仅验证 data-testid 存在 |
| `SettingPage.test.tsx` | SettingSidebar | 仅验证 data-testid 存在 |
| `InitializationController.test.tsx` | FatalErrorScreen, NoProvidersAvailable, Progress | 验证属性值和回调（测试价值中等） |

**spyOn 内部实现（4 个文件）**：

| 文件 | spy 目标 | 数量 |
|------|---------|------|
| `highlightLanguageManager.test.ts` | 私有方法 `doLoadLanguage` | 5 处 |
| `codeBlockUpdater.test.ts` | `document.querySelectorAll`/`contains` | 12 处 |
| `masterKey.test.ts` | `keyring.getPassword`/`setPassword` | 多处 |
| `useAdaptiveScrollbar.test.ts` | `global.clearTimeout` | 2 处 |

**`as any` 类型绕过**：代码文件中从 ~66 处降至 61 处，其中约 25 处仍为可疑使用。

## Goals / Non-Goals

**Goals:**

- 消除 3 个组件测试文件中的子组件 mock，改为渲染完整组件树
- 消除 `highlightLanguageManager.test.ts` 对私有方法 `doLoadLanguage` 的 spy，改为 mock 外部依赖
- 消除 `codeBlockUpdater.test.ts` 对 `document` 方法的 spy，改为使用 happy-dom 真实 DOM
- 清理约 25 处可疑 `as any`，替换为类型安全写法

**Non-Goals:**

- 不重构 `masterKey.test.ts`（spy 外部依赖 keyring 属于灰色地带，优先级低）
- 不重构 `useAdaptiveScrollbar.test.ts` 中已验证可观察行为的测试（仅 2 个用例 spy `clearTimeout`，影响小）
- 不修改 hook 测试文件的 mock 策略（mock hook 依赖属于合理的单元测试隔离）
- 不修改生产代码
- 不新增测试用例或覆盖新模块

## Decisions

### Decision 1: 组件测试渲染完整组件树

**选择**：移除 `vi.mock()` 对子组件的 mock，渲染完整组件树。

**方案**：为每个测试文件提供必要的 Provider 包裹：
- `GeneralSetting.test.tsx`：需要 Redux Provider + i18n Provider + mock `toastQueue`（LanguageSetting 和 ModelProviderSetting 调用 `toastQueue.success/error`）
- `SettingPage.test.tsx`：已有 Redux + MemoryRouter，需要补充 i18n 和路由子路由配置
- `InitializationController.test.tsx`：需要 i18n Provider（FatalErrorScreen 和 NoProvidersAvailable 使用 `useTranslation`），当前已有 `vi.spyOn` mock `InitializationManager`，保留此模式（mock 服务层而非 UI 组件）

**替代方案**：
- 方案 B：仅 mock 子组件的 hooks/数据依赖，保留真实组件渲染 — 拒绝，因为仍然违背"不 mock 子组件"原则
- 方案 C：将组件测试升级为集成测试（使用 MSW） — 拒绝，超出当前范围

**风险**：子组件可能有深层依赖链（如 Redux、i18n、路由、toastQueue），需要逐个提供。如果依赖链过深导致测试 setup 过于复杂，可以保留对**第三方 UI 库组件**（如 shadcn/ui 的 Progress）的 mock。特别注意 `GeneralSetting` 的子组件 LanguageSetting 和 ModelProviderSetting 依赖 `toastQueue` 服务，需要在测试中 mock 该模块。

### Decision 2: highlightLanguageManager — mock 外部依赖替代 spy 私有方法

**选择**：将 `vi.spyOn(manager as any, 'doLoadLanguage')` 替换为 mock 外部依赖 `highlightLanguageIndex` 模块中的 `loadLanguageModule` 函数。

**原理**：被测类的公共 API（`loadLanguageAsync`、`isLoaded`、`hasFailedToLoad` 等）已经足够验证所有行为。失败场景可以通过让外部依赖（`loadLanguageModule`）reject 来触发，无需直接 spy 私有方法。调用次数验证可以通过 spy `hljs.registerLanguage`（外部库的公共 API）来替代。

**具体改动**：
- 新增 `vi.mock('@/utils/highlightLanguageIndex')` 配置 `loadLanguageModule` 的返回值/reject
- 删除所有 `vi.spyOn(manager as any, 'doLoadLanguage')` 调用
- 并发测试：改为 spy `hljs.registerLanguage`，断言只调用一次
- 失败测试：通过 mock `loadLanguageModule` 使其 reject，通过公共 API（`isLoaded`、`hasFailedToLoad`）验证结果
- 减少通过 `testInternals` 直接操作内部状态的次数，优先使用 `loadLanguageAsync`/`markAsLoaded` 等公共 API

### Decision 3: codeBlockUpdater — 使用 happy-dom 真实 DOM

**选择**：利用项目已有的 happy-dom 测试环境，直接操作真实 DOM 元素替代 `vi.spyOn(document, ...)`。

**原理**：`updateCodeBlockDOM` 是一个纯 DOM 操作函数，在 happy-dom 环境中可以直接创建 `<code>` 元素、设置 `className` 和 `textContent`、添加到 `document.body`，然后调用被测函数验证结果。这完全消除了对 `document.querySelectorAll` 和 `document.contains` 的 spy 需求。

**具体改动**：
- 删除所有 `vi.spyOn(document, 'querySelectorAll')` 和 `vi.spyOn(document, 'contains')` 调用
- 删除 `asNodeList` 辅助函数
- 在每个测试中通过 `document.createElement` 创建真实 DOM 元素
- 重试场景：使用 `vi.useFakeTimers()` + `vi.advanceTimersByTime()` 推进时间，通过 `getPendingUpdatesCount()` 验证最终状态
- 验证重试停止：推进足够长的时间后验证 pending count 为 0，而非验证精确重试次数

### Decision 4: `as any` 清理策略

**选择**：按类别批量清理可疑的 `as any`。

**分类处理**：
1. **mock 路由 hooks 的返回值**（约 8 处）：使用已有的 `mockRouter` 工具函数（见 `helpers/mocks/router.ts`）
2. **测试边界值 `null as any`/`undefined as any`**（约 5 处）：使用类型安全的 null 替代（如 `null as unknown as Type` 或使用可选链）
3. **构造 mock store state**（约 4 处）：使用已有的 `createTestRootState` 工厂函数
4. **传入不匹配的枚举值测试错误处理**（约 4 处）：使用 `as unknown as Type` 替代 `as any`，或使用 `String()` 转换
5. **其他分散的可疑使用**（约 4 处）：逐个分析替换

**保留的 `as any`**（约 20 处）：
- 第三方库类型不完整（如 AI SDK `stream: [] as any`）
- `highlightLanguageManager.test.ts` 中剩余的（改为 mock 外部依赖后自动消除）
- 有明确注释说明原因的

## Risks / Trade-offs

- **[子组件深层依赖]** → 如果子组件依赖链过深（如需要特定的 Redux state 结构），测试 setup 会变复杂。缓解：提供专门的 `renderWithProviders` 辅助函数封装通用 Provider。
- **[happy-dom DOM 行为差异]** → happy-dom 与浏览器在某些 DOM API 上可能有细微差异。缓解：项目已在全局使用 happy-dom，已有的 DOM 相关测试均正常运行。
- **[重试次数验证缺失]** → 不再验证精确重试次数后，如果重试逻辑被意外修改（如从 3 次改为 1 次或无限次），测试可能无法捕获。缓解：验证"最终停止"（pending count 为 0）和"成功更新"两个端点行为。
- **[测试重构回归]** → 大规模修改测试可能引入新 bug。缓解：每个文件独立提交，逐个运行测试验证。
