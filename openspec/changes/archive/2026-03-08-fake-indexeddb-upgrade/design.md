## Context

**当前状态**：
- 项目使用 `fake-indexeddb` 5.0.2 作为测试环境中的 IndexedDB mock 实现
- 主要用于单元测试和集成测试，特别是 `src/__test__/store/storage/` 下的存储相关测试
- 5.0.2 版本发布于 2020 年，缺少最新的 IndexedDB 规范兼容性和性能优化

**约束条件**：
- 必须确保所有现有测试通过
- 不能影响生产环境代码（仅用于测试）
- 需要保持与当前测试工具链的兼容性

**相关方**：
- 测试套件：所有依赖 `fake-indexeddb` 的单元测试和集成测试
- 存储功能：IndexedDB 加密存储（`src/store/keyring/masterKey.ts`）和通用存储（`src/store/storage/`）

## Goals / Non-Goals

**Goals:**
- 升级 `fake-indexeddb` 到 6.2.5 以获得规范兼容性、性能提升和 bug 修复
- 确保所有现有测试在升级后继续通过
- 利用新版本的性能优化提升测试执行速度
- 提供清晰的回滚策略以应对潜在问题

**Non-Goals:**
- 修改生产环境的 IndexedDB 使用代码
- 引入新的测试功能或测试场景
- 优化现有测试逻辑（除非因升级而必须）

## Decisions

### 1. 直接升级策略
**决定**：直接从 5.0.2 升级到 6.2.5，跳过中间版本

**理由**：
- 6.2.5 是最新的稳定版本，包含所有中间版本的修复和改进
- fake-indexeddb 的变更日志显示没有需要逐步迁移的破坏性变更
- 减少升级复杂度和测试负担

**考虑的替代方案**：
- 逐步升级（5.0.2 → 6.0.0 → 6.1.0 → 6.2.5）- 被拒绝，因为增加不必要的复杂度

### 2. 测试优先验证策略
**决定**：在升级前先运行完整测试套件，建立基线，升级后立即验证

**理由**：
- 确保升级前的测试通过状态，避免将既有问题归咎于升级
- 快速发现潜在的不兼容问题
- 便于回滚决策（如果大量测试失败）

**执行步骤**：
1. 运行 `pnpm test:all` 并记录结果
2. 升级 fake-indexeddb 版本
3. 更新 pnpm lock 文件
4. 再次运行 `pnpm test:all`
5. 对比结果并修复失败测试

### 3. 错误处理适配策略
**决定**：预先识别可能受错误类型变更影响的测试代码

**理由**：
- v6.0.0 将错误类型从普通 `Error` 改为 `DOMException`
- 可能影响依赖特定错误类型或错误消息的断言

**适应措施**：
- 检索所有使用 `try/catch` 和 `.toThrow()` 的测试文件
- 识别依赖 `error.message` 或 `error.constructor` 的断言
- 必要时更新断言以兼容 `DOMException`

### 4. autoIncrement 行为变更处理
**决定**：识别并修复依赖旧 autoIncrement 行为的测试

**理由**：
- v6.0.1 修复了 autoIncrement + keyPath 为 undefined 的处理，现在会抛出错误
- 如果有测试依赖这种边缘情况的静默失败，需要调整测试数据或断言

**执行步骤**：
- 搜索使用 `autoIncrement: true` 的测试代码
- 检查 keyPath 值可能为 undefined 的场景
- 调整测试数据或断言以符合新行为

## Risks / Trade-offs

### 风险 1: 错误类型变更导致测试失败
**风险**：测试断言依赖普通 `Error` 类型，升级后因 `DOMException` 而失败

**缓解措施**：
- 全局搜索测试中的错误处理代码
- 优先检查 `toThrow()` 和 `instanceof Error` 断言
- 准备批量更新错误类型断言的代码

### 风险 2: 事件调度时序变化
**风险**：setImmediate 使用方式的改进可能影响异步测试的时序

**缓解措施**：
- 关注使用 `fake-timers` 或时间相关的测试
- 必要时添加显式等待或调整时序断言
- 验证测试隔离是否受影响

### 风险 3: autoIncrement 行为变更
**风险**：依赖旧 autoIncrement 行为的测试可能失败

**缓解措施**：
- 识别所有使用 autoIncrement 的测试场景
- 检查 keyPath 的边缘情况处理
- 更新测试以符合新的规范行为

### 权衡: 新功能 vs 稳定性
**权衡**：不使用新版本的全部功能（如 `getAllRecords`、`forceCloseDatabase`）

**决策**：
- 本次升级专注于提升兼容性和性能
- 新功能可在未来的需求中按需引入
- 保持测试代码简洁，避免过度设计

## Migration Plan

### 升级步骤

1. **建立基线**（5 分钟）
   ```bash
   pnpm test:all
   ```
   - 记录通过的测试数量
   - 保存测试输出日志

2. **升级依赖**（2 分钟）
   ```bash
   pnpm update fake-indexeddb@6.2.5
   # 或手动编辑 package.json 并运行
   pnpm install
   ```

3. **验证升级**（5 分钟）
   ```bash
   # 检查 package.json 中的版本
   cat package.json | grep fake-indexeddb
   # 运行测试
   pnpm test:all
   ```

4. **修复失败测试**（预估 15-30 分钟）
   - 分析失败原因
   - 区分由真实 bug 引起的失败 vs 由升级引起的失败
   - 修复测试代码（非生产代码）

5. **验证修复**（5 分钟）
   ```bash
   pnpm test:all
   pnpm lint
   pnpm tsc
   ```

### 回滚策略

**触发条件**：
- 超过 20% 的测试失败且无法快速修复
- 发现影响测试可靠性的严重问题
- 升级耗时超过 1 小时且进展缓慢

**回滚步骤**：
```bash
# 1. 恢复 package.json
git checkout package.json

# 2. 恢复 lock 文件
git checkout pnpm-lock.yaml

# 3. 重新安装依赖
pnpm install

# 4. 验证回滚
pnpm test:all
```

**回滚后决策**：
- 如果是特定测试的问题，考虑隔离修复后再升级
- 如果是普遍兼容性问题，考虑提交 issue 到 fake-indexeddb 仓库
- 保持 5.0.2 直到有更明确的解决方案

## Open Questions

**Q1: 是否需要在生产代码中添加对新 IndexedDB 功能的支持？**
- **决策**：否。本次升级专注于测试环境的兼容性和性能提升
- **时机**：可在未来的产品需求中按需评估新功能的使用

**Q2: 如果大量测试失败，是否有快速诊断工具？**
- **决策**：使用 vitest 的 `--reporter=verbose` 模式获得详细错误信息
- **备用方案**：临时创建测试集，只运行 fake-indexeddb 相关的测试

**Q3: 是否需要在文档中记录 fake-indexeddb 的版本和升级原因？**
- **决策**：是。在 AGENTS.md 中添加 fake-indexeddb 相关说明，包括版本要求和潜在问题
