## Context

当前项目使用 `tauri-plugin-stronghold` 作为加密存储方案。Stronghold 基于 IOTA 的加密保险库技术，使用 Argon2 进行密钥派生，将数据存储在专有的二进制格式（.hold 文件）中。

### 当前架构问题

1. **依赖复杂**: Stronghold 依赖 IOTA 加密库，增加了构建复杂性和二进制体积
2. **数据锁定**: .hold 文件格式专有，用户无法直接查看或备份数据
3. **设备绑定**: 当前密钥派生使用设备硬件信息（平台、版本、数据目录），导致数据无法跨设备使用
4. **调试困难**: 二进制存储格式使得开发和调试时难以检查数据状态
5. **跨平台一致性**: 不同操作系统的硬件信息差异可能导致密钥不一致

### 目标架构

迁移到基于 @tauri-apps/plugin-store 的存储方案（保持 .json 文件扩展名），配合应用级主密钥进行敏感数据字段级加密。这将：
- 保持敏感数据（API 密钥）的加密安全性
- 允许用户查看、编辑和备份数据文件
- 简化架构依赖，利用 Store 插件的懒加载和自动保存特性
- 提供一致的跨平台体验

## Goals / Non-Goals

**Goals:**

- 完全移除 `tauri-plugin-stronghold` 依赖
- 将模型配置和聊天记录存储为 JSON 格式文件
- 实现应用级主密钥，首次启动时生成并持久化
- 对 API 密钥等敏感字段进行字段级 AES-256-GCM 加密
- 使用 Web Crypto API 生成主密钥，使用 `tauri-plugin-keyring` 存储主密钥
- 保持现有 Redux 状态管理和自动保存机制
- 提供旧数据检测和手动迁移路径

**Non-Goals:**

- 自动数据迁移（避免强制用户升级，保留选择权）
- 跨设备密钥共享或同步
- 用户自定义主密钥密码（使用随机生成密钥）
- 修改 Redux 状态结构或业务逻辑
- 聊天内容加密（聊天记录本身保持明文，仅加密 API 密钥）
- 支持移动平台（`tauri-plugin-keyring` 目前不支持移动端，仅支持桌面端 macOS/Windows/Linux）

## Decisions

### 1. 主密钥生成与存储

**决策**: 使用 Web Crypto API 生成 256-bit 随机密钥，使用 `tauri-plugin-keyring` 存储到系统安全存储

**理由**:
- Web Crypto API 是现代浏览器的标准 API，无需额外依赖，性能优秀
- `tauri-plugin-keyring` 仅提供存储功能（getPassword/setPassword），不提供密钥生成
- 分离生成和存储职责，架构清晰：Web Crypto 生成 → keyring 存储 → Web Crypto 加密/解密
- 系统级安全存储（keychain/DPAPI/secret-service）提供硬件级别的密钥保护
- 随机密钥比用户密码更安全（更高熵值）

**替代方案考虑**:
- 完全使用 keyring（生成+存储）：不可行，因为 keyring 插件不支持密钥生成
- 用户密码派生：被排除，因为增加了用户负担且密码通常熵值较低
- 继续使用硬件信息派生：被排除，因为违反了数据可移植性目标
- 纯内存存储：被排除，因为应用重启后密钥会丢失

### 2. 加密算法选择

**决策**: 使用 AES-256-GCM 进行字段级加密

**理由**:
- AES-256-GCM 提供认证加密（Confidentiality + Integrity）
- Web Crypto API 原生支持 AES-GCM，性能优秀（硬件加速）
- GCM 模式支持并行解密，适合多个字段的场景
- 256-bit 密钥长度提供足够的安全强度
- 密钥从 `tauri-plugin-keyring` 读取后，由 Web Crypto API 执行加解密

**替代方案考虑**:
- AES-256-CBC：被排除，因为不提供完整性保护
- ChaCha20-Poly1305：被排除，因为 Web Crypto API 支持有限
- 全文件加密：被排除，因为字段级加密提供更好的灵活性和可读性

### 3. 数据格式设计

**决策**: 使用 @tauri-apps/plugin-store 存储，文件扩展名保持为 .json，敏感字段值加密后以 `enc:` 前缀标识

**示例**:
```json
{
  "models": [
    {
      "id": "model-1",
      "name": "GPT-4",
      "apiKey": "enc:base64(ciphertext+auth_tag+nonce)",
      "apiAddress": "https://api.openai.com",
      "modelName": "gpt-4"
    }
  ]
}
```

**理由**:
- Store 插件内部使用 JSON 格式，使用 .json 扩展名更符合语义
- 用户可以直接用文本编辑器打开查看文件内容
- 保留 JSON 的可读性，便于用户理解和调试
- 明确的加密标识（`enc:` 前缀）便于程序识别
- 非敏感字段明文存储，便于版本控制和差异对比

**替代方案考虑**:
- 纯二进制加密块：被排除，因为失去可读性
- 分离的加密数据文件：被排除，因为增加了文件管理复杂性

### 4. 密钥存储插件选择

**决策**: 使用 `tauri-plugin-keyring` 统一管理主密钥的存储（仅存储，不生成）

**理由**:
- `tauri-plugin-keyring` 封装了各平台的原生安全存储机制
- macOS: 底层使用钥匙串（Keychain）
- Windows: 底层使用 DPAPI（Data Protection API）
- Linux: 底层使用 Secret Service API（gnome-keyring/kwallet）
- 提供统一的 JavaScript/TypeScript API，无需关心平台差异
- **注意**: keyring 仅提供 `getPassword`/`setPassword`/`deletePassword`，密钥生成由 Web Crypto API 完成
- **限制**: 目前仅支持桌面端，不支持移动端（iOS/Android）

