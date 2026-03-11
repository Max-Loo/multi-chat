# Design: 移动端 Toast 优化

## Context

**当前状态**：
- 项目使用 sonner 2.0.7 作为 Toast 库
- Toast 组件位于 `src/components/ui/sonner.tsx`，配置了主题和样式，但没有响应式位置配置
- Toast 队列系统位于 `src/lib/toast/toastQueue.ts`，只提供 `enqueue()` 和 `markReady()` 方法
- 项目中混用两种 API：
  - `import { toast } from 'sonner'` + `toast.success()` 等（约 8 处）
  - `toastQueue.enqueue({ type, message })`（主要用于初始化场景）

**问题**：
1. 移动端（≤767px）Toast 默认显示在右上角，会折叠页面内容
2. 没有统一的 Toast API，无法在全局层面控制移动端适配
3. 单个 Toast 调用可以传入 `position` 选项覆盖全局配置，导致移动端位置不一致
4. 外部调用者需要判断时机（初始化阶段用 `enqueue()`，初始化后用 `success()` 等）

**约束**：
- 不引入新的依赖，利用现有的 sonner 和 React Hooks
- 性能开销可忽略（响应式检测）
- 现有代码没有使用 `enqueue()` 的返回值

**利益相关者**：
- 移动端用户：获得更好的 Toast 体验
- 开发者：统一的 API，更易维护
- 代码库：更清晰的架构

## Goals / Non-Goals

**Goals:**
1. ✅ 移动端 Toast 显示在屏幕中上部（`top-center`），桌面端显示在右下角（`bottom-right`）
2. ✅ 支持手势关闭：移动端左右滑动，桌面端右滑
3. ✅ 提供统一的 Promise-based Toast API（`await toastQueue.success()` 等）
4. ✅ 自动移除 `position` 选项，防止覆盖全局配置
5. ✅ 自动队列管理：外部无需判断时机，系统自动处理

**Non-Goals:**
- ❌ 不修改 Toast 的视觉样式（颜色、阴影等）
- ❌ 不添加新的 Toast 类型（自定义组件等）
- ❌ 不改变 Toast 的显示时长和消失逻辑
- ❌ 不保留 `enqueue()` API（统一使用 Promise-based API）
- ❌ 不导出 `QueuedToast` 类型（内部实现细节）

## Decisions

### 决策 1：利用 toastQueue 单例管理移动端状态

**选择**：在 `ToastQueue` 类中添加 `isMobile` 状态（初始值 `undefined`）和 `setIsMobile()` 方法，通过 `ToasterWrapper` 组件直接调用 `useResponsive()` hook 同步状态。

**理由**：
- ✅ `toastQueue` 已经是全局单例，无需创建新的状态管理机制
- ✅ 队列系统需要知道移动端状态，以便应用响应式位置配置
- ✅ 避免 Context 或全局变量的复杂性
- ✅ 使用 `undefined` 作为初始状态，可以区分"未初始化"和"已初始化"

**状态初始化策略（延迟就绪）**：
- `isMobile` 初始值为 `undefined`（未初始化状态）
- `ToasterWrapper` 调用 `useResponsive()` hook 同步状态到 `toastQueue`
- `ToasterWrapper` 等待 `isMobile` 确定（`true` 或 `false`）后才调用 `markReady()`
- 确保 `flush()` 执行时 `isMobile` 已初始化，队列中的消息使用正确的响应式位置
- `getIsMobile()` 方法返回 `boolean` 类型：
  - 如果未初始化，返回 `false`（桌面端保守策略）
  - 如果已初始化，返回实际值

**架构简化**：
- ❌ 不创建单独的 `useToastQueue` hook
- ✅ `ToasterWrapper` 直接实现响应式同步逻辑
- ✅ 减少一层抽象，代码更直观

**替代方案**：
- **方案 A**：创建全局的 `ResponsiveDetector` 单例
  - ❌ 增加一个新的单例，与 `toastQueue` 功能重叠
