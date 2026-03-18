# 设计文档：渐进式加载优化

## Context

### 当前状态

Web 端应用启动时，`index.html` 中的 `<div id="root">` 容器为空，用户在 JavaScript 加载和 React 渲染完成前看到的是白屏。当前 `main.tsx` 将所有依赖（store、router、业务组件）打包在一起，导致初始 bundle 较大（~765KB），弱网环境下下载耗时 5-15 秒。

### 约束条件

- 保持 Tauri 桌面端不受影响
- 不改变现有的初始化流程逻辑
- React 18 + Vite 构建系统

## Goals / Non-Goals

**Goals:**
- 消除 Web 端首屏白屏（<100ms 显示内容）
- 让初始化动画尽快显示（减少等待时间）
- 减少初始加载的 bundle 体积

**Non-Goals:**
- 不优化初始化流程本身的执行时间
- 不优化网络请求（如模型数据获取）
- 不改变 Tauri 桌面端的加载体验

## Decisions

### 1. 三层渐进式加载策略

**决策**：采用三层渐进式加载：HTML Spinner → 初始化动画 → 主应用

**理由**：
- Layer 1（HTML Spinner）内联在 HTML 中，无需等待 JS，可立即显示
- Layer 2（初始化动画）通过代码分割独立打包，减少等待时间
- Layer 3（主应用）按需加载，不阻塞初始化动画显示

**备选方案**：
- ❌ 单层加载：无法解决白屏问题
- ❌ 仅 HTML Loading：用户等待时间仍然很长，体验不佳

### 2. HTML Spinner 实现方式

**决策**：使用纯 CSS 转圈动画

**理由**：
- 实现简单，代码量极小（<1KB）
- 无需额外资源加载
- React 渲染后自动替换，无需手动清理

**备选方案**：
- ❌ SVG 动画：复杂度高，不符合"简单即可"的原则
- ❌ 图片/字体图标：需要额外资源请求

### 3. 移除 chunk-init 对 store 的依赖

**决策**：通过依赖注入解耦 chunk-init 与 store，确保轻量化打包

**问题背景**：
当前存在两处 store 依赖会导致 chunk-init 无法轻量化：
1. `InitializationController` 直接导入 store 来读取 `modelProvider.error` 和 `modelProvider.loading`
2. `initSteps.ts` 直接导入 store 来执行 `store.dispatch`

如果这两个模块被打包进 chunk-init，整个 store（6 slices + 3 middleware）也会被带入。

**解决方案**：
1. **扩展 `InitResult` 类型**：添加 `modelProviderStatus` 字段
2. **initSteps 作为 prop 传入**：InitializationController 不再静态导入 initSteps，改为通过 props 接收
3. **modelProviderStatus 通过回调传递**：InitializationController 从 result 中获取状态，而非从 store
4. **store 相关逻辑延迟到 MainApp**：`triggerSilentRefreshIfNeeded` 等调用移到 MainApp.tsx

**代码改动示意**：
```typescript
// 1. 扩展 InitResult 类型 (src/lib/initialization/types.ts)
interface InitResult {
  // ... 现有字段
  modelProviderStatus?: {
    hasError: boolean;
    isNoProvidersError: boolean;
  };
}

// 2. InitializationController 接收 initSteps 作为 prop
interface InitializationControllerProps {
  initSteps: InitStep[];  // 新增：由外部传入
  onComplete: (result: InitResult) => void;
}

// 3. main.tsx 渐进式加载流程（使用顶层 await 简化实现）
// 使用顶层 await 在模块加载时并行加载 initSteps，无需 useEffect
const initStepsModule = await import('@/config/initSteps');

const App: React.FC = () => {
  const [initSteps, setInitSteps] = useState<InitStep[] | null>(null);
  const [appState, setAppState] = useState<"loading" | "initializing" | "ready">("loading");
  const [MainAppComponent, setMainAppComponent] = useState<React.ComponentType | null>(null);

  // 3.1 使用 useEffect 设置已加载的 initSteps（顶层 await 已完成加载）
  useEffect(() => {
    setInitSteps(initStepsModule.initSteps);
    setAppState("initializing");
  }, []);

  // 3.2 初始化完成后动态导入 MainApp
  const handleInitComplete = useCallback(async (result: InitResult) => {
    const { createMainApp } = await import('./MainApp');
    setMainAppComponent(() => createMainApp(result));
    setAppState("ready");
  }, []);

  // initSteps 加载中，继续显示 HTML Spinner
  if (appState === "loading" || !initSteps) {
    return null;
  }

  // 初始化中，显示初始化动画
  if (appState === "initializing") {
    return <InitializationController initSteps={initSteps} onComplete={handleInitComplete} />;
  }

  // 初始化完成，渲染主应用
  return MainAppComponent ? <MainAppComponent /> : null;
};
```

