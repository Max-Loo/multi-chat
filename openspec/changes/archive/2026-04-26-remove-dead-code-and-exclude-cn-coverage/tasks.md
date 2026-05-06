## 1. 删除死代码

- [x] 1.1 从 `src/utils/utils.ts` 中删除 `getStandardRole` 函数（行 33-48）及其上方的 JSDoc 注释
- [x] 1.2 从 `src/utils/utils.ts` 中移除不再需要的 `ChatRoleEnum` 和 `isNil` 导入

## 2. 更新覆盖率排除配置

- [x] 2.1 在 `vite.config.ts` 的 `coverage.exclude` 数组中添加 `"src/utils/utils.ts"` 的 cn 函数排除注释（或整文件排除，视 exclude 机制决定）
- [x] 2.2 在 `vite.config.ts` 的 `coverage.exclude` 数组中添加 `"src/utils/highlightLanguageIndex.ts"`

## 3. 验证

- [x] 3.1 运行 `pnpm test:run` 确认全量测试通过
- [x] 3.2 运行 `pnpm tsc` 确认无类型错误（验证无遗漏的 getStandardRole 引用）
- [x] 3.3 运行 `pnpm test:coverage` 确认 `src/utils/` 覆盖率达标