- **方案 B**：使用 React Context + Provider
  - ❌ 需要在 App 根组件添加 Provider，增加复杂度
  - ❌ Redux middleware 中无法访问 Context
- **方案 C**：创建 `useToastQueue` hook
  - ❌ 增加不必要的抽象层，只有 `ToasterWrapper` 使用
  - ❌ 职责重复，`ToasterWrapper` 最终还是需要直接处理就绪逻辑
- **方案 D**：在每次 toast 调用时检测窗口大小
  - ❌ 重复检测，性能浪费
  - ❌ 可能在一次 toast 会话中窗口大小改变，导致状态不一致

**最终选择**：`ToasterWrapper` 直接调用 `useResponsive()` 同步状态，并实现延迟就绪策略。

---

### 决策 2：Promise-based API + 自动队列管理

**选择**：所有公共方法返回 `Promise<T>`，内部自动判断是立即显示还是加入队列，外部统一调用 `toastQueue.success()` 等方法。

**理由**：
- ✅ API 统一：外部无需判断时机，任何时候都调用相同的方法
- ✅ 自动队列：内部自动处理初始化阶段的队列
- ✅ 返回 toast ID：`loading()` 方法可以通过 await 获取 toast ID，用于后续 dismiss
- ✅ 符合 sonner 风格：方法签名与 sonner 一致（除了返回 Promise）
- ✅ 类型安全：完整的 TypeScript 类型支持
- ✅ 简化实现：移除 `enqueue()` 和 `show()` 方法，代码更简洁

**API 设计**：
```typescript
// 所有方法返回 Promise
success(message, options?): Promise<string | number>
error(message, options?): Promise<string | number>
warning(message, options?): Promise<string | number>
info(message, options?): Promise<string | number>
loading(message, options?): Promise<string | number>

// 特殊方法不返回 Promise（不加入队列）
dismiss(id?): void
promise(promise, options): void
```

**使用方式对比**：
```typescript
// ❌ 旧设计：外部需要判断时机
if (isToasterReady) {
  toast.success('成功');
} else {
  toastQueue.enqueue({ type: 'success', message: '成功' });
}

// ✅ 新设计：统一 API，自动处理队列
await toastQueue.success('成功');
```

**队列存储"执行动作"而非"消息数据"**：
```typescript
interface QueuedToastAction {
  execute: () => void;
}

// 内部实现
private enqueueOrShow<T>(action: () => T): Promise<T> {
  return new Promise((resolve) => {
    const wrappedAction = () => {
      try {
        const result = action();
        resolve(result);
      } catch (error) {
        console.error('Toast error:', error);
        resolve(undefined as T);  // 避免 await 永久挂起
      }
    };

    if (this.toastReady) {
      wrappedAction();  // 立即执行
    } else {
      this.queue.push({ execute: wrappedAction });  // 加入队列
    }
  });
}
```

**替代方案**：
- **方案 A**：保留 `enqueue()` API
  - ❌ API 冗余，两套方式增加复杂度
  - ❌ 外部仍需判断时机
- **方案 B**：同步返回值（不使用 Promise）
  - ❌ 无法获取 toast ID（加入队列时没有 ID）
  - ❌ 无法知道 toast 何时真正显示

**最终选择**：Promise-based API + 自动队列管理。

---

### 决策 3：异步错误处理策略

**选择**：捕获 Toast 执行过程中的错误，避免 Promise 永久 pending。

**理由**：
- ✅ 避免 await 永久挂起：即使 toast 执行失败，Promise 也会 resolve
- ✅ 错误记录：将错误记录到控制台，便于调试
- ✅ 非阻塞：外部 await 不会永久等待

**错误处理实现**：
```typescript
private enqueueOrShow<T>(action: () => T): Promise<T> {
  return new Promise((resolve) => {
    const wrappedAction = () => {
      try {
        const result = action();
        resolve(result);
      } catch (error) {
        console.error('Toast execution error:', error);
        resolve(undefined as T);  // resolve 而不是 reject
      }
    };
    // ...
  });
}
```

