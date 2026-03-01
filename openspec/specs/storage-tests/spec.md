# Spec: 数据持久化层测试能力

## ADDED Requirements

### Requirement: Store 兼容层测试覆盖
系统 MUST 为 Store 兼容层（`src/utils/tauriCompat/store.ts`）提供完整的测试覆盖，包括环境检测、CRUD 操作和 IndexedDB 集成的所有场景。

#### Scenario: Tauri 环境创建 TauriStoreCompat
- **WHEN** 运行环境为 Tauri 桌面环境
- **THEN** createLazyStore() MUST 返回 TauriStoreCompat 实例
- **AND** isSupported() MUST 返回 true

#### Scenario: Web 环境创建 WebStoreCompat
- **WHEN** 运行环境为 Web 浏览器环境
- **THEN** createLazyStore() MUST 返回 WebStoreCompat 实例
- **AND** isSupported() MUST 检查 IndexedDB 可用性

#### Scenario: 初始化 Store 成功
- **WHEN** 调用 `store.init()`
- **THEN** 系统 MUST 初始化存储后端（Tauri 文件系统或 IndexedDB）
- **AND** 初始化 MUST 成功完成

#### Scenario: 初始化 IndexedDB 失败
- **WHEN** 在 Web 环境 IndexedDB 不可用
- **THEN** store.init() MUST 抛出错误
- **AND** 错误消息 MUST 说明"浏览器不支持 IndexedDB 或初始化失败"

#### Scenario: 在未初始化时调用 get 操作
- **WHEN** Store 未调用 init() 就调用 get()
- **THEN** 系统 MUST 抛出错误"Store 未初始化，请先调用 init() 方法"

#### Scenario: get 操作返回存储的值
- **WHEN** 调用 `store.set(key, value)` 存储数据后调用 `store.get(key)`
- **THEN** get() MUST 返回之前存储的值
- **AND** 返回值类型 MUST 与存储时一致

#### Scenario: get 操作返回 null 当键不存在时
- **WHEN** 调用 `store.get(nonExistentKey)`
- **THEN** 系统 MUST 返回 null
- **AND** 系统 MUST NOT 抛出错误

#### Scenario: get 操作处理读取错误
- **WHEN** IndexedDB 读取操作失败
- **THEN** 系统 MUST 在控制台输出错误日志
- **AND** 系统 MUST 返回 null
- **AND** 系统 MUST NOT 抛出异常

#### Scenario: set 操作成功存储数据
- **WHEN** 调用 `store.set(key, value)`
- **THEN** 系统 MUST 成功存储数据
- **AND** 后续 get() 调用 MUST 返回相同数据

#### Scenario: set 操作覆盖已存在的键
- **WHEN** 对同一个键多次调用 `store.set(key, value)`
- **THEN** 后续值 MUST 覆盖之前的值
- **AND** get() MUST 返回最新的值

#### Scenario: set 操作处理写入错误
- **WHEN** IndexedDB 写入操作失败
- **THEN** 系统 MUST 抛出错误
- **AND** 错误消息 MUST 包含失败的键名

#### Scenario: delete 操作成功删除键
- **WHEN** 调用 `store.delete(key)` 删除已存在的键
- **THEN** 系统 MUST 成功删除数据
- **AND** 后续 get() 调用 MUST 返回 null

#### Scenario: delete 操作删除不存在的键不报错
- **WHEN** 调用 `store.delete(nonExistentKey)`
- **THEN** 系统 MUST 不抛出错误
- **AND** 操作 MUST 成功完成

#### Scenario: keys 操作返回所有键
- **WHEN** Store 中存储了多个键值对
- **THEN** keys() MUST 返回所有键的数组
- **AND** 数组长度 MUST 等于存储的键数量

#### Scenario: keys 操作返回空数组当存储为空时
- **WHEN** Store 中没有存储任何数据
- **THEN** keys() MUST 返回空数组

