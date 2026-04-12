## Context

当前 `keyring.ts` 和 `storeUtils.ts` 中存在两类浅模块问题：

1. **keyring.ts 转发函数**：文件尾部 5 个导出函数（`setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState`）完全转发到模块内部的 `keyringCompat` 实例，不增加任何验证、转换或错误处理。其中 `resetWebKeyringState()` 使用 `instanceof WebKeyringCompat` 检查暴露了实现类型。

2. **SettingStore 薄包装类**：`storeUtils.ts` 中的 `SettingStore` 类将 `StoreCompat` 的 5 个方法原样转发，唯一有价值的 `setAndSave()` 仅组合了 `set + save`。经排查，`settingStore` 实例在生产代码中零调用，仅存在于测试 mock 的 shape 定义中。

当前调用链：

```
masterKey.ts → setPassword() [转发] → keyringCompat.setPassword() [实际]
masterKey.ts → getPassword() [转发] → keyringCompat.getPassword() [实际]
keyringMigration.ts → resetWebKeyringState() [instanceof 泄漏] → keyringCompat.resetState()
```

## Goals / Non-Goals

**Goals:**

- 消除 keyring.ts 中 5 个无附加价值的转发函数，替换为受类型约束的实例导出
- 消除 `resetWebKeyringState()` 的 `instanceof` 信息泄漏，用多态方法替代
- 删除未使用的 `SettingStore` 类和 `settingStore` 导出
- 收敛 barrel export，不再暴露内部实现类

**Non-Goals:**

- 不重构 `WebKeyringCompat` / `TauriKeyringCompat` 内部实现
- 不重构 `saveToStore` / `loadFromStore`（它们是深函数，提供真实价值）
- 不改变外部行为——纯内部结构优化，用户可见行为不变
- 不合并 `keyringMigration.ts` 的重复代码（属于独立改进项）

## Decisions

### 决策 1：用受约束的实例导出替代独立函数

**选择**：导出 `keyring: KeyringPublicAPI` 实例，替代 5 个独立函数。

**备选方案**：
- A) 导出裸 `keyringCompat` 实例 — 风险：暴露 `resetState()` 等内部方法，且 `TauriKeyringCompat` 没有 `resetState()`
- B) 保持独立函数但添加有价值逻辑 — 违反 YAGNI，当前无需求
- C) 用 namespace 对象包裹 — TypeScript 中 namespace 不如 interface 灵活

**理由**：方案 A 通过 `KeyringPublicAPI` 接口约束暴露面，编译期就能防止调用方访问不存在的 `resetState()`（Tauri 环境）。同时减少 65 行代码。

### 决策 2：将 resetState 收入 KeyringPublicAPI 接口

**选择**：在 `KeyringPublicAPI` 接口中定义 `resetState(): void`，内部通过 duck typing 分发。

**备选方案**：
- A) 在 `KeyringCompat` 基础接口加 `resetState()` — 影响 `TauriKeyringCompat`，需要加空实现
- B) 保持 `instanceof` — 信息泄漏，违反设计原则

**理由**：方案 A 让 `TauriKeyringCompat` 加一个空操作的 `resetState()` 使接口完整，比 duck typing 更类型安全。但考虑到 `TauriKeyringCompat` 只是一个极简的代理类（3 行方法体），增加空操作方法会使其变成"半浅模块"。因此采用在 `createKeyringAPI` 工厂中用 duck typing 分发的方式，将复杂性下沉到工厂函数内部。

### 决策 3：直接删除 SettingStore 类

**选择**：完全删除 `SettingStore` 类和 `settingStore` 导出。

**理由**：生产代码中零调用。`setAndSave()` 的 `set + save` 组合逻辑已被 `saveToStore()` 完全覆盖。测试 mock 中的 `settingStore` shape 也需要同步删除，简化 mock 配置。

## Risks / Trade-offs

- **[破坏性 API 变更]** → `import { setPassword }` 改为 `import { keyring }`，影响 2 个生产文件 + 1 个测试文件。调用方改动量小（约 10 行），可控。
- **[Barrel export 收敛]** → `index.ts` 当前仅导出 `type { KeyringCompat }`（从未导出 `WebKeyringCompat`/`TauriKeyringCompat` 类）。需更新为 `type { KeyringPublicAPI }`，保留 `KeyringCompat` 供外部类型引用。测试文件已直接从 `./keyring` 路径导入，不受影响。
- **[duck typing 分发]** → `resetState()` 内部通过 `'resetState' in impl` 检查分发。比 `instanceof` 好但不如正式接口。考虑到只有两个实现类且不会扩展，风险极低。

## Migration Plan

1. 先改 `keyring.ts`（添加 `KeyringPublicAPI` + `createKeyringAPI` + `keyring` 导出）
2. 改调用方 `masterKey.ts` 和 `keyringMigration.ts` 的 import
3. 改 `index.ts` barrel export 及 JSDoc 示例
4. 删除 `storeUtils.ts` 中的 `SettingStore`
5. 更新测试文件（`keyring.test.ts`、`masterKey.test.ts`、`setup.ts`、mock 工具）
6. 更新文档（`docs/design/cross-platform.md`）
7. 运行测试确认无回归

**回滚**：还原 import 路径即可，无数据迁移。