**使用场景**：
```typescript
// 场景 1：使用 await（推荐）
try {
  const id = await toastQueue.loading('加载中...');
  // 处理成功
} catch (error) {
  // 不会进入这里，因为 Promise 总是 resolve
}

// 场景 2：不使用 await
toastQueue.success('成功');  // Toast 仍会显示
```

**替代方案**：
- **方案 A**：Promise reject 错误
  - ❌ 外部必须使用 try-catch，否则未处理的 reject 会警告
  - ❌ 增加 API 使用复杂度

**最终选择**：resolve(undefined) + console.error。

---

### 决策 4：智能 Position 处理

**选择**：在 `toastQueue` 的每个方法中调用 `ensureResponsivePosition()`，根据 `isMobile` 状态动态设置 `position`。

**规则**：
- **移动端**：强制使用 `top-center`（即使用户传入 `position` 也忽略）
- **桌面端**：保留用户传入的 `position`，未传入时使用默认值 `bottom-right`

**理由**：
- ✅ 移动端强制响应式，保证体验一致性（避免用户自定义位置导致内容被遮挡）
- ✅ 桌面端允许自定义，满足不同业务场景需求（如左下角显示通知）
- ✅ 位置逻辑集中在 `toastQueue`，而不是分散在 `sonner.tsx` 和业务代码中
- ✅ 保留 `rawToast` 供特殊场景（需要在移动端也自定义位置）

**替代方案**：
- **方案 A**：在 `sonner.tsx` 中使用响应式配置，移除单个 toast 的 position
  - ❌ 桌面端无法自定义位置，限制了灵活性
  - ❌ 响应式配置在 React 组件中，无法在队列阶段使用
- **方案 B**：完全移除 position 选项，强制全局配置
  - ❌ 无法满足桌面端自定义位置的业务需求
  - ❌ 失去了 `rawToast` 的意义
- **方案 C**：移动端和桌面端都强制使用响应式位置
  - ❌ 桌面端场景多样，不应强制限制

**最终选择**：移动端强制响应式，桌面端允许自定义，`rawToast` 完全自由控制。

---

### 决策 5：响应式配置的位置（已调整）

**选择**：在 `toastQueue` 中通过 `ensureResponsivePosition()` 方法动态设置 `position`，`sonner.tsx` 保持为纯 UI 组件，只提供默认配置。

**理由**：
- ✅ `toastQueue` 可以在队列阶段就知道移动端状态，从而设置正确的 position
- ✅ `sonner.tsx` 简化为纯 UI 组件，职责单一（渲染 Toaster）
- ✅ 桌面端允许自定义 position，满足不同业务场景
- ✅ 移动端强制响应式，保证体验一致性

**配置分层**：
1. **`sonner.tsx`**：提供默认配置（`position="bottom-right"`, `swipeDirections={["right"]}`, `offset={{ bottom: 24, right: 24 }}`）
2. **`toastQueue.ensureResponsivePosition()`**：
   - 移动端：覆盖为 `top-center`（优先级最高）
   - 桌面端：使用用户传入的 position，未传入时使用默认值

**替代方案**：
- **方案 A**：在 `sonner.tsx` 中使用响应式配置（旧方案）
  - ❌ 桌面端无法自定义 position，限制了灵活性
  - ❌ 响应式配置与 position 优先级冲突
- **方案 B**：完全由 `toastQueue` 管理，`sonner.tsx` 不设置 position
  - ❌ `sonner.tsx` 的默认配置不明确，代码可读性降低
  - ❌ 如果 `toastQueue` 逻辑出错，完全没有后备方案

**最终选择**：`toastQueue` 动态设置 position，`sonner.tsx` 提供桌面端默认配置。

---

### 决策 6：是否创建 responsiveDetector 单例

**选择**：不创建 `responsiveDetector.ts`，直接使用 `useResponsive()` hook。

