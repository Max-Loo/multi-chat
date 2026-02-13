## 1. 测试环境准备

- [x] 1.1 创建 `src/utils/tauriCompat/__mocks__/index.ts` Mock 文件（新增）
- [x] 1.2 实现 `getPassword` mock 函数，支持 `mockResolvedValue`、`mockRejectedValue`（新增）
- [x] 1.3 实现 `setPassword` mock 函数，支持 `mockResolvedValue`、`mockRejectedValue`（新增）
- [x] 1.4 实现 `isTauri` mock 函数，支持 `mockReturnValue`（新增）
- [x] 1.5 添加 TypeScript 类型导出，确保 Mock 函数类型正确（新增）

## 2. 测试文件基础结构

> **发现**: `src/__test__/store/keyring/masterKey.test.ts` 已存在，包含 53 个测试，覆盖 98.3%
> 原计划创建 `src/store/keyring/__tests__/masterKey.test.ts`，但已存在更全面的测试，无需重复

- [x] 2.1 创建 `src/store/keyring/__tests__/masterKey.test.ts` 测试文件（已存在更全面的版本）
- [x] 2.2 导入 `describe`、`it`、`expect`、`vi`、`beforeEach`、`afterEach` 从 `vitest`（已存在）
- [x] 2.3 在文件顶部添加 `vi.mock("@/utils/tauriCompat")` Mock 声明（已存在）
- [x] 2.4 导入所有需要测试的函数从 `@/store/keyring/masterKey`（已存在）
- [x] 2.5 在每个 `describe` 块中添加 `beforeEach()` 重置 Mock 状态（已存在）

## 3. generateMasterKey() 测试

- [x] 3.1 测试生成的密钥长度为 64 个字符（32 字节）
- [x] 3.2 测试生成的密钥为有效十六进制格式（0-9, a-f）
- [x] 3.3 测试多次生成产生不同的密钥（调用 100 次，至少 99 次不同）

## 4. isMasterKeyExists() 测试

- [x] 4.1 测试密钥已存在场景（`getPassword` 返回有效字符串）
- [x] 4.2 测试密钥不存在场景（`getPassword` 返回 `null`）
- [x] 4.3 测试 Keyring 异常场景（`getPassword` 抛出异常）

## 5. getMasterKey() 测试

- [x] 5.1 测试成功获取密钥场景（`getPassword` 返回有效字符串）
- [x] 5.2 测试密钥不存在场景（`getPassword` 返回 `null`）
- [x] 5.3 测试 Web 环境 Keyring 异常（`isTauri` 返回 `false`，`getPassword` 抛出异常）
- [x] 5.4 测试 Tauri 环境 Keyring 异常（`isTauri` 返回 `true`，`getPassword` 抛出异常）

## 6. storeMasterKey() 测试

- [x] 6.1 测试成功存储密钥场景（`setPassword` 成功调用）
- [x] 6.2 测试 Web 环境 Keyring 异常（`isTauri` 返回 `false`，`setPassword` 抛出异常）
- [x] 6.3 测试 Tauri 环境 Keyring 异常（`isTauri` 返回 `true`，`setPassword` 抛出异常）

## 7. initializeMasterKey() 测试

- [x] 7.1 测试密钥已存在场景（`getMasterKey` 返回有效密钥）
- [x] 7.2 测试密钥不存在时生成并存储新密钥
- [x] 7.3 测试 Web 环境生成新密钥时的警告日志（`console.warn` spy）
- [x] 7.4 测试 Tauri 环境生成新密钥时的警告日志（`console.warn` spy）

## 8. handleSecurityWarning() 测试

- [x] 8.1 测试 Tauri 环境直接返回（`isTauri` 返回 `true`）
- [x] 8.2 测试 Web 环境且用户已确认（`localStorage.getItem` 返回 `'true'`）
- [x] 8.3 测试 Web 环境首次使用时显示永久性 Toast（mock `import('sonner')`）
- [x] 8.4 测试用户点击 Toast 按钮后保存确认状态（`localStorage.setItem` spy）

## 9. exportMasterKey() 测试

- [x] 9.1 测试密钥存在时成功导出
- [x] 9.2 测试密钥不存在时抛出错误（`getMasterKey` 返回 `null`）

## 10. Mock 工具测试

- [x] 10.1 验证 Mock 函数被正确调用（`vi.mocked(getPassword).mockResolvedValue`）
- [x] 10.2 验证每个测试用例独立执行（`beforeEach` 重置 Mock）
- [x] 10.3 验证 Mock 支持不同返回值配置（`mockResolvedValue`、`mockRejectedValue`）

## 11. 验证和优化

- [x] 11.1 运行 `pnpm test` 验证所有测试通过（发现已存在 53 个测试）
- [x] 11.2 运行 `pnpm test:coverage` 检查测试覆盖率（98.3% 超过 90% 目标 ✓）
- [x] 11.3 检查测试执行时间，确保无慢速测试（所有测试 < 500ms ✓）
- [x] 11.4 优化 Mock 函数实现，确保可复用性（现有已优化）

## 12. 文档和清理

- [x] 12.1 在测试文件顶部添加注释，说明测试覆盖范围（现有已包含）
- [x] 12.2 为 Mock 工具添加 JSDoc 注释，说明使用方法
- [x] 12.3 运行 `pnpm lint` 确保代码风格符合规范（0 错误 ✓）
- [x] 12.4 运行 `pnpm tsc` 确保类型检查通过（0 错误 ✓）
