## MODIFIED Requirements

### Requirement: 解密失败处理
当解密操作失败时（如密文损坏或主密钥变更），系统 SHALL 保留该字段的原始加密值（`enc:` 前缀不变），并上报失败信息。

#### Scenario: 主密钥变更后的数据加载
- **WHEN** 应用加载模型配置数据
- **AND** 发现加密的 API 密钥字段
- **AND** 使用当前主密钥解密失败（认证标签验证失败）
- **THEN** 系统 SHALL 保留该字段值为原始 `enc:xxx` 加密字符串（不置空）
- **AND** 系统 SHALL 记录警告日志说明解密失败的原因
- **AND** 系统 SHALL 将失败计入 `decryptionFailureCount` 统计