**顶层 await 优势**：
- 模块加载时立即并行加载 initSteps，无需等待 React 组件挂载
- 代码更简洁，减少一个 useEffect
- 与 useEffect 内 import 效果相同（都显示 HTML Spinner 等待加载）

**加载流程变化**：
```
修改前：
main.tsx
├── import { store } ← 重型依赖
├── import { router } ← 重型依赖
├── import { initSteps } ← 依赖 store
└── InitializationController
    └── 全部加载完成才能渲染

修改后：
main.tsx (轻量入口)
│
├─ 阶段 1：HTML Spinner 显示
│   └─ 浏览器解析 index.html
│
├─ 阶段 2：initSteps 动态加载
│   ├─ import('@/config/initSteps')
│   └─ 用户仍看到 HTML Spinner（加载时间极短，<500ms）
│
├─ 阶段 3：初始化动画显示
│   ├─ 渲染 InitializationController
│   └─ chunk-init (~50KB) 已加载
│
└─ 阶段 4：主应用加载
    ├─ 初始化完成
    ├─ import('./MainApp')
    └─ main-app (~700KB) 按需加载
```

**依赖关系变化**：
```
修改前：
main.tsx
├── import { store } ← 重型依赖
├── import { router } ← 重型依赖
├── import { initSteps } ← 依赖 store
└── InitializationController
    └── 全部打包进初始 bundle

修改后：
main.tsx (入口)
├── 静态导入：InitializationController、main.css
└── 动态导入：
    ├── initSteps.ts (阶段 2) → 打包进独立 chunk (~10KB)
    └── MainApp.tsx (阶段 4) → 打包进 main-app chunk (~700KB)

chunk-init (~50KB)
├── InitializationController (无 store 依赖)
├── AnimatedLogo
└── ui/progress

initSteps chunk (~10KB)
├── initSteps.ts
└── store (仅此 chunk 包含 store)

main-app (~700KB)
├── router
├── ConfirmProvider
└── ToasterWrapper
```

**理由**：
- 最小改动范围（仅改 InitializationController 接口和相关类型）
- 低风险（不影响其他使用 store 的代码）
- 额外收益：更好的关注点分离、更易测试

**备选方案**：
- ❌ 拆分 store：改动范围大，风险高，需要重构整个 store 架构

### 4. 代码分割策略

**决策**：通过 Vite 的 `manualChunks` 配置将初始化相关代码分离为多个独立 chunk

**chunk-init**（初始化 UI，~50KB）：
- InitializationController（无 store、无 initSteps 依赖）
- AnimatedLogo + canvas-logo
- lib/initialization（InitializationManager、types）
- ui/progress（轻量 UI 组件）

**chunk-initsteps**（初始化步骤，~10KB）：
- config/initSteps
- store（store 仅此 chunk 包含）

**main-app**（主应用，~700KB）：
- router
- ConfirmProvider
- ToasterWrapper

**不包含在初始加载的模块**：
- ❌ router（延迟到初始化完成后）
- ❌ 业务组件（延迟到主应用）

**预期体积**：
- chunk-init：目标 ~50KB，上限 100KB（gzip 后）
- chunk-initsteps：~10KB（gzip 后）

