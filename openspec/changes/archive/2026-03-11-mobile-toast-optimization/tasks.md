# Tasks: 移动端 Toast 优化

## 1. 核心重构

- [x] 1.1 重构 `src/lib/toast/toastQueue.ts`：添加 `isMobile: boolean | undefined` 状态（初始值 `undefined`）
- [x] 1.2 重构 `src/lib/toast/toastQueue.ts`：添加 `setIsMobile()` 和 `getIsMobile()` 方法
- [x] 1.3 重构 `src/lib/toast/toastQueue.ts`：添加 `QueuedToastAction` 接口，移除 `QueuedToast` 接口
- [x] 1.4 重构 `src/lib/toast/toastQueue.ts`：添加 `enqueueOrShow()` 私有方法，返回 `Promise<T>`
- [x] 1.5 重构 `src/lib/toast/toastQueue.ts`：添加 `success()`, `error()`, `warning()`, `info()` 方法，返回 `Promise<string | number>`
- [x] 1.6 重构 `src/lib/toast/toastQueue.ts`：添加 `loading()` 方法，返回 `Promise<string | number>`
- [x] 1.7 重构 `src/lib/toast/toastQueue.ts`：添加 `dismiss()` 和 `promise()` 方法（不返回 Promise，不加入队列）
- [x] 1.8 重构 `src/lib/toast/toastQueue.ts`：实现 `sanitizeOptions()` 方法（仅移除顶层的 `position` 属性）
- [x] 1.9 重构 `src/lib/toast/toastQueue.ts`：重构 `flush()` 方法为 async，每个 Toast 间隔 500ms
- [x] 1.10 重构 `src/lib/toast/toastQueue.ts`：移除 `enqueue()` 公共方法和 `show()` 私有方法
- [x] 1.11 重构 `src/lib/toast/toastQueue.ts`：导出 `toastQueue` 单例和 `rawToast`（原始 sonner API）
- [x] 1.12 重构 `src/lib/toast/toastQueue.ts`：添加所有方法的 JSDoc 注释，说明 Promise 返回值

## 2. 新建文件

- [x] 2.1 创建 `src/lib/toast/index.ts`：导出 `toastQueue` 和 `rawToast`（不导出 `QueuedToast`）

## 3. 响应式配置

- [x] 3.1 修改 `src/components/ui/sonner.tsx`：导入 `useResponsive` hook
- [x] 3.2 修改 `src/components/ui/sonner.tsx`：根据 `isMobile` 设置 `position`（移动端 `top-center`，桌面端 `bottom-right`）
- [x] 3.3 修改 `src/components/ui/sonner.tsx`：根据 `isMobile` 设置 `swipeDirections`（移动端 `["left", "right"]`，桌面端 `["right"]`）
- [x] 3.4 修改 `src/components/ui/sonner.tsx`：设置 `mobileOffset={{ top: 16 }}`
- [x] 3.5 修改 `src/components/ui/sonner.tsx`：设置 `offset={isMobile ? undefined : { top: 24, right: 24 }}`
- [x] 3.6 重构 `src/lib/toast/toastQueue.ts`：将 `sanitizeOptions()` 重构为 `ensureResponsivePosition()`
- [x] 3.7 重构 `src/lib/toast/toastQueue.ts`：实现移动端强制 `top-center`，桌面端保留用户传入的 position
- [x] 3.8 重构 `src/lib/toast/toastQueue.ts`：更新所有方法的注释，说明新的 position 处理逻辑
- [x] 3.9 简化 `src/components/ui/sonner.tsx`：移除 `useResponsive` 导入和响应式配置
- [x] 3.10 简化 `src/components/ui/sonner.tsx`：设置静态默认值 `position="bottom-right"`, `swipeDirections={["right"]}`, `offset={{ bottom: 24, right: 24 }}`
- [x] 3.11 更新 `src/lib/toast/index.ts`：更新 `toastQueue` 和 `rawToast` 的使用场景说明

## 4. 延迟就绪策略重构

- [x] 4.1 修改 `src/lib/toast/ToasterWrapper.tsx`：导入 `useResponsive` hook
- [x] 4.2 修改 `src/lib/toast/ToasterWrapper.tsx`：实现 `isReady` 状态管理（`useState(false)`）
- [x] 4.3 修改 `src/lib/toast/ToasterWrapper.tsx`：同步 `isMobile` 到 `toastQueue`，并确定 `isReady`
- [x] 4.4 修改 `src/lib/toast/ToasterWrapper.tsx`：只在 `isReady` 为 `true` 时调用 `markReady()`
- [x] 4.5 删除 `src/lib/toast/useToastQueue.ts`：不再需要独立的 hook
- [x] 4.6 更新 `src/lib/toast/index.ts`：移除 `useToastQueue` 导出

