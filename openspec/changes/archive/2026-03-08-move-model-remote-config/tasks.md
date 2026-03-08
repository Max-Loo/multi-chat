## 1. 创建新配置文件

- [x] 1.1 创建 `src/services/modelRemote/` 目录
- [x] 1.2 创建 `src/services/modelRemote/config.ts` 文件
- [x] 1.3 在 `config.ts` 中定义 `REMOTE_MODEL_NETWORK_CONFIG` 常量（包含 DEFAULT_TIMEOUT, DEFAULT_MAX_RETRIES, RETRY_DELAY_BASE, API_ENDPOINT）
- [x] 1.4 在 `config.ts` 中定义 `REMOTE_MODEL_CACHE_CONFIG` 常量（包含 EXPIRY_TIME_MS, CACHE_VERSION, MAX_CACHE_SIZE_MB）
- [x] 1.5 在 `config.ts` 中定义 `ALLOWED_REMOTE_MODEL_PROVIDERS` 常量（包含供应商白名单数组）
- [x] 1.6 在 `config.ts` 中添加所有常量的 JSDoc 中文注释

## 2. 更新 modelRemoteService.ts

- [x] 2.1 更新导入语句：从 `@/utils/constants` 改为 `./config`
- [x] 2.2 替换 `NETWORK_CONFIG` 为 `REMOTE_MODEL_NETWORK_CONFIG`
- [x] 2.3 替换 `CACHE_CONFIG` 为 `REMOTE_MODEL_CACHE_CONFIG`
- [x] 2.4 替换 `ALLOWED_MODEL_PROVIDERS` 为 `ALLOWED_REMOTE_MODEL_PROVIDERS`
- [x] 2.5 验证所有引用已更新（约 10 处）

## 3. 清理 constants.ts

- [x] 3.1 从 `src/utils/constants.ts` 移除 `NETWORK_CONFIG` 导出（第 66-75 行）
- [x] 3.2 从 `src/utils/constants.ts` 移除 `CACHE_CONFIG` 导出（第 80-87 行）
- [x] 3.3 从 `src/utils/constants.ts` 移除 `ALLOWED_MODEL_PROVIDERS` 导出（第 92-97 行）

## 4. 验证和测试

- [x] 4.1 运行 `pnpm tsc` 进行类型检查
- [x] 4.2 运行 `pnpm lint` 进行代码检查
- [x] 4.3 运行 `pnpm test` 执行单元测试
- [x] 4.4 运行 `pnpm tauri dev` 验证应用启动正常
- [x] 4.5 手动测试远程模型数据获取功能是否正常

## 5. 文档更新

- [x] 5.1 更新 AGENTS.md 中的相关说明（如有）
- [x] 5.2 检查 README.md 是否需要更新（通常不需要）
