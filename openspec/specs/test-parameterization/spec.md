## ADDED Requirements

### Requirement: crypto Unicode 往返测试参数化
`crypto.test.ts` 中约 20 个 Unicode 字符的加解密往返测试 SHALL 使用 `test.each` 进行参数化。

#### Scenario: Unicode 往返测试使用 test.each
- **WHEN** 查看 `crypto.test.ts` 中所有 Unicode 字符（中文、日文、韩文、emoji 等）的加密→解密往返测试
- **THEN** 这些测试 SHALL 使用 `test.each` 统一参数化，而非单独编写多个 it/test 块

#### Scenario: 参数化后测试可读性
- **WHEN** 查看参数化后的测试输出
- **THEN** 每个测试用例 SHALL 包含有意义的测试名称，能够清楚识别测试的 Unicode 字符类型
