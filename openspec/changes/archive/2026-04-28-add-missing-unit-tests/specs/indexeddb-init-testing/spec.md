## ADDED Requirements

### Requirement: initIndexedDB 成功时 resolve 数据库实例

当 `indexedDB.open()` 触发 `success` 事件时，`initIndexedDB` SHALL resolve 为 `request.result`（即 `IDBDatabase` 实例）。

#### Scenario: 数据库成功打开
- **WHEN** 调用 `initIndexedDB('test-db', 'test-store', 'id')` 且 `indexedDB.open()` 触发 `success` 事件
- **THEN** Promise SHALL resolve 为 `request.result`

### Requirement: initIndexedDB 失败时 reject 错误

当 `indexedDB.open()` 触发 `error` 事件时，`initIndexedDB` SHALL reject 为包含错误信息的 `Error`。

#### Scenario: 数据库打开失败
- **WHEN** 调用 `initIndexedDB('test-db', 'test-store', 'id')` 且 `indexedDB.open()` 触发 `error` 事件，`request.error` 为 `'VersionError'`
- **THEN** Promise SHALL reject 为 `Error`，错误消息包含 `'VersionError'`

### Requirement: initIndexedDB 在 upgradeneeded 时创建对象存储

当 `indexedDB.open()` 触发 `upgradeneeded` 事件且对象存储不存在时，`initIndexedDB` SHALL 调用 `db.createObjectStore(storeName, { keyPath })`。

#### Scenario: 首次打开数据库（需要升级）
- **WHEN** 调用 `initIndexedDB('test-db', 'test-store', 'id')` 且 `upgradeneeded` 事件触发，`db.objectStoreNames` 不包含 `'test-store'`
- **THEN** SHALL 调用 `db.createObjectStore('test-store', { keyPath: 'id' })`

#### Scenario: 对象存储已存在时不重复创建
- **WHEN** 调用 `initIndexedDB('test-db', 'existing-store', 'id')` 且 `upgradeneeded` 事件触发，`db.objectStoreNames` 已包含 `'existing-store'`
- **THEN** SHALL NOT 调用 `db.createObjectStore`

### Requirement: initIndexedDB 支持复合键

`initIndexedDB` SHALL 接受 `keyPath` 为字符串数组（复合键）。

#### Scenario: 使用复合键创建对象存储
- **WHEN** 调用 `initIndexedDB('test-db', 'test-store', ['chatId', 'modelId'])` 且 `upgradeneeded` 事件触发
- **THEN** SHALL 调用 `db.createObjectStore('test-store', { keyPath: ['chatId', 'modelId'] })`