**理由**：
- ✅ `useResponsive()` 已经存在，功能完善
- ✅ `toastQueue` 通过 `useToastQueue` hook 获取状态，不需要额外的检测器
- ✅ 减少文件数量，降低复杂度

**替代方案**：
- **方案 A**：创建 `responsiveDetector.ts` 全局单例
  - ❌ 与 `useResponsive()` 功能重复
  - ❌ 需要手动监听 `resize` 事件，增加维护成本

**最终选择**：复用现有的 `useResponsive()` hook。

---

### 决策 7：ToasterWrapper 的职责

**选择**：在 `ToasterWrapper` 中调用 `useToastQueue()` hook，确保状态同步。

**理由**：
- ✅ `ToasterWrapper` 已经是 React 组件，可以调用 hooks
- ✅ 组件一挂载就同步状态，确保 `toastQueue` 在使用前已更新
- ✅ 无需修改 `main.tsx` 的结构

**替代方案**：
- **方案 A**：在 `main.tsx` 中创建 `AppWrapper` 组件调用 `useToastQueue()`
  - ❌ 需要修改 `main.tsx` 的结构
  - ❌ 增加组件层级
- **方案 B**：在 `sonner.tsx` 中调用 `useToastQueue()`
  - ❌ `sonner.tsx` 的职责是配置 `<Sonner>`，不应负责状态同步
  - ❌ 职责混乱

**最终选择**：在 `ToasterWrapper` 中调用 `useToastQueue()`。

---

### 决策 8：dismiss 和 promise 不加入队列

**选择**：`dismiss()` 和 `promise()` 方法立即执行，不加入队列。

**理由**：
- ✅ `dismiss()` 需要立即生效，即使 Toaster 未就绪
- ✅ `promise()` 需要立即绑定 Promise 结果，加入队列没有意义
- ✅ 简化实现：这两个方法不需要返回 Promise

**API 设计**：
```typescript
// 不加入队列，同步执行
dismiss(id?: string | number): void
promise<T>(promise: Promise<T>, options: {...}): void
```

## Risks / Trade-offs

### 风险 1：导入替换工作量大

**风险**：约 8 个文件需要将 `import { toast } from 'sonner'` 替换为 `import { toastQueue } from '@/lib/toast'`，可能出现遗漏。

**缓解措施**：
- ✅ 使用 grep 批量查找所有使用 `toast.` 的文件
- ✅ 创建测试用例验证 toast 功能
- ✅ 在 Code Review 中重点检查 import 语句

### 风险 2：开发者误用 rawToast

**风险**：开发者可能在移动端场景使用 `rawToast` 并传入 `position`，导致位置不一致。

**缓解措施**：
- ✅ 在 `index.ts` 中添加详细注释，明确 `rawToast` 的使用场景和禁止使用场景
- ✅ 在 spec 文档中列举 `rawToast` 的使用场景（见 specs/mobile-toast/spec.md）
- ✅ 代码审查时重点关注 `rawToast` 的使用
- ✅ 使用类型标记增加 `rawToast` 的使用成本（可选）

**rawToast 的使用场景**：
- ✅ 需要在特定位置显示 Toast（如底部通知、中心弹窗）
- ✅ 需要动态位置（根据业务逻辑决定位置）
- ✅ 需要在移动端也自定义位置（完全自由控制）
- ✅ 需要测试 Toast 的不同位置效果

**禁止使用场景**：
- ❌ 普通的成功/失败提示（应使用 `toastQueue`）
- ❌ 需要响应式位置的 Toast（应使用 `toastQueue`，系统自动适配移动端/桌面端）
- ❌ 移动端的标准业务提示（应使用 `toastQueue`，位置由系统自动管理为 `top-center`）

### 风险 3：性能影响

**风险**：`useResponsive()` 使用 `useMediaQuery` hook，可能在每次渲染时重新计算。

**缓解措施**：
- ✅ `useMediaQuery` 使用事件监听，仅在窗口大小变化时更新，性能开销可忽略
- ✅ Toast 数量不变，无额外内存开销
- ✅ 无网络请求，无依赖增加

