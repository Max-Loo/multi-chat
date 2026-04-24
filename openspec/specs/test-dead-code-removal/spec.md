## Purpose

清理测试代码中的死代码、冗余调用和调试残留，保持测试文件的整洁和可维护性。

## Requirements

### Requirement: 移除冗余 cleanup() 调用

所有测试文件不得（MUST NOT）手动调用 `cleanup()`，因为 `setup.ts` 全局 `afterEach` 已处理。仅包含 `cleanup()` 调用的 `afterEach` 块必须（MUST）整体移除。

#### Scenario: 38 个文件移除冗余 cleanup

- **WHEN** 扫描 `src/__test__/` 目录下所有测试文件
- **THEN** 不包含任何 `cleanup()` 的手动调用（从 `@testing-library/react` 导入的 `cleanup` 也应移除）

#### Scenario: 空 afterEach 块整体移除

- **WHEN** 某个测试文件的 `afterEach` 回调仅包含 `cleanup()` 调用
- **THEN** 整个 `afterEach` 块（包括 `import { cleanup }` 中的 `cleanup`）必须（MUST）被移除

### Requirement: 删除循环论证测试文件

`verify-setup-mock.test.ts` 必须（MUST）被删除。该文件仅验证 `vi.isMockFunction()` 返回 `true`，不涉及任何业务逻辑，属于 mock 基础设施的循环论证。`ai-mock-test.test.ts` 不得（MUST NOT）被删除（其后半部分验证了 `createMockStreamResult` 的流消费行为，具有实质价值）。

#### Scenario: 删除文件后测试套件正常运行

- **WHEN** `verify-setup-mock.test.ts` 被删除
- **THEN** 全量测试仍然通过，无任何测试受影响

### Requirement: 清理已删除测试注释块

`appConfigSlices.test.ts`、`modelSlice.test.ts`、`chatSlices.test.ts`、`modelProviderSlice.test.ts` 中关于已删除测试的注释块必须（MUST）被移除。文件头部的模块说明文档可以（MAY）保留。

#### Scenario: 移除注释后测试文件无噪音

- **WHEN** 扫描上述 4 个文件
- **THEN** 不包含任何形如 "// 已删除：..." 或 "/* 原测试：... */" 的注释块

### Requirement: 修复 setup.ts 重复注释

`setup.ts` 第 341-342 行的重复注释行必须（MUST）合并为一行。

#### Scenario: 注释不重复

- **WHEN** 扫描 `setup.ts` 全文
- **THEN** 不存在连续两行完全相同的注释内容

### Requirement: 清理空 beforeEach 块

`helpers/fixtures/fixtures.test.ts` 中仅包含注释的空 `beforeEach` 块必须（MUST）被移除（第 9-11、51-53、89、102、115 行）。

#### Scenario: 不存在空副作用钩子

- **WHEN** 扫描 `fixtures.test.ts`
- **THEN** 不存在回调体为空或仅包含注释的 `beforeEach` 块

### Requirement: 移除 console.log 调试残留

`store/storage/test-keyring.test.ts` 中的 `console.log('[TEST] ...')` 调试输出必须（MUST）被全部移除（第 10、13、16、20、23、27 行）。

#### Scenario: 测试文件无调试输出

- **WHEN** 扫描 `test-keyring.test.ts`
- **THEN** 不包含任何 `console.log` 调用