**理由**：
- chunk-init 是初始化动画的完整依赖，必须轻量化
- initSteps 必须单独打包，因为它依赖 store
- 将 initSteps 独立打包后，可在 App 挂载后立即并行加载

### 5. 主应用延迟加载

**决策**：将重型依赖（store、router、业务组件）提取到 `MainApp.tsx`，通过动态 `import()` 加载

**理由**：
- Redux store 和 Router 配置体积较大
- 初始化完成前不需要这些模块
- 动态导入可实现真正的按需加载

### 6. CSS 样式加载策略

**决策**：保持 main.css 在入口文件中静态导入，接受其对初始加载的微小影响

**问题背景**：
当前 `main.css` 在 `main.tsx` 中通过 `import "./main.css"` 加载。如果改为延迟加载，可能导致：
- FOUC（Flash of Unstyled Content）问题
- 初始化动画样式不一致

**理由**：
- Tailwind CSS 已经过优化，体积可控
- 初始化动画依赖部分 Tailwind 工具类（如 `flex`、`items-center`）
- 静态导入确保样式在渲染前就绪，避免闪烁

**体积影响**：
- main.css gzip 后约 10-20KB
- 对初始加载时间影响可接受（<500ms 在 Slow 3G 下）

## Risks / Trade-offs

### 风险 1：代码分割可能引入额外的网络请求

**缓解措施**：
- chunk-init 体积较小（~50KB），对加载时间影响有限
- HTTP/2 多路复用可并行加载多个 chunk

### 风险 2：store 相关逻辑需要延迟到 MainApp

**问题**：`main.tsx` 中的 `triggerSilentRefreshIfNeeded(store)` 调用依赖 store，但 store 延迟加载后无法在 main.tsx 中调用。

**解决方案**：将 `triggerSilentRefreshIfNeeded` 调用移到 `MainApp.tsx` 中，在 MainApp 组件挂载后自动执行。

**代码改动示意**：
```typescript
// MainApp.tsx
export function createMainApp(result: InitResult) {
  return function MainApp() {
    useEffect(() => {
      // MainApp 挂载后执行静默刷新
      triggerSilentRefreshIfNeeded(store);
    }, []);
    // ...
  };
}
```

### 风险 3：动态导入可能导致初始化完成后的短暂延迟

**决策**：暂不实现预加载，保持方案简单

**理由**：
- 预加载增加代码复杂度
- 初始化过程中用户已看到有意义的动画，等待体验可接受
- 可作为后续优化项，不影响核心目标

**后续优化方向**（可选）：
- 在初始化进度达到 80% 时，使用 `<link rel="preload">` 预加载主应用 chunk
- 使用 Suspense 提供平滑的加载过渡

### 风险 4：架构变更可能影响现有代码

**缓解措施**：
- 保持 InitializationController 的 API 不变
- 仅修改 main.tsx 的加载逻辑
- 充分测试各种网络环境下的表现

## Migration Plan

### 实施步骤

1. **添加 HTML Spinner**（低风险）
   - 修改 `index.html`
   - 验证 Spinner 显示正常

2. **移除 store 依赖**（中风险）
   - 扩展 InitResult 类型
   - 修改 InitializationController 接收 initSteps 作为 prop
   - 修改 initSteps 返回 modelProviderStatus

3. **配置代码分割**（中风险）
   - 修改 `vite.config.ts`
   - 配置 chunk-init、chunk-initsteps 分块
   - 验证 chunk 生成正确

4. **重构 main.tsx**（中风险）
   - 提取 MainApp 组件
   - 实现四阶段渐进式加载：
     1. HTML Spinner 显示
     2. initSteps 动态加载
     3. 初始化动画显示
     4. 主应用加载
   - 验证初始化流程正常

5. **测试验证**
   - Chrome DevTools 网络限速测试
   - Bundle 分析验证
   - 功能回归测试

### 回滚策略

- 每个步骤独立提交，可单独回滚
- 保留原有 main.tsx 结构的备份
