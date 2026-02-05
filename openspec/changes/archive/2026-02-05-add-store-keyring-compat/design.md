# 设计文档：Web 存储 Keyring 兼容层

## Context

**当前状态**：
应用目前仅支持 Tauri 桌面环境，使用以下 Tauri 插件进行数据持久化：
- `@tauri-apps/plugin-store`：键值存储，用于存储模型配置、聊天数据等
- `@tauri-plugin-keyring-api`：系统钥匙串存储，用于存储主密钥（256-bit 随机密钥）

**约束条件**：
- Tauri 插件在 Web 浏览器环境中不可用
- 需要保持完全向后兼容，Tauri 端现有逻辑不变
- 调用者无需修改代码即可在不同环境中运行
- 主密钥用于加密敏感数据（如 API 密钥），必须提供安全的存储方案

**已有基础**：
- 项目已实现 `shell.ts` 和 `os.ts` 兼容层（Null Object 模式）
- 环境检测函数 `isTauri()` 已实现
- 兼容层目录结构：`src/utils/tauriCompat/`

## Goals / Non-Goals

**Goals:**
- 为 `@tauri-apps/plugin-store` 提供 Web 兼容层，使用 IndexedDB 实现键值存储
- 为 `@tauri-plugin-keyring-api` 提供 Web 兼容层，使用 IndexedDB + AES-256-GCM 加密实现安全存储
- 保持 API 与 Tauri 原生插件完全一致，确保调用者无需修改代码
- 扩展 Tauri 插件兼容层框架，定义 IndexedDB 降级方案的规范
- 支持主密钥在 Web 端的安全存储和使用
- 提供功能可用性标记（`isSupported()`），让调用者能够判断功能是否可用

**Non-Goals:**
- 不修改 Tauri 环境的现有逻辑和行为
- 不提供与系统钥匙串相同的安全级别（Web 环境的安全限制）
- 不自动迁移 Tauri 端数据到 Web 端（需手动导出/导入）
- 不支持在不支持 IndexedDB 或 Web Crypto API 的旧版浏览器中运行

## Decisions

### 1. Web 存储方案选择：IndexedDB

**决策**：使用 IndexedDB 作为 Web 端的存储后端，而非 localStorage 或 sessionStorage。

**理由**：
- **存储容量**：IndexedDB 提供更大的存储配额（通常 50MB+，而 localStorage 限制在 5-10MB）
- **数据类型**：支持复杂数据类型（对象、数组、Blob 等），无需手动序列化/反序列化
- **异步 API**：不阻塞主线程，适合大量数据的读写操作
- **事务支持**：提供事务机制，确保数据一致性

**替代方案**：
- localStorage：容量小，同步 API 阻塞主线程，仅支持字符串
- sessionStorage：数据在关闭标签页后丢失，不适合持久化存储

### 2. 加密算法选择：AES-256-GCM

**决策**：使用 Web Crypto API 的 AES-256-GCM 算法加密 Keyring 数据。

**理由**：
- **安全性**：AES-256 是目前最安全的对称加密算法之一
- **完整性**：GCM 模式提供认证加密（AEAD），同时保证机密性和完整性
- **性能**：现代浏览器的 Web Crypto API 提供硬件加速，性能良好
- **标准性**：Web Crypto API 是 W3C 标准，跨浏览器支持良好

**替代方案**：
- AES-CBC：不提供完整性校验，需要额外的 HMAC
- 自定义加密算法：安全性无法保证，不推荐

### 3. 加密密钥派生方案：PBKDF2 + 种子

**决策**：使用 PBKDF2 算法从持久化的种子值派生加密密钥。

**方案细节**：
- 种子生成：首次启动时使用 `crypto.getRandomValues()` 生成 256-bit 随机种子
- 种子存储：以明文形式存储在 `localStorage` 中（存储键：`multi-chat-keyring-seed`）
- 密钥派生：PBKDF2 算法，使用 `navigator.userAgent` + 种子作为基础密钥材料
- 派生参数：
  - 盐值（salt）：种子本身
  - 迭代次数：100,000 次
  - 哈希算法：SHA-256
  - 输出密钥长度：256 bits

