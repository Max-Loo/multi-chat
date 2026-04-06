## REMOVED Requirements

### Requirement: SettingStore 封装类
**Reason**: `SettingStore` 类的 6 个方法中 5 个纯转发到 `StoreCompat`，唯一有附加价值的 `setAndSave()` 功能已被 `saveToStore()` 函数完整覆盖。经排查该类在生产代码中零调用。
**Migration**: 无需迁移。生产代码不使用 `settingStore`。测试 mock 中的 `settingStore` shape 应同步删除。
