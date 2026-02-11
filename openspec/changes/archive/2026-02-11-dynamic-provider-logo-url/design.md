## Context

当前系统中，模型供应商的 Logo URL 存在以下问题：

1. **重复代码**：每个 Provider 类都需要硬编码其 `logoUrl` 属性，或在动态注册时手动拼接 URL
2. **维护成本高**：当 logo URL 格式需要统一调整时，必须修改所有 Provider 类
3. **违反 DRY 原则**：相同的 URL 拼接逻辑在多处重复

涉及的代码位置：
- `ModelProvider` 接口（定义 `logoUrl?: string` 属性）
- `ConfigurableModelProvider` 基类（定义抽象属性）
- 各 Provider 子类（DeepseekProvider、KimiProvider、BigModelProvider，硬编码 URL）
- `DynamicModelProvider`（构造函数中拼接 URL）
- UI 组件（ModelProviderDisplay.tsx、ModelSidebar.tsx）

当前 URL 格式：`https://models.dev/logos/{providerKey}.svg`

## Goals / Non-Goals

**Goals:**
- 完全移除 `logoUrl` 属性，简化 ModelProvider 接口和基类设计
- 将 Logo URL 的生成逻辑集中到 UI 层，统一为 `https://models.dev/logos/${provider.key}.svg` 格式
- 消除 Provider 类中的重复代码，提升代码可维护性
- 确保所有使用 Logo URL 的地方都能正确显示

**Non-Goals:**
- 不改变 Logo URL 的格式（仍使用 `https://models.dev/logos/{providerKey}.svg`）
- 不新增外部依赖或工具函数
- 不处理 Logo 加载失败的情况（保持现有行为）

## Decisions

### 决策 1：移除 `logoUrl` 属性，在 UI 层直接拼接 URL

**选择**：完全移除 `logoUrl` 属性，在 UI 组件中直接拼接 URL

**理由**：
- Logo URL 格式固定（`https://models.dev/logos/{providerKey}.svg`），无需在数据层维护
- URL 拼接逻辑简单，在 UI 层直接拼接更直观
- 消除了重复代码，符合 DRY 原则
- 简化了 Provider 接口和基类设计

**其他考虑方案**：
- 方案 A：保留 `logoUrl` 属性，但改为 getter 函数动态生成
  - 缺点：仍需要在每个 Provider 类中实现 getter，未完全消除重复代码
- 方案 B：创建工具函数 `getLogoUrl(providerKey: string)` 统一生成
  - 缺点：增加了一层抽象，对于简单的字符串拼接过于复杂
- 方案 C：在 UI 层直接拼接（最终选择）
  - 优点：最简洁直观，符合 YAGNI 原则

### 决策 2：不在数据层进行 Logo URL 生成

**选择**：不在 ModelProvider 接口、基类或子类中保留任何与 Logo URL 相关的逻辑

**理由**：
- Logo URL 是展示层的关注点，不属于领域模型的核心职责
- 符合单一职责原则（SRP）：Provider 类应专注于模型配置，而非 UI 资源
- 减少了数据层和展示层的耦合

**影响**：
- ModelProvider 接口更简洁，只包含核心的模型配置属性
- Provider 子类不再需要维护 `logoUrl` 属性
- UI 组件需要自行拼接 URL（逻辑简单，不会增加复杂度）

### 决策 3：保持 URL 格式不变

**选择**：继续使用 `https://models.dev/logos/{providerKey}.svg` 格式

**理由**：
- 该格式已经在使用，无需迁移
- models.dev 是稳定的公共资源，无需担心可用性
- 简化了变更范围，降低风险

## Risks / Trade-offs

### 风险 1：Logo 文件缺失导致 404

**风险**：如果某个 providerKey 在 models.dev 上没有对应的 logo 文件，会显示 404 错误

**缓解措施**：
- 当前已经在使用的 providerKey 都有对应的 logo 文件（已验证）
- 未来新增 Provider 时，需要确保 models.dev 上有对应的 logo 文件
- 可以考虑在 UI 层添加 onError 处理，显示默认 Logo（但这不在本次变更范围内）

### 风险 2：models.dev 服务不可用

**风险**：如果 models.dev 服务宕机或 CDN 故障，所有 Logo 都无法加载

**缓解措施**：
- models.dev 是稳定的公共服务，风险较低
- 未来可以考虑缓存 Logo 到本地（但这不在本次变更范围内）

### 权衡 1：UI 层逻辑 vs 数据层逻辑

**权衡**：将 URL 拼接逻辑从数据层移到 UI 层

**影响**：
- 优点：简化了数据层，符合关注点分离原则
- 缺点：UI 层需要了解 URL 格式，增加了轻微的耦合
- 结论：收益大于成本，因为 URL 格式固定且简单

## Migration Plan

### 实施步骤

1. **移除 `logoUrl` 属性定义**
   - 修改 `ModelProvider` 接口，删除 `logoUrl?: string` 属性
   - 修改 `ConfigurableModelProvider` 基类，删除抽象属性

2. **移除各 Provider 子类中的 `logoUrl` 赋值**
   - 修改 `DeepseekProvider.ts`，删除 `logoUrl` 属性
   - 修改 `KimiProvider.ts`，删除 `logoUrl` 属性
   - 修改 `BigModelProvider.ts`，删除 `logoUrl` 属性

3. **移除动态注册中的 `logoUrl` 拼接**
   - 修改 `registerDynamicProviders.ts`，删除构造函数中的 `logoUrl` 拼接逻辑

4. **修改 UI 组件，改为直接拼接 URL**
   - 修改 `ModelProviderDisplay.tsx`，使用 `https://models.dev/logos/${provider.key}.svg`
   - 修改 `ModelSidebar.tsx`，使用 `https://models.dev/logos/${provider.key}.svg`

5. **测试验证**
   - 运行应用，检查所有模型供应商的 Logo 是否正常显示
   - 检查 TypeScript 编译是否通过
   - 运行 lint 检查

### 回滚策略

如果出现问题，可以通过 Git 回滚到变更前的代码：
- 所有修改都是移除代码或修改拼接逻辑，不涉及数据迁移
- 回滚后恢复原有的 `logoUrl` 属性即可

## Open Questions

- 无：本次变更范围清晰，技术方案明确，无未解决的问题
