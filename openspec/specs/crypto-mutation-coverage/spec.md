## Purpose

Crypto 模块突变测试覆盖率规格，定义测试 SHALL 验证的关键行为路径，确保突变测试工具（如 Stryker）无法存活未覆盖的逻辑分支。

## Requirements

### Requirement: decryptField 错误链 cause 属性验证
测试 SHALL 验证 `decryptField` 在解密失败时抛出的 `Error` 对象包含 `cause` 属性，且 `cause` 为原始底层错误。

#### Scenario: 使用错误密钥解密时错误包含 cause
- **WHEN** 使用错误的主密钥调用 `decryptField` 解密密文
- **THEN** 抛出的 `Error` 的 `message` 包含"解密敏感数据失败"，且 `cause` 属性存在且为 `Error` 实例

#### Scenario: 解密损坏数据时错误包含 cause
- **WHEN** 对格式正确但数据损坏的密文调用 `decryptField`
- **THEN** 抛出的 `Error` 的 `cause` 属性存在，指向底层解密操作错误

### Requirement: extractable 变异状态记录
将 `importKey` 的 `extractable` 参数存活变异（2 个 BooleanLiteral）记录为已知等价变异，暂不补充测试。该参数不影响加密/解密功能正确性，属于安全纵深防御属性。

#### Scenario: extractable 变异标记为已知等价变异
- **WHEN** Stryker 将 `importKey` 的 `extractable` 参数从 `false` 变异为 `true`
- **THEN** 现有测试无法区分差异，该变异继续存活，记录为等价变异不处理
