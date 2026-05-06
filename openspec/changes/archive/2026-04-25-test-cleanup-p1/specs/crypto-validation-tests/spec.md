## ADDED Requirements

### Requirement: crypto-simple.test.ts 必须删除

`src/__test__/utils/crypto-simple.test.ts` MUST 被整体删除。该文件仅包含 1 个冒烟测试用例，与 `crypto-masterkey.integration.test.ts` 中的「首次启动生成新密钥并加密」+「使用相同密钥解密密文」两个用例完全重复，且 integration 版本覆盖更全面。

#### Scenario: 删除后测试套件正常运行

- **WHEN** `crypto-simple.test.ts` 被删除
- **THEN** 全量测试 MUST 仍然通过
- **AND** 无任何其他测试文件 import 该文件的内容

### Requirement: crypto-storage 测试重定位为加密业务策略测试

`crypto-storage.test.ts` MUST 重命名为 `crypto-storage-strategy.test.ts`，定位为「加密业务策略单元测试」。文件 MUST 仅保留以下独有场景，删除所有与 `crypto.test.ts` 重复的用例。

#### Scenario: 保留批量解密失败容错场景

- **WHEN** 重定位后的文件被审查
- **THEN** SHALL 包含以下场景的测试：
  - 所有模型使用旧密钥时批量解密失败，保留原始 enc: 值
  - 部分模型使用旧密钥时，仅失败项保留 enc: 值，成功项正常解密

#### Scenario: 保留 masterKey 丢失降级场景

- **WHEN** 重定位后的文件被审查
- **THEN** SHALL 包含以下场景的测试：
  - masterKey 丢失后加密的 apiKey 被替换为空字符串
  - masterKey 丢失后未加密的 apiKey 保持不变
  - masterKey 为 null 时加密字段置空（静默降级，非报错）
  - masterKey 为 null 时明文字段保持不变

#### Scenario: 保留混合加密状态场景

- **WHEN** 重定位后的文件被审查
- **THEN** SHALL 包含以下场景的测试：
  - 保存混合状态模型时仅未加密的 apiKey 被加密，已加密/空/undefined 不动
  - 加载混合状态模型时已加密的 apiKey 被解密，明文不动

#### Scenario: 删除重复用例

- **WHEN** 重定位后的文件与 `crypto.test.ts` 对比
- **THEN** MUST NOT 包含以下重复场景：基本加密/解密往返、错误密钥解密失败、enc: 前缀验证、密文格式验证（无效 Base64/数据长度不足/缺少前缀）、nonce 唯一性/并发加密、isEncrypted() 各种输入判断、空密钥/64 字符密钥验证

### Requirement: 边缘用例迁移至 crypto.test.ts

`crypto-storage.test.ts` 中以下 2 个边缘用例 MUST 迁移到 `crypto.test.ts` 的「边缘用例」区域：

1. 无效 hex 字符串的密钥（非 hex 字符导致包装错误）
2. 奇数长度 hex 字符串的密钥（63 字符导致包装错误）

#### Scenario: 迁移后 crypto.test.ts 覆盖边缘密钥格式

- **WHEN** 扫描 `crypto.test.ts` 的边缘用例区域
- **THEN** SHALL 包含无效 hex 字符密钥和奇数长度 hex 密钥的测试用例
- **AND** 这两个用例 MUST NOT 依赖 `crypto-storage.test.ts` 中的任何 mock
