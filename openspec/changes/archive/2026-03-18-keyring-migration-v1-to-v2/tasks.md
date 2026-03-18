# Tasks: Keyring V1 → V2 迁移

## 1. 迁移模块实现

- [x] 1.1 创建 `src/utils/tauriCompat/keyringMigration.ts` 文件
- [x] 1.2 实现版本标记常量和检查函数
- [x] 1.3 实现 V1 密钥派生函数 `deriveEncryptionKeyV1`
- [x] 1.4 实现迁移主函数 `migrateKeyringV1ToV2`
- [x] 1.5 实现迁移失败时的重置逻辑
- [x] 1.6 添加清理计划注释

## 2. Keyring 模块修改

- [x] 2.1 修改 `deriveEncryptionKey` 函数，移除 `navigator.userAgent` 依赖
- [x] 2.2 在 `src/utils/tauriCompat/index.ts` 中导出迁移函数
- [x] 2.3 添加 Tauri 环境跳过迁移的逻辑

## 3. 初始化流程集成

- [x] 3.1 在 `src/config/initSteps.ts` 中添加 `keyringMigration` 步骤
- [x] 3.2 配置 `masterKey` 步骤依赖 `keyringMigration`
- [x] 3.3 确保迁移步骤在 Tauri 环境中跳过

## 4. 测试

- [x] 4.1 为 `keyringMigration.ts` 编写单元测试
- [x] 4.2 测试场景：新用户无迁移
- [x] 4.3 测试场景：已迁移用户跳过迁移
- [x] 4.4 测试场景：V1 → V2 成功迁移
- [x] 4.5 测试场景：迁移失败后重置
- [x] 4.6 测试场景：并发迁移幂等性
- [x] 4.7 测试场景：Tauri 环境跳过
- [x] 4.8 测试场景：新密钥派生方式（仅 seed）加密/解密一致性
- [x] 4.9 测试场景：密钥派生不依赖 userAgent（验证不同 userAgent 可解密相同数据）

## 5. 文档更新

- [x] 5.1 更新 `docs/design/cross-platform.md`（如需要）
- [x] 5.2 确保代码注释清晰说明迁移逻辑
