## Context

当前应用初始化在 `main.tsx` 中使用顶层 `await` 执行，React 无法在初始化过程中重新渲染，导致进度条无法动态更新。需要将初始化逻辑移入 React 组件内部。

**现有架构**:
- `InitializationManager` 已支持 `onProgress(current, total, currentStep)` 回调
- `initSteps` 定义了 8 个初始化步骤，支持依赖关系和并行执行
- 错误处理分为三级：fatal / warning / ignorable

**约束**:
- i18n 是第一个初始化步骤，初始化阶段不能依赖 i18n
- 需要保持现有的错误处理逻辑不变

## Goals / Non-Goals

**Goals:**
- 实现带进度条和百分比的初始化动画
- 进度条下方显示动态加载文本（三个点循环动画）
- 初始化完成后等待 0.5s 再进入应用
- 保持现有错误处理逻辑

**Non-Goals:**
- 不显示每个步骤的详细名称（保持简洁）
- 不实现精确到毫秒的进度（步骤级进度即可）
- 不修改初始化步骤的执行逻辑

## Decisions

### D1: 初始化流程架构

**决策**: 将初始化逻辑从顶层 await 移入 React 组件

**原因**:
- 顶层 await 阻塞渲染，React 无法更新状态
- 组件内初始化可以使用 useState/useEffect 实时更新进度

**架构对比**:

```
当前架构:
main.tsx → render(Skeleton) → await init() → render(App)

新架构:
main.tsx → render(App)
         → App 内渲染 InitializationController
         → InitializationController 执行 init() 并更新进度
         → 完成后 App 渲染主应用
```

**组件职责划分**:

| 组件 | 职责 |
|------|------|
| `InitializationController` | 执行初始化、更新进度、返回初始化结果（成功/失败/警告） |
| `App` | 根据结果渲染不同界面、处理警告 Toast、安全警告、静默刷新 |

**Redux Provider 挂载时机**:

`store` 是全局对象，可以直接使用，`Provider` 只是提供 React context 给 `useSelector`/`useDispatch` hooks。
初始化步骤中直接使用 `store.dispatch()` 是安全的，不需要 Provider 已挂载。

```typescript
// initSteps.ts 中直接使用 store
const models = await store.dispatch(initializeModels()).unwrap();
```

### D2: 进度条组件选择

**决策**: 使用 shadcn/ui Progress 组件（基于 @radix-ui/react-progress）

**原因**:
- 项目已使用 shadcn/ui 组件库，风格一致
- 基于 Radix UI，可访问性好
- 支持平滑过渡动画

**安装**:
```bash
npx shadcn@latest add progress
```

或手动安装：
```bash
pnpm add @radix-ui/react-progress
```

**用法**:
```tsx
import { Progress } from "@/components/ui/progress"

// value 为 0-100 的百分比数值
<Progress value={62} className="h-2" />
```

**进度计算**:
```typescript
const percentage = Math.round((currentStep / totalSteps) * 100);
// 例如：5/8 = 62.5% → 62%
```

**UI 布局**:
```
┌─────────────────────────────────────────┐
│                                         │
│    ┌─────────────────────────────┐ 62%  │  Progress bar + Percentage on right
│    │████████████░░░░░░░░░░░░░░░░│      │
│    └─────────────────────────────┘      │
│                                         │
│    Initializing application...          │  Dynamic dots animation
│                                         │
└─────────────────────────────────────────┘
```

- 进度条和百分比在同一行，百分比在右侧
- 不显示步骤计数（如 "5/8"），保持简洁

### D3: 动态三个点动画实现

**决策**: 使用 setInterval 实现，每 500ms 更新一次

**原因**:
- 实现简单，性能开销小
- 500ms 间隔视觉上舒适

**实现**:
```typescript
const [dots, setDots] = useState('');

useEffect(() => {
  if (status === 'initializing') {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }
}, [status]);
```

### D4: 完成后延迟

**决策**: 100% 后等待 500ms 再进入应用

**原因**:
- 避免进度条闪现即消失
- 给用户视觉反馈确认初始化完成

### D5: 初始化阶段文本语言

**决策**: 使用英文硬编码，不依赖 i18n

**原因**:
- i18n 本身是第一个初始化步骤
- 在 i18n 就绪前无法使用翻译函数
- "Initializing application..." 是通用文本，英文可接受

### D6: 进度初始值

**决策**: InitializationController 初始化时设置 `currentStep: 0`

**原因**:
- `InitializationManager.onProgress` 回调在步骤**完成后**触发
- 如果不设置初始值，第一个回调触发时进度已经是 1/8 = 12%
- 设置初始值为 0 确保进度条从 0% 开始显示

**实现**:
```typescript
const [progress, setProgress] = useState({
  current: 0,  // 初始值设为 0
  total: initSteps.length,
  stepName: '',
});
```

## Risks / Trade-offs

### R1: 进度跳跃

**风险**: 由于并行执行，多个步骤可能同时完成，导致进度跳跃（如 12% → 37% → 62%）

**缓解**: 接受此行为。用户关注的是整体进度，而非单个步骤的精确进度。

### R2: 快速初始化看不到进度

**风险**: 初始化非常快（<100ms），用户可能看不到进度条

**缓解**: 已实现 0.5s 延迟，确保用户能看到完成状态。

### R3: 状态管理复杂度

**风险**: 新增 InitializationController 组件增加了状态管理复杂度

**缓解**: 组件职责单一，状态简单（status + progress），易于维护。
