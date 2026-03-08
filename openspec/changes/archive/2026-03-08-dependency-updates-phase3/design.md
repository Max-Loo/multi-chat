## Context

**当前状态**: 阶段 1（补丁版本）和阶段 2（次版本）已完成，现在需要处理**最高风险的主版本更新**。

**问题背景**: 
- 主版本更新（major versions）通常包含破坏性变更（BREAKING CHANGES）
- 需要更新 4 个关键依赖：rollup-plugin-visualizer、fake-indexeddb、globals、@types/node
- 这些更新可能需要修改代码或配置
- 主版本更新的风险最高，需要最谨慎的测试

**约束条件**:
- 采用**分阶段更新策略**的最后阶段
- 阶段 3 更新**主版本**（major versions），即第一位版本号变更
- 主版本更新**很可能**包含破坏性变更
- 必须逐个更新并充分测试
- 必须能够快速回滚

**利益相关者**: 开发团队、项目维护者

## Goals / Non-Goals

**Goals:**
- 更新主版本依赖到最新稳定版本（目标 4 个，实际完成 3 个）
- 查阅每个依赖的 CHANGELOG 和迁移指南
- 识别并处理所有破坏性变更
- 修改必要的代码和配置以适配新版本
- 确保所有测试通过（单元测试 + 集成测试）
- 保持代码质量（lint 和类型检查通过）
- 优先保证应用稳定性，可跳过高风险更新

**Non-Goals:**
- 不引入新的依赖
- 不改变应用的功能需求
- 如果某个更新风险过高，可以跳过或延后

## Decisions

### 决策 1: 必须逐个更新，严格禁止批量更新

**选择**: 逐个更新每个主版本依赖，每个更新后都要验证

**理由**:
- 主版本更新几乎必然包含破坏性变更
- 批量更新会导致问题难以定位
- 逐个更新可以快速定位到具体的破坏性变更
- 4 个包的更新量不大，逐个更新是可行的

**实施顺序**（从低风险到高风险）:
1. `globals`（类型定义，影响最小）✅ 已完成
2. `@types/node`（类型定义，可能影响类型检查）✅ 已完成
3. `rollup-plugin-visualizer`（构建工具，影响构建配置）✅ 已完成
4. `fake-indexeddb`（测试工具，影响集成测试）⚠️ 已跳过

**实际结果**: 3/4 依赖更新成功，fake-indexeddb 因风险评估选择跳过（详见 tasks.md）

**替代方案**:
- **批量更新**: 极其危险，绝对不推荐

### 决策 2: 查阅 CHANGELOG 和迁移指南是强制步骤

**选择**: 在更新前，**必须**查阅每个依赖的 CHANGELOG 和迁移指南

**理由**:
- 主版本更新通常提供详细的迁移指南
- 提前识别所有破坏性变更
- 了解新版本提供的替代 API
- 评估代码修改的工作量

**查阅资源**:
- `rollup-plugin-visualizer`: https://github.com/btd/rollup-plugin-visualizer/releases
- `fake-indexeddb`: https://github.com/dumbmatter/fakeIndexedDB/blob/main/CHANGELOG.md
- `globals`: https://github.com/sindresorhus/globals/releases
- `@types/node`: https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node

**替代方案**:
- **直接更新**: 极其危险，几乎必然导致失败

### 决策 3: 灵活的代码修改策略

**选择**: 如果依赖有破坏性变更，**必须**修改代码以适配新版本

**理由**:
- 主版本更新通常不会保留旧 API
- 使用新版本比维护旧版本更有价值
- 一次性升级比长期维护旧版本更好

**修改原则**:
- 严格遵循迁移指南
- 优先使用新版本推荐的 API
- 确保修改不影响现有功能
- 添加必要的注释说明升级原因

**替代方案**:
- **跳过更新**: 可能导致技术债务累积

### 决策 4: 预留充足的缓冲时间

**选择**: 为每个更新预留充足的时间，包括查阅文档、修改代码、测试验证

**理由**:
- 主版本更新的工作量难以准确预估
- 可能遇到复杂的破坏性变更
- 需要充分的测试验证

**时间分配**:
- 查阅文档和迁移指南：每个依赖 30-60 分钟
- 代码修改：每个依赖 1-3 小时（取决于破坏性变更）
- 测试验证：每个依赖 1-2 小时
- **总计：每个依赖 2.5-6.5 小时**

**替代方案**:
- **快速完成**: 可能导致处理不当，引发更多问题

### 决策 5: 如遇高风险更新，可以跳过或延后

**选择**: 如果某个更新的风险过高或工作量过大，可以选择跳过

**理由**:
- 不是所有主版本更新都立即必要
- 某些更新可以等待社区反馈和稳定
- 优先保证应用稳定性