**理由**：
- **密钥持久化**：每次启动都能派生出相同的密钥（无需用户输入密码）
- **安全性**：PBKDF2 的高迭代次数增加暴力破解难度
- **简单性**：无需用户管理额外密码

**替代方案**：
- 用户密码派生：需要用户记住密码，降低易用性
- 直接使用种子作为密钥：种子长度不够（需要 256-bit 密钥）

**权衡**：
- ⚠️ **安全风险**：种子以明文形式存储在 `localStorage` 中，可被浏览器插件或 XSS 攻击读取
- **缓解措施**：
  - PBKDF2 100,000 次迭代增加暴力破解难度
  - 显示安全性警告，建议在桌面版处理敏感数据
  - 这是 Web 环境下安全性与可用性的合理权衡

### 4. 数据库隔离：独立的 IndexedDB 数据库

**决策**：每个插件使用独立的 IndexedDB 数据库，而非共享数据库。

**数据库名称**：
- Store 插件：`multi-chat-store`（对象存储：`store`）
- Keyring 插件：`multi-chat-keyring`（对象存储：`keys`）

**理由**：
- **模块化**：每个插件独立管理数据，遵循单一职责原则
- **隔离性**：避免数据冲突和命名空间污染
- **可维护性**：便于调试、清理和版本管理

**替代方案**：
- 共享数据库：增加复杂度，需要额外的命名空间管理

### 5. 降级策略：IndexedDB vs Null Object 模式

**决策**：根据插件特性选择不同的降级策略。

**策略选择**：
- **数据持久化插件**（store、keyring）：使用 IndexedDB 替代方案，提供完整功能
- **系统操作插件**（shell 命令）：使用 Null Object 模式，模拟成功但不执行实际操作

**理由**：
- **功能需求**：store 和 keyring 是核心功能，必须提供可用实现
- **安全性**：Web 环境无法执行 Shell 命令，Null Object 模式避免安全风险
- **一致性**：降级策略应在兼容层文档中明确说明

### 6. 类型定义复用：使用 Tauri 官方类型

**决策**：复用 `@tauri-apps/plugin-store` 和 `@tauri-plugin-keyring-api` 的官方类型定义，不创建重复类型。

**实现方式**：
```typescript
// 在 Web 环境中，仍导入 Tauri 官方类型
import type { Store } from '@tauri-apps/plugin-store';
import type { Keyring } from '@tauri-plugin-keyring-api';

// 兼容层实现与官方类型保持一致
```

**理由**：
- **类型安全**：确保兼容层与原生 API 的类型一致性
- **可维护性**：减少重复代码，类型更新自动同步
- **开发体验**：提供完整的 TypeScript 类型提示

### 7. 主密钥初始化流程优化

**决策**：主密钥初始化在 Web 端采用异步加载，不阻塞应用启动。

**流程**：
1. 应用启动时异步读取主密钥（IndexedDB + 解密）
2. 如果主密钥不存在，异步生成并存储
3. 主密钥加载完成后，再加载模型数据和聊天列表

**理由**：
- **性能**：PBKDF2 密钥派生耗时约 500ms，不应阻塞 UI 渲染
- **用户体验**：应用快速启动，后台加载数据

**实现细节**：
- 使用 React 的 `useEffect` 或 Suspense 实现异步加载
- 显示加载状态提示用户

## Risks / Trade-offs

### 安全风险

**风险 1**：Web 端密钥存储安全性低于 Tauri 端
- **描述**：IndexedDB + 加密的安全级别无法与系统钥匙串（macOS Keychain、Windows DPAPI）相比
- **缓解措施**：
  - 使用 AES-256-GCM 强加密算法
  - PBKDF2 100,000 次迭代增加暴力破解难度
  - 首次使用时显示安全性警告
  - 在 AGENTS.md 中明确说明安全级别差异
  - 建议用户在桌面版处理敏感数据

