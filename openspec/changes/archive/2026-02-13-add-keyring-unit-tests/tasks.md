# Keyring 单元测试实施任务清单

## 1. 准备工作

- [x] 1.1 安装 `fake-indexed-db` 开发依赖
  ```bash
  pnpm add -D fake-indexeddb
  ```

- [x] 1.2 创建测试文件和目录结构
  - 创建 `src/__test__/utils/tauriCompat/` 目录（如果不存在）
  - 创建 `src/__test__/utils/tauriCompat/keyring.test.ts` 文件

- [x] 1.3 设置测试文件基础结构
  - 导入 Vitest 函数（describe、it、expect、vi、beforeEach、afterEach）
  - 添加顶层 describe 块：`describe('Keyring 兼容层测试套件', () => { ... })`
  - 添加全局 beforeEach（清理 Mock）和 afterEach（恢复 Mock）

- [x] 1.4 配置测试基础设施验证
  - 添加 describe 块：`describe('测试基础设施验证', () => { ... })`
  - 测试 Mock 函数是否正确配置
  - 测试 localStorage Mock 是否工作
  - 验证测试环境正常

## 2. Tauri 环境测试

- [x] 2.1 配置 Tauri 环境 Mock
  - 使用 `vi.mock` 模拟 `tauri-plugin-keyring-api`
  - 提供 getPassword、setPassword、deletePassword 的 Mock 实现
  - 使用 `vi.mock` 模拟 `@/utils/tauriCompat/env` 的 isTauri，返回 true

- [x] 2.2 实现 Tauri 环境 setPassword 测试
  - 添加 describe 块：`describe('Tauri 环境 - setPassword', () => { ... })`
  - 测试：应该调用 Tauri API 并传递正确的参数
  - 测试：应该传递 service、user、password 参数
  - 测试：应该传播 Tauri API 的异常

- [x] 2.3 实现 Tauri 环境 getPassword 测试
  - 添加 describe 块：`describe('Tauri 环境 - getPassword', () => { ... })`
  - 测试：应该调用 Tauri API 并传递正确的参数
  - 测试：应该返回密码字符串（当密钥存在）
  - 测试：应该返回 null（当密钥不存在）
  - 测试：应该传播 Tauri API 的异常

- [x] 2.4 实现 Tauri 环境 deletePassword 测试
  - 添加 describe 块：`describe('Tauri 环境 - deletePassword', () => { ... })`
  - 测试：应该调用 Tauri API 并传递正确的参数
  - 测试：应该成功删除（不抛出异常）
  - 测试：应该传播 Tauri API 的异常

- [x] 2.5 实现 Tauri 环境 isKeyringSupported 测试
  - 添加 describe 块：`describe('Tauri 环境 - isKeyringSupported', () => { ... })`
  - 测试：应该返回 true（Tauri 环境始终支持）

## 3. Web 环境 - 测试基础设施

- [x] 3.1 配置 Web 环境 Mock
  - 使用 `vi.mock` 模拟 `@/utils/tauriCompat/env` 的 isTauri，返回 false
  - 配置 `fake-indexeddb`，替换全局 indexedDB

- [x] 3.2 实现 localStorage Mock 清理
  - 在 beforeEach 中创建 localStorage Mock
  - 在 beforeEach 中清理 localStorage（localStorage.clear()）
  - 测试：应该正确设置和读取种子

- [x] 3.3 实现 IndexedDB Mock 清理
  - 在 beforeEach 中初始化 fake-indexeddb
  - 在 beforeEach 中清空 IndexedDB 数据库（通过 unstubAllGlobals 实现）
  - 在 afterEach 中关闭数据库连接

- [x] 3.4 实现 Web 环境基础设施测试
  - 添加 describe 块：`describe('Web 环境 - 基础设施', () => { ... })`
  - 测试：应该正确初始化 IndexedDB
  - 测试：应该从 localStorage 读取种子（通过 localStorage 设置和读取测试验证）
  - 测试：应该生成新种子并存储到 localStorage（通过后续 setPassword 测试间接验证）