## 5. Import 替换 - Store 层

- [x] 4.1 修改 `src/store/middleware/appConfigMiddleware.ts`：`import { toast }` → `import { toastQueue }`
- [x] 4.2 修改 `src/store/middleware/appConfigMiddleware.ts`：所有 `toast.xxx()` 调用改为 `toastQueue.xxx()`
- [x] 4.3 修改 `src/store/keyring/masterKey.ts`：`import { toast }` → `import { toastQueue }`
- [x] 4.4 修改 `src/store/keyring/masterKey.ts`：所有 `toast.xxx()` 调用改为 `toastQueue.xxx()`

## 6. Import 替换 - Pages 层

- [x] 5.1 修改 `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx`：替换 import 和调用
- [x] 5.2 修改 `src/pages/Chat/components/ChatContent/components/ModelSelect.tsx`：替换 import 和调用
- [x] 5.3 修改 `src/pages/Model/ModelTable/index.tsx`：替换 import 和调用
- [x] 5.4 修改 `src/pages/Model/ModelTable/components/EditModelModal.tsx`：替换 import 和调用
- [x] 5.5 修改 `src/pages/Model/CreateModel/index.tsx`：替换 import 和调用
- [x] 5.6 修改 `src/pages/Setting/components/GeneralSetting/components/LanguageSetting.tsx`：替换 import 和调用

## 7. Import 替换 - 其他文件

- [x] 6.1 修改 `src/main.tsx`：`import { toast }` → `import { toastQueue }`
- [x] 6.2 修改 `src/main.tsx`：所有 `toast.xxx()` 调用改为 `toastQueue.xxx()`
- [x] 6.3 修改 `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting.tsx`：替换 import 和调用

## 8. 测试文件更新

- [x] 7.1 更新 `src/__test__/store/middleware/appConfigMiddleware.test.ts`：将 mock 的 `toast` 改为 `toastQueue`，返回 Promise
- [x] 7.2 更新 `src/__test__/pages/Chat/components/ChatSidebar/components/ChatButton.test.tsx`：将 mock 的 `toast` 改为 `toastQueue`，返回 Promise
- [x] 7.3 更新 `src/__test__/components/ModelSelect.test.tsx`：将 mock 的 `toast` 改为 `toastQueue`，返回 Promise
- [x] 7.4 检查其他测试文件是否有 `toast` mock 需要更新（使用 grep 搜索）

## 9. 测试验证

- [x] 8.1 启动开发服务器，验证应用正常启动
- [x] 8.2 测试移动端显示（窗口宽度 ≤ 767px）：Toast 显示在屏幕中上部（`top-center`）
- [x] 8.3 测试桌面端显示（窗口宽度 ≥ 768px）：Toast 显示在右下角（`bottom-right`）
- [x] 8.4 测试移动端手势关闭：左右滑动可以关闭 Toast
- [x] 8.5 测试桌面端手势关闭：右滑可以关闭 Toast
- [x] 8.6 测试多个 Toast 堆叠显示：多个 Toast 垂直堆叠，间距正确，间隔 500ms
- [x] 8.7 测试响应式切换：调整窗口大小，Toast 位置立即更新
- [x] 8.8 测试 `toastQueue.success()` 等新 API：所有方法正常工作
- [x] 8.9 测试 Promise 返回值：`await toastQueue.loading()` 可以获取 toast ID
- [x] 8.10 测试 toast ID 用于 dismiss：`const id = await toastQueue.loading(...); toastQueue.dismiss(id)`
- [x] 8.11 测试不使用 await：`toastQueue.success('消息')` 正常显示，Promise 被 ignored
- [x] 8.12 测试早期 Toast 调用（Toaster 挂载前）：加入队列，markReady 后显示，返回 ID
- [x] 8.13 测试移动端 position 强制覆盖：传入 `position: 'bottom-right'` 被强制覆盖为 `top-center`
- [x] 8.14 测试桌面端 position 自定义：传入 `position: 'top-left'` 生效，显示在左上角
- [x] 8.15 测试桌面端 position 默认值：不传入 position 时，使用 `bottom-right`
- [x] 8.16 测试 `rawToast` 导出：`rawToast.success('消息', { position: 'bottom-left' })` 可以完全自定义位置（包括移动端）
- [x] 8.15 测试队列延迟：多个早期 Toast 调用，markReady 后每个间隔 500ms 显示
- [x] 8.16 测试 dismiss 不加入队列：即使在 Toaster 未就绪时，dismiss 也立即执行
- [x] 8.17 测试 promise 不加入队列：即使在 Toaster 未就绪时，promise 也立即执行
- [x] 8.18 运行测试用例：`pnpm test`，确保没有破坏现有功能
- [x] 8.19 运行类型检查：`pnpm tsc`，确保 TypeScript 类型正确
- [x] 8.20 运行代码检查：`pnpm lint`，确保代码风格一致
- [x] 8.21 测试桌面端 Toast 位置：启动应用，触发 Toast，验证显示在右下角
- [x] 8.22 测试桌面端 Toast 偏移：验证 Toast 距离底部 24px、右侧 24px
- [x] 8.23 测试桌面端手势关闭：右滑可以关闭 Toast
- [x] 8.24 测试多个 Toast 堆叠：多个 Toast 在右下角垂直堆叠，间距正确
- [x] 8.25 测试响应式切换：从桌面端缩小到移动端，Toast 位置从右下角切换到中上部
- [x] 8.26 测试响应式切换：从移动端放大到桌面端，Toast 位置从中上部切换到右下角
- [x] 8.27 测试移动端位置不受影响：确认移动端仍然显示在中上部
- [x] 8.28 测试移动端手势不受影响：确认移动端仍然支持左右滑动关闭

