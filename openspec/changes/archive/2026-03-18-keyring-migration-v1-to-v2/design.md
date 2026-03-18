# Design: Keyring V1 → V2 迁移

## Context

### 当前状态

Web 环境的密钥派生逻辑位于 `src/utils/tauriCompat/keyring.ts`，使用 PBKDF2 算法从 `navigator.userAgent + seed` 派生加密密钥。

```
当前密钥派生流程：
navigator.userAgent ──┐
                      ├──▶ keyMaterial ──▶ PBKDF2 ──▶ 加密密钥
seed (localStorage) ──┘
```

### 问题

`navigator.userAgent` 会因以下原因变化：
- 浏览器版本更新（Chrome 120 → Chrome 121）
- 用户切换浏览器（Chrome → Firefox）
- 浏览器隐私设置
- 扩展程序修改

一旦 `userAgent` 变化，之前加密的数据将无法解密。

### 数据规模

涉及的 IndexedDB 数据库：
- `multi-chat-keyring`：存储加密的主密钥（一条记录）
- `multi-chat-store`：存储加密的应用数据（使用主密钥加密）

迁移失败时需要清除这两个数据库。

## Goals / Non-Goals

**Goals:**

1. 移除密钥派生对 `navigator.userAgent` 的依赖
2. 提供静默的 V1 → V2 数据迁移
3. 迁移失败时优雅降级（重置数据）
4. 集成到应用初始化流程，支持进度显示

**Non-Goals:**

1. 不修改 Tauri 环境的实现（使用系统钥匙串）
2. 不修改加密算法（仍使用 AES-256-GCM）
3. 不改变 IndexedDB 数据结构
4. 不提供用户可见的迁移通知

## Decisions

### Decision 1: 密钥派生方式

**选择**: 仅使用 `seed` 作为密钥派生材料

```
新密钥派生流程：
seed (localStorage) ──▶ PBKDF2 ──▶ 加密密钥
```

**理由**:
- `seed` 存储在 `localStorage`，用户不主动清除则不会变化
- 移除 `userAgent` 依赖后，跨浏览器版本稳定性显著提升
- 安全性不变（种子仍通过 PBKDF2 100,000 次迭代保护）

### Decision 2: 迁移时机

**选择**: 作为 `initSteps.ts` 中的第一个步骤执行（在 `i18n` 之前）

**备选方案**:
| 方案 | 优点 | 缺点 |
|------|------|------|
| 在 i18n 之前（选择） | 迁移最早执行，逻辑清晰 | 错误消息需硬编码英文 |
| 在 i18n 之后 | 可显示国际化错误消息 | 迁移稍晚执行 |
| 集成到 `WebKeyringCompat.init()` | 内聚性高 | 并发迁移复杂 |

**理由**:
- 迁移操作很快（只有一条记录），串行执行不会显著影响启动时间
- 迁移是静默操作，通常不需要显示错误消息
- 放在最前面可以确保后续所有步骤都使用已迁移的数据格式

### Decision 3: 迁移失败处理

**选择**: 删除旧数据 + 生成新 seed + 继续启动

**理由**:
- 迁移失败的主要原因是 `userAgent` 已变化，此时旧数据已无法恢复
- 重置是唯一可行的方案
- `initializeMasterKey` 已有处理"密钥不存在"的逻辑，会自动生成新密钥

### Decision 4: 版本标记存储

**选择**: 使用 `localStorage`，键名 `keyring-data-version`

**理由**:
- 与 `seed` 存储位置一致
- 读取快速，无异步操作
- 版本标记与数据格式紧密关联

## Risks / Trade-offs

### Risk 1: 迁移失败导致数据丢失

**场景**: 用户 `userAgent` 已变化，无法解密旧数据

**影响**: 用户需要重新配置 API keys，聊天记录等应用数据也将丢失

**缓解措施**:
- 这是预期行为，现有代码已有类似处理（密钥不存在时生成新密钥）
- `initializeMasterKey` 会输出 console 警告
- Web 版本的安全级别本身就低于桌面版，用户应有心理预期

### Risk 2: 并发迁移

**场景**: 多个浏览器标签页同时启动应用

**影响**: 可能重复迁移

**缓解措施**:
- IndexedDB 事务自动处理并发
- 迁移是幂等操作（先检查版本，再迁移）

### Risk 3: 迁移代码维护

**场景**: 需要长期保留 V1 密钥派生逻辑

**影响**: 代码库膨胀

**缓解措施**:
- 添加清理计划注释
- 监控迁移覆盖率，适时移除迁移逻辑

## Migration Plan

### 部署步骤

1. 发布包含迁移逻辑的新版本
2. 用户首次启动时自动迁移
3. 迁移成功后，`localStorage` 中设置 `keyring-data-version: "2"`

### 回滚策略

如果发现严重问题：

1. 用户可手动清除 `localStorage` 和 IndexedDB
2. 重新启动应用会生成新密钥

**注意**: 回滚后旧数据仍无法恢复（V2 密钥无法解密 V1 数据）

### 清理计划

```
清理计划：
- [ ] 当大多数用户已完成迁移后，移除 keyringMigration.ts
- [ ] 同时移除 initSteps.ts 中的 keyringMigration 步骤
- [ ] 同时清理 localStorage['keyring-data-version'] 的读取逻辑
- [ ] 预计清理时间：待定（根据迁移覆盖率数据调整）
```

## Open Questions

无。所有设计决策已在探索阶段与用户确认。
