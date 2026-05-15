## Context

当前项目有 155 个测试文件、1839 个测试用例，通过测试审查发现 4 个包含实际业务逻辑的源文件完全缺少测试覆盖。这些文件分布在 utils、tauriCompat 和 pages 目录，涉及动态 import 路由、IndexedDB 异步初始化、表单验证联动和国际化日期格式化。

现有测试基础设施已足够支撑：
- `vi.mock()` + `vi.fn()` 用于 mock 动态 import 和 IndexedDB API
- `@testing-library/react` + `renderHookWithProviders` 用于组件测试
- `setup.ts` 已配置 `fake-indexeddb/auto` polyfill
- Mock 工厂（`createMockModel` 等）和 i18n mock 已就绪

## Goals / Non-Goals

**Goals:**
- 为 4 个文件补充单元测试，覆盖所有可测试的代码分支
- 测试风格与项目现有规范一致（中文命名、语义查询、Mock 注释规范）
- 测试通过 `pnpm test:run` 且不引入 flaky test

**Non-Goals:**
- 不修改任何生产代码
- 不引入新的测试依赖（如 MSW）
- 不追求 100% 分支覆盖率——对纯展示性代码路径不强制覆盖

## Decisions

**1. `loadLanguageModule` 测试策略：Mock 动态 import 而非真实加载**

`loadLanguageModule` 是一个 40+ case 的 switch 函数，每个 case 执行 `import()` 动态加载。该文件当前在 `vite.config.ts` 中被排除覆盖率统计（注释：纯动态 import 映射，已被上层测试完整 mock）。现有上层测试（`highlightLanguageManager.test.ts`）通过 `vi.mock('@/utils/highlightLanguageIndex')` 整体替换模块，跳过了 switch 路由本身。补充此测试的价值在于：直接验证语言标识符到 `import()` 路径的映射正确性，在新增或修改语言分支时提供回归保护，这是上层集成测试无法覆盖的。

方案：对测试中选用的代表性语言（javascript、python、elixir、plaintext），逐个使用 `vi.mock('highlight.js/lib/languages/<lang>', ...)` 拦截具体模块路径。在测试内部 spy 或断言该模块被加载。对未知语言（`'brainfuck'`、空字符串）直接验证抛出 `Error`，无需 mock 任何模块。

未采用 glob 模式 `vi.mock('highlight.js/lib/languages/*')` 的原因：项目中无 glob mock 先例（全部使用精确路径），且 Vitest 4.x 对动态 `import()` 的 glob 拦截行为不确定。

备选方案：真实加载语言包—— rejected，因为需要 highlight.js 全量安装且测试耗时过长。

**2. `initIndexedDB` 测试策略：Mock `indexedDB.open()` 返回可控的 request 对象**

`initIndexedDB` 内部调用 `indexedDB.open()` 并监听三个事件。需要 mock `indexedDB.open` 返回一个可手动触发事件的 fake request 对象。

方案：创建一个 helper 函数 `createFakeIDBRequest()`，手动实现 `addEventListener`，允许测试代码触发 `error`/`success`/`upgradeneeded` 事件。

备选方案：依赖 `fake-indexeddb/auto` 的真实实现—— rejected，因为无法精确控制事件触发顺序和 `upgradeneeded` 条件。

**3. ModelSelect 组件测试策略：Mock `useFormField` 返回 error 状态**

ModelSelect 的核心逻辑是 `useFormField()` 返回的 `error` 控制边框样式。`useFormField` 来自 shadcn/ui form 组件。

方案：在测试中 mock `@/components/ui/form` 的 `useFormField` 返回 `{ error: 'xxx' }` 或 `{ error: undefined }`，验证 RadioGroup 的 className 是否包含 `border-red-500`。

**4. ProviderHeader 组件测试策略：测试 locale 感知的日期格式化**

`formatLastUpdate` 根据 `i18n.language` 切换 `zh-CN`/`en-US` locale。核心测试点是不同 locale 下输出格式不同。

方案：中文 locale 测试使用项目已有的 `globalThis.__mockI18n()` 工厂（默认 `language: 'zh'`）。英文 locale 测试不使用 `__mockI18n()` 工厂，因为 `createI18nMockReturn` 硬编码了 `language: 'zh'` 且不支持传入自定义值；改为直接 `vi.mock('react-i18next')` 并在返回对象中设置 `i18n: { language: 'en' }`。两个测试用例分别传入固定 ISO 日期，断言渲染文本包含预期的格式元素。

## Risks / Trade-offs

- **[Risk] highlight.js 逐语言 mock 的维护成本** → 仅 mock 测试中实际使用的 4 种代表性语言，不 mock 全部 40+ 种；新增语言分支由 error 分支测试间接保护
- **[Risk] `initIndexedDB` 的 fake request 与真实 IDBRequest 行为有差异** → 仅覆盖三个事件分支的 Promise 行为（resolve/reject/createObjectStore），不模拟复杂交互
- **[Risk] locale 日期格式化依赖运行时时区** → 使用固定输入日期 `2025-01-15T08:30:45.000Z`，断言仅验证时区无关的格式元素（年/月/日/分/秒）而非包含小时的精确字符串匹配，避免不同时区下测试失败
