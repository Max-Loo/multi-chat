## Why

当前项目使用 `tauri-plugin-stronghold` 作为加密存储方案，存在依赖复杂、文件格式专有、调试困难等问题。同时，现有的加密方案将设备硬件信息（平台、版本、数据目录）作为密钥派生基础，导致用户无法跨设备使用备份数据。需要一个更简洁、灵活且用户可控的加密存储方案，以提升数据可移植性并简化架构。

## What Changes

- **移除 Stronghold 依赖**：完全移除 `tauri-plugin-stronghold` Rust 插件和相关前端封装代码
- **迁移到 JSON 文件存储**：将模型数据和聊天记录存储为普通 JSON 文件（`.json`），便于查看、调试和备份
- **新增应用级加密密钥**：应用首次启动时使用 Web Crypto API 生成 256-bit 主密钥，并通过 `tauri-plugin-keyring` 安全存储到系统钥匙串，用于加密敏感字段（注意：`tauri-plugin-keyring` 目前不支持移动端）
- **字段级敏感数据加密**：对 API 密钥等敏感数据进行字段级加密后再存入 JSON，非敏感数据明文存储
- **密钥持久化**：主密钥一旦生成，将在应用生命周期内持续使用，用户无法主动重置
- **BREAKING**：数据格式变更，旧版本 Stronghold 加密数据需要迁移或重新配置

## Capabilities

### New Capabilities

- `app-master-key`: 应用级主密钥管理，包括首次生成、安全存储和读取
- `field-level-encryption`: 敏感数据字段级加密/解密，支持 API 密钥等敏感字段的透明加解密
- `json-data-persistence`: JSON 文件格式的数据持久化，替代原有的 Stronghold 二进制格式
- `secure-key-storage`: 主密钥的安全存储，使用 `tauri-plugin-keyring` 统一管理跨平台密钥存储（仅支持桌面端）

### Modified Capabilities

- `model-storage`: 模型数据存储方式从 Stronghold 加密存储改为 JSON 文件 + 字段级加密
- `chat-storage`: 聊天记录存储方式从 Stronghold 加密存储改为 JSON 文件（聊天记录本身不加密，或可选加密）

## Impact

- **依赖变更**：移除 `@tauri-apps/plugin-stronghold` 和 `tauri-plugin-stronghold`，新增 `tauri-plugin-keyring` 用于密钥管理
- **存储文件变更**：
  - 原 `modelVault.hold` → `models.json`
  - 原 `chatVault.hold` → `chats.json`
  - 新增密钥存储（使用 tauri-plugin-keyring）
- **代码影响范围**：
  - `src-tauri/Cargo.toml`：移除 stronghold 依赖
  - `src-tauri/src/lib.rs`：移除 stronghold 初始化代码
  - `src/store/vaults/`：整个目录需要重写或移除
  - `src/store/storage/`：需要新增 JSON 存储和加密逻辑
- **用户体验**：数据备份更简单（直接复制 JSON 文件），但需要处理旧数据迁移
