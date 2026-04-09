## MODIFIED Requirements

### Requirement: Web Store 使用共享的 initIndexedDB

WebStoreCompat 的 IndexedDB 初始化 SHALL 使用从共享模块导入的 `initIndexedDB` 函数，而非本地定义的版本。

#### Scenario: Store 功能不变
- **WHEN** 通过 WebStoreCompat 进行 get/set/delete/keys 操作
- **THEN** 行为与重构前完全一致，数据格式不变

#### Scenario: 公开 API 不变
- **WHEN** 上层代码通过 `@/utils/tauriCompat` 导入 store 相关 API
- **THEN** 所有导出的函数签名和类型保持不变
