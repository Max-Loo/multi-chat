## ADDED Requirements

### Requirement: 集成测试 Mock 与窗口模拟互斥原则
集成测试 SHALL NOT 同时使用 `vi.mock` Mock 内部响应式 hook 和设置 `global.innerWidth` + `dispatch(new Event('resize'))` 模拟窗口尺寸。两种机制互斥，Mock 存在时窗口尺寸模拟无效。

#### Scenario: Mock useResponsive 时移除 resize 代码
- **WHEN** 集成测试通过 `vi.mock('@/hooks/useResponsive')` 控制布局模式
- **THEN** MUST NOT 设置 `global.innerWidth` 或调用 `global.dispatchEvent(new Event('resize'))`
- **AND** SHALL 仅通过 Mock 返回值控制布局状态

#### Scenario: 使用真实响应式行为时需要 matchMedia polyfill
- **WHEN** 集成测试意图测试真实的响应式布局切换行为
- **THEN** SHALL NOT Mock `useResponsive`
- **AND** SHALL 提供 `window.matchMedia` polyfill 并通过 `global.innerWidth` 控制视口宽度

---

### Requirement: 测试用例不可重复断言相同结果
同一 describe 块内的测试用例 SHALL NOT 对同一数据断言完全相同的条件或存在包含关系。当存在包含关系时，SHALL 保留断言更严格的用例（超集），删除被包含的用例（子集）。

#### Scenario: 合并步骤名称唯一性测试（包含关系）
- **WHEN** 测试初始化步骤配置的步骤名称唯一性
- **THEN** SHALL 保留断言更严格的用例（包含 Set 比较和步骤数量断言）
- **AND** MUST NOT 保留仅验证等价不变量的冗余用例（如 reduce 计数方式）

#### Scenario: 合并依赖存在性验证测试（等价关系）
- **WHEN** 测试初始化步骤的依赖存在性
- **THEN** SHALL 仅保留带自定义错误消息的用例（便于定位问题）
- **AND** MUST NOT 保留逻辑相同但无错误消息的用例

#### Scenario: 合并字段完整性测试（包含关系）
- **WHEN** 测试初始化步骤配置的字段完整性
- **THEN** SHALL 仅保留断言更完整的用例（defined + typeof + length）
- **AND** MUST NOT 保留仅验证 typeof 的子集用例

#### Scenario: 合并 onError severity 测试（包含关系）
- **WHEN** 测试初始化步骤的 onError 返回值
- **THEN** SHALL 仅保留同时验证 severity 和 message 的用例
- **AND** MUST NOT 保留仅验证 severity 的子集用例

#### Scenario: 合并导出测试（包含关系）
- **WHEN** 测试 initSteps 的导出结构
- **THEN** SHALL 保留 `应该 initSteps 可以正常导入`（包含 defined + Array.isArray）
- **AND** MUST NOT 保留仅检查 Array.isArray 的子集用例
