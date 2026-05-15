## Context

项目测试套件对核心模块覆盖良好，但二次校验发现 3 个真实缺口：

1. **`tauriCompat/env.ts`**：`isTauri()`、`isTestEnvironment()`、`getPBKDF2Iterations()` 的真实逻辑从未被直接测试。全局 setup (`src/__test__/setup/mocks.ts:58-64`) 将整个模块 mock 掉，所有测试都在 mock 下运行。
2. **`ChatExportSetting.tsx`**：仅通过父组件 `GeneralSetting.test.tsx` 测试了"导出已删除聊天为空"一条路径，`downloadJson()`、导出全部、loading 状态、错误处理均未覆盖。
3. **`config/navigation.tsx`**：纯配置模块，被其他测试大量 mock，但自身无完整性校验。

当前测试架构：所有测试集中在 `src/__test__/` 下，按模块目录组织。

## Goals / Non-Goals

**Goals:**

- 为 `env.ts` 的 3 个函数编写直接测试（绕过全局 mock）
- 为 `ChatExportSetting.tsx` 补充组件交互测试，覆盖导出全部、loading、错误处理、文件下载等路径
- 为 `navigation.tsx` 编写配置完整性校验测试
- 所有新增测试遵循项目现有测试模式和规范

**Non-Goals:**

- 不修改任何源代码（纯增量测试）
- 不修改全局 mock 策略（仅在新测试文件中局部绕过）
- 不覆盖 `ModelSelect/Skeleton.tsx`（纯静态展示组件，优先级最低）

## Decisions

### Decision 1: env.ts 测试绕过全局 mock

**选择**：在新测试文件中使用 `vi.importActual` 导入真实模块，而非修改全局 setup

**理由**：全局 mock 是为其他 100+ 测试提供稳定环境，修改它影响面太大。新测试文件通过 `vi.importActual('@/utils/tauriCompat/env')` 局部导入真实逻辑即可。需要在测试中模拟 `window`、`globalThis`、`process.env` 等，因此使用 `beforeEach`/`afterEach` 清理副作用。

**替代方案**：
- 修改全局 mock → 影响面不可控，风险高
- 独立测试脚本 → 与现有 vitest 体系不一致

### Decision 2: ChatExportSetting.tsx 测试策略

**选择**：创建独立的组件测试文件，mock `exportAllChats`/`exportDeletedChats` 服务和 `downloadJson` 内部函数

**理由**：组件测试应隔离外部依赖。`downloadJson` 是模块内私有函数，无法直接 mock，需要通过 `Blob`/`URL.createObjectURL` 的全局 mock 来验证下载行为。

**测试路径**：
- 导出全部成功 → 验证调用 `exportAllChats`、触发下载、显示成功 toast
- 导出全部失败 → 验证显示错误 toast、loading 状态恢复
- 导出已删除成功 → 验证正常流程
- 导出已删除为空 → 验证 info toast、不触发下载
- Loading 状态 → 按钮 disabled
- 导出已删除失败 → 错误处理

### Decision 3: navigation.tsx 测试为静态配置校验

**选择**：编写纯同步断言测试，验证数据结构完整性

**理由**：`NAVIGATION_ITEMS` 和 `NAVIGATION_ITEM_MAP` 是编译时常量，测试应验证：
- 所有项包含必需字段（id、i18nKey、path、icon、IconComponent、theme）
- `NAVIGATION_ITEM_MAP` 与数组一一对应
- ID 唯一性
- theme 包含 base、active、inactive 字段
- 路径格式合法（以 `/` 开头）

## Risks / Trade-offs

- **env.ts 测试环境隔离** → `isTestEnvironment()` 检查多个全局变量，测试需谨慎清理以避免测试间污染。使用 `beforeEach` 重置 + `afterEach` 恢复。
- **downloadJson 测试** → 需 mock `Blob`、`URL.createObjectURL`、`document.createElement` 等浏览器 API。JSDOM 环境可能不支持全部特性，可能需要额外 polyfill。
- **模块级缓存** → `env.ts` 中 `_isTestEnv` 是模块级变量，在 vitest 进程中只计算一次。测试 `getPBKDF2Iterations` 时需要注意这个缓存行为。