#### Scenario: save 操作在 Tauri 环境保存到磁盘
- **WHEN** 在 Tauri 环境调用 `store.save()`
- **THEN** 系统 MUST 将更改保存到文件系统
- **AND** 操作 MUST 成功完成

#### Scenario: save 操作在 Web 环境为空操作
- **WHEN** 在 Web 环境调用 `store.save()`
- **THEN** 系统 MUST 为空操作（IndexedDB 自动持久化）
- **AND** 操作 MUST 立即返回 resolved Promise

#### Scenario: 存储复杂对象
- **WHEN** 存储包含嵌套对象、数组和混合类型的复杂对象
- **THEN** 存储 MUST 成功完成
- **AND** get() MUST 返回完整相同的对象结构

#### Scenario: 存储大数据
- **WHEN** 存储大于 1MB 的数据
- **THEN** 存储 MUST 成功完成
- **AND** get() MUST 返回完整数据

---

### Requirement: Store 工具函数测试覆盖
系统 MUST 为 Store 工具函数（`src/store/storage/storeUtils.ts`）提供完整的测试覆盖，包括 saveToStore、loadFromStore 和 SettingStore 的所有场景。

#### Scenario: saveToStore 成功保存数据
- **WHEN** 调用 `saveToStore(store, key, data, successMessage)`
- **THEN** 系统 MUST 调用 `store.set(key, data)`
- **AND** 系统 MUST 调用 `store.save()`
- **AND** 如果提供了 successMessage，系统 MUST 在控制台输出成功日志

#### Scenario: saveToStore 处理保存失败
- **WHEN** store.set() 或 store.save() 抛出异常
- **THEN** 系统 MUST 在控制台输出错误日志
- **AND** 系统 MUST 重新抛出异常

#### Scenario: saveToStore 打印成功日志
- **WHEN** 调用 `saveToStore(store, key, data, '保存测试数据')`
- **THEN** 系统 MUST 在控制台输出"成功保存测试数据到 {key}"

#### Scenario: saveToStore 打印错误日志
- **WHEN** 保存操作失败
- **THEN** 系统 MUST 在控制台输出"保存数据到 {key} 失败:"及错误详情

#### Scenario: loadFromStore 成功加载数据
- **WHEN** Store 中存在指定的键
- **THEN** 系统 MUST 调用 `store.init()`
- **AND** 系统 MUST 调用 `store.get(key)`
- **AND** 系统 MUST 返回存储的数据

#### Scenario: loadFromStore 数据不存在时返回默认值
- **WHEN** Store 中不存在指定的键
- **THEN** 系统 MUST 返回提供的 defaultValue
- **AND** 系统 MUST 在控制台输出"{key} 数据不存在，返回默认值"

#### Scenario: loadFromStore 加载失败时返回默认值
- **WHEN** store.init() 或 store.get() 抛出异常
- **THEN** 系统 MUST 在控制台输出错误日志
- **AND** 系统 MUST 返回提供的 defaultValue

#### Scenario: SettingStore init 初始化成功
- **WHEN** 调用 `settingStore.init()`
- **THEN** 系统 MUST 初始化内部 Store 实例
- **AND** 操作 MUST 成功完成

#### Scenario: SettingStore get/set/delete/save 功能正常
- **WHEN** 调用 SettingStore 的 get、set、delete、save 方法
- **THEN** 系统 MUST 正确委托到内部 Store 实例
- **AND** 操作行为 MUST 与 StoreCompat 接口一致

#### Scenario: SettingStore setAndSave 功能正常
- **WHEN** 调用 `settingStore.setAndSave(key, value, message)`
- **THEN** 系统 MUST 调用 `store.set(key, value)`
- **AND** 系统 MUST 调用 `store.save()`
- **AND** 操作 MUST 成功完成

#### Scenario: SettingStore setAndSave 失败时抛出错误
- **WHEN** set() 或 save() 操作失败
- **THEN** 系统 MUST 在控制台输出错误日志
- **AND** 系统 MUST 抛出包含 message 的错误

---