**跳过标准**:
- 破坏性变更过多（> 5 个）
- 需要大规模重构（> 4 小时）
- 缺乏明确的迁移指南
- 社区反馈不稳定

**替代方案**:
- **强制更新**: 可能引入高风险变更，得不偿失

## Risks / Trade-offs

### 风险 1: rollup-plugin-visualizer 配置格式变更

**风险**: v6 → v7 可能包含配置 API 的破坏性变更

**缓解措施**:
- 仔细查阅 v7.0.0 的发布说明和迁移指南
- 检查 `vite.config.ts` 中的配置
- 准备修改配置代码
- 测试 bundle 分析功能是否正常

**可能的问题**:
- 配置选项名称变化
- 插件初始化方式变化
- 输出格式或路径变化

### 风险 2: fake-indexeddb API 变更影响集成测试

**风险**: v5 → v6 可能影响 IndexedDB mock 的行为

**缓解措施**:
- 查阅 CHANGELOG 中的破坏性变更
- 识别所有使用 fake-indexeddb 的测试文件
- 更新测试代码以适配新 API
- 运行所有集成测试验证

**可能的问题**:
- IndexedDB API 模拟方式变化
- 事务或索引行为变化
- 测试中的 mock 配置需要调整

**实际决策**: ⚠️ **已跳过**
- **原因**: 破坏性变更过多（13+ 测试文件受影响），工作量 > 4 小时
- **当前状态**: v5.0.2 稳定，所有集成测试通过
- **决策依据**: 优先保证稳定性，成本 > 收益
- **详见**: tasks.md "跳过更新记录" 章节

### 风险 3: globals 类型定义变更导致类型错误

**风险**: v16 → v17 可能移除或修改全局类型定义

**缓解措施**:
- 运行 `pnpm tsc` 进行类型检查
- 修复类型错误
- 检查是否需要添加类型声明

**可能的问题**:
- 某些全局类型被移除
- 类型签名发生变化
- 需要更新类型导入

### 风险 4: @types/node 主版本更新影响 Node.js API 类型

**风险**: v24 → v25 可能包含大量 Node.js API 类型变更

**缓解措施**:
- 运行 `pnpm tsc` 进行类型检查
- 修复类型错误
- 检查 Node.js API 使用是否兼容

**可能的问题**:
- Node.js API 类型签名变化
- 某些 API 被标记为废弃
- Tauri 相关的 Node.js polyfill 类型问题

### 风险 5: 多个更新的累积影响

**风险**: 即使单个更新成功，多个更新可能产生累积影响

**缓解措施**:
- 每个更新后都要运行完整测试套件
- 检查更新之间的交互影响
- 保留每个更新的独立提交

### 风险 6: 时间和成本超预期

**风险**: 主版本更新的工作量可能远超预期

**缓解措施**:
- 预留充足的缓冲时间
- 如遇问题，及时评估是否跳过
- 优先保证应用稳定性

## Migration Plan

### 实施步骤

1. **准备工作**
   ```bash
   # 记录当前状态
   pnpm list rollup-plugin-visualizer fake-indexeddb globals @types/node
   pnpm tsc
   pnpm test:all
   ```

2. **更新步骤 1: globals（类型定义，最低风险）**
   ```bash
   # 更新 globals
   pnpm update -D globals
   
   # 类型检查
   pnpm tsc
   
   # 如果有类型错误，修复并验证
   ```

3. **更新步骤 2: @types/node（类型定义，中低风险）**
   ```bash
   # 更新 @types/node
   pnpm update -D @types/node
   
   # 类型检查
   pnpm tsc
   
   # 运行测试
   pnpm test:all
   
   # 修复类型错误并验证
   ```

4. **更新步骤 3: rollup-plugin-visualizer（构建工具，中等风险）**
   ```bash
   # 查阅迁移指南
   # https://github.com/btd/rollup-plugin-visualizer/blob/master/CHANGELOG.md
   
   # 更新插件
   pnpm update -D rollup-plugin-visualizer
   
   # 检查 vite.config.ts 配置
   # 根据迁移指南修改配置（如有需要）
   
   # 测试构建
   pnpm web:build
   
   # 验证 bundle 分析功能
   ```

5. **更新步骤 4: fake-indexeddb（测试工具，高风险）**
   ```bash
   # 查阅 CHANGELOG
   # https://github.com/dumbmatter/fakeIndexedDB/blob/main/CHANGELOG.md
   
   # 更新测试工具
   pnpm update -D fake-indexeddb
   
   # 查找所有使用 fake-indexeddb 的测试文件
   grep -r "fake-indexeddb" src/__test__/
   
   # 根据迁移指南更新测试代码（如有需要）
   
   # 运行所有集成测试
   pnpm test:integration
   ```

