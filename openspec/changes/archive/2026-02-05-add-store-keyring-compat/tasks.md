## 实施任务清单

## 1. 环境准备

- [x] 1.1 创建 `src/utils/tauriCompat/store.ts` 文件
- [x] 1.2 创建 `src/utils/tauriCompat/keyring.ts` 文件
- [x] 1.3 定义 IndexedDB 数据库初始化工具函数
- [ ] 1.4 创建单元测试框架配置（如需要）

## 2. Store 兼容层实现

- [x] 2.1 实现 `Store` 类，封装 IndexedDB 操作
- [x] 2.2 实现 `Store.get(key)` 方法，支持读取任意 JSON 可序列化类型
- [x] 2.3 实现 `Store.set(key, value)` 方法，支持写入字符串、对象、数组等类型
- [x] 2.4 实现 `Store.delete(key)` 方法，删除指定键
- [x] 2.5 实现 `Store.keys()` 方法，返回所有键的数组
- [x] 2.6 实现 `Store.save()` 方法（Web 环境为空操作）
- [x] 2.7 实现 `Store.isSupported()` 方法，检测 IndexedDB 可用性
- [x] 2.8 在 `src/utils/tauriCompat/index.ts` 中导出 Store 类和类型

## 3. Keyring 兼容层实现

- [x] 3.1 实现 `Keyring` 类，封装 IndexedDB + 加密操作
- [x] 3.2 实现种子生成与存储逻辑（首次启动时生成 256-bit 随机种子存储到 localStorage）
- [x] 3.3 实现加密密钥派生逻辑（PBKDF2，100,000 次迭代，SHA-256）
- [x] 3.4 实现 `Keyring.setPassword(service, user, password)` 方法（AES-256-GCM 加密）
- [x] 3.5 实现 `Keyring.getPassword(service, user)` 方法（解密并返回明文密码）
- [x] 3.6 实现 `Keyring.deletePassword(service, user)` 方法
- [x] 3.7 实现 `Keyring.isSupported()` 方法，检测 IndexedDB 和 Web Crypto API 可用性
- [x] 3.8 在 `src/utils/tauriCompat/index.ts` 中导出 Keyring 类和类型

## 4. 主密钥存储逻辑修改

- [x] 4.1 修改 `src/store/keyring/masterKey.ts` 中的 `initializeMasterKey()` 函数，支持使用 Keyring 兼容层
- [x] 4.2 添加主密钥丢失的错误处理（显示警告并生成新密钥）
- [x] 4.3 添加加密/解密失败的错误处理
- [x] 4.4 实现首次使用时的安全性警告提示（使用 shadcn/ui Toast 永久显示，直到用户确认）
- [x] 4.5 更新应用启动初始化流程，在应用渲染后显示安全性警告 Toast（方案 C）

## 5. 存储模块更新

- [x] 5.1 更新 `src/store/storage/storeUtils.ts` 使用 Store 兼容层 API
- [x] 5.2 移除直接导入 `@tauri-apps/plugin-store` 的代码
- [x] 5.3 验证数据读写功能在两种环境中正常工作

## 6. 文档更新

- [x] 6.1 在 AGENTS.md 中新增 "Store 和 Keyring 插件兼容层" 章节
- [x] 6.2 说明 IndexedDB 降级方案的实现细节和数据库结构
- [x] 6.3 提供使用示例代码（Store 和 Keyring 的导入和使用）
  - [x] 6.4 添加安全性警告和浏览器兼容性说明
- [x] 6.5 更新 "为其他插件添加兼容层" 部分，说明 IndexedDB 降级策略的选择规则

## 7. 单元测试

- [ ] 7.1 编写 Store 兼容层单元测试（get/set/delete/keys/save 方法）
- [ ] 7.2 编写 Keyring 兼容层单元测试（setPassword/getPassword/deletePassword 方法）
- [ ] 7.3 编写加密/解密正确性测试（AES-256-GCM）
- [ ] 7.4 编写密钥派生一致性测试（PBKDF2）
- [ ] 7.5 编写错误场景测试（IndexedDB 不可用、存储配额超限、加密失败）
- [ ] 7.6 确保所有测试在 CI/CD 流程中通过

## 8. 集成测试和跨浏览器验证

- [ ] 8.1 在 Chrome 浏览器中进行完整功能测试（应用启动、数据读写、主密钥初始化）
- [ ] 8.2 在 Firefox 浏览器中进行完整功能测试
- [ ] 8.3 在 Safari 浏览器中进行完整功能测试
- [ ] 8.4 测试错误场景（IndexedDB 不可用、存储配额超限）
- [ ] 8.5 性能测试（加密/解密、密钥派生、IndexedDB 查询）
- [ ] 8.6 安全性审查（确保密钥不暴露在日志或调试工具中）

## 9. 代码审查和优化

- [x] 9.1 运行 `pnpm lint` 检查代码规范
- [x] 9.2 运行 `pnpm tsc` 进行类型检查
- [x] 9.3 代码审查：确保遵循 SOLID 原则和 DRY 原则
- [x] 9.4 代码审查：确保所有函数和类型都有中文注释
- [x] 9.5 代码审查：确保使用 `@/` 别名导入兼容层
