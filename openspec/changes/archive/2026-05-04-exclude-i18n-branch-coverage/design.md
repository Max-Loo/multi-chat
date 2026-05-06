## Context

当前覆盖率报告的分支覆盖率被 React Compiler 的 JSX 变换系统性拖低。

**根因（经实验验证）**：`babel-plugin-react-compiler` 在 Babel 转换阶段将 JSX 展开为带条件判断的 memoization 代码（null guard、依赖比较等）。这些条件分支在源码中不存在，是编译产物。V8 和 Istanbul 两个覆盖率提供者均操作 Babel 转换后的代码，因此报告相同的分支数。

**对照实验数据**（NoProvidersAvailable.tsx，源码仅含 5 个 `t()` 调用，无任何条件分支）：

| Provider | React Compiler | 分支数 | 全局分支覆盖率 |
|----------|---------------|--------|---------------|
| V8       | 开启 | 30 | 81.68% (2658/3254) |
| Istanbul | 开启 | 30 | 81.59% (2655/3254) |
| V8       | 关闭 | 0 | 91.20% (1276/1399) |
| Istanbul | 关闭 | 0 | 90.63% (1268/1399) |

React Compiler 约产生 1855 个额外分支（占总量 57%）。i18next `t()` 函数本身在两种 provider 下均不产生额外分支。

**最初的假设（已证伪）**：V8 字节码级分支归因将 i18next 内部分支归到 src/ 文件。实测证明 V8 无 React Compiler 时 t() 调用也产生 0 个分支。

**已排除的方案**：在 `coverage.exclude` 中添加 `node_modules/i18next/**` — 经实测确认无效。

## Goals / Non-Goals

**Goals:**
- 采用 Istanbul 作为覆盖率提供者（统一标准，Statement 覆盖率更准确）
- 基于实际数据调整覆盖率阈值
- 同步文档

**Non-Goals:**
- 不排除 React Compiler 生成的分支（这是编译产物，排除会掩盖真实的测试缺口）
- 不改变任何测试用例或运行时行为
- 不禁用 React Compiler（它是性能优化手段）

## Decisions

### Decision 1: 采用 Istanbul 覆盖率提供者

将 `vite.config.ts` 中 `coverage.provider` 设为 `"istanbul"`，并安装 `@vitest/coverage-istanbul` 依赖。

**选择**: Istanbul (Babel/SWC 插桩) 覆盖率提供者
**替代方案**:
- 保持 V8 → 可行，但 Istanbul 在 Statement 覆盖率上更准确（94.69% vs 90.93% 无 React Compiler 基准）
- `coverage.exclude` 排除 node_modules → 已实测无效
- 禁用 React Compiler → 会失去编译优化，且影响构建产物

**理由**:
- Istanbul 和 V8 在有 React Compiler 时报告相同的分支数，但 Istanbul 的 Statement 覆盖率更准确
- Vitest 官方支持的两种 provider 之一，维护稳定
- 虽然最初的目标（消除 i18n 噪音）被证伪，Istanbul 本身是合理的默认选择

**权衡**:
- 性能：Istanbul 通常比 V8 慢 2-3x。仅影响 `pnpm test:coverage`，日常 `pnpm test` 不受影响
- 新增依赖：`@vitest/coverage-istanbul`，约 2MB
- 覆盖率数字将变化：Statement 覆盖率会上升（更准确），分支覆盖率基本不变

### Decision 2: 阈值基于实际数据调整

切换 provider 后先运行一次完整覆盖率，用实际数据决定阈值。

## Risks / Trade-offs

- **覆盖率数字变化** → Istanbul 的 Statement 覆盖率高于 V8，分支覆盖率基本一致。需要建立新基线并调整阈值。
- **Istanbul 插桩与 Vite/ESBuild 不兼容** → Vitest 的 Istanbul provider 已适配 Vite 转换管线，实测通过。
- **构建时间增加** → Istanbul 插桩增加代码转换步骤。仅影响 `test:coverage`，日常开发不受影响。
