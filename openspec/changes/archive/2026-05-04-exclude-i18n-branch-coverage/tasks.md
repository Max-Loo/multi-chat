## 1. Spike：验证 Istanbul provider 可行性

- [x] 1.1 安装 `@vitest/coverage-istanbul` 依赖
- [x] 1.2 将 `vite.config.ts` 中 `coverage.provider` 从 `"v8"` 改为 `"istanbul"`
- [x] 1.3 运行 `pnpm test:coverage`，确认所有测试通过且覆盖率报告正常生成
- [x] 1.4 对比关键模块（components、pages）的分支覆盖率数据（结论：Istanbul 与 V8 报告相同的分支数，噪音来源是 React Compiler 而非 i18next，详见 design.md）

## 2. 调整覆盖率阈值

- [x] 2.1 基于 Istanbul provider 的实际覆盖率数据，调整 `vite.config.ts` 中各模块的覆盖率阈值
- [x] 2.2 运行 `pnpm test:coverage`，确认所有模块阈值检查通过

## 3. 同步文档

- [x] 3.1 更新 `src/__test__/README.md` 中的覆盖率阈值表格和覆盖率提供者说明，与 `vite.config.ts` 保持一致