### Requirement: 聊天存储测试覆盖
系统 MUST 为聊天存储（`src/store/storage/chatStorage.ts`）提供完整的测试覆盖，包括 saveChatsToJson 和 loadChatsFromJson 的所有场景。

#### Scenario: saveChatsToJson 成功保存聊天列表
- **WHEN** 调用 `saveChatsToJson(chats)` 保存聊天数组
- **THEN** 系统 MUST 调用 `saveToStore(chatsStore, 'chats', chats, '保存 N 个聊天')`
- **AND** 操作 MUST 成功完成

#### Scenario: saveChatsToJson 保存空列表
- **WHEN** 传入空数组 `[]`
- **THEN** 系统 MUST 成功保存
- **AND** 日志 MUST 显示"成功保存 0 个聊天"

#### Scenario: saveChatsToJson 处理保存失败
- **WHEN** saveToStore 抛出异常
- **THEN** 系统 MUST 重新抛出异常
- **AND** 错误 MUST 包含失败原因

#### Scenario: loadChatsFromJson 成功加载聊天列表
- **WHEN** Store 中存在聊天数据
- **THEN** 系统 MUST 调用 `loadFromStore<Chat[]>(chatsStore, 'chats', [])`
- **AND** 系统 MUST 返回聊天数组

#### Scenario: loadChatsFromJson 数据不存在时返回空数组
- **WHEN** Store 中不存在聊天数据
- **THEN** 系统 MUST 返回空数组 `[]`

#### Scenario: loadChatsFromJson 加载失败时返回空数组
- **WHEN** loadFromStore 抛出异常
- **THEN** 系统 MUST 返回空数组 `[]`
- **AND** 系统 MUST 在控制台输出错误日志

#### Scenario: Chat 类型安全验证
- **WHEN** 加载聊天数据
- **THEN** 返回值类型 MUST 为 `Chat[]`
- **AND** 每个 Chat 对象 MUST 包含必需字段（id、name、chatModelList、isDeleted）

---

### Requirement: 测试覆盖率和质量标准
系统 MUST 确保所有数据持久化层测试达到以下质量和覆盖率标准。

#### Scenario: 语句覆盖率达标
- **WHEN** 运行 `pnpm test:coverage`
- **THEN** 每个数据持久化层模块的语句覆盖率 MUST ≥ 85%

#### Scenario: 分支覆盖率达标
- **WHEN** 运行 `pnpm test:coverage`
- **THEN** 每个数据持久化层模块的分支覆盖率 MUST ≥ 80%

#### Scenario: 函数覆盖率达标
- **WHEN** 运行 `pnpm test:coverage`
- **THEN** 每个数据持久化层模块的函数覆盖率 MUST ≥ 90%

#### Scenario: 测试通过率 100%
- **WHEN** 运行 `pnpm test:run`
- **THEN** 所有数据持久化层测试 MUST 通过
- **AND** 失败测试数 MUST 为 0

---

### Requirement: IndexedDB Mock 和测试隔离
系统 MUST 使用 fake-indexeddb 库模拟 IndexedDB，确保测试隔离和数据一致性。

#### Scenario: 使用 fake-indexeddb 初始化
- **WHEN** 测试开始前
- **THEN** 系统 MUST 使用 fake-indexeddb 创建内存数据库
- **AND** 数据库名称 MUST 为测试专用（避免污染其他测试）

#### Scenario: 每个测试使用独立的数据库实例
- **WHEN** 运行多个测试用例
- **THEN** 每个测试 MUST 有独立的 IndexedDB 实例
- **AND** 测试之间 MUST 不相互影响

#### Scenario: 测试后清理数据库
- **WHEN** 测试完成后（afterEach）
- **THEN** 系统 MUST 清空所有测试数据
- **AND** 系统 MUST 关闭数据库连接

#### Scenario: IndexedDB 事务处理
- **WHEN** 测试涉及多个 IndexedDB 操作
- **THEN** 系统 MUST 正确处理事务生命周期
- **AND** 系统 MUST 在事务完成前保持数据库打开

