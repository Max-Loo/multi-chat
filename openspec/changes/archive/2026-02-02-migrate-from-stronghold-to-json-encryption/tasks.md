## 1. 依赖和配置更新

- [x] 1.1 移除 `tauri-plugin-stronghold` 依赖（`src-tauri/Cargo.toml` 和 `package.json`）
- [x] 1.2 添加 `tauri-plugin-keyring` 依赖（`src-tauri/Cargo.toml` 和 `package.json`）
- [x] 1.3 在 `src-tauri/src/lib.rs` 中初始化 `tauri-plugin-keyring`
- [x] 1.4 移除 `src-tauri/src/lib.rs` 中的 Stronghold 初始化代码

## 2. 移除旧的 Stronghold 代码

- [x] 2.1 删除 `src/store/vaults/index.ts`（Stronghold 封装层）
- [x] 2.2 删除 `src/store/vaults/modelVault.ts`（模型保险库）
- [x] 2.3 删除 `src/store/vaults/chatVault.ts`（聊天保险库）
- [x] 2.4 删除 `src/store/storage/secretKeyStorage.ts`（硬件信息密钥派生）
- [x] 2.5 如有必要，删除 `src/store/vaults/` 整个目录

## 3. 实现主密钥管理（Web Crypto 生成 + keyring 存储）

- [x] 3.1 创建 `src/store/keyring/masterKey.ts`，封装 `tauri-plugin-keyring` API
- [x] 3.2 实现 `initializeMasterKey()` 函数：检查 keyring 中是否存在密钥，不存在则使用 Web Crypto API 生成并存储
- [x] 3.3 实现 `isMasterKeyExists()` 函数：检查主密钥是否存在
- [x] 3.4 实现错误处理：当 keyring 不可用时显示用户友好提示
- [x] 3.5 在主密钥丢失时使用 Web Crypto API 生成新密钥并显示警告（旧数据将无法解密）
- [x] 3.6 在应用启动时调用 `initializeMasterKey()`（src/main.tsx 的阻断式初始化阶段）

## 4. 实现 AES-256-GCM 加密/解密

- [x] 4.1 创建 `src/utils/crypto.ts`，实现加密工具函数
- [x] 4.2 实现 `encryptField(plaintext: string, masterKey: string): string` 函数（使用 Web Crypto API）
- [x] 4.3 实现 `decryptField(ciphertext: string, masterKey: string): string` 函数（使用 Web Crypto API）
- [x] 4.4 加密格式：`enc:base64(ciphertext + auth_tag + nonce)`
- [x] 4.5 生成随机 nonce（12 bytes）用于每次加密
- [x] 4.6 实现加密失败处理：阻止保存并显示错误提示
- [x] 4.7 实现解密失败处理：标记字段为无效并提示重新配置

## 5. 实现 Store 插件数据存储（.json 文件）

- [x] 5.1 创建 `src/store/storage/jsonStorage.ts`，封装 Store 插件操作
- [x] 5.2 实现 `saveModelsToJson(models: Model[])`：使用 Store 插件保存模型到 `models.json`
- [x] 5.3 实现 `loadModelsFromJson(): Promise<Model[]>`：从 Store 插件 `models.json` 加载模型
- [x] 5.4 实现 `saveChatsToJson(chats: Chat[])`：使用 Store 插件保存聊天到 `chats.json`
- [x] 5.5 实现 `loadChatsFromJson(): Promise<Chat[]>`：从 Store 插件 `chats.json` 加载聊天
- [x] 5.6 使用 `@tauri-apps/plugin-store` 的 LazyStore 实现懒加载和自动保存
- [x] 5.7 保存时对 `apiKey` 字段进行加密，加载时解密
- [x] 5.8 文件扩展名保持为 `.json` 以保持语义清晰性

## 6. 更新 Redux Middleware

