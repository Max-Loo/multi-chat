## Context

### 当前状态

`ModelProviderSetting.tsx` 组件当前实现了基础的模型供应商刷新功能，但界面设计存在以下问题：

- **信息展示不足**：仅显示刷新按钮和最后更新时间，无法查看已加载的供应商列表
- **状态反馈有限**：错误信息仅以纯文本显示，缺少视觉层次
- **交互单一**：除了刷新外无其他操作入口
- **未遵循现代 UI 设计原则**：缺少卡片式布局、徽章、图标等视觉元素

### 技术约束

- **组件库**：必须使用 shadcn/ui 组件（Card、Badge、Button、Alert、Collapsible 等）
- **状态管理**：使用 Redux Toolkit（`modelProviderSlice`）管理供应商数据
- **数据源**：从 `store.modelProvider.providers` 读取供应商列表
- **国际化**：使用 react-i18next 支持中英文
- **样式系统**：使用 Tailwind CSS，遵循 design-taste-frontend 的设计原则
- **无障碍性**：遵循 web-design-guidelines 的可访问性标准

### 相关文件

- `src/store/slices/modelProviderSlice.ts`: Redux store，包含 `providers`、`loading`、`error`、`lastUpdate` 状态
- `src/services/modelRemoteService.ts`: 远程数据获取服务
- `src/types/model.ts`: 类型定义（RemoteProviderData、ModelData 等）

## Goals / Non-Goals

**Goals:**

1. 提供清晰的供应商信息展示，包括状态、模型数量、最后更新时间
2. 实现卡片式布局，提升视觉层次和信息可读性
3. 支持展开/折叠查看供应商详细信息（模型列表、API 端点等）
4. 改进错误处理和加载状态的视觉反馈
5. 支持响应式布局，适配桌面和移动端
6. 提供模型搜索功能，方便用户查找特定模型
7. 遵循现代 UI/UX 设计原则（高内聚、低耦合、性能优化）

**Non-Goals:**

1. 不修改后端 API 或 Redux 状态管理逻辑
2. 不改变模型供应商的数据结构或刷新机制
3. 不添加新的功能（如编辑供应商配置、删除供应商等）
4. 不实现供应商的启用/禁用功能

## Decisions

### 1. 组件架构设计

**决策**：采用**复合组件模式**（Compound Component Pattern），将 `ModelProviderSetting` 拆分为多个子组件。

**原因**：
- **高内聚**：每个子组件负责单一职责（SRP 原则）
- **可复用性**：子组件可在其他地方复用
- **可维护性**：降低单个文件的复杂度，便于测试和修改
- **可扩展性**：未来添加新功能（如排序、筛选）更容易

**组件结构**：
```
ModelProviderSetting (容器组件)
├── ProviderHeader (标题 + 刷新按钮)
├── ProviderGrid (供应商卡片网格)
│   └── ProviderCard (单个供应商卡片)
│       ├── ProviderCardHeader (图标 + 名称 + 状态徽章)
│       ├── ProviderCardSummary (模型数量 + 最后更新)
│       └── ProviderCardDetails (可展开的详细信息)
│           ├── ProviderMetadata (API 端点、文档链接)
│           ├── ModelList (模型列表)
│           └── ModelSearch (模型搜索框)
└── ErrorAlert (错误提示)
```

### 2. 状态管理设计

**决策**：使用**本地状态**管理 UI 交互状态（展开/折叠、搜索关键词），Redux 状态仅用于数据。

**原因**：
- **关注点分离**：UI 交互状态不应污染全局 Redux store
- **性能优化**：避免不必要的 Redux 重渲染
- **简单性**：本地状态足以管理 UI 交互

**状态分布**：
- **Redux**: `providers`、`loading`、`error`、`lastUpdate`（已存在）
- **Local State**: `expandedProviders` (Set<string>)、`searchQuery` (string)

### 3. 布局方案

**决策**：使用 **CSS Grid + Flexbox** 混合布局。

**原因**：
- **Grid**: 适合二维布局（供应商卡片网格）
- **Flexbox**: 适合一维布局（卡片内部元素排列）
- **响应式**: 通过 `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))` 实现自适应

**具体实现**：
```tsx
// 桌面端：网格布局
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// 移动端：单列布局
<div className="grid grid-cols-1 gap-4">
```

### 4. 展开动画实现

**决策**：使用 **CSS transition** 代替 JavaScript 动画。

**原因**：
- **性能**: CSS 动画由浏览器合成器线程处理，不阻塞主线程
- **硬件加速**: 启用 GPU 加速（transform、opacity）
- **简洁性**: 无需额外的动画库依赖
- **可维护性**: 通过 Tailwind 类控制，代码更清晰

