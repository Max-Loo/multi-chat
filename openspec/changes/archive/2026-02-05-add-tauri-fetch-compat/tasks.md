# HTTP Fetch 跨平台兼容层 - 实现任务

## 1. 核心实现

- [x] 1.1 创建 `src/utils/tauriCompat/http.ts` 模块文件
- [x] 1.2 实现 `createFetch()` 内部函数，包含环境判断逻辑（开发/生产 + Tauri/Web）
- [x] 1.3 实现动态导入 Tauri fetch，添加 try-catch 降级机制
  - 使用标准 ES 模块 `import()` 动态导入（非 `require()`）
  - 配合顶层 await 在模块初始化时完成导入
  - try-catch 捕获导入失败，降级到 Web fetch
  - 记录警告日志到控制台
- [x] 1.4 实现顶层变量 `_fetchInstance` 使用顶层 await 初始化（模块级常量）
  - 使用 `const _fetchInstance: FetchFunc = await createFetch()`
  - 模块加载时等待初始化完成
  - 后续所有调用使用已初始化的实例，无需额外判断
  - 初始化时机：开发/生产 Web 环境 0ms，生产 Tauri 环境约 10-50ms
- [x] 1.5 实现并导出 `fetch` 函数，使用 `_fetchInstance` 缓存
- [x] 1.6 实现并导出 `getFetchFunc()` 方法，返回 fetch 函数实例
- [x] 1.7 定义并导出 `RequestInfo` 类型：`type RequestInfo = string | URL | Request`
- [x] 1.8 定义并导出 `FetchFunc` 类型：`(input: RequestInfo, init?: RequestInit) => Promise<Response>`
- [x] 1.9 重新导出原生类型 `RequestInit`、`Response`、`Headers`、`Request`
- [x] 1.10 添加完整的 JSDoc 中文注释，包含使用示例

## 2. 模块集成

- [x] 2.1 更新 `src/utils/tauriCompat/index.ts`，导入 HTTP 兼容层模块
- [x] 2.2 在 index.ts 中导出 `fetch` 和 `getFetchFunc` 函数
- [x] 2.3 在 index.ts 中导出类型定义：`RequestInfo`、`FetchFunc`、`RequestInit`、`Response`、`Headers`、`Request`
- [x] 2.4 更新 index.ts 的模块文档注释，添加 HTTP 兼容层使用示例

## 3. 现有代码迁移

- [x] 3.1 使用 `grep` 或 IDE 搜索功能，查找所有使用 `@tauri-apps/plugin-http` 的代码文件
- [x] 3.2 检查搜索结果，确认需要迁移的文件列表和导入语句
- [x] 3.3 逐个文件替换导入语句：`import { fetch as tauriFetch } from '@tauri-apps/plugin-http'` → `import { fetch } from '@/utils/tauriCompat'`
- [x] 3.4 如果使用了其他 Tauri HTTP 类型，相应替换为兼容层导出的类型
- [x] 3.5 检查代码中是否有对 `tauriFetch` 的特殊调用，确保替换后的 `fetch` 行为一致
- [x] 3.6 对每个修改的文件进行功能验证，确保替换后功能正常
- [x] 3.7 如果项目中没有使用 `@tauri-apps/plugin-http` 的代码，在任务清单中标注"无需迁移"
- [x] 3.8 在迁移完成后，再次运行 `grep` 确认没有遗漏的 `@tauri-apps/plugin-http` 导入

## 4. 代码质量验证

- [x] 4.1 运行 `pnpm tsc` 进行 TypeScript 类型检查，确保无类型错误
- [x] 4.2 运行 `pnpm lint` 进行代码规范检查，修复 lint 错误
- [x] 4.3 验证导出的 API 类型与标准 Fetch API 兼容
- [x] 4.4 确认 `RequestInfo` 类型在 Tauri 和 Web 环境中都能正常工作
- [x] 4.5 验证迁移后的代码类型检查通过，无类型错误

## 5. 文档更新

- [x] 5.1 在 AGENTS.md 的"兼容层目录结构"部分添加 `http.ts` 说明
- [x] 5.2 在 AGENTS.md 中新增"HTTP 插件兼容层"章节
- [x] 5.3 添加环境判断逻辑说明（开发/生产 + Tauri/Web）
- [x] 5.4 添加 `fetch` 和 `getFetchFunc` 的使用示例
- [x] 5.5 添加类型定义说明（RequestInfo 自定义，其他类型复用原生）
- [x] 5.6 添加 Web 端功能差异说明（如果存在）
- [x] 5.7 添加开发环境限制说明（开发环境无法测试 Tauri fetch）
- [x] 5.8 添加使用场景示例：直接调用 fetch、封装自定义方法、注入第三方库（如 Axios）
- [x] 5.9 添加现有代码迁移指南：说明如何替换 `@tauri-apps/plugin-http` 导入为兼容层 API
- [x] 5.10 添加迁移前后的代码对比示例，帮助开发者理解变更

