# Design: 供应商 Logo 显示

## Context

**当前状态**：
- 供应商卡片头部 (`ProviderCardHeader`) 使用供应商名称的首字母作为头像
- 头像显示逻辑硬编码在组件内部，没有复用性
- 当 logo 加载失败时没有降级处理机制

**问题**：
- 首字母头像不够直观，无法快速识别供应商品牌
- 项目中其他地方也可能需要显示供应商 logo，但没有统一的解决方案
- 缺乏错误处理机制，用户体验不够健壮

**约束条件**：
- Logo 资源由 models.dev 提供，URL 格式固定
- 需要保持向后兼容，logo 加载失败时降级到首字母显示
- SVG 图片较小，对性能影响可控
- 不需要修改类型定义或远程 API

**利益相关者**：
- 用户：获得更好的品牌识别体验
- 开发者：获得可复用的工具函数，提升开发效率

## Goals / Non-Goals

**Goals**:
- 创建可复用的 `getProviderLogoUrl()` 工具函数，统一管理 logo URL 构建逻辑
- 创建可复用的 `ProviderLogo` 组件，封装 logo 显示、加载、降级、缓存逻辑
- 修改 `ProviderCardHeader` 组件，使用 `ProviderLogo` 组件替代直接渲染
- 实现多层缓存机制（React.memo + 自定义 Hook），优化性能
- 实现健壮的错误处理机制，logo 加载失败时降级到首字母显示
- 实现渐进显示策略，提升用户体验
- 确保所有需要显示供应商 logo 的地方都能使用统一的组件
- 优化 SVG 显示样式，确保在不同背景下清晰可见

**Non-Goals**:
- 不实现本地持久化缓存（localStorage、IndexedDB），组件级内存缓存已足够
- 不创建复杂的图片加载库依赖
- 不修改远程 API 或类型定义
- 不实现 logo 的懒加载（SVG 文件很小，不需要）
- 不使用 Redux 或全局状态管理缓存，使用组件级缓存即可

## Decisions

### 决策 1：工具函数位置选择

**选择**：在 `src/utils/providerUtils.ts` 中创建工具函数

**理由**：
- 符合项目现有的工具函数组织结构（参考 AGENTS.md 的文档参考章节）
- `@/utils/` 别名已配置，导入方便
- 与 `crypto.ts`、`utils.ts` 等工具函数保持一致

**替代方案**：
- 创建 `src/utils/logoUtils.ts`：过于专门化，功能单一
- 创建 `src/services/providerLogoService.ts`：过度设计，这不是服务，只是纯函数

### 决策 2：组件封装策略

**选择**：创建独立的 `ProviderLogo` 可复用组件，封装所有 logo 显示逻辑

**理由**：
- **即时复用价值**：虽然当前只有一个使用场景，但创建独立组件符合项目长期架构目标
- **性能优化**：使用双层缓存机制（React.memo + 浏览器缓存）避免重复的网络请求和渲染
- **关注点分离**：将复杂的 logo 加载、降级、超时、渐进显示逻辑封装在独立组件中
- **测试便利性**：独立组件更容易编写单元测试和集成测试
- **未来扩展性**：其他页面（如聊天历史、模型选择器等）可能需要显示供应商 logo

**组件 API 设计**：
```typescript
interface ProviderLogoProps {
  /** 供应商唯一标识 */
  providerKey: string;
  /** 供应商名称（用于降级显示和可访问性） */
  providerName: string;
  /** logo 容器尺寸，默认 40px */
  size?: number;
  /** 自定义类名 */
  className?: string;
}

<ProviderLogo
  providerKey="openai"
  providerName="OpenAI"
  size={40}
/>
```

**组件内部实现**：
- 使用 `React.memo` 包装，避免不必要的重新渲染
- 使用 `useState` 和 `useRef` 管理加载状态
- 内置超时机制（默认 5 秒，使用常量 `LOGO_LOAD_TIMEOUT`）
- 内置渐进显示逻辑
- 内置错误降级到首字母
- 使用绝对定位和平滑过渡动画

### 决策 2.5：缓存策略

**选择**：使用双层缓存机制（React.memo + 浏览器缓存）

