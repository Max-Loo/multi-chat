## 1. 实现缓存

- [x] 1.1 在 `src/utils/tauriCompat/env.ts` 中添加模块级私有常量 `_isTestEnv`，在 `isTestEnvironment()` 定义后立即计算并赋值
- [x] 1.2 修改 `getPBKDF2Iterations()` 使用 `_isTestEnv` 常量代替调用 `isTestEnvironment()`

## 2. 验证

- [x] 2.1 运行 `pnpm test:all` 确认所有现有测试通过
- [x] 2.2 运行 `pnpm tsc` 确认类型检查通过
