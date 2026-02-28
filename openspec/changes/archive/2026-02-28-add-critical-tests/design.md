# Design: 添加关键模块测试

## Context

### 背景

当前项目是一个 Tauri + React + TypeScript 桌面应用程序，整体测试覆盖率仅为 **48.94%**。关键的跨平台兼容层（HTTP、OS、Shell、Store）和数据持久化层模块几乎完全没有测试覆盖（覆盖率 0%），这些模块是项目的基础设施：

- **跨平台兼容层**：负责 Tauri 桌面环境和 Web 浏览器环境的适配，所有 API 调用和系统操作都依赖这些模块
- **数据持久化层**：负责模型配置和聊天数据的存储，一旦失败会导致用户数据丢失

### 当前状态

```
整体测试覆盖率：48.94% (语句)
├── 跨平台兼容层：0% ❌
│   ├── HTTP 兼容层：0%
│   ├── OS 兼容层：0%
│   ├── Shell 兼容层：0%
│   └── Store 兼容层：0%
├── 数据持久化层：18.75% ⚠️
│   ├── Store 工具函数：18.75%
│   └── 聊天存储：0%
└── 其他模块：70-98% ✅
```

### 约束条件

1. **零生产代码影响**：仅添加测试代码，不能修改任何生产代码
2. **测试框架约束**：必须使用现有的 Vitest 测试框架
3. **Mock 策略约束**：需要合理 Mock Tauri API 和浏览器 API
4. **覆盖率目标**：语句 ≥85%, 分支 ≥80%, 函数 ≥90%
5. **时间约束**：需要在 2-3 天内完成所有测试

### 利益相关者

- **开发团队**：需要清晰的测试代码，便于未来维护
- **CI/CD 系统**：需要新的测试用例集成到 CI/CD 流程
- **最终用户**：受益于更稳定的应用，减少数据丢失风险

---

## Goals / Non-Goals

**Goals:**

1. ✅ 为 6 个 P0 优先级模块创建完整的单元测试和集成测试
2. ✅ 达到测试覆盖率目标：语句 ≥85%, 分支 ≥80%, 函数 ≥90%
3. ✅ 确保测试代码质量和可维护性
4. ✅ 提供清晰的 Mock 示例，便于未来测试编写

**Non-Goals:**

❌ 不修改任何生产代码
❌ 不添加新的测试依赖（使用现有 Vitest 生态）
❌ 不编写 E2E 测试（仅单元测试和集成测试）
❌ 不重构现有代码结构
❌ 不修改现有测试文件

---

## Decisions

### 决策 1：使用 Vitest + vi.mock() 模拟 Tauri API

**决策**：使用 Vitest 的 `vi.mock()` 和 `vi.stubGlobal()` 模拟 Tauri 插件 API。

**理由**：
- ✅ Vitest 是项目现有测试框架，无需引入新依赖
- ✅ `vi.mock()` 提供了强大的 Mock 功能，可以完全控制 Tauri API 的行为
- ✅ `vi.stubGlobal()` 可以模拟全局对象（window、navigator）
- ✅ 与 TypeScript 类型系统完全兼容

**替代方案及拒绝理由**：
- **方案 B**：使用 `@tauri-apps/api/mocks` 官方 Mock 库
  - ❌ 拒绝：官方 Mock 库功能有限，不如 vi.mock() 灵活
- **方案 C**：使用真实 Tauri 环境（在 Tauri 中运行测试）
  - ❌ 拒绝：CI/CD 环境难以配置，测试运行时间更长

---

### 决策 2：使用 fake-indexeddb 模拟 IndexedDB

**决策**：使用 `fake-indexeddb` 库模拟 IndexedDB。

**理由**：
- ✅ IndexedDB 是异步事件驱动 API，难以手动 Mock
- ✅ `fake-indexeddb` 提供了内存中的 IndexedDB 实现，API 与原生一致
- ✅ 支持所有 IndexedDB 操作（open、put、get、delete、getAllKeys）
- ✅ 测试运行速度快（内存操作，无磁盘 I/O）

**替代方案及拒绝理由**：
- **方案 B**：手动 Mock IndexedDB API
  - ❌ 拒绝：IndexedDB API 复杂，手动 Mock 容易出错且难以维护
- **方案 C**：使用真实 IndexedDB（在浏览器中运行测试）
  - ❌ 拒绝：测试环境不稳定，CI/CD 难以配置

**依赖添加**：
```json
{
  "devDependencies": {
    "fake-indexeddb": "^5.0.0"
  }
}
```

---

### 决策 3：测试文件结构与源码结构一致

**决策**：测试文件路径与源码路径保持一致。

**示例**：
```
src/utils/tauriCompat/http.ts
src/__test__/utils/tauriCompat/http.test.ts

src/store/storage/storeUtils.ts
src/__test__/store/storage/storeUtils.test.ts
```

**理由**：
- ✅ 测试文件易于查找和维护
- ✅ 与项目现有测试结构一致
- ✅ 符合业界最佳实践

---

### 决策 4：使用三层测试结构（Describe 嵌套）

**决策**：使用三层测试结构：模块 → 功能 → 场景。

**示例**：
```typescript
describe('HTTP 兼容层', () => {
  describe('环境检测', () => {
    it('应该在开发环境使用 Web fetch', async () => {
      // 测试代码
    });
  });

  describe('fetch 函数', () => {
    describe('GET 请求', () => {
      it('应该成功发送 GET 请求', async () => {
        // 测试代码
      });
    });
  });
});
```

**理由**：
- ✅ 测试结构清晰，易于理解
- ✅ 便于组织大量测试用例
- ✅ 测试报告输出更加友好

---

### 决策 5：统一的测试辅助工具函数