**缓存层次**：

**第一层：React.memo 组件级缓存**
```typescript
export const ProviderLogo = React.memo<ProviderLogoProps>(
  ({ providerKey, providerName, size = 40, className }) => {
    // 组件实现
  },
  (prevProps, nextProps) => {
    // 自定义比较函数
    return (
      prevProps.providerKey === nextProps.providerKey &&
      prevProps.providerName === nextProps.providerName &&
      prevProps.size === nextProps.size
    );
  }
);
```
- 当 `providerKey`、`providerName`、`size` 都不变时，跳过组件重新渲染
- 避免不必要的 useEffect 执行和状态更新
- 适用于 props 不变的重新渲染场景

**第二层：浏览器原生缓存**
- 浏览器自动缓存已加载的图片资源（HTTP 缓存）
- 相同 URL 的图片不会重复下载
- 由浏览器管理，无需额外实现

**理由**：
- **简单可靠**：依赖成熟的浏览器缓存机制，无需手动管理
- **零维护成本**：不需要处理缓存失效、内存清理等问题
- **性能优秀**：浏览器缓存已经过高度优化
- **跨组件共享**：浏览器缓存天然支持跨组件共享
- **避免全局状态**：不引入模块级全局变量或 Redux 状态

**不使用 Hook 层缓存的原因**：
- **技术限制**：`useRef` 是组件实例级别的，无法实现跨组件共享
- **复杂度增加**：引入 Hook 缓存会增加代码复杂度和维护成本
- **收益有限**：浏览器缓存已经足够，Hook 缓存的边际收益很小

**替代方案（未采用）**：
- **模块级全局缓存**：使用模块级变量 `Map` 缓存状态
  - 缺点：引入全局可变状态，需要手动管理生命周期
  - 缺点：增加代码复杂度，可能引入 bug
- **Redux 全局状态管理**：过度设计，增加复杂度
- **localStorage 持久化**：浏览器缓存已足够，不需要额外持久化

**性能对比**：

| 场景 | 无优化 | 双层缓存方案 |
|------|--------|-------------|
| 首次渲染单个 logo | 1 次网络请求 | 1 次网络请求 |
| 同一 logo 渲染 10 次 | 10 次网络请求 | **10 次网络请求**，但浏览器缓存命中，下载速度极快 |
| providerKey 不变重新渲染 | 重新执行所有逻辑 | **跳过渲染**（React.memo） |
| 内存占用 | 最小 | 最小（无额外缓存） |

**说明**：
- 虽然会发起 10 次网络请求，但浏览器缓存命中后，请求几乎瞬间完成
- React.memo 确保组件不重新渲染，性能开销极小
- 简化的设计降低了维护成本和 bug 风险

### 决策 3：错误降级策略

**选择**：使用 `<img>` 标签的 `onError` 事件和超时检测，失败时切换到首字母显示

**理由**：
- 简单直接，不需要复杂的第三方库
- 原生浏览器事件，兼容性好
- 降级逻辑与当前实现一致，用户过渡平滑
- 添加超时机制避免无限等待

**实现方式**：
```typescript
// 超时常量定义
const LOGO_LOAD_TIMEOUT = 5000; // 5 秒超时

const [imgError, setImgError] = useState(false);
const [imgLoaded, setImgLoaded] = useState(false);
const imgLoadedRef = useRef(false);  // 使用 ref 避免闭包陷阱

useEffect(() => {
  // 重置状态当 providerKey 变化
  setImgError(false);
  setImgLoaded(false);
  imgLoadedRef.current = false;

  // 设置超时
  const timeoutId = setTimeout(() => {
    if (!imgLoadedRef.current) {  // 检查 ref 而非 state
      setImgError(true);
    }
  }, LOGO_LOAD_TIMEOUT);

  return () => clearTimeout(timeoutId);
}, [providerKey]);

<img
  key={providerKey}  // 确保 providerKey 变化时重新渲染
  src={getProviderLogoUrl(providerKey)}
  onLoad={() => {
    imgLoadedRef.current = true;  // 同步更新 ref
    setImgLoaded(true);
  }}
  onError={() => setImgError(true)}
  style={{ display: imgError ? 'none' : 'block' }}
/>;

{imgError && <FallbackAvatar />}
```