6. **最终验证**
   ```bash
   # 完整测试套件
   pnpm test:all
   
   # 类型检查
   pnpm tsc
   
   # Lint
   pnpm lint
   
   # 构建验证
   pnpm web:build
   ```

### 回滚策略

**方案 1: 回滚单个包**
```bash
# 如果某个包有问题，只回滚该包
pnpm update -D <package-name>@<old-version>
```

**方案 2: 恢复更新前的依赖文件**
```bash
# 恢复到更新前的状态
# （需要通过 Git 或其他方式恢复到更新前的版本）
git checkout <pre-update-commit> -- package.json pnpm-lock.yaml
pnpm install
```

### 验证清单

**globals**:
- [ ] 类型检查通过 (`pnpm tsc`)
- [ ] 无全局类型相关错误

**@types/node**:
- [ ] 类型检查通过
- [ ] Node.js API 类型错误已修复
- [ ] 测试通过

**rollup-plugin-visualizer**:
- [ ] Vite 配置已更新（如有需要）
- [ ] 构建成功 (`pnpm web:build`)
- [ ] Bundle 分析功能正常

**fake-indexeddb**:
- [ ] 所有集成测试通过
- [ ] IndexedDB mock 使用已更新
- [ ] 测试行为符合预期

**最终验证**:
- [ ] 完整测试套件通过 (`pnpm test:all`)
- [ ] 类型检查通过 (`pnpm tsc`)
- [ ] Lint 通过 (`pnpm lint`)
- [ ] 构建成功 (`pnpm web:build`)
- [ ] 控制台无警告或错误

## Open Questions

**问题 1: 如果某个主版本更新的工作量过大，如何处理？**

**待决定**: 是投入时间完成更新，还是跳过该更新？

**建议**:
- 评估更新的价值和风险
- 如果破坏性变更 > 5 个，考虑跳过
- 如果缺乏迁移指南，考虑跳过
- 可以延后到下一个更新周期

**问题 2: 如何处理社区反馈不稳定的更新？**

**待决定**: 如果新版本在 GitHub issues 中有大量问题报告，是否还要更新？

**建议**:
- 优先考虑稳定性
- 可以等待小版本修复（如 v7.0.1）
- 跳过当前版本，观察社区反馈

**问题 3: 更新后是否需要更新文档？**

**待决定**: 主版本更新是否需要更新 README 或开发文档？

**建议**:
- 如果更新了构建工具，更新构建文档
- 如果更新了测试工具，更新测试文档
- 记录已知的破坏性变更和解决方案

## Performance Considerations

**预期影响**:
- **构建时间**: 可能略有变化（rollup-plugin-visualizer 优化）
- **运行时性能**: 基本无影响（所有都是开发依赖）
- **Bundle 大小**: 基本无变化

**监控指标**:
- 构建时间
- Bundle 分析报告
- 测试执行时间

## Security Considerations

**安全更新**:
- 主版本通常包含安全修复
- 但也可能引入新的安全风险

**验证步骤**:
```bash
# 更新前检查
pnpm audit

# 更新后再次检查
pnpm audit

# 检查新引入的安全漏洞
```

## Lessons Learned from Phase 1 & 2

**阶段 1 和 2 的经验应用于阶段 3**:
1. **逐个更新**: 继续使用逐个更新策略
2. **充分测试**: 每个更新后都要运行完整测试套件
3. **快速回滚**: 准备好快速回滚方案
4. **独立提交**: 为每个更新创建独立提交

**阶段 3 的特殊注意**:
1. **必须查阅迁移指南**: 主版本更新的强制步骤
2. **预留缓冲时间**: 工作量可能远超预期
3. **可以跳过**: ✅ 不是所有更新都必须完成（fake-indexeddb 已跳过）
4. **代码修改**: 几乎必然需要修改代码

**阶段 3 的关键决策 - 跳过 fake-indexeddb**:
1. **风险评估优先**: 在更新前进行充分的成本效益分析
2. **稳定性 > 最新**: 当前稳定版本 > 最新版本
3. **明智跳过**: 识别高成本低价值的更新，果断跳过
4. **记录决策**: 详细记录跳过原因，为未来评估提供依据

## References

- **依赖列表**: 见 proposal.md 的 "What Changes" 章节
- **更新策略**: 分阶段更新（阶段 3: 主版本）
- **测试策略**: `pnpm test:all` + 针对性功能测试
- **回滚方案**: Git revert 或选择性回滚
- **CHANGELOG 和迁移指南**:
  - rollup-plugin-visualizer: https://github.com/btd/rollup-plugin-visualizer/blob/master/CHANGELOG.md
  - fake-indexeddb: https://github.com/dumbmatter/fakeIndexedDB/blob/main/CHANGELOG.md
  - globals: https://github.com/sindresorhus/globals/releases
  - @types/node: https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node