**决策**：在测试中创建统一的辅助工具函数，避免重复代码。

**示例**：
```typescript
// 辅助函数：Mock Tauri 环境
const mockTauriEnvironment = () => {
  vi.stubGlobal('window', { __TAURI__: {} });
};

// 辅助函数：Mock Web 环境
const mockWebEnvironment = () => {
  vi.stubGlobal('window', {});
};

// 辅助函数：重置全局对象
const resetGlobals = () => {
  vi.unstubAllGlobals();
};
```

**理由**：
- ✅ 减少测试代码重复
- ✅ 提高测试可维护性
- ✅ 统一的 Mock 策略

---

## Risks / Trade-offs

### 风险 1：IndexedDB Mock 可能与真实行为不一致

**风险**：`fake-indexeddb` 的实现可能与真实 IndexedDB 行为有细微差异。

**缓解措施**：
- 在关键路径上添加集成测试（如果可能）
- 在 CI/CD 中定期运行真实环境测试
- 记录已知的 Mock 限制

### 风险 2：Tauri API Mock 可能过时

**风险**：Tauri API 更新可能导致 Mock 代码过时。

**缓解措施**：
- 在测试代码中添加注释，说明 Mock 的 Tauri API 版本
- 定期检查 Tauri 更新日志
- 在 Tauri 升级时重新运行测试

### 风险 3：测试编写时间可能超出预期

**风险**：6 个模块的测试编写可能需要超过 3 天。

**缓解措施**：
- 优先完成核心功能测试（P0 场景）
- 边缘情况测试可以后续补充
- 复用测试辅助工具函数，减少重复工作

### 风险 4：Mock 过度可能导致测试通过但实际失败

**风险**：过度 Mock 可能导致测试通过，但实际环境中失败。

**缓解措施**：
- 最小化 Mock 范围，只 Mock 必要的外部依赖
- 在可能的情况下，使用真实实现（如 Web fetch）
- 定期在真实环境中运行测试

### 权衡 1：测试覆盖率 vs 测试时间

**权衡**：追求 85%+ 的覆盖率需要更多测试用例，增加编写时间。

**决策**：优先覆盖核心功能和错误处理路径，边缘场景后续补充。

### 权衡 2：测试复杂度 vs 可维护性

**权衡**：复杂的测试场景可能提高覆盖率，但降低可维护性。

**决策**：保持测试简单清晰，避免过度复杂的测试逻辑。

---

## Migration Plan

### 阶段 1：环境准备（1 小时）

1. 安装 `fake-indexeddb` 依赖：
   ```bash
   pnpm add -D fake-indexeddb
   ```

2. 创建测试辅助工具文件：
   ```
   src/__test__/utils/tauriCompat/helpers.ts
   ```

3. 验证测试环境配置正确：
   ```bash
   pnpm test:run
   ```

### 阶段 2：创建测试文件（2-3 天）

**第 1 天**：跨平台兼容层测试（HTTP、OS、Shell）
- 创建 `src/__test__/utils/tauriCompat/http.test.ts`
- 创建 `src/__test__/utils/tauriCompat/os.test.ts`
- 创建 `src/__test__/utils/tauriCompat/shell.test.ts`

**第 2 天**：数据持久化层测试（Store、工具函数、聊天存储）
- 创建 `src/__test__/utils/tauriCompat/store.test.ts`
- 创建 `src/__test__/store/storage/storeUtils.test.ts`
- 创建 `src/__test__/store/storage/chatStorage.test.ts`

### 阶段 3：验证和优化（0.5 天）

1. 运行测试并生成覆盖率报告：
   ```bash
   pnpm test:coverage
   ```

2. 检查覆盖率是否达标：
   - 语句覆盖率 ≥ 85%
   - 分支覆盖率 ≥ 80%
   - 函数覆盖率 ≥ 90%

3. 修复失败的测试用例

4. 代码审查和优化

### 阶段 4：CI/CD 集成（0.5 天）

1. 确保新测试在 CI/CD 中运行
2. 更新测试覆盖率报告
3. 合并到主分支

### 回滚策略

如果测试导致问题：
- **单个测试文件**：删除或重命名该测试文件
- **整体变更**：Git revert 提交
- **依赖问题**：卸载 `fake-indexeddb`，使用手动 Mock

---

## Open Questions

### Q1: 是否需要在 CI/CD 中运行真实环境的集成测试？

**讨论中**。当前方案使用 Mock，可能无法捕获真实环境问题。

**决策**：暂不添加真实环境测试。如果发现频繁的 Mock 相关 bug，再考虑添加。

### Q2: 是否需要测试性能（如大数据存储）？

**讨论中**。Store 兼容层需要测试大数据存储场景。

**决策**：添加基本的性能测试（存储 >1MB 数据），但不作为硬性要求。

### Q3: 是否需要测试并发操作（如多个 Store 同时写入）？

**讨论中**。IndexedDB 支持并发事务，但可能引发竞态条件。

**决策**：暂不测试并发操作。如果发现并发相关 bug，再添加测试。

---

## 附录：测试文件清单

### 跨平台兼容层测试（4 个文件）

1. `src/__test__/utils/tauriCompat/http.test.ts`（12-15 个测试用例）
2. `src/__test__/utils/tauriCompat/os.test.ts`（4-6 个测试用例）
3. `src/__test__/utils/tauriCompat/shell.test.ts`（10-12 个测试用例）
4. `src/__test__/utils/tauriCompat/store.test.ts`（15-20 个测试用例）

### 数据持久化层测试（2 个文件）

5. `src/__test__/store/storage/storeUtils.test.ts`（10-12 个测试用例）
6. `src/__test__/store/storage/chatStorage.test.ts`（6-8 个测试用例）

**总计**：6 个测试文件，约 57-73 个测试用例
