## Context

当前项目测试覆盖率配置存在三个问题：

1. **阈值形同虚设**：`vite.config.ts` 中全局阈值设为 60%，而 README 声明目标为 85%+ 分支覆盖和 90%+ 行覆盖，两者严重脱节
2. **不可测代码拖累整体**：`src/@types/`（类型声明）和纯 re-export barrel files 被纳入覆盖率计算，拉低整体数字
3. **关键模块覆盖不足**：`config/initSteps.ts` 仅 31%（所有 execute 函数体未测试）、`store/storage/storeUtils.ts` 为 0%（saveToStore/loadFromStore 未测试）、`pages/Chat/index.tsx` 为 0%（chatId 重定向逻辑未测试）

当前各模块实际覆盖率：hooks 95%、services 85%、store 91%、utils 87%、components 74%、router 59%、config 31%、pages/Chat 0%。

## Goals / Non-Goals

**Goals:**
- 建立分模块覆盖率阈值体系，替代全局一刀切
- 排除不可测代码，使覆盖率数字反映真实质量
- 为 3 个未达标模块补充测试用例
- 更新 README 目标描述与配置保持一致

**Non-Goals:**
- 不追求所有模块达到 85%+（pages 等复杂 UI 模块 ROI 不高）
- 不改动现有通过的测试用例
- 不重构测试基础设施（globalThis 管道等问题另行处理）
- 不补充 components/ui 的测试（整体已过阈值）

## Decisions

### Decision 1: 分模块阈值 vs 全局阈值

**选择**：使用 Vitest 的 `per-file` 阈值配置，按模块目录设置不同覆盖率目标。

**理由**：各模块测试难度和 ROI 差异巨大。hooks 几乎都是纯函数（95%），而 pages 包含复杂 UI 交互（0%）。全局阈值无法反映这种差异。

**阈值方案**：

| 模块 | 行覆盖率 | 分支覆盖率 | 当前实际 |
|------|---------|-----------|---------|
| hooks/ | 85% | 80% | 95% |
| services/ | 75% | 70% | 85% |
| store/ | 75% | 70% | 91% |
| utils/ | 75% | 65% | 87% |
| components/ | 65% | 50% | 74% |
| config/ | 50% | 50% | 31% |
| pages/ | 50% | 40% | 0% |
| router/ | 50% | 40% | 59% |
| 全局底线 | 65% | 55% | 75% |

**备选方案**：继续使用全局阈值但提高至 70%。被否决，因为 pages 和 config 会持续拖累整体，而 hooks/services 已经远超目标。

### Decision 2: coverage exclude 策略

**选择**：在 `coverage.exclude` 中添加 `src/@types/**`、`src/pages/Model/index.tsx`。

**不排除的**：barrel re-export 文件（`src/utils/tauriCompat/index.ts`、`src/store/storage/index.ts`）不排除，因为 Vitest V8 provider 会自动处理纯 re-export，且手动排除容易遗漏新增文件。

### Decision 3: storeUtils 测试策略

**选择**：直接 mock `StoreCompat` 接口，不依赖 fake-indexeddb。

**理由**：`saveToStore` 和 `loadFromStore` 接受 `StoreCompat` 参数，不需要真实的 IndexedDB 环境。使用 mock 可以精确控制 init/set/get/save 的行为，独立测试错误处理路径。

### Decision 4: initSteps 测试策略

**选择**：mock 所有外部依赖（Redux store、i18n、master key 等），只测 step 的 execute 和 onError 回调逻辑。

**理由**：initSteps 是配置文件，execute 函数体是胶水代码（调用其他模块并传递结果）。测试目标是验证"调用正确、结果传递正确、错误处理正确"，而非验证被调用模块的功能。

### Decision 5: ChatPage 测试策略

**选择**：使用 React Testing Library + mock Redux store，测试 useEffect 中的 chatId 重定向逻辑和 mobile/desktop 条件渲染。

**理由**：ChatPage 的核心逻辑是 URL 参数处理和条件渲染，这正是 RTL 擅长的场景。使用项目现有的 `renderWithRedux` 辅助工具。

## Risks / Trade-offs

- **[风险] 分模块阈值增加维护成本** → 每新增模块需手动配置。缓解：全局底线兜底，新模块不会漏掉
- **[风险] initSteps mock 过多可能测试的是 mock 而非逻辑** → 只 mock 外部依赖的返回值，验证 execute 内部的分支和结果传递
- **[权衡] pages 阈值设为 50%，对 Chat 以外的页面要求较低** → 当前 pages/Model 是空壳、pages/Setting 已有 75%。50% 是合理的起步点
