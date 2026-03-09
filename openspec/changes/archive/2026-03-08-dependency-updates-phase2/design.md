## Context

**当前状态**: 阶段 1（补丁版本更新）已完成，现在需要处理**次版本依赖更新**。

**问题背景**: 
- 次版本更新（minor versions）可能包含新功能、API 变更或行为变化
- 需要更新 3 个关键依赖：Redux Toolkit、React Router、Tauri CLI
- 这些依赖对应用的核心功能有重要影响

**约束条件**:
- 采用**分阶段更新策略**以降低风险
- 阶段 2 仅更新**次版本**（minor versions），即第二位版本号变更
- 次版本更新**可能**包含破坏性变更（虽然通常不包含）
- 必须能够快速回滚

**利益相关者**: 开发团队、项目维护者

## Goals / Non-Goals

**Goals:**
- 更新 3 个次版本依赖到最新稳定版本
- 查阅每个依赖的 CHANGELOG，识别潜在的破坏性变更
- 确保所有测试通过（单元测试 + 集成测试）
- 保持代码质量（lint 和类型检查通过）
- 验证核心功能正常工作（特别是 Redux 状态管理和路由）

**Non-Goals:**
- 不涉及应用代码的修改（除非依赖有破坏性变更）
- 不更新主版本依赖（留待阶段 3）
- 不引入新的依赖

## Decisions

### 决策 1: 逐个更新而非批量更新

**选择**: 逐个更新每个次版本依赖，而非批量更新

**理由**:
- 次版本更新可能包含破坏性变更，逐个更新更容易定位问题
- 3 个包的更新量不大，逐个更新的时间成本可接受
- 可以在每个更新后验证，避免同时引入多个问题

**实施顺序**:
1. 先更新 `@tauri-apps/cli`（开发依赖，影响较小）
2. 再更新 `@reduxjs/toolkit`（状态管理，核心依赖）
3. 最后更新 `react-router-dom`（路由，核心依赖）

**替代方案**:
- **批量更新**: 效率高但难以定位问题来源

### 决策 2: 查阅 CHANGELOG 并识别破坏性变更

**选择**: 在更新前，查阅每个依赖的 CHANGELOG

**理由**:
- 提前识别潜在的破坏性变更
- 了解新功能和改进
- 评估代码修改需求

**查阅资源**:
- `@reduxjs/toolkit`: https://github.com/reduxjs/redux-toolkit/releases
- `react-router-dom`: https://github.com/remix-run/react-router/releases
- `@tauri-apps/cli`: https://github.com/tauri-apps/tauri/releases

**替代方案**:
- **直接更新**: 快速但风险高，可能遇到意外问题

### 决策 3: 针对性的功能测试

**选择**: 根据更新的依赖，进行针对性的功能测试

**理由**:
- 次版本更新可能影响特定功能域
- 针对性测试更高效，能快速发现问题

**测试重点**:
- `@reduxjs/toolkit`: 测试 Redux store、状态更新、异步 actions
- `react-router-dom`: 测试路由导航、URL 参数、嵌套路由
- `@tauri-apps/cli`: 测试构建流程、开发服务器

**替代方案**:
- **仅运行自动测试**: 可能覆盖不全面

### 决策 4: 灵活的代码修改策略

**选择**: 如果依赖有破坏性变更，允许必要的代码修改

**理由**:
- 次版本更新有时需要代码调整
- 保持依赖更新比维护旧版本更有价值

**修改原则**:
- 最小化修改范围
- 优先使用依赖提供的新 API
- 确保修改不影响现有功能

**替代方案**:
- **严格禁止代码修改**: 可能导致无法更新到新版本

## Risks / Trade-offs

### 风险 1: 破坏性变更导致应用崩溃

**风险**: 次版本更新可能包含破坏性变更，导致应用功能异常

**缓解措施**:
- 更新前仔细查阅 CHANGELOG
- 逐个更新并测试，快速定位问题
- 如遇破坏性变更，查阅迁移指南
- 如无法快速修复，立即回滚

### 风险 2: Redux Toolkit 更新影响状态管理

**风险**: `@reduxjs/toolkit` 从 2.9.1 → 2.11.2，跨越 2 个次版本

**缓解措施**:
- 仔细阅读 v2.10 和 v2.11 的发布说明
- 重点测试 Redux store 和 slices
- 验证所有使用 Redux 的功能（聊天、模型配置等）
- 检查是否有弃用的 API

### 风险 3: React Router 更新影响路由功能

**风险**: `react-router-dom` 从 7.9.4 → 7.13.1，可能包含行为变化

**缓解措施**:
- 测试所有路由（聊天页面、设置页面等）
- 验证导航功能（前进、后退、链接跳转）
- 检查 URL 参数和嵌套路由
- 测试路由钩子（useParams, useNavigate 等）

### 风险 4: 逐个更新的时间成本

**风险**: 逐个更新比批量更新耗时更长

**缓解措施**:
- 只有 3 个包，时间成本可控
- 逐个更新降低调试成本，总体可能更快
- 阶段 1 已积累了经验，流程更顺畅

## Migration Plan

### 实施步骤

1. **准备工作**
   ```bash
   # 记录当前版本
   pnpm list @reduxjs/toolkit react-router-dom @tauri-apps/cli
   ```