### 风险 4：早期 Toast 调用的位置不准确

**风险**：在 `ToasterWrapper` 挂载前（如初始化阶段）调用的 toast，`isMobile` 状态为 `undefined`，可能使用不正确的位置。

**缓解措施**：
- ✅ `isMobile` 使用 `undefined` 作为初始状态，明确区分"未初始化"和"已初始化"
- ✅ `getIsMobile()` 方法在未初始化时返回 `false`（桌面端，保守策略）
- ✅ 在文档中说明：早期 toast 调用会使用桌面端位置，但影响很小（通常初始化阶段很快完成）
- ✅ 如果未来确实需要在初始化阶段就使用正确位置，可以在 `toastQueue` 中添加 `window.matchMedia` 检测作为后备方案

### 风险 5：Promise 返回值的接受度

**风险**：将所有方法改为返回 Promise，可能需要开发者适应新的调用方式。

**缓解措施**：
- ✅ 现有代码不使用返回值，改为 Promise 不会有破坏性影响
- ✅ 提供两种使用方式：`await toastQueue.success()` 或 `toastQueue.success()`
- ✅ Promise 是现代 JavaScript 的标准模式，开发者熟悉

## Migration Plan

### 阶段 1：核心重构（1 个文件）
1. 重构 `src/lib/toast/toastQueue.ts`：
   - 添加 `isMobile: boolean | undefined` 状态（初始值 `undefined`）
   - 添加 `setIsMobile(isMobile: boolean)` 和 `getIsMobile(): boolean` 方法
   - 添加 `QueuedToastAction` 接口（移除 `QueuedToast`）
   - 添加 `enqueueOrShow()` 私有方法
   - 添加 `success()`, `error()`, `warning()`, `info()`, `loading()`, `dismiss()`, `promise()` 方法（返回 Promise）
   - 实现 `sanitizeOptions()` 方法：仅移除顶层的 `position` 属性
   - 实现 `flush()` 方法：async，每个 Toast 间隔 500ms
   - 移除 `enqueue()` 公共方法
   - 移除 `show()` 私有方法
   - 导出 `toastQueue` 单例和 `rawToast`（原始 sonner API）

### 阶段 2：新建文件（2 个文件）
1. 创建 `src/lib/toast/useToastQueue.ts`：
   - 实现 `useToastQueue` hook，同步 `isMobile` 状态到 `toastQueue`
2. 创建 `src/lib/toast/index.ts`：
   - 导出 `toastQueue`, `rawToast`, `useToastQueue`
   - 移除 `QueuedToast` 类型导出

### 阶段 3：响应式配置（1 个文件）
1. 修改 `src/lib/toast/toastQueue.ts`：
    - 将 `sanitizeOptions()` 方法重构为 `ensureResponsivePosition()`
    - 移动端：强制覆盖为 `top-center`（即使用户传入也忽略）
    - 桌面端：保留用户传入的 `position`，未传入时使用 `bottom-right`
2. 修改 `src/components/ui/sonner.tsx`：
    - 移除 `useResponsive` 导入和 `isMobile` 状态
    - 移除响应式配置（`position`, `swipeDirections`, `mobileOffset`, `offset`）
    - 设置静态默认值：`position="bottom-right"`, `swipeDirections={["right"]}`, `offset={{ bottom: 24, right: 24 }}`
    - 保留主题配置（`theme`）和样式配置（`className`, `toastOptions.classNames`）

### 阶段 4：Import 替换（10 个文件）
1. 批量替换以下文件的 import：
   - `src/store/middleware/appConfigMiddleware.ts`
   - `src/store/keyring/masterKey.ts`
   - `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx`
   - `src/pages/Chat/components/ChatContent/components/ModelSelect.tsx`
   - `src/pages/Model/ModelTable/index.tsx`
   - `src/pages/Model/ModelTable/components/EditModelModal.tsx`
   - `src/pages/Model/CreateModel/index.tsx`
   - `src/pages/Setting/components/GeneralSetting/components/LanguageSetting.tsx`
   - `src/main.tsx`
   - `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting.tsx`

