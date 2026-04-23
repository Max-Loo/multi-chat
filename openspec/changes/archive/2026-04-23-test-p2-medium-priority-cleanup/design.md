## Context

测试系统审查发现 7 个中等优先级问题，涉及测试基础设施重复、执行效率低、测试编写模式不一致等方面。这些问题独立且互不依赖，但均属于测试代码质量改进。

涉及文件分布在 `src/__test__/` 的 components、hooks、store、pages 等子目录中。

## Goals / Non-Goals

**Goals:**

- 消除 ResizeObserver polyfill 重复定义（4 处 → 1 处）
- 消除真实 `setTimeout` 等待（2 处），提升测试执行速度约 1s
- 参数化 `crypto.test.ts` 中约 20 个重复的 Unicode 往返测试
- 提取 highlight.js mock 为共享模块
- 统一使用 mock 工厂替代手动对象构造（3 个文件）
- 移除无价值的 RTK 样板测试
- 清理 `setup.ts` 中的 barrel export

**Non-Goals:**

- 不涉及 P1/P3 优先级问题
- 不重构 mock 工厂的整体架构
- 不改变测试覆盖率目标

## Decisions

### D1: ResizeObserver polyfill 统一注册

**决策**：在 `setup.ts` 的 `beforeAll` 或顶层添加标准空 polyfill，4 个测试文件删除各自的重复定义。

**备选方案**：
- 创建独立 `polyfills.ts` 文件在 `setup.ts` 中导入 → 增加不必要的文件，直接写在 setup.ts 更简单

### D2: Fake timers 策略

**决策**：在需要等待的测试中使用 `vi.useFakeTimers()` + `vi.advanceTimersByTime()`，并在 `afterEach` 中恢复。

**理由**：消除非确定性等待，测试速度从 ~1s 降至接近 0s。

### D3: highlight.js mock 共享方式

**决策**：提取到 `helpers/mocks/highlight.ts` 新文件，两个测试文件改为导入共享 mock。

**理由**：两个文件中 highlight.js mock 完全一致，适合共享。markdown-it 和 dompurify 因实现不同保持各自独立。

### D4: 手动构造 → 工厂迁移策略

**决策**：逐步替换手动构造为 `createMockMessage` 等工厂调用，不修改工厂本身。

**理由**：工厂已存在且类型安全，手动构造容易遗漏字段。

### D5: RTK 样板测试移除

**决策**：直接删除 `chatPageSlices.test.ts` 中行 57-85 的框架保证测试。

**理由**：测试不可变性、action type 生成等是 RTK 框架的职责，不属于应用逻辑测试。

## Risks / Trade-offs

- **[低风险] fake timers 可能与其他 timer 交互** → 仅在需要的测试文件中使用，afterEach 恢复真实 timers
- **[低风险] 删除 RTK 样板测试可能降低行覆盖率** → 这些测试测的是框架代码，对应用覆盖率贡献为零
- **[低风险] 参数化后测试可读性可能降低** → 使用有意义的测试名保持可读性
