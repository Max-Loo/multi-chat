# Proposal: Keyring V1 → V2 迁移

## Why

当前 Web 环境的密钥派生逻辑依赖 `navigator.userAgent`，导致浏览器版本更新或用户切换浏览器后无法解密之前存储的密码。这造成了数据丢失问题，影响用户体验。

移除 `userAgent` 依赖后，密钥派生仅使用 `localStorage` 中的种子，确保跨浏览器版本和会话的数据可访问性。

## What Changes

- **移除**：`deriveEncryptionKey` 函数对 `navigator.userAgent` 的依赖
- **新增**：V1 → V2 数据迁移逻辑，在应用启动时静默执行
- **新增**：版本标记机制，使用 `localStorage` 存储数据格式版本
- **BREAKING**：V1 格式的加密数据将无法直接读取，必须通过迁移逻辑转换

### 迁移策略

1. **优先迁移**：尝试使用旧密钥派生方式解密数据，然后用新方式重新加密
2. **降级重置**：迁移失败时（如 `userAgent` 已变化），删除旧数据并生成新密钥
3. **静默执行**：整个迁移过程对用户无感知

## Capabilities

### New Capabilities

- `keyring-migration`: V1 → V2 数据迁移能力，包含旧版密钥派生逻辑和迁移流程

### Modified Capabilities

- `web-keyring-compat`: 修改密钥派生要求，移除对 `navigator.userAgent` 的依赖

## Impact

### 代码变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/utils/tauriCompat/keyring.ts` | 修改 | 移除 `deriveEncryptionKey` 中的 `userAgent` 依赖 |
| `src/utils/tauriCompat/keyringMigration.ts` | 新增 | 迁移逻辑模块，包含 V1 密钥派生 |
| `src/config/initSteps.ts` | 修改 | 新增 `keyringMigration` 初始化步骤 |

### API 变更

无公开 API 变更，所有改动为内部实现细节。

### 数据格式变更

- **localStorage**: 新增 `keyring-data-version` 键，值为 `"2"`
- **IndexedDB**: 数据格式不变，但加密密钥派生方式改变

### 依赖关系

- `masterKey` 初始化步骤将依赖 `keyringMigration` 步骤

### 向后兼容性

- V1 用户首次启动时自动迁移（如果 `userAgent` 未变化）
- 迁移失败的用户将丢失旧数据，需要重新配置 API keys
