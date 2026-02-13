## 1. 测试环境搭建

- [x] 1.1 创建测试文件 `src/utils/__tests__/crypto-masterkey.integration.test.ts`
- [x] 1.2 配置 Vitest 测试环境（describe、test、expect、beforeEach、afterEach）
- [x] 1.3 导入需要测试的模块（crypto.ts、masterKey.ts）
- [x] 1.4 配置 Mock 模块（`@/utils/tauriCompat`）

## 2. Mock 配置实现

- [x] 2.1 Mock `getPassword` 函数（支持返回密钥、null、抛出异常）
- [x] 2.2 Mock `setPassword` 函数（支持成功、抛出异常）
- [x] 2.3 Mock `isTauri` 函数（支持返回 true/false）
- [x] 2.4 在 `beforeEach` 中重置 Mock 状态（`vi.clearAllMocks()`）
- [x] 2.5 在 `afterEach` 中恢复 Mock 状态（验证 Mock 调用）

## 3. 生成密钥集成测试

- [x] 3.1 测试生成密钥后加密明文（验证密文格式）
- [x] 3.2 测试使用相同密钥解密密文（验证往返一致性）
- [x] 3.3 测试加密 Unicode 字符并解密（中文、emoji）
- [x] 3.4 测试密钥长度验证（64 字符，有效 hex）

## 4. 初始化密钥集成测试

- [x] 4.1 测试首次启动生成新密钥并加密（Mock getPassword 返回 null）
- [x] 4.2 测试已有密钥时复用并加密（Mock getPassword 返回有效密钥）
- [x] 4.3 测试使用初始化密钥进行往返加密/解密
- [x] 4.4 验证 setPassword 调用次数（首次 1 次，已有密钥 0 次）

## 5. 密钥重新生成场景测试

- [x] 5.1 测试重新生成密钥后解密旧数据失败（验证 OperationError）
- [x] 5.2 测试密钥丢失后解密失败（Mock getPassword 返回 null → 重新初始化）
- [x] 5.3 测试部分错误的密钥解密失败（密钥少量字符不同）
- [x] 5.4 验证错误消息包含"主密钥已更改或数据已损坏"

## 6. 密钥导出集成测试

- [x] 6.1 测试导出密钥后用于加密（Mock getPassword 返回有效密钥）
- [x] 6.2 测试导出密钥后用于解密（验证往返一致性）
- [x] 6.3 测试密钥不存在时导出失败（Mock getPassword 返回 null）
- [x] 6.4 验证错误消息包含"主密钥不存在，无法导出"

## 7. Tauri 和 Web 环境集成测试

- [x] 7.1 测试 Tauri 环境密钥初始化与加密（Mock isTauri 返回 true）
- [x] 7.2 测试 Web 环境密钥初始化与加密（Mock isTauri 返回 false）
- [x] 7.3 验证 Tauri 环境警告消息（"system secure storage"）
- [x] 7.4 验证 Web 环境警告消息（"browser secure storage (IndexedDB + encryption)"）
- [x] 7.5 测试 Tauri 环境 Keyring 异常时加密失败（Mock getPassword 抛出异常）
- [x] 7.6 测试 Web 环境 Keyring 异常时加密失败（Mock getPassword 抛出异常）

## 8. 测试隔离与验证

- [x] 8.1 验证每个测试用例独立执行（无状态共享）
- [x] 8.2 验证 Mock 不调用真实 Keyring（使用 vi.mocked）
- [x] 8.3 验证测试顺序不影响结果（随机运行测试）
- [x] 8.4 添加清晰的断言错误消息（便于调试）

## 9. 测试覆盖率验证

- [x] 9.1 验证所有主要集成场景有测试用例
- [x] 9.2 验证所有错误场景有测试用例
- [x] 9.3 运行测试套件验证通过（`pnpm test crypto-masterkey.integration`）
- [x] 9.4 检查测试文件可独立运行（不依赖其他测试文件）
- [x] 9.5 验证测试执行时间 < 5 秒

## 10. 文档与代码审查

- [x] 10.1 添加测试文件头部注释（说明测试目的和范围）
- [x] 10.2 为每个测试套件添加 describe 注释（说明测试场景）
- [x] 10.3 运行 lint 检查（`pnpm lint`）
- [x] 10.4 运行 typecheck 检查（`pnpm tsc`）