## 6. 开发环境测试

- [ ] 6.1 启动开发服务器 `pnpm tauri dev`
- [ ] 6.2 在浏览器 DevTools 中测试 fetch 调用，验证使用 Web fetch
- [ ] 6.3 测试 GET 请求的基本功能
- [ ] 6.4 测试 POST 请求带请求体
- [ ] 6.5 测试带完整配置选项的请求（headers、mode、credentials 等）
- [ ] 6.6 测试错误处理（网络错误、HTTP 错误响应）
- [ ] 6.7 验证 `getFetchFunc()` 返回的函数与直接调用 `fetch` 行为一致
- [ ] 6.8 验证类型推导正常工作（TypeScript 编译时检查）
- [ ] 6.9 如果有迁移的代码，测试迁移后的功能是否正常工作

## 7. Web 环境构建测试

- [ ] 7.1 构建 Web 生产版本（如果项目支持 Web 构建）
- [ ] 7.2 在浏览器中打开应用，测试 fetch 功能
- [ ] 7.3 验证 Web 环境使用原生 Web fetch
- [ ] 7.4 测试各种 HTTP 请求场景（GET、POST、PUT、DELETE 等）
- [ ] 7.5 验证浏览器控制台无 Tauri 插件加载错误
- [ ] 7.6 如果有迁移的代码，测试迁移后的功能在 Web 环境中是否正常

## 8. Tauri 生产环境测试

- [ ] 8.1 构建 Tauri 生产版本 `pnpm tauri build`
- [ ] 8.2 在 Tauri 桌面环境中启动应用
- [ ] 8.3 测试 fetch 调用，验证使用 Tauri fetch
- [ ] 8.4 验证 Tauri fetch 的系统代理功能（如果配置了代理）
- [ ] 8.5 验证 Tauri fetch 的证书管理功能（如果使用 HTTPS）
- [ ] 8.6 测试网络错误场景，验证错误处理正常
- [ ] 8.7 验证动态导入失败时的降级机制（手动触发错误场景）
- [ ] 8.8 检查应用日志，确认无警告或错误信息
- [ ] 8.9 如果有迁移的代码，测试迁移后的功能在 Tauri 环境中是否正常

## 9. 代码清理和优化

- [x] 9.1 移除开发过程中添加的调试代码（如果有）
- [x] 9.2 优化代码注释，确保清晰易懂
- [x] 9.3 检查代码性能，确认无不必要的重复计算
- [x] 9.4 验证所有导出项都有对应的类型定义
- [x] 9.5 确认代码风格与项目其他兼容层模块一致
- [x] 9.6 如果有迁移的代码，检查是否还有未使用的 `@tauri-apps/plugin-http` 相关导入
- [x] 9.7 移除 BaseFetchApi.getFetchFunc 方法
- [x] 9.8 更新 BigModelProvider 直接导入 getFetchFunc
- [x] 9.9 更新 DeepseekProvider 直接导入 getFetchFunc
- [x] 9.10 更新 KimiProvider 直接导入 getFetchFunc
- [x] 9.11 验证重构后的类型检查和功能正常

## 10. 最终验证

- [x] 10.1 再次运行 `pnpm tsc` 和 `pnpm lint`，确保无错误
- [ ] 10.2 在 Tauri 和 Web 环境中分别进行完整的功能测试
- [ ] 10.3 验证 AGENTS.md 文档完整且准确
- [ ] 10.4 确认所有任务已完成，无遗漏项
- [ ] 10.5 准备提交变更，创建 git commit（如果用户要求）

## 任务完成标准

每个任务应在完成后进行验证：
- **代码任务**：运行 `pnpm tsc` 和 `pnpm lint` 无错误
- **文档任务**：文档内容准确、完整、格式正确
- **测试任务**：在相应环境中验证功能正常工作
- **迁移任务**：所有使用 `@tauri-apps/plugin-http` 的代码已替换为兼容层 API，且功能验证通过
- **所有任务完成后**：HTTP 兼容层在开发、Web 生产、Tauri 生产三个环境中都能正常工作，类型定义完整，文档齐全，现有代码已完全迁移
