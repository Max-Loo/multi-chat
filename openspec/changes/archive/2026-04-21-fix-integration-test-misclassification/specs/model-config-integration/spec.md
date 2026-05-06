## MODIFIED Requirements

### Requirement: 模型配置集成测试使用真实存储层

`model-config.integration.test.ts` SHALL 使用 fake-indexeddb 提供的真实存储实现，不 SHALL mock `saveModelsToJson` 和 `loadModelsFromJson`。仅 mock 外部依赖（keyring 系统密钥链访问）。

#### Scenario: 使用真实存储层
- **WHEN** 测试验证模型配置的保存和加载
- **THEN** SHALL 使用 `fake-indexeddb` 的真实存储实现，通过 `saveModelsToJson` 写入并通过 `loadModelsFromJson` 读回验证

### Requirement: 模型配置集成测试仅包含集成测试

`model-config.integration.test.ts` SHALL NOT 包含以下类型的测试：
- 纯加密函数的单元测试（如"加密算法应跨平台一致"）
- JavaScript 基础功能验证（如"应该验证 API 地址格式"使用 `new URL()`）
- mock 环境下的性能测试（如"批量加密/解密应 < 5 秒"）

#### Scenario: 移除纯单元测试
- **WHEN** 测试用例仅验证单个函数的行为（不涉及模块协作）
- **THEN** SHALL 从集成测试文件中移除，该测试应在对应的单元测试文件中存在