2. **更新步骤 1: Tauri CLI**
   ```bash
   # 更新 Tauri CLI（开发依赖）
   pnpm update @tauri-apps/cli
   
   # 验证开发服务器
   pnpm tauri dev
   
   # 验证构建
   pnpm tauri build
   ```

3. **更新步骤 2: Redux Toolkit**
   ```bash
   # 更新 Redux Toolkit
   pnpm update @reduxjs/toolkit
   
   # 类型检查
   pnpm tsc
   
   # Lint
   pnpm lint
   
   # 运行测试
   pnpm test:all
   
   # 手动测试 Redux 功能
   # - 聊天列表管理
   # - 模型配置
   # - 应用设置
   ```

4. **更新步骤 3: React Router**
   ```bash
   # 更新 React Router
   pnpm update react-router-dom
   
   # 类型检查
   pnpm tsc
   
   # Lint
   pnpm lint
   
   # 运行测试
   pnpm test:all
   
   # 手动测试路由功能
   # - 聊天页面导航
   # - 设置页面导航
   # - URL 参数
   # - 前进/后退按钮
   ```

5. **最终验证**
   ```bash
   # 完整测试套件
   pnpm test:all
   
   # 检查变更
   git diff package.json
   git diff pnpm-lock.yaml
   ```

### 回滚策略

**方案 1: 回滚单个包**
```bash
# 如果某个包有问题，只回滚该包
pnpm update <package-name>@<old-version>
```

**方案 2: 恢复更新前的依赖文件**
```bash
# 恢复 package.json 和 pnpm-lock.yaml
# （需要通过 Git 或其他方式恢复到更新前的版本）
git checkout <pre-update-commit> -- package.json pnpm-lock.yaml
pnpm install
```

### 验证清单

**Tauri CLI**:
- [ ] 开发服务器正常启动 (`pnpm web:dev`)
- [ ] 构建成功 (`pnpm tauri build`)

**Redux Toolkit**:
- [ ] 类型检查通过
- [ ] 所有测试通过
- [ ] 聊天列表功能正常
- [ ] 模型配置功能正常
- [ ] 应用设置功能正常
- [ ] Redux DevTools 正常工作

**React Router**:
- [ ] 类型检查通过
- [ ] 所有测试通过
- [ ] 路由导航正常
- [ ] URL 参数正确
- [ ] 前进/后退按钮正常
- [ ] 所有路由可访问

**最终验证**:
- [ ] 完整测试套件通过 (`pnpm test:all`)
- [ ] 类型检查通过 (`pnpm tsc`)
- [ ] Lint 通过 (`pnpm lint`)
- [ ] 控制台无警告或错误
- [ ] `package.json` 变更符合预期
- [ ] `pnpm-lock.yaml` 已正确更新

## Open Questions

**问题 1: 如果某个次版本更新包含破坏性变更，如何处理？**

**待决定**: 是修改代码适配新版本，还是跳过该更新？

**建议**:
- 如果破坏性变更影响小，修改代码适配
- 如果破坏性变更影响大或复杂，考虑跳过或延后到阶段 3
- 优先保持应用稳定性

**问题 2: 是否需要为每个更新创建独立的提交？**

**待决定**: 是为每个包的更新创建独立提交，还是统一提交？

**建议**: 为每个包创建独立提交，便于回滚和问题追踪。

**问题 3: 更新后是否需要更新依赖的类型定义？**

**待决定**: 次版本更新后，是否需要运行 `pnpm exec tsc --noEmit` 验证类型？

**建议**: 是的，类型检查是验证更新的重要手段。

## Performance Considerations

**预期影响**:
- **构建时间**: 可能略微减少（Tauri CLI 优化）
- **运行时性能**: 可能略有提升（Redux Toolkit 优化）
- **Bundle 大小**: 基本无变化（次版本通常不影响代码体积）

**监控指标**:
- 应用启动时间
- Redux 状态更新性能
- 路由切换速度
- Bundle 大小（使用 `rollup-plugin-visualizer`）

## Security Considerations

**安全更新**:
- 次版本通常包含安全修复
- 审查 `pnpm audit` 输出以确认安全漏洞已修复

**验证步骤**:
```bash
# 更新前检查
pnpm audit

# 更新后再次检查
pnpm audit
```

## Lessons Learned from Phase 1

**阶段 1 的经验应用于阶段 2**:
1. **测试流程**: 使用阶段 1 验证过的测试流程
2. **回滚策略**: 准备好快速回滚方案
3. **时间估算**: 根据阶段 1 的耗时，合理安排时间
4. **问题追踪**: 记录遇到的问题和解决方案

**关键改进**:
- 逐个更新而非批量更新（阶段 2 特有）
- 针对性功能测试（阶段 2 特有）
- 查阅 CHANGELOG（阶段 2 特有）

## References

- **依赖列表**: 见 proposal.md 的 "What Changes" 章节
- **更新策略**: 分阶段更新（阶段 2: 次版本）
- **测试策略**: `pnpm test:all` + 针对性功能测试
- **回滚方案**: Git revert 或选择性回滚
- **CHANGELOG**: 
  - Redux Toolkit: https://github.com/reduxjs/redux-toolkit/releases
  - React Router: https://github.com/remix-run/react-router/releases
  - Tauri CLI: https://github.com/tauri-apps/tauri/releases