2. 将所有 `toast.xxx()` 调用改为 `toastQueue.xxx()`

### 阶段 5：测试文件更新（3 个文件）
1. 更新测试文件的 mock：
   - `src/__test__/store/middleware/appConfigMiddleware.test.ts`
   - `src/__test__/pages/Chat/components/ChatSidebar/components/ChatButton.test.tsx`
   - `src/__test__/components/ModelSelect.test.tsx`

2. Mock 返回 Promise：
   ```typescript
   vi.mock('@/lib/toast', () => ({
     toastQueue: {
       loading: vi.fn(async () => 'loading-toast-id'),
       success: vi.fn(async () => 'toast-id'),
       error: vi.fn(async () => 'toast-id'),
       // ...
     },
   }));
   ```

### 阶段 6：测试验证
1. 启动开发服务器，测试移动端和桌面端显示
2. 测试手势关闭功能
3. 测试多个 toast 堆叠展示
4. 测试响应式切换（窗口缩放）
5. 运行测试用例，确保没有破坏现有功能

### 回滚策略
- ✅ 使用 Git 版本控制，可以随时回滚
- ✅ 修改集中在 Toast 模块，不影响其他功能
- ✅ 如果出现严重问题，可以快速恢复到上一个版本

## Open Questions

**问题 1**：`mobileOffset` 和 `offset` 的具体像素值应该设置为多少？

**答案**：
- 桌面端：`offset={{ bottom: 24, right: 24 }}`（24px 底部和右侧间距）
- 移动端：通过 `toastQueue` 动态设置 position，不需要在 `sonner.tsx` 中设置 `mobileOffset`

**理由**：移动端的 position 由 `toastQueue` 动态设置为 `top-center`，sonner 会自动使用合适的默认间距。

**问题 2**：是否需要在暗色模式下调整 Toast 样式？

**答案**：不需要。sonner 的 `theme` prop 已经支持自动切换，现有的 `className` 配置已经适配暗色模式。

**问题 3**：如果未来需要支持更多的响应式断点（如平板），如何扩展？

**答案**：
- 当前使用 `useResponsive()` 的 `isMobile`（≤767px）
- 如果需要平板支持，可以在 `toastQueue` 中使用 `layoutMode` 而不是 `isMobile`
- `layoutMode` 有 4 个值：`mobile`, `compact`, `compressed`, `desktop`
- 可以为不同模式设置不同的 position 逻辑（如平板使用 `top-right`）

**问题 4**：是否需要添加 Toast 的动画效果？

**答案**：不需要。sonner 默认的动画效果已经很好，且用户明确要求"采用默认的动画效果"。

**问题 5**：`flush()` 执行期间的新消息如何处理？

**答案**：
- `flush()` 会复制队列并清空原队列，然后按顺序执行
- 执行期间的新消息会因为 `toastReady === true` 而立即显示（不加入队列）
- 这种设计确保队列中的 toast 按顺序显示，而新消息可以立即响应

**问题 6**：桌面端用户传入的 position 会被 `sonner.tsx` 的默认配置覆盖吗？

**答案**：不会。Sonner 的优先级是：单个 toast 调用的 position > `<Sonner>` 组件的 position prop。因此：
- 移动端：`toastQueue` 强制设置 `top-center`，覆盖用户传入的值
- 桌面端：`toastQueue` 保留用户传入的 position，未传入时才使用默认值 `bottom-right`
- `sonner.tsx` 的 `position="bottom-right"` 只是桌面端的默认值，会被单个 toast 的 position 覆盖

**问题 6**：是否需要 `loading()` 返回 Promise？

**答案**：需要。这是新设计的核心优势：
- 可以通过 `await` 获取 toast ID
- 用于后续的 `dismiss(loadingId)`
- 其他方法也返回 Promise 以保持 API 一致性