**替代方案考虑**:
- `tauri-plugin-keychain`：功能类似，同样仅提供存储
- 自定义 Rust 实现：被排除，因为增加了维护负担
- 文件系统存储（加密后）：被排除，因为不如系统级安全存储安全

### 5. 数据迁移策略

**决策**: 检测旧数据存在性，提示用户手动迁移或重新配置

**理由**:
- 自动迁移需要保留 stronghold 依赖，增加复杂性
- 用户可能希望全新开始而非迁移旧数据
- 手动迁移确保用户了解数据格式的变更

**迁移检测逻辑**:
1. 应用启动时检查 `*.hold` 文件是否存在
2. 如果存在且没有对应的 `.json` 文件，显示迁移提示
3. 用户选择：迁移数据 / 删除旧数据 / 稍后决定

## Risks / Trade-offs

### Risk 1: 主密钥丢失导致数据无法解密

**风险**: 如果系统级密钥存储损坏或被清除，主密钥丢失，加密的敏感数据将无法恢复

**缓解措施**:
- 提供密钥导出功能，允许用户手动备份主密钥
- 在 UI 中明确提示用户备份重要数据
- 应用设置中显示密钥状态

### Risk 2: 系统级密钥存储兼容性问题

**风险**: 某些 Linux 发行版可能缺少 Secret Service 支持，导致密钥存储失败

**缓解措施**:
- 在文档中列出支持的操作系统版本（主流桌面环境均已支持）
- 应用启动时检测密钥存储可用性，提前报错并引导用户安装必要的密钥环服务
- 对于服务器/无图形环境，建议使用其他部署方式

### Risk 3: 性能影响

**风险**: 字段级加密/解密可能在大批量数据操作时产生性能开销

**缓解措施**:
- 仅在序列化/反序列化时进行加密/解密，不在 Redux 状态树中保存加密值
- AES-GCM 在现代 CPU 上有硬件加速（AES-NI），性能开销极小
- 测量：在 1000 个模型的场景下测试，确保加密/解密时间 < 100ms

### Risk 4: 旧版本兼容性问题

**风险**: 新版本无法读取旧版本的 .hold 文件，用户可能丢失数据

**缓解措施**:
- 保留旧文件检测逻辑，明确告知用户旧数据存在
- 提供独立的迁移工具或脚本（可选）
- 在更新日志中明确标记此破坏性变更

### Trade-off: 安全性 vs 可用性

**权衡**: 移除设备绑定后，JSON 文件可以在设备间复制，但这也意味着如果用户不慎分享包含加密字段的 JSON，接收方即使拥有主密钥也无法解密（因为主密钥是设备特定的）。

**结论**: 这是可接受的风险。用户应该被教育不要将包含 `enc:` 字段的 JSON 分享给他人，因为虽然他们无法解密，但暴露了加密值的结构。

## Migration Plan

### Phase 1: 准备阶段（应用首次启动）

1. **初始化主密钥**
   - 调用 `tauri-plugin-keyring` API 检查主密钥是否存在（`getPassword`）
   - 如果不存在：
     - 使用 Web Crypto API 的 `crypto.getRandomValues()` 生成 256-bit 随机密钥
     - 调用 `tauri-plugin-keyring` 的 `setPassword` 将密钥存储到系统安全存储
   - 应用通过 `getPassword` 读取密钥用于加解密

2. **检测旧数据**
   - 扫描 `appDataDir` 中是否存在 `modelVault.hold` 或 `chatVault.hold`
   - 如果存在且没有对应的 `.json` 文件，显示迁移对话框

### Phase 2: 数据迁移（用户确认后）

1. **加载旧数据**（仅在用户选择迁移时）
   - 临时保留 `tauri-plugin-stronghold` 用于读取旧数据
   - 使用旧版密码（硬件信息派生）解锁 Stronghold 保险库

 2. **转换并保存**
    - 读取所有模型和聊天数据
    - 对敏感字段（apiKey）使用新主密钥加密
    - 使用 Store 插件保存到 `models.json` 和 `chats.json`

3. **清理**
   - 删除或备份旧 `.hold` 文件（建议备份到 `.hold.bak`）
   - 显示迁移成功提示

### Phase 3: 运行阶段（日常操作）

1. **数据加载**
   - 从 Store 插件读取数据（.json 文件）
   - 解密敏感字段（使用主密钥）
   - 加载到 Redux 状态树

2. **数据保存**
   - Redux middleware 监听状态变更
   - 敏感字段加密后通过 Store 插件保存
   - 自动保存到 .json 文件

### Rollback Strategy

如果迁移后出现问题：
- 从 `.hold.bak` 文件恢复 Stronghold 数据
- 降级到旧版本应用
- 重新进行迁移

## Open Questions

1. ~~**tauri-plugin-keyring 调研**: 已确认 keyring 仅支持存储，不支持密钥生成~~ ✅ 完成调研：keyring API 仅包含 `getPassword`/`setPassword`/`deletePassword`，密钥生成需使用 Web Crypto API

2. **Linux 兼容性**: 需要测试主流 Linux 发行版（Ubuntu、Fedora、Arch）的 Secret Service 支持情况，以及在没有图形环境时的降级方案。

3. **加密字段标识**: `enc:` 前缀是否足够？是否需要包含版本信息（如 `enc:v1:`）以便未来升级加密算法？

4. **旧数据保留策略**: 迁移后旧 `.hold` 文件应该删除还是保留？保留多久？用户如何手动清理？

5. **密钥备份 UX**: 如何设计密钥导出/导入的用户体验？是否需要密码保护导出的密钥文件？
