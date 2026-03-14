# Vite 8 迁移任务列表

## 0. 性能基准建立（迁移前）

- [x] 0.1 运行 `pnpm web:build` 建立迁移前构建时间基准
- [x] 0.2 记录迁移前构建产物大小（dist 目录总大小）
- [x] 0.3 记录迁移前各 vendor chunk 大小（从 dist/stats.html）
- [x] 0.4 测量开发服务器冷启动时间（从启动到可访问）
- [x] 0.5 测量 HMR 响应时间（修改文件到页面更新）

## 1. 依赖升级

- [x] 1.1 在 `package.json` 中将 `vite` 从 `^7.3.1` 升级到 `^8.0.0`
- [x] 1.2 运行 `pnpm install` 安装升级后的依赖
- [x] 1.3 验证 `pnpm install` 无错误完成

## 2. 配置文件迁移

- [x] 2.1 在 `vite.config.ts` 中将 `build.rollupOptions` 重命名为 `build.rolldownOptions`
- [x] 2.2 保留 `manualChunks` 函数形式（Rolldown 仍支持）
- [x] 2.3 配置 React 和 React-DOM 分割策略（使用否定前瞻避免匹配 react-router）
- [x] 2.4 配置 Redux 相关库分割策略
- [x] 2.5 配置 Router 相关库分割策略
- [x] 2.6 配置 Highlight.js 代码高亮库分割策略
- [x] 2.7 配置 Ant Design X 组件库分割策略
- [x] 2.8 配置 Vercel AI SDK 分割策略
- [x] 2.9 其他依赖由 Rolldown 自动处理
- [x] 2.10 验证配置文件语法正确（TypeScript 编译检查）

## 3. 开发环境验证

- [x] 3.1 运行 `pnpm web:dev` 启动开发服务器
- [x] 3.2 验证开发服务器成功启动（无错误）
- [x] 3.3 测量开发服务器冷启动时间，对比迁移前基准（**335 ms**）
- [x] 3.4 验证 HMR（热模块替换）正常工作
- [x] 3.5 测量 HMR 响应时间，对比迁移前基准
- [x] 3.6 验证所有路由可访问
- [x] 3.7 验证 API 代理正常工作（deepseek, kimi, zhipuai）
- [x] 3.8 检查控制台无错误或警告

## 4. 生产构建验证

- [x] 4.1 运行 `pnpm web:build` 执行生产构建
- [x] 4.2 验证构建成功完成（无错误）
- [x] 4.3 检查 `dist/` 目录生成正确（**3.1M**）
- [x] 4.4 打开 `dist/stats.html` 验证代码分割正确（vendor chunks 已正确分割）
- [x] 4.5 对比构建产物大小与迁移前（确保无异常增长）
- [x] 4.6 对比各 vendor chunk 大小与迁移前基准
- [x] 4.7 验证构建时间是否 ≤ 迁移前基准（**5.08s**）
- [x] 4.8 运行 `pnpm preview` 预览生产构建
- [x] 4.9 验证预览应用功能正常

## 5. Tauri 构建验证

- [ ] 5.1 运行 `pnpm build` 执行 Tauri 构建
- [ ] 5.2 验证 Tauri 构建成功完成
- [ ] 5.3 启动 Tauri 应用
- [ ] 5.4 验证应用正常运行
- [ ] 5.5 验证所有核心功能工作正常

## 6. 测试套件验证

- [x] 6.1 运行 `pnpm test:run` 执行单元测试
- [x] 6.2 验证所有单元测试通过（**110 个测试文件，1496 个测试通过**）
- [x] 6.3 运行 `pnpm test:integration:run` 执行集成测试
- [ ] 6.4 验证所有集成测试通过（**运行中，已修复 2 个问题**）
- [x] 6.5 如有测试失败，检查是否与 CJS 互操作变更相关（**已修复**）
- [x] 6.6 如有测试失败，尝试调整 `test.deps.optimizer.web.include` 配置（**已修复**）
- [x] 6.7 如有测试失败，使用 `pnpm test:run --reporter=verbose` 获取详细输出（已完成）
- [x] 6.8 如有测试失败，隔离运行失败的测试文件以定位问题（**已修复**）
  - ✓ 增加 hookTimeout 到 60 秒（适应 PBKDF2 密钥派生时间）
  - ✓ 修复 settings-change 测试的返回值格式问题

## 7. 文档更新

- [x] 7.1 更新 design.md 以反映实际实现（保留 manualChunks 函数形式）
- [x] 7.2 更新 tasks.md 以反映简化后的代码分割策略
- [x] 7.3 回滚命令已在 design.md 中记录