## 4. Web 环境 - 加密和解密测试

- [x] 4.1 实现密钥派生测试
  - 添加 describe 块：`describe('Web 环境 - 加密和解密', () => { ... })`
  - 测试：应该使用相同的种子派生相同的密钥（通过 setPassword/getPassword 验证）
  - 注：deriveEncryptionKey 是内部函数，通过间接测试验证

- [x] 4.2 实现加密功能测试
  - 测试：应该使用 AES-256-GCM 算法加密
  - 测试：应该生成唯一的 IV
  - 测试：密文应该与明文不同（通过 IndexedDB 读取验证）
  - 测试：应该返回 base64 编码的密文和 IV（通过 IndexedDB 存储验证）

- [x] 4.3 实现解密功能测试
  - 测试：应该使用相同的密钥和 IV 解密
  - 测试：解密后的明文应该与原始明文一致
  - 注：错误的 IV/密钥解密失败测试将在错误处理任务组中实现

- [x] 4.4 实现加密解密集成测试
  - 测试：应该完整加密并解密密码
  - 测试：应该加密不同长度的密码（空、短、长）
  - 测试：应该加密包含特殊字符的密码（包括 Unicode 和 Emoji）

## 5. Web 环境 - IndexedDB 操作测试

- [x] 5.1 实现 setPassword 测试
  - 添加 describe 块：`describe('Web 环境 - IndexedDB 操作', () => { ... })`
  - 测试：应该加密密码后存储到 IndexedDB
  - 测试：应该存储 service、user、encryptedPassword、iv、createdAt
  - 测试：应该使用复合主键 [service, user]（通过 IndexedDB 读取验证）
  - 注：加密失败处理将在错误处理任务组中实现

- [x] 5.2 实现 getPassword 测试
  - 测试：应该从 IndexedDB 读取加密记录
  - 测试：应该解密密文并返回明文
  - 测试：应该返回 null（当记录不存在）
  - 注：解密失败处理将在错误处理任务组中实现

- [x] 5.3 实现 deletePassword 测试
  - 测试：应该从 IndexedDB 删除记录
  - 测试：删除后读取应该返回 null
  - 注：IndexedDB 错误处理将在错误处理任务组中实现

- [x] 5.4 实现密钥生命周期测试
  - 测试：创建 → 读取 → 删除流程
  - 测试：更新密钥（存储新密钥，读取验证）
  - 测试：并发存储多个密钥（不同的 service/user）

## 6. 跨环境兼容性测试

- [x] 6.1 实现 API 签名一致性测试
  - 添加 describe 块：`describe('跨环境兼容性 - API 一致性', () => { ... })`
  - 测试：Tauri 和 Web 环境应该提供相同的接口
  - 测试：setPassword、getPassword、deletePassword、isKeyringSupported 的签名应该一致

- [x] 6.2 实现行为一致性测试
  - 添加 describe 块：`describe('跨环境兼容性 - 行为一致性', () => { ... })`
  - 测试：相同操作应该返回一致的类型
  - 测试：错误处理行为应该一致（抛出异常）

- [x] 6.3 实现 isKeyringSupported 测试
  - 添加 describe 块：`describe('跨环境兼容性 - isKeyringSupported', () => { ... })`
  - 测试：Tauri 环境应该返回 true
  - 测试：Web 环境（支持 IndexedDB + Crypto）应该返回 true
  - 测试：Web 环境（不支持 IndexedDB 或 Crypto）应该返回 false

## 7. 错误处理测试

- [x] 7.1 实现加密失败测试
  - 添加 describe 块：`describe('错误处理 - 加密失败', () => { ... })`
  - 测试：应该抛出"密码加密或存储失败"错误
  - 测试：应该包含原始错误作为 cause