**关键点**：
- 使用 `LOGO_LOAD_TIMEOUT` 常量定义超时时间，便于统一调整
- 使用 `key={providerKey}` 强制在 providerKey 变化时重新创建 img 元素
- 添加超时机制，防止网络挂起
- 使用 `imgLoaded` 状态跟踪加载成功（用于渲染）
- 使用 `imgLoadedRef` 引用跟踪加载成功（用于超时检查，避免闭包陷阱）
- providerKey 变化时在 useEffect 中重置所有状态和 ref
- **闭包陷阱修复**：`setTimeout` 回调中读取 `imgLoadedRef.current` 而非 `imgLoaded` state

**替代方案**：
- 预加载 logo 检查是否存在：增加不必要的网络请求
- 使用统一的 404 图片：用户体验不如首字母降级

### 决策 4：SVG 显示优化

**选择**：使用原生 `<img>` 标签，设置固定尺寸和对象适配

**理由**：
- SVG 本身是矢量图，天然支持不同尺寸
- 不需要额外的库（如 `react-svg`）
- 简单的 CSS 足以处理显示需求

**样式配置**：
```tsx
<img
  src={logoUrl}
  alt={`${providerName} logo`}
  className="w-10 h-10 object-contain"
  style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))' }}
/>
```

### 决策 4.5：渐进显示策略

**选择**：先显示首字母占位符，logo 加载成功后淡入替换

**理由**：
- 避免首屏空白或闪烁
- 提供更好的用户体验
- 减少布局偏移（layout shift）
- 网络慢时用户仍能立即看到内容

**实现方式**：
```typescript
return (
  <div className="relative w-10 h-10">
    {/* 首字母占位符 - 始终渲染，通过 opacity 控制显示 */}
    <div
      className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 absolute inset-0 transition-opacity duration-300"
      style={{ opacity: imgLoaded && !imgError ? 0 : 1 }}
      role="img"
      aria-label={`${providerName} logo`}
    >
      <span className="text-lg font-bold text-primary">
        {providerName.charAt(0).toUpperCase()}
      </span>
    </div>

    {/* Logo 加载成功后淡入 */}
    {!imgError && (
      <img
        key={providerKey}
        src={getProviderLogoUrl(providerKey)}
        alt={`${providerName} logo`}
        className="w-10 h-10 object-contain absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: imgLoaded ? 1 : 0,
          filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))'
        }}
        onLoad={() => {
          imgLoadedRef.current = true;
          setImgLoaded(true);
        }}
        onError={() => setImgError(true)}
      />
    )}
  </div>
);
```

**关键点**：
- 首字母始终存在作为后备，避免空白
- 使用 `opacity` 过渡实现平滑淡入效果（300ms）
- 使用绝对定位确保 logo 和首字母重叠在同一位置
- logo 加载成功后（`imgLoaded = true`），首字母淡出（opacity: 0），logo 淡入（opacity: 1）
- logo 加载失败时（`imgError = true`），保持首字母显示
- 只使用 `imgLoaded` 状态，无需额外的 `showLogo` 状态

**替代方案**：
- 骨架屏：需要额外实现，首字母作为占位符已足够
- 闪烁加载（先空白再显示）：用户体验差

### 决策 5：工具函数导出方式

**选择**：命名导出（named export）

**理由**：
- 符合项目现有代码风格
- 更好的 tree-shaking 支持
- 导入时可以明确函数名