- [x] 6.1 修改 `src/store/middleware/modelMiddleware.ts`
- [x] 6.2 将自动保存逻辑从 Stronghold 改为 `saveModelsToJson`
- [x] 6.3 修改 `src/store/middleware/chatMiddleware.ts`
- [x] 6.4 将自动保存逻辑从 Stronghold 改为 `saveChatsToJson`
- [x] 6.5 确保敏感字段在序列化前加密，反序列化后解密

## 7. 实现旧数据检测和迁移（已跳过）

> **注意**: 数据迁移功能已跳过，用户需要手动处理旧 .hold 文件

- [ ] 7.1 创建 `src/utils/migration.ts`，实现迁移检测逻辑
- [ ] 7.2 实现 `checkLegacyData()`：检测 `*.hold` 文件是否存在
- [ ] 7.3 创建迁移对话框组件，提供选项：迁移 / 删除 / 稍后
- [ ] 7.4 实现临时 Stronghold 读取逻辑（仅在用户选择迁移时）
- [ ] 7.5 实现数据转换：从 Stronghold 读取 → 使用新密钥加密 → 保存为 JSON
- [ ] 7.6 迁移完成后备份旧 `.hold` 文件到 `.hold.bak`
- [ ] 7.7 在应用启动时自动调用迁移检测

## 8. 类型和接口更新

- [ ] 7.1 创建 `src/utils/migration.ts`，实现迁移检测逻辑
- [ ] 7.2 实现 `checkLegacyData()`：检测 `*.hold` 文件是否存在
- [ ] 7.3 创建迁移对话框组件，提供选项：迁移 / 删除 / 稍后
- [ ] 7.4 实现临时 Stronghold 读取逻辑（仅在用户选择迁移时）
- [ ] 7.5 实现数据转换：从 Stronghold 读取 → 使用新密钥加密 → 保存为 JSON
- [ ] 7.6 迁移完成后备份旧 `.hold` 文件到 `.hold.bak`
- [ ] 7.7 在应用启动时自动调用迁移检测

## 8. 类型和接口更新

- [x] 8.1 检查 `src/types/model.ts`，确保包含 `apiKey` 字段
- [x] 8.2 如有需要，更新类型定义以适应新存储格式
- [x] 8.3 确保所有类型在加密/解密流程中保持一致

## 9. UI 和用户体验

- [ ] 9.1 在设置界面添加密钥状态显示（存在/不存在）
- [ ] 9.2 实现密钥导出功能（允许用户手动备份主密钥）
- [ ] 9.3 在模型列表中显示"需要重新配置 API 密钥"的警告图标（当解密失败时）
- [ ] 9.4 添加加载状态提示：从 Store 插件加载数据时显示进度
- [ ] 9.5 确保所有错误提示使用用户友好的中文消息

## 10. 测试和验证

- [ ] 10.1 测试 macOS 上的密钥生成和存储
- [ ] 10.2 测试 Windows 上的密钥生成和存储
- [ ] 10.3 测试 Linux（Ubuntu/Fedora）上的密钥生成和存储
- [ ] 10.4 测试加密/解密性能：1000 个模型场景下 < 100ms
- [ ] 10.5 测试数据迁移流程：从旧 `.hold` 文件迁移到新 JSON
- [ ] 10.6 测试文件写入原子性：崩溃后数据完整性
- [ ] 10.7 测试主密钥丢失场景：正确显示警告并生成新密钥

## 11. 文档和清理

- [x] 11.1 更新 `README.md`，说明新的数据存储格式
- [x] 11.2 删除所有 Stronghold 相关的注释和文档
- [x] 11.3 更新开发文档，说明 `tauri-plugin-keyring` 的使用方式
- [x] 11.4 更新变更日志，标记 BREAKING 变更
- [x] 11.5 运行 `pnpm lint` 检查代码规范
- [x] 11.6 运行 `pnpm tsc` 进行类型检查
- [ ] 11.7 构建测试版本验证功能完整性