#### Scenario: IndexedDB 事件处理
- **WHEN** IndexedDB 操作触发 success、error 或 upgradeneeded 事件
- **THEN** 系统 MUST 正确处理所有事件类型
- **AND** 测试 MUST 覆盖所有事件路径

---

### Requirement: Mock 策略和测试隔离
系统 MUST 使用一致的 Mock 策略，确保测试隔离和可重复性。

#### Scenario: Mock Tauri Store API
- **WHEN** 测试需要 Tauri Store 环境
- **THEN** 系统 MUST Mock `@tauri-apps/plugin-store` 的 LazyStore 类
- **AND** Mock 实现 MUST 提供与真实 API 兼容的方法（init、get、set、delete、keys、save）

#### Scenario: Mock 环境检测
- **WHEN** 测试需要 Tauri 或 Web 环境
- **THEN** 系统 MUST 使用 `vi.stubGlobal('window', { __TAURI__: {} })` 或 `vi.stubGlobal('window', {})`
- **AND** 测试完成后 MUST 调用 `vi.unstubAllGlobals()` 清理

#### Scenario: Mock console 输出
- **WHEN** 测试需要验证日志输出
- **THEN** 系统 MUST 使用 `vi.spyOn(console, 'log').mockImplementation(() => {})`
- **AND** 测试完成后 MUST 恢复原始 console.log

#### Scenario: 测试隔离
- **WHEN** 运行多个测试用例
- **THEN** 每个测试 MUST 有独立的 Mock 状态
- **AND** 测试之间 MUST 不相互影响

---

### Requirement: 错误处理和边缘情况测试
系统 MUST 测试所有错误处理路径和边缘情况。

#### Scenario: IndexedDB 不可用时的错误处理
- **WHEN** 浏览器不支持 IndexedDB
- **THEN** 系统 MUST 在 init() 时抛出明确的错误
- **AND** 错误消息 MUST 说明原因和解决方案

#### Scenario: 存储空间不足时的错误处理
- **WHEN** IndexedDB 存储空间不足（quota exceeded）
- **THEN** 系统 MUST 在 set() 时抛出错误
- **AND** 错误消息 MUST 说明存储空间不足

#### Scenario: 数据损坏时的错误处理
- **WHEN** 存储的数据格式错误或损坏
- **THEN** 系统 MUST 在 get() 时返回 null 或抛出错误
- **AND** 系统 MUST 在控制台输出错误日志

#### Scenario: 并发操作的处理
- **WHEN** 同时调用多个 Store 操作（如多个 set() 调用）
- **THEN** 系统 MUST 正确处理并发操作
- **AND** 数据一致性 MUST 得到保证

#### Scenario: 大数据操作的性能
- **WHEN** 存储或加载大于 1MB 的数据
- **THEN** 操作 MUST 在合理时间内完成（< 1秒）
- **AND** 测试 MUST 包含性能断言

---

### Requirement: 测试文档和维护性
系统 MUST 提供清晰的测试文档，确保未来维护的可行性。

#### Scenario: 测试文件头部注释
- **WHEN** 创建新的测试文件
- **THEN** 文件头部 MUST 包含模块描述
- **AND** 文件头部 MUST 包含测试覆盖范围说明

#### Scenario: IndexedDB 集成文档
- **WHEN** 使用 fake-indexeddb
- **THEN** 测试代码 MUST 包含注释说明如何初始化和清理
- **AND** 注释 MUST 说明 fake-indexeddb 的限制

#### Scenario: 测试辅助工具文档
- **WHEN** 创建测试辅助工具函数
- **THEN** 函数 MUST 包含 JSDoc 注释
- **AND** 注释 MUST 说明用途、参数和返回值

#### Scenario: 错误场景文档
- **WHEN** 测试错误处理路径
- **THEN** 测试名称 MUST 清晰描述错误场景
- **AND** 测试 MUST 包含注释说明期望的错误行为
