## ADDED Requirements

### Requirement: 密钥导出失败路径测试
`crypto-masterkey.integration.test.ts` 中的密钥导出失败用例 SHALL 保留 skip 状态但补充详细的跳过原因注释，说明环境限制。

#### Scenario: 跳过用例注释规范
- **WHEN** 测试因 `fake-indexedDB` mock 死锁无法执行
- **THEN** skip 注释 SHALL 说明：具体的环境限制（fake-indexedDB 版本）、已验证的替代方式（生产环境验证）、解除条件（环境升级或 mock 改进）