**风险 2**：种子明文存储在 localStorage
- **描述**：攻击者可通过浏览器插件或 XSS 攻击读取种子，进而派生加密密钥
- **缓解措施**：
  - 种子仅用于派生密钥，不直接加密数据
  - PBKDF2 增加暴力破解难度
  - 密钥不持久化，仅在内存中使用
  - 这是 Web 环境下安全性与可用性的权衡

**风险 3**：XSS 攻击可能读取内存中的主密钥
- **描述**：XSS 攻击可能通过 JavaScript 访问内存中的解密后主密钥
- **缓解措施**：
  - 实施 CSP（内容安全策略）防止 XSS
  - 主密钥存储在闭包中，不暴露在全局作用域
  - 不在日志或控制台输出主密钥

### 性能风险

**风险 4**：PBKDF2 密钥派生耗时较长
- **描述**：100,000 次迭代可能耗时 500ms，影响应用启动性能
- **缓解措施**：
  - 仅在应用启动时派生一次
  - 异步派生，不阻塞 UI 渲染
  - 派生后的密钥存储在内存中，避免重复派生

**风险 5**：IndexedDB 异步操作增加复杂度
- **描述**：IndexedDB 是异步 API，需要正确处理 Promise 和事务
- **缓解措施**：
  - 封装兼容层 API，隐藏 IndexedDB 的复杂性
  - 提供错误处理和重试机制
  - 编写单元测试和集成测试

### 兼容性风险

**风险 6**：浏览器不支持 IndexedDB 或 Web Crypto API
- **描述**：旧版浏览器或隐私模式可能不支持这些 API
- **缓解措施**：
  - 使用 `isSupported()` 方法检测功能可用性
  - 不支持时显示友好的错误提示
  - 在 AGENTS.md 中明确浏览器兼容性要求

**风险 7**：不同浏览器的 IndexedDB 实现差异
- **描述**：Safari、Firefox、Chrome 的 IndexedDB 行为可能不一致
- **缓解措施**：
  - 在主流浏览器中进行测试
  - 遵循 Web 标准，不依赖浏览器特定行为
  - 编写跨浏览器测试

### 用户体验风险

**风险 8**：清除浏览器数据导致密钥丢失
- **描述**：用户清除浏览器数据后，主密钥和种子将被删除，旧数据无法解密
- **缓解措施**：
  - 在安全性警告中明确说明此风险
  - 提供数据导出/导入功能，让用户手动备份
  - 密钥丢失时，生成新密钥并显示警告

**风险 9**：Web 端功能降级可能让用户困惑
- **描述**：某些功能在 Web 端不可用或行为不同（如 Shell 命令）
- **缓解措施**：
  - 使用 `isSupported()` 方法禁用不可用的功能
  - 在 UI 中显示清晰的功能不可用提示
  - 在文档中明确说明功能差异

## Migration Plan

### 实施步骤

**阶段 1：环境准备（1 天）**
1. 创建 `src/utils/tauriCompat/store.ts` 和 `src/utils/tauriCompat/keyring.ts` 文件
2. 定义 IndexedDB 数据库结构和初始化逻辑
3. 编写单元测试框架

**阶段 2：Store 兼容层实现（2-3 天）**
1. 实现 `Store` 类，封装 IndexedDB 操作
2. 实现 `get()`、`set()`、`delete()`、`keys()`、`save()` 方法
3. 实现 `isSupported()` 方法
4. 在 `src/utils/tauriCompat/index.ts` 中导出 Store API
5. 编写单元测试和集成测试
6. 更新 `src/store/storage/` 中的存储模块，使用兼容层 API

