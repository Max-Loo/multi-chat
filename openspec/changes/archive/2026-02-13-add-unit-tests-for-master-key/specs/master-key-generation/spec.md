## ADDED Requirements

### Requirement: 密钥长度验证
测试套件必须验证 generateMasterKey() 生成的密钥长度为 64 个十六进制字符（256 bits）。

#### Scenario: 正常生成密钥
- **WHEN** 调用 generateMasterKey()
- **THEN** 返回的密钥字符串长度必须为 64 个字符

#### Scenario: 密钥为纯十六进制格式
- **WHEN** 调用 generateMasterKey()
- **THEN** 返回的密钥字符串必须仅包含 0-9 和 a-f 的十六进制字符

### Requirement: 密钥格式验证
测试套件必须验证 generateMasterKey() 生成的密钥符合预期的十六进制编码格式。

#### Scenario: 每个字节转换为两个 hex 字符
- **WHEN** 调用 generateMasterKey() 生成 32 字节的随机数据
- **THEN** 每个字节必须被转换为两个十六进制字符
- **AND** 转换后的字符串长度为 64 个字符

#### Scenario: 使用小写十六进制字符
- **WHEN** 调用 generateMasterKey()
- **THEN** 返回的密钥字符串必须使用小写字母（a-f），而非大写（A-F）

### Requirement: 密钥随机性验证
测试套件必须验证 generateMasterKey() 生成的密钥具有足够的随机性，多次生成的密钥不应重复。

#### Scenario: 连续生成密钥不重复
- **WHEN** 连续调用 generateMasterKey() 100 次
- **THEN** 生成的 100 个密钥必须全部唯一
- **AND** 使用 Set 数据结构验证无重复值

#### Scenario: 密钥分布统计验证
- **WHEN** 调用 generateMasterKey() 生成多个密钥
- **THEN** 每个十六进制字符（0-9, a-f）在密钥中的分布应接近随机
- **AND** 不应出现明显的模式或固定序列

### Requirement: 密钥生成方法验证
测试套件必须验证 generateMasterKey() 使用正确的 Web Crypto API 方法。

#### Scenario: 使用 crypto.getRandomValues
- **WHEN** 生成密钥时
- **THEN** 必须使用 crypto.getRandomValues() 方法生成随机数
- **AND** 该方法在浏览器和 Node.js 环境中均可调用

#### Scenario: 生成 32 字节随机数组
- **WHEN** 调用 generateMasterKey()
- **THEN** 必须创建一个包含 32 个元素的 Uint8Array
- **AND** 每个元素为 0-255 之间的随机值

### Requirement: 密钥生成性能验证
测试套件必须验证密钥生成操作的性能合理，不会阻塞应用初始化。

#### Scenario: 单次密钥生成时间
- **WHEN** 调用 generateMasterKey()
- **THEN** 生成操作应在 10 毫秒内完成
- **AND** 不应涉及异步操作（为同步函数）

#### Scenario: 批量生成性能
- **WHEN** 连续调用 generateMasterKey() 1000 次
- **THEN** 所有生成操作应在合理时间内完成（建议 < 1 秒）
- **AND** 不应出现内存泄漏或性能下降
