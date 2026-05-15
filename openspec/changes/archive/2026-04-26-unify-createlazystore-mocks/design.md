## Context

`createLazyStore` 在生产代码中有三条导入路径，在测试代码中有三处独立的 mock。同时 `helpers/mocks/storage.ts` 已提供完整的 `createMemoryStorageMock()` 工厂函数（含 8 个方法、真实 Map 读写），但单元测试的全局 mock 绕过了它，手工构建了更残缺的版本。

## Goals / Non-Goals

**Goals:**

- 将 `createLazyStore` 的 mock 定义收敛到唯一点（`vi.mock('@/utils/tauriCompat/store')`）
- 所有 `createLazyStore` mock 统一使用 `createMemoryStorageMock()` 工厂函数
- 消除 `storeUtils.ts` 中零价值的 `createLazyStore` 转发函数
- 统一所有消费者的导入路径为 `@/utils/tauriCompat`
- 消除桶模块 mock 中的 `createLazyStore: vi.fn()` 裸桩

**Non-Goals:**

- 不改变 `createMemoryStorageMock()` 本身的实现
- 不涉及 `globalThis` 注册模式的变更（这是另一个独立话题）
- 不修改集成测试的 mock 策略（集成测试已正确使用 `createMemoryStorageMock`）
- 不改变 `saveToStore` / `loadFromStore` 的 mock 方式

## Decisions

### D1: storeUtils 删除 createLazyStore 转发，消费者改为直接导入

**选择**：删除 `storeUtils.ts` 中的 `createLazyStore` 转发函数和对应的 import。`chatStorage.ts` 和 `modelStorage.ts` 改为从 `@/utils/tauriCompat` 直接导入 `createLazyStore`。

**理由**：转发函数 `return createCompatStore(filename)` 是零逻辑的包装，制造了额外的 mock 需求。删除后 mock 链路从 3 条减少到 2 条。

**替代方案**：保留转发函数但统一 mock。被否决——保留无价值的间接层会增加认知负担。

### D2: modelRemote 导入路径统一为桶模块

**选择**：`modelRemote/index.ts` 的导入从 `@/utils/tauriCompat/store` 改为 `@/utils/tauriCompat`。

**理由**：与其他消费者（chatStorage、modelStorage）保持一致，减少导入路径变体。

**替代方案**：保持直接子模块导入。被否决——路径不统一导致 mock 需要覆盖更多入口点。

### D3: Mock B 作为 createLazyStore 的唯一定义点

**选择**：`vi.mock('@/utils/tauriCompat/store')` 是 `createLazyStore` mock 的唯一定义点，使用 `createMemoryStorageMock()` 实现。

**理由**：`tauriCompat/store` 是 `createLazyStore` 的真正来源（工厂函数定义在此模块），mock 应拦截源头。

### D4: Mock A 删除 createLazyStore，仅保留 saveToStore/loadFromStore

**选择**：`vi.mock('@/store/storage/storeUtils')` 删除 `createLazyStore` 字段。由于 D1 中消费者不再从 storeUtils 导入 `createLazyStore`，storeUtils 的 mock 只需覆盖 `saveToStore` 和 `loadFromStore`。

**理由**：storeUtils 不再转发 `createLazyStore`，mock 中也不需要它。

### D5: Mock C 删除 createLazyStore 裸桩

**选择**：`vi.mock('@/utils/tauriCompat')` 中删除 `createLazyStore: vi.fn()` 行，让 `...actual` 展开自然提供来自 Mock B 的实现。

**理由**：`importOriginal` 解析 `@/utils/tauriCompat` 时，其 `tauriCompat/store` 子模块已被 Mock B 拦截，所以 `actual.createLazyStore` 就是 Mock B 的实现。显式裸桩会覆盖这个正确实现。

## Risks / Trade-offs

- **[风险] 删除 storeUtils 转发后，chatStorage/modelStorage 需要修改导入路径** → **缓解**：改动是机械性的，IDE 的重构工具可以自动完成。需确认没有其他文件从 storeUtils 导入 `createLazyStore`。
- **[风险] `createMemoryStorageMock()` 的真实读写行为可能暴露被 stub 掩盖的 bug** → **缓解**：这是期望的行为。如果测试因 mock 行为变化而失败，说明 stub 掩盖了一个真实的 bug。
- **[风险] modelRemote 导入路径从子模块改为桶模块，可能触发桶模块的副作用** → **缓解**：桶模块的 mock（Mock C）已经拦截了所有子模块，不存在真实副作用。集成测试中桶模块无 mock，但集成测试本身就是要测试真实行为。
