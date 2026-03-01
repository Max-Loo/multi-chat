# 设计文档：修复模型供应商 Logo 显示

## Context

### 当前状态

系统中有两种模型供应商 Provider：

1. **静态 Provider**：直接在代码中定义，包括：
   - `KimiProvider` (src/lib/factory/modelProviderFactory/providers/KimiProvider.ts)
   - `BigModelProvider` (src/lib/factory/modelProviderFactory/providers/BigModelProvider.ts)
   - `DeepseekProvider` (src/lib/factory/modelProviderFactory/providers/DeepseekProvider.ts)

2. **动态 Provider**：通过 `registerDynamicProviders` 从远程 API 动态注册（src/lib/factory/modelProviderFactory/registerDynamicProviders.ts）

当前问题：
- 静态 Provider 的 logo URL 来源不一致（favicon、CDN 等）
- 部分静态 Provider 的 logo URL 已失效（如 moonshot.cn 的 favicon）
- 动态 Provider 没有设置 logo URL（`logoUrl = undefined`）
- UI 组件依赖 `provider.logoUrl` 属性来显示 logo

### 约束条件

- **向后兼容**：不能破坏现有的 Provider 接口（`ModelProvider` 接口）
- **统一格式**：所有 Provider 应使用相同的 logo URL 格式
- **自动适配**：UI 组件无需修改，自动使用新的 logo URL

## Goals / Non-Goals

**Goals:**
- 统一所有 Provider 的 logo URL 格式为 `https://models.dev/logos/{provider}.svg`
- 确保动态注册的 Provider 也能正确显示 logo
- 保持向后兼容，不破坏现有 API

**Non-Goals:**
- 不修改 UI 组件的渲染逻辑（ModelProviderDisplay、ModelSidebar）
- 不添加 logo 缓存机制（浏览器会自动缓存图片）
- 不实现 logo 的回退机制（如果 models.dev 的 logo 不存在）

## Decisions

### 决策 1：使用 models.dev 作为统一的 logo 来源

**选择**：统一使用 `https://models.dev/logos/{provider}.svg` 格式

**理由**：
- models.dev 已经是项目依赖（用于获取远程模型数据）
- 提供标准化的 SVG logo，确保高质量和一致性
- 命名规范清晰，直接使用 provider key 作为文件名

**替代方案**：
- 使用各 Provider 官网的 logo
  - ❌ 来源不一致，格式不统一（favicon、PNG、SVG 混合）
  - ❌ 部分官网 logo 可能失效或不可访问
- 使用自建的 logo CDN
  - ❌ 需要额外的维护成本和存储资源
  - ❌ 增加 CDN 的可靠性风险

### 决策 2：动态 Provider 使用模板字符串生成 logo URL

**选择**：在 `DynamicModelProvider` 构造函数中使用模板字符串

```typescript
this.logoUrl = `https://models.dev/logos/${this.key}.svg`;
```

**理由**：
- 简洁直接，无需额外的配置
- 自动适配所有动态注册的 Provider
- 与静态 Provider 的实现保持一致

**替代方案**：
- 从远程 API 返回 logo URL
  - ❌ 增加数据传输量
  - ❌ models.dev API 当前未提供此字段
- 在模型配置文件中硬编码 logo URL
  - ❌ 重复配置，维护成本高
  - ❌ 容易出错（provider key 不匹配）

### 决策 3：不实现 logo 回退机制

**选择**：如果 models.dev 的 logo 不存在，UI 组件不显示 logo

**理由**：
- 保持实现简单，避免过度工程化
- 模型供应商的主要功能是 API 调用，logo 是次要的视觉元素
- 如果 logo 加载失败，UI 组件会显示 fallback 的 Provider 名称（已存在的行为）

**替代方案**：
- 实现多级回退（models.dev → 官网 → 默认 logo）
  - ❌ 增加复杂度，不符合 YAGNI 原则
  - ❌ 需要处理多个网络请求，可能影响性能

## Risks / Trade-offs

### 风险 1：models.dev logo 服务不可用

**风险**：如果 models.dev 的 logo 服务宕机或响应缓慢，所有 Provider 的 logo 都无法显示。

**缓解措施**：
- 浏览器会自动缓存已加载的 logo，重复访问无需重新请求
- logo 失效不影响核心功能（模型 API 调用）
- UI 组件已经有 fallback：当 `logoUrl` 为空或加载失败时，仅显示 Provider 名称

### 风险 2：models.dev 的 logo 文件命名不规范

**风险**：如果 models.dev 的 logo 文件名与 provider key 不匹配（例如 `moonshotai` vs `kimi`），会导致部分 Provider 无法显示 logo。

**缓解措施**：
- 在实现前手动验证 models.dev 的 logo 文件命名规范
- 如果发现命名不一致，可以创建映射表或调整 provider key
- 根据项目中的 `ALLOWED_MODEL_PROVIDERS`，需要验证的 provider：
  - `deepseek` → `https://models.dev/logos/deepseek.svg`
  - `kimi` → `https://models.dev/logos/kimi.svg`
  - `bigmodel` → `https://models.dev/logos/bigmodel.svg`

### 权衡：实现简单性 vs 健壮性

**选择**：优先实现简单性

**权衡**：
- ✅ 优点：代码简洁，易于维护，符合 KISS 原则
- ❌ 缺点：缺少健壮的错误处理（如 logo 回退机制）

**结论**：鉴于 logo 是次要的视觉元素，且不影响核心功能，选择简单的实现方式。

## Migration Plan

### 实现步骤

1. **修改静态 Provider 的 logo URL**
   - 文件：`src/lib/factory/modelProviderFactory/providers/KimiProvider.ts`
     - 修改 `readonly logoUrl = 'https://models.dev/logos/kimi.svg'`
   - 文件：`src/lib/factory/modelProviderFactory/providers/BigModelProvider.ts`
     - 修改 `readonly logoUrl = 'https://models.dev/logos/bigmodel.svg'`
   - 文件：`src/lib/factory/modelProviderFactory/providers/DeepseekProvider.ts`
     - 修改 `readonly logoUrl = 'https://models.dev/logos/deepseek.svg'`

2. **修改动态 Provider 的 logo URL 生成逻辑**
   - 文件：`src/lib/factory/modelProviderFactory/registerDynamicProviders.ts`
   - 在 `DynamicModelProvider` 构造函数中修改：
     ```typescript
     // 修改前
     this.logoUrl = undefined;
     
     // 修改后
     this.logoUrl = `https://models.dev/logos/${this.key}.svg`;
     ```

3. **验证实现**
   - 运行应用，检查模型列表页面是否正确显示 logo
   - 检查创建模型页面的侧边栏是否正确显示 logo
   - 测试远程 API 动态注册的 Provider 是否显示 logo

### 回滚策略

如果实现有问题（如 models.dev logo 不存在），可以快速回滚：

1. 恢复静态 Provider 的 logo URL 为原值
2. 恢复动态 Provider 的 `logoUrl = undefined`
3. UI 组件会自动适配（不显示 logo，仅显示名称）

无需数据库迁移或配置变更。

## Open Questions

**无**

此变更的实现方式清晰，没有未解决的技术问题。