**实现方式**：
```tsx
<div className="transition-all duration-300 ease-in-out">
  {isExpanded && <DetailsContent />}
</div>
```

### 5. 错误处理策略

**决策**：使用 **分层错误提示**（Toast + Alert）。

**原因**：
- **Toast**: 非阻塞式通知，适合刷新成功/失败的即时反馈
- **Alert**: 阻断式警告，适合显示持久的错误详情
- **用户体验**: 结合两者的优势，既及时又不打扰

**实现方式**：
```tsx
// Toast (成功/失败)
toast.success(t('refreshSuccess'));
toast.error(errorMessage);

// Alert (持久显示)
{error && <Alert variant="destructive">{error}</Alert>}
```

### 6. 图标和视觉设计

**决策**：使用 **Lucide React** 图标库 + **shadcn/ui Badge** 组件。

**原因**：
- **一致性**: 项目已使用 Lucide React，保持统一
- **轻量**: Tree-shakeable，按需导入
- **可访问性**: 内置 aria-label 支持
- **Badge**: shadcn/ui 提供现成的徽章组件，无需自定义样式

**图标映射**：
- 刷新按钮: `RefreshCw`
- 可用状态: `CheckCircle` (绿色)
- 不可用状态: `XCircle` (红色)
- 文档链接: `ExternalLink`
- 展开图标: `ChevronDown`
- 折叠图标: `ChevronUp`

## Risks / Trade-offs

### Risk 1: 供应商数据量过大导致性能问题

**场景**: 如果供应商数量超过 20 个，或单个供应商的模型数量超过 100 个，可能导致渲染性能下降。

**缓解措施**:
- 使用 `React.memo` 优化 `ProviderCard` 组件，避免不必要的重渲染
- 实现**虚拟滚动**（如果供应商数量 > 50）
- 实现**搜索防抖**（debounce 300ms），减少输入时的重渲染

### Risk 2: 展开动画在低端设备上卡顿

**场景**: 在低端移动设备上，CSS transition 可能出现掉帧。

**缓解措施**:
- 仅对 `opacity` 和 `transform` 应用动画（GPU 加速）
- 避免对 `height` 应用动画（触发重排）
- 使用 `will-change: opacity, transform` 提示浏览器优化

### Trade-off 1: 功能完整性 vs. 开发时间

**权衡**: 当前设计不包含供应商的启用/禁用、编辑配置等功能。

**原因**:
- 这些功能需要修改后端 API 和数据结构
- 超出本次 UI 改进的范围
- 遵循 YAGNI 原则（You Aren't Gonna Need It）

**未来扩展**:
- 预留扩展点（如 ProviderCard 的操作按钮区域）
- 在后续 change 中实现

### Trade-off 2: 动画流畅度 vs. 代码复杂度

**权衡**: 使用 CSS transition 代替 Framer Motion。

**原因**:
- CSS transition 足以满足需求（简单的展开/折叠）
- 避免引入额外的依赖和 bundle 体积
- 遵循 KISS 原则（Keep It Simple, Stupid）

**代价**:
- 无法实现复杂的弹性动画
- 需要手动处理动画状态

## Migration Plan

### 部署步骤

1. **创建新分支**: `feature/redesign-model-provider-ui`
2. **实现组件**: 按照 Decisions 中的组件结构逐步实现
3. **添加国际化**: 在 `src/locales/zh/setting.json` 和 `src/locales/en/setting.json` 添加新的翻译键
4. **测试**:
   - 单元测试（Vitest）：测试组件渲染和交互
   - 手动测试：测试不同屏幕尺寸和浏览器
   - 无障碍测试：使用 axe DevTools 检查
5. **代码审查**: 确保遵循设计原则和代码规范
6. **合并到主分支**: 通过 PR 合并

### 回滚策略

如果新版本出现严重问题：
1. 保留原 `ModelProviderSetting.tsx` 为 `ModelProviderSetting.legacy.tsx`
2. 通过功能开关（feature flag）控制使用哪个版本
3. 回滚时切换回旧版本
4. 修复问题后重新部署

## Open Questions

1. **Q**: 是否需要显示供应商的图标？
   - **A**: 是的，如果 `RemoteProviderData` 包含 `icon` 字段。如果没有，使用首字母作为占位图标。

2. **Q**: 搜索功能是否应该支持模糊匹配？
   - **A**: 是的，使用简单的字符串包含匹配（不区分大小写）。未来可升级为 fuse.js 的模糊搜索。

3. **Q**: 是否需要记住用户的展开/折叠状态？
   - **A**: 暂不需要。每次访问时默认全部折叠。如果用户反馈强烈，可在后续版本中添加本地存储。
