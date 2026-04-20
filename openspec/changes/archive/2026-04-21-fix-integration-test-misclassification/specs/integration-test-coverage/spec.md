## ADDED Requirements

### Requirement: 集成测试目录准入标准

`src/__test__/integration/` 目录中的测试文件 SHALL 满足以下全部条件：

1. 测试至少两个模块的协作（如 Redux + Storage、Service + UI）
2. 使用真实存储层（fake-indexeddb）而非 mock 的存储实现
3. 使用真实加密层（crypto.ts）而非 mock 的加密函数
4. 仅 mock 外部 API（网络请求）和系统密钥链（keyring）
5. 测试名称 SHALL NOT 包含 "e2e" 字样，除非使用真实浏览器环境

#### Scenario: 验证集成测试使用真实存储层
- **WHEN** 集成测试涉及数据持久化操作（save/load）
- **THEN** SHALL 使用 fake-indexeddb 提供的真实存储实现，不 SHALL mock 存储层模块

#### Scenario: 验证集成测试涉及多模块协作
- **WHEN** 测试文件位于 `src/__test__/integration/` 目录
- **THEN** 测试 SHALL 验证至少两个模块之间的协作行为，不 SHALL 仅测试单个纯函数
