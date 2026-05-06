## 1. 安装依赖

- [x] 1.1 安装 `@stryker-mutator/core` 和 `@stryker-mutator/vitest-runner` 为开发依赖

## 2. 配置

- [x] 2.1 在项目根目录创建 `stryker.config.json`，配置 vitest runner、试点文件范围、报告器、并发数、排除 StringLiteral 变异
- [x] 2.2 在 `package.json` 中添加 `test:mutation` 和 `test:mutation:core` 脚本

## 3. 试点运行

- [x] 3.1 对 `src/utils/crypto.ts` 运行突变测试，验证基础设施工作正常（最小的试点文件）
- [x] 3.2 对 `src/services/chat/index.ts` 运行突变测试
- [x] 3.3 对 `src/services/chat/providerLoader.ts` 运行突变测试
- [x] 3.4 对 `src/store/slices/chatSlices.ts` 运行突变测试
- [x] 3.5 运行完整试点 `pnpm test:mutation`，确认报告正常生成

## 4. 验证

- [x] 4.1 检查 `reports/mutation/mutation.html` 报告可正常浏览
- [x] 4.2 记录试点文件的突变分数基线（用于后续对比）
