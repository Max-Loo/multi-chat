## 1. 测试环境准备

- [x] 1.1 创建测试文件 `src/__test__/store/keyring/masterKey.test.ts`
- [x] 1.2 配置 Vitest 和 happy-dom 测试环境
- [x] 1.3 创建 tauriCompat 全局 mock（getPassword、setPassword、isTauri）
- [x] 1.4 验证测试基础设施正常工作（运行空测试套件）

## 2. 密钥生成测试（generateMasterKey）

- [x] 2.1 实现密钥长度验证测试（64 个十六进制字符）
- [x] 2.2 实现密钥格式验证测试（仅包含0-9 和 a-f）
- [x] 2.3 实现密钥随机性验证（100 次生成无重复）
- [x] 2.4 实现密钥性能测试（单次生成 < 10ms）
- [x] 2.5 验证使用 crypto.getRandomValues() 方法

## 3. 密钥存在性检查测试（isMasterKeyExists）

- [x] 3.1 实现密钥存在场景测试（getPassword 返回有效密钥）
- [x] 3.2 实现密钥不存在场景测试（getPassword 返回 null）
- [x] 3.3 实现错误处理场景测试（getPassword 抛出异常）
- [x] 3.4 验证异常时返回 false 并记录错误日志

## 4. 密钥获取测试（getMasterKey）

- [x] 4.1 实现正常获取场景测试（密钥存在且有效）
- [x] 4.2 实现密钥不存在场景测试（返回 null）
- [x] 4.3 实现 Web 环境错误处理测试（IndexedDB 不可用或解密失败）
- [x] 4.4 实现 Tauri 环境错误处理测试（系统钥匙串不可用）
- [x] 4.5 验证错误消息包含环境特定提示

## 5. 密钥存储测试（storeMasterKey）

- [x] 5.1 实现存储成功场景测试（setPassword 正常调用）
- [x] 5.2 实现 Web 环境存储失败测试（IndexedDB 不可用或加密失败）
- [x] 5.3 实现 Tauri 环境存储失败测试（系统钥匙串不可用）
- [x] 5.4 验证失败时抛出包含具体原因的错误

## 6. 主密钥初始化测试（initializeMasterKey）

- [x] 6.1 实现首次生成场景测试（密钥不存在，生成并存储新密钥）
- [x] 6.2 实现密钥已存在场景测试（返回现有密钥，不生成新密钥）
- [x] 6.3 实现生成失败场景测试（generateMasterKey 或 storeMasterKey 抛出异常）
- [x] 6.4 实现 Web 环境初始化日志验证（包含安全级别警告）
- [x] 6.5 实现 Tauri 环境初始化日志验证（不显示安全警告）
- [x] 6.6 验证密钥丢失时提示用户重新配置 API 密钥

## 7. 安全警告处理测试（handleSecurityWarning）

- [x] 7.1 实现 Tauri 环境跳过警告测试（isTauri 返回 true）
- [x] 7.2 实现 Web 环境首次使用显示警告测试
- [x] 7.3 实现 Web 环境已确认跳过警告测试（localStorage 标记已设置）
- [x] 7.4 实现 Toast 动态导入测试（使用 await import('sonner')）
- [x] 7.5 验证 Toast 显示永久警告（duration: Infinity）
- [x] 7.6 验证 Toast 操作按钮设置 localStorage 标记

## 8. 主密钥导出测试（exportMasterKey）

- [x] 8.1 实现正常导出场景测试（密钥存在，返回密钥字符串）
- [x] 8.2 实现密钥不存在导出失败测试（抛出"主密钥不存在"错误）
- [x] 8.3 验证导出功能依赖 getMasterKey

## 9. 跨平台兼容性测试

- [x] 9.1 实现所有函数在 Tauri 环境的行为测试
- [x] 9.2 实现所有函数在 Web 环境的行为测试
- [x] 9.3 验证 isTauri mock 正确模拟两种环境
- [x] 9.4 验证错误消息在两种环境中的差异

## 10. 覆盖率和质量验证

- [x] 10.1 运行 `pnpm test:coverage` 生成覆盖率报告
- [x] 10.2 验证测试覆盖率达到 80% 以上
- [x] 10.3 验证所有测试用例通过（无失败或跳过）
- [x] 10.4 检查测试代码质量（命名、组织、可读性）
- [x] 10.5 添加必要的测试文档注释

## 11. 手动验证和文档

- [x] 11.1 在 Tauri 开发环境运行真实场景测试（pnpm tauri dev）
- [x] 11.2 在 Web 环境运行真实场景测试（浏览器中测试）
- [ ] 11.3 更新 AGENTS.md 文档（如需要，记录测试模式）
- [ ] 11.4 为后续测试工作提供参考模板（storeUtils.ts、modelStorage.ts 等）