## 10. 文档和清理

- [x] 9.1 在 `src/lib/toast/index.ts` 中添加详细注释，说明 `toastQueue` 和 `rawToast` 的使用场景
- [x] 9.2 在 `src/lib/toast/toastQueue.ts` 中添加 JSDoc 注释，说明所有方法的 Promise 返回值
- [x] 9.3 在 `src/lib/toast/toastQueue.ts` 中添加 `ensureResponsivePosition()` 的实现说明：移动端强制 top-center，桌面端支持自定义
- [x] 9.4 检查是否有遗漏的 `import { toast } from 'sonner'` 使用 grep 搜索
- [x] 9.5 更新方案文档 `proposal.md`、`design.md`、`tasks.md`，反映最新的实现方案

## 11. Toast 测试页面（开发环境）

### 10.1 创建测试页面组件

- [x] 10.1.1 创建 `src/pages/Setting/components/ToastTest/index.tsx` 组件
- [x] 10.1.2 添加生产环境保护：`if (import.meta.env.PROD) return null;`
- [x] 10.1.3 实现分组布局：使用 `useAdaptiveScrollbar` hook 和滚动容器
- [x] 10.1.4 实现 toastQueue 方法测试分组（5 个按钮：success, error, warning, info, loading）
- [x] 10.1.5 实现 rawToast 位置测试分组（6 个按钮：top/bottom × left/center/right）
- [x] 10.1.6 实现队列机制测试分组（3 个按钮：快速连续触发、dismiss 最新、dismiss 全部）
- [x] 10.1.7 实现 Promise 测试分组（3 个按钮：promise success、promise error、promise loading）

### 10.2 更新路由配置

- [x] 10.2.1 在 `src/router/index.tsx` 中添加 `ToastTest` 懒加载导入
- [x] 10.2.2 在 setting children 中添加 `toast-test` 路由配置

### 10.3 更新 SettingSidebar

- [x] 10.3.1 在 `src/pages/Setting/components/SettingSidebar.tsx` 的 `settingList` 中添加 Toast 测试按钮
- [x] 10.3.2 添加 `import.meta.env.DEV` 条件判断，确保按钮仅在开发环境显示

### 10.4 添加国际化文本

- [x] 10.4.1 在 `src/locales/zh/setting.json` 中添加 `toastTest: "Toast 测试"`
- [x] 10.4.2 在 `src/locales/en/setting.json` 中添加 `toastTest: "Toast Test"`

### 10.5 验证和测试

- [x] 10.5.1 运行 `pnpm tsc` 确保 TypeScript 编译通过
- [x] 10.5.2 运行 `pnpm lint` 确保代码规范检查通过
- [x] 10.5.3 启动 `pnpm tauri dev` 验证测试页面功能
- [x] 10.5.4 测试所有测试按钮是否正常工作
- [x] 10.5.5 验证生产环境构建不包含测试页面代码

