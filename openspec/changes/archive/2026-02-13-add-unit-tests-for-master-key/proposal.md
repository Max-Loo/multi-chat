## Why

masterKey.ts 是密钥管理的核心模块，负责主密钥的生成、存储和获取。目前该模块没有任何单元测试，存在以下风险：
- 密钥生成逻辑可能存在隐患（如随机性不足、格式错误）
- 错误处理路径未被覆盖
- 跨平台兼容性问题（Tauri vs Web）难以早期发现
- 重构时缺乏安全网

现在添加测试可以确保密钥管理的可靠性，这是整个加密系统的基础。

## What Changes

- 为 masterKey.ts 模块创建完整的单元测试套件
- 测试覆盖所有导出函数（7个函数）
- 使用 Vitest + happy-dom 环境进行测试
- 模拟 tauriCompat/keyring 依赖以隔离测试
- 验证错误处理和边界情况
- 确保测试覆盖率达到合理水平（建议 >80%）

## Capabilities

### New Capabilities

- `master-key-generation`: 主密钥生成能力测试，验证密钥长度、格式和随机性
- `master-key-storage`: 主密钥存储能力测试，验证存储成功和失败场景
- `master-key-retrieval`: 主密钥获取能力测试，验证正常获取和错误处理
- `master-key-initialization`: 主密钥初始化能力测试，验证首次生成和已存在场景
- `cross-platform-keyring`: 跨平台密钥环兼容性测试，验证 Tauri 和 Web 环境行为
- `master-key-export`: 主密钥导出能力测试，验证导出功能和错误处理

### Modified Capabilities

无。这是新增测试，不改变现有功能规范。

## Impact

**受影响的代码：**
- 新增 `src/__test__/store/keyring/masterKey.test.ts`

**依赖的测试基础设施：**
- Vitest 测试框架
- happy-dom 测试环境
- 现有的 crypto.ts 单元测试作为参考

**需要模拟的依赖：**
- `@/utils/tauriCompat` 的 keyring API（getPassword, setPassword, isTauri）

**测试覆盖范围：**
- generateMasterKey(): 密钥长度（64 hex 字符 = 256 bits）、格式验证、随机性验证
- isMasterKeyExists(): 存在/不存在场景
- getMasterKey(): 正常获取、不存在返回 null、错误处理
- storeMasterKey(): 存储成功、存储失败
- initializeMasterKey(): 首次生成新密钥、已存在密钥、错误处理
- handleSecurityWarning(): Web 环境显示警告、Tauri 环境跳过
- exportMasterKey(): 正常导出、无密钥时错误

**后续工作：**
- 完成测试后，可为 storeUtils.ts 和 modelStorage.ts 添加测试
- 最终实现 crypto.ts 的集成测试