**阶段 3：Keyring 兼容层实现（3-4 天）**
1. 实现 `Keyring` 类，封装 IndexedDB + 加密操作
2. 实现加密密钥派生逻辑（PBKDF2）
3. 实现 `setPassword()`、`getPassword()`、`deletePassword()` 方法
4. 实现 `isSupported()` 方法
5. 在 `src/utils/tauriCompat/index.ts` 中导出 Keyring API
6. 编写单元测试和集成测试（包括加密解密测试）
7. 更新 `src/store/keyring/masterKey.ts`，使用兼容层 API

**阶段 4：主密钥存储逻辑修改（1-2 天）**
1. 修改 `initializeMasterKey()` 函数，支持 Web 端使用 Keyring 兼容层
2. 添加密钥丢失和加密失败的错误处理
3. 添加首次使用的安全性警告对话框
4. 更新应用启动初始化流程，确保主密钥加载完成后再加载其他数据

**阶段 5：文档更新（1 天）**
1. 在 AGENTS.md 中新增 "Store 和 Keyring 插件兼容层" 章节
2. 说明 IndexedDB 降级方案的实现细节
3. 提供使用示例代码
4. 添加安全性警告和浏览器兼容性说明

**阶段 6：测试和验证（2-3 天）**
1. 在 Chrome、Firefox、Safari 中进行手动测试
2. 测试应用启动、数据读写、主密钥初始化等关键流程
3. 测试错误场景（IndexedDB 不可用、存储配额超限等）
4. 性能测试（加密/解密、密钥派生、IndexedDB 查询）
5. 安全性审查（确保密钥不暴露在日志或调试工具中）

**总预计时间**：10-14 天

### 回滚策略

**如果发现严重问题，可按以下步骤回滚**：
1. 恢复 `src/store/keyring/masterKey.ts` 和 `src/store/storage/` 的旧代码
2. 删除 `src/utils/tauriCompat/store.ts` 和 `src/utils/tauriCompat/keyring.ts`
3. 从 `src/utils/tauriCompat/index.ts` 中移除相关导出
4. 回滚 AGENTS.md 的文档更新

**回滚影响**：
- Web 端将无法运行（依赖 store 和 keyring 插件）
- Tauri 端不受影响（回滚后继续使用原生插件）

### 数据迁移方案

**当前不提供自动数据迁移**，原因：
- Tauri 端使用系统钥匙串，无法直接导出密钥
- Web 端和 Tauri 端的安全级别不同，直接迁移可能带来安全风险

**未来可提供的手动迁移功能**：
- 导出功能：将 Tauri 端的加密数据导出为加密 JSON 文件
- 导入功能：在 Web 端导入加密 JSON 文件，解密后存储到 IndexedDB
- 密钥迁移：导出主密钥（加密），在 Web 端导入并重新加密存储

## Open Questions

1. **种子存储的替代方案**：是否有更安全的方式存储种子，同时保持密钥派生的无需用户密码特性？
   - 可能方案：使用浏览器指纹而非 localStorage，但浏览器指纹可能变化

2. **PBKDF2 迭代次数**：100,000 次迭代是否在性能和安全性之间达到平衡？
   - 可能需要根据实际性能测试调整

3. **数据导出/导入功能的优先级**：是否在本次变更中实现，还是推迟到后续版本？
   - 建议：本次变更不实现，作为独立的后续功能

4. **安全性警告的显示频率**：仅首次显示，还是每次启动都显示？
   - 建议：首次显示，用户可选择"不再提示"

5. **主密钥的生命周期管理**：是否需要定期重新生成主密钥以提高安全性？
   - 建议：不需要，除非密钥丢失或用户主动重置

## 参考

- **Tauri 官方文档**：[Plugin Store](https://v2.tauri.app/plugin/store/)、[Plugin Keyring](https://github.com/tauri-apps/tauri-plugin-keyring)
- **Web Crypto API**：[SubtleCrypto interface](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
- **IndexedDB API**：[IndexedDB guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- **PBKDF2**：[RFC 7914](https://datatracker.ietf.org/doc/html/rfc7914)
- **项目现有兼容层**：`src/utils/tauriCompat/shell.ts`、`src/utils/tauriCompat/os.ts`