- [x] 7.2 实现解密失败测试
  - 添加 describe 块：`describe('错误处理 - 解密失败', () => { ... })`
  - 测试：应该抛出"密码读取或解密失败"错误
  - 测试：应该记录错误日志到 console.error

- [x] 7.3 实现 IndexedDB 不可用测试
  - 添加 describe 块：`describe('错误处理 - IndexedDB 不可用', () => { ... })`
  - 测试：应该抛出"浏览器不支持安全存储或初始化失败"错误
  - 测试：应该包含原始错误作为 cause

- [x] 7.4 实现密钥未初始化测试
  - 添加 describe 块：`describe('错误处理 - 密钥未初始化', () => { ... })`
  - 测试：调用密码操作前未初始化应该抛出错误
  - 测试：错误消息应该清晰

## 8. 边界条件和特殊场景测试

- [x] 8.1 实现空密码测试
  - 测试：应该处理空字符串密码（已在任务 4.4 中实现）
  - 测试：应该正确加密和解密空字符串（已在任务 4.4 中实现）

- [x] 8.2 实现长密码测试
  - 测试：应该处理非常长的密码（1000+ 字符）（已在任务 4.4 中实现）
  - 注：性能测试未实现（需要性能基准测试，超出单元测试范围）

- [x] 8.3 实现特殊字符密码测试
  - 测试：应该正确处理包含特殊字符的密码（已在任务 4.4 中实现）
  - 测试：应该正确处理 Unicode 字符（如中文、emoji）（已在任务 4.4 中实现）

- [x] 8.4 实现种子丢失测试
  - 测试：localStorage 中没有种子应该生成新种子
  - 测试：新种子应该与旧种子不同
  - 测试：旧加密数据应该无法用新密钥解密

## 9. 覆盖率验证和优化

- [ ] 9.1 运行测试并生成覆盖率报告
  ```bash
  pnpm test:coverage -- keyring.test.ts
  ```

- [ ] 9.2 验证核心逻辑覆盖率 ≥80%
  - 查看 `coverage/src/utils/tauriCompat/keyring.ts/index.html`
  - 识别未覆盖的代码行
  - 验证未覆盖的代码是否为边界情况

- [ ] 9.3 补充缺失的测试用例
  - 为未覆盖的关键代码添加测试
  - 重点检查错误处理逻辑
  - 重点检查边界条件

- [ ] 9.4 优化测试性能
  - 确保所有测试在合理时间内完成（预期 < 30 秒）
  - 移除不必要的等待或重复操作
  - 优化 Mock 设置和清理逻辑

## 10. CI/CD 集成

- [ ] 10.1 验证 CI 环境中的测试运行
  - 在 CI pipeline 中运行 keyring 测试
  - 确保测试在 CI 环境中稳定（无间歇性失败）
  - 确保测试环境配置正确

- [ ] 10.2 添加覆盖率检查到 CI
  - 在 CI pipeline 中生成覆盖率报告
  - 设置覆盖率阈值（< 80% 时失败）
  - 配置覆盖率报告上传（如 Codecov）

- [ ] 10.3 更新项目文档（如需要）
  - 更新 AGENTS.md 中的测试相关章节（如需要）
  - 添加测试运行命令到 README.md（如需要）
  - 更新贡献指南中的测试要求（如需要）

## 11. 代码审查和最终验证

- [ ] 11.1 自我审查测试代码
  - 检查测试命名是否清晰
  - 检查测试结构是否合理
  - 检查是否有重复的测试逻辑

- [ ] 11.2 运行完整的测试套件
  ```bash
  pnpm test
  ```
  - 确保新测试不会破坏现有测试
  - 确保所有测试通过

- [ ] 11.3 最终验证
  - 运行 lint 检查：`pnpm lint`
  - 运行类型检查：`pnpm tsc`
  - 确认覆盖率达标：`pnpm test:coverage`
  - 确认 CI pipeline 通过
