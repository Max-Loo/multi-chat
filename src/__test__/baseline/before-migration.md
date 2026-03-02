# 测试基准：重构前

记录时间：2026-03-02

## 测试运行时间

### 总体统计
- **总时间**: ~6 秒（使用 `pnpm test` 交互模式）
- **测试文件数**: 88 个测试文件
- **测试用例数**: 1266+ 个测试用例（基于首次成功运行的测试）
- **跳过测试**: 5 个

### 最慢的10个测试文件

基于实际测试运行数据：

1. **src/__test__/pages/Model/ModelTable/ModelTable.test.tsx** - 1280ms (15 tests)
   - 最慢的测试：清空过滤条件应该显示所有模型 (443ms)

2. **src/__test__/hooks/useBasicModelTable.test.tsx** - 627ms (9 tests)
   - 最慢的测试：应支持过滤功能 (603ms)

3. **src/__test__/utils/crypto.test.ts** - 722ms (79 tests)
   - 加密/解密测试套件

4. **src/__test__/integration/settings-change.integration.test.ts** - 557ms (28 tests)
   - 设置变更集成测试

5. **src/__test__/pages/Model/CreateModel/CreateModel.test.tsx** - 401ms (14 tests)
   - 创建模型页面测试

6. **src/__test__/utils/markdown.test.ts** - 396ms (54 tests)
   - 最慢的测试：应该渲染没有语言标记的代码块 (320ms)

7. **src/__test__/pages/Model/components/EditModelModal.test.tsx** - 238ms (9 tests)
   - 编辑模型弹窗测试

8. **src/__test__/components/ModelConfigForm.test.tsx** - 291ms (9 tests)
   - 模型配置表单测试

9. **src/__test__/components/ChatPanel.test.tsx** - 220ms (22 tests)
   - 聊天面板组件测试

10. **src/__test__/utils/tauriCompat/keyring.test.ts** - 438ms (41 tests, 2 skipped)
    - Keyring 兼容层测试

### 性能观察

- **慢速测试特征**：
  - 表格组件测试包含大量 DOM 操作和渲染
  - 过滤功能测试需要处理复杂的状态变化
  - 加密测试涉及大量计算密集型操作
  - 集成测试需要设置完整的应用上下文

- **快速测试特征**：
  - 单元测试通常运行在 100ms 以下
  - 纯函数测试非常快速（< 20ms）

## 测试覆盖率

### 当前状态

测试覆盖率检查未能成功完成，原因：
- **语法错误**: `src/__test__/helpers/render/redux.ts` 文件扩展名错误
  - 问题：`.ts` 文件包含 JSX 代码
  - 修复：已重命名为 `.tsx`

- **MSW 配置问题**: 集成测试中存在 Mock Service Worker 配置问题
  - 错误：`[MSW] Cannot bypass a request when using the "error" strategy for the "onUnhandledRequest" option`
  - 影响：11 个测试文件失败，112 个测试失败

### 测试失败统计

- **失败文件数**: 11 / 88 (12.5%)
- **失败测试数**: 112 / 1383 (8.1%)
- **错误数**: 10 个

### 主要问题

1. **测试环境配置问题**：
   - i18n 实例未正确初始化
   - Redux Provider 配置问题

2. **Mock 配置问题**：
   - MSW 请求处理策略配置错误
   - 未处理的请求导致测试失败

3. **测试隔离问题**：
   - 集成测试之间存在状态泄漏
   - 全局状态未正确清理

## 测试套件分类

### 按类型分类

1. **单元测试** (~60 个文件)
   - 组件测试
   - 工具函数测试
   - Hooks 测试
   - Redux 状态测试

2. **集成测试** (~4 个文件)
   - 聊天流程集成测试
   - 模型配置集成测试
   - 设置变更集成测试
   - 加密存储集成测试

3. **Helper 测试** (~10 个文件)
   - 测试辅助工具
   - Mock 工具
   - Fixtures

### 按测试框架分类

- **Vitest**: 主要测试框架
- **Testing Library**: React 组件测试
- **MSW**: API Mock
- **Happy DOM**: 浏览器环境模拟

## 已识别的问题

### 严重问题

1. **测试覆盖率工具无法运行**
   - 需要修复语法错误
   - 需要修复 MSW 配置

2. **测试隔离不足**
   - 集成测试之间存在状态共享
   - 未正确清理测试环境

### 中等问题

1. **测试速度慢**
   - 10%+ 的测试运行时间超过 400ms
   - 需要优化测试性能

2. **测试稳定性**
   - 8.1% 的测试失败率
   - 需要提高测试可靠性

### 轻微问题

1. **测试文档不足**
   - 部分测试缺少描述性名称
   - 需要改进测试可读性

## 改进建议

### 短期（立即执行）

1. 修复测试覆盖率工具
2. 修复 MSW 配置问题
3. 修复语法错误

### 中期（1-2 周）

1. 优化慢速测试
2. 改进测试隔离
3. 提高测试稳定性

### 长期（1-2 月）

1. 建立性能基准监控
2. 实施测试最佳实践
3. 提高测试覆盖率到 80%+

## 备注

- 本基准数据在 "improve-unit-testing-practices" 变更开始前记录
- 用于对比重构前后的改进效果
- 测试运行环境：macOS (darwin), Node.js v24.9.1
- Vitest 版本：v4.0.18