**函数签名**：
```typescript
/**
 * 获取供应商 logo URL
 * @param providerKey 供应商唯一标识（如 'openai'、'anthropic'）
 * @returns logo 图片 URL
 * @example
 * getProviderLogoUrl('openai')
 * // => 'https://models.dev/logos/openai.svg'
 */
export const getProviderLogoUrl = (providerKey: string): string => {
  return `https://models.dev/logos/${providerKey}.svg`;
};
```

## Risks / Trade-offs

### 风险 1：Logo 资源不可用
**风险描述**：models.dev 的 logo 资源可能不存在或无法访问

**缓解措施**：
- 实现 `onError` 降级到首字母显示
- 在开发环境测试常见供应商的 logo 可用性
- 记录加载失败率，监控资源稳定性

### 风险 2：网络延迟影响首次渲染
**风险描述**：logo 加载需要时间，可能导致头像区域短暂空白

**缓解措施**：
- **已实现**：渐进显示策略（决策 4.5），先显示首字母占位符
- SVG 文件通常很小（< 10KB），加载速度快
- logo 加载成功后平滑淡入替换首字母
- 5 秒超时机制，避免长时间等待

### 风险 3：供应商 Key 命名不匹配
**风险描述**：`providerKey` 可能与 models.dev 的文件命名不一致

**缓解措施**：
- 在开发阶段验证常见供应商的 logo URL
- 如果发现不匹配，可以添加映射表
- 错误降级机制确保即使 URL 错误也能正常显示

### 权衡 1：性能 vs 一致性
**权衡**：每次渲染都调用工具函数会创建新的字符串，但影响微乎其微

**决策**：优先考虑代码一致性和可维护性，性能影响可忽略

**优化建议**：如果未来发现性能问题，可以考虑 memoization

### 权衡 2：简单性 vs 可扩展性
**权衡**：当前设计简单直接，但如果需要支持多种图片格式或 CDN 会受限

**决策**：遵循 YAGNI 原则，当前设计满足需求即可

**未来扩展**：如果需要支持更多特性，再重构为更复杂的方案

## Migration Plan

**部署步骤**：

1. **创建工具函数** (`src/utils/providerUtils.ts`)
    - 实现 `getProviderLogoUrl()` 函数
    - 添加完整的 JSDoc 注释
    - 使用命名导出

2. **创建 ProviderLogo 组件** (`src/components/ProviderLogo/index.tsx`)
    - 实现 `ProviderLogo` 组件
    - 定义超时常量 `const LOGO_LOAD_TIMEOUT = 5000;`
    - 添加状态管理（`imgError`、`imgLoaded`、`imgLoadedRef`）
    - 实现渐进显示逻辑（首字母 → logo 淡入）
    - 实现错误降级（首字母显示）
    - 实现超时机制（使用 `useRef` 避免闭包陷阱）
    - 使用 `React.memo` 包装组件
    - 添加自定义比较函数
    - 添加 TypeScript 类型定义
    - 导出组件

3. **修改 ProviderCardHeader 组件**
    - 导入 `ProviderLogo` 组件
    - 替换原有的头像渲染逻辑
    - 传递 `providerKey` 和 `providerName` props

4. **测试验证**
   - 开发环境验证常见供应商 logo 显示
   - 测试网络错误场景（使用错误的 providerKey）
   - 验证降级逻辑正常工作
   - 检查响应式布局下的显示效果

5. **代码审查**
   - 确保遵循项目代码规范
   - 检查类型安全性
   - 验证可访问性（alt 文本、ARIA 属性）

6. **部署**
   - 提交代码并运行测试
   - 合并到主分支
   - 部署生产环境

**回滚策略**：
- 变更影响范围小，回滚简单：恢复 `ProviderCardHeader.tsx` 到之前版本
- 删除 `providerUtils.ts` 文件
- 不涉及数据迁移或数据库变更
- 向后兼容，不影响现有功能

## Open Questions

**无**：本设计基于明确的需求和现有代码结构，所有关键决策已在上述 Decisions 部分详细说明。

**待验证项**（开发阶段确认）：
- [ ] models.dev 的 logo 文件命名是否与 `providerKey` 完全一致？
- [ ] 是否有供应商缺少 logo 资源？
- [ ] Logo 图片的实际尺寸和视觉效果如何？
- [ ] `LOGO_LOAD_TIMEOUT`（5000ms）超时是否合适？是否需要根据实际加载时间调整？
- [ ] 渐进显示的过渡动画（300ms）是否流畅？

**未来考虑**（非当前范围）：
- [ ] 是否需要将常用供应商 logo 打包到项目中以支持离线访问？
- [ ] 是否需要实现本地资源优先策略（本地 → 远程 → 降级）？
- [ ] 是否需要监控 logo 加载失败率？

这些将在实现阶段通过实际测试验证。
