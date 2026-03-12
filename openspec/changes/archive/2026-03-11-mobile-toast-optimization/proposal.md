# Proposal: 移动端 Toast 优化

## Why

当前 Toast 系统存在三个关键问题：

1. **移动端体验问题**：Toast 提示显示在四个角落（默认右上角），在小屏幕设备上会折叠大量页面内容，影响用户操作
2. **API 不统一**：项目中混用 `import { toast } from 'sonner'` 和 `toastQueue.enqueue()`，导致代码风格不一致，且无法统一管理移动端适配逻辑
3. **外部调用复杂**：外部调用者需要判断时机（初始化阶段用 `enqueue()`，初始化后用 `success()` 等），增加使用复杂度

现在需要优化是因为移动端用户占比增加，且需要一个统一的、响应式的 Toast API 来保证跨设备的一致体验。

## What Changes

- **移动端位置调整**：Toast 在移动端（≤767px）显示在屏幕中上部（`top-center`），桌面端显示在右下角（`bottom-right`）
- **智能 Position 处理**：
  - 移动端：强制使用 `top-center`（即使用户传入 `position` 也忽略）
  - 桌面端：支持自定义 `position`，未传入时默认使用 `bottom-right`
- **手势支持**：移动端支持左右滑动关闭 Toast，桌面端支持右滑关闭
- **Promise-based API**：重构 `toastQueue` 类，所有方法返回 `Promise<T>`，自动处理队列
- **自动队列管理**：外部无需判断时机，系统自动判断是否立即显示或加入队列
- **响应式位置管理**：`toastQueue` 根据 `isMobile` 状态动态设置 `position`，而非依赖 `sonner.tsx` 的响应式配置
- **延迟就绪策略**：`ToasterWrapper` 等待 `isMobile` 初始化后再调用 `markReady()`，避免竞态条件
- **导出原始 API**：导出 `rawToast` 供特殊场景（需要完全控制 position）使用
- **开发测试页面**：在设置页面添加 Toast 测试面板（仅开发环境），提供完整的测试按钮集合

## Capabilities

### New Capabilities

- **`mobile-toast`**: 移动端 Toast 优化能力，涵盖响应式位置、手势关闭、间距配置
- **`toast-api`**: 统一的 Promise-based Toast API，提供与 sonner 兼容的方法（`success`, `error`, `warning`, `info`, `loading`, `dismiss`, `promise`）

### Modified Capabilities

无（Toast 系统之前没有正式的 spec 文档）

## Impact

### 受影响的代码文件

**核心重构**（1 个文件）：
- `src/lib/toast/toastQueue.ts` - 重构为 Promise-based API，移除 `enqueue()` 和 `show()` 方法

**新建文件**（1 个文件）：
- `src/lib/toast/index.ts` - 统一导出模块

**配置文件**（2 个文件）：
- `src/components/ui/sonner.tsx` - 简化为静态配置（`position="bottom-right"`, `swipeDirections={["right"]}`, `offset={{ bottom: 24, right: 24 }}`），移除响应式逻辑
- `src/lib/toast/ToasterWrapper.tsx` - 直接调用 `useResponsive()` hook，等待 `isMobile` 初始化后再调用 `markReady()`，避免竞态条件

**Import 替换**（10 个文件）：
- `src/store/middleware/appConfigMiddleware.ts` - `toast` → `toastQueue`
- `src/store/keyring/masterKey.ts` - `toast` → `toastQueue`
- `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx` - `toast` → `toastQueue`
- `src/pages/Chat/components/ChatContent/components/ModelSelect.tsx` - `toast` → `toastQueue`
- `src/pages/Model/ModelTable/index.tsx` - `toast` → `toastQueue`
- `src/pages/Model/ModelTable/components/EditModelModal.tsx` - `toast` → `toastQueue`
- `src/pages/Model/CreateModel/index.tsx` - `toast` → `toastQueue`
- `src/pages/Setting/components/GeneralSetting/components/LanguageSetting.tsx` - `toast` → `toastQueue`
- `src/main.tsx` - `toast` → `toastQueue`
- `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting.tsx` - `toast` → `toastQueue`

**测试文件更新**（3 个文件）：
- `src/__test__/store/middleware/appConfigMiddleware.test.ts` - mock 返回 Promise
- `src/__test__/pages/Chat/components/ChatSidebar/components/ChatButton.test.tsx` - mock 返回 Promise
- `src/__test__/components/ModelSelect.test.tsx` - mock 返回 Promise

**开发测试页面**（4 个文件）：
- `src/pages/Setting/components/ToastTest/index.tsx` - 新建测试页面组件（仅开发环境）
- `src/router/index.tsx` - 添加 `toast-test` 路由
- `src/pages/Setting/components/SettingSidebar.tsx` - 添加 Toast 测试按钮（仅开发环境）
- `src/locales/{zh,en}/setting.json` - 添加国际化文本

### API 变更

**之前**：
```typescript
// 方式 1：直接使用 sonner
import { toast } from 'sonner'
toast.success('成功')

// 方式 2：使用 toastQueue.enqueue（初始化阶段）
import { toastQueue } from '@/lib/toast/toastQueue'
toastQueue.enqueue({ type: 'success', message: '成功' })

// 问题：外部需要判断使用哪种方式
```

**之后**：
```typescript
// 统一 API，自动处理队列
import { toastQueue } from '@/lib/toast'

// 方式 1：不使用 await（大多数场景）
toastQueue.success('成功')

// 方式 2：使用 await（需要 toast ID）
const loadingId = await toastQueue.loading('加载中...')
// ... 后续操作
toastQueue.dismiss(loadingId)

// 特殊场景（需要自定义位置）
import { rawToast } from '@/lib/toast'
rawToast.success('成功', { position: 'bottom-left' })
```

### 关键改进

**改进 1：API 统一**
- ❌ 旧设计：外部需要判断 `isToasterReady` 来决定用 `enqueue()` 还是 `success()`
- ✅ 新设计：任何时候都调用 `toastQueue.success()`，系统自动处理

**改进 2：获取 Toast ID**
- ❌ 旧设计：`enqueue()` 不返回 toast ID
- ✅ 新设计：`await toastQueue.loading()` 返回 toast ID，用于后续 dismiss

**改进 3：简化导出**
- ❌ 旧设计：导出 `QueuedToast` 类型（内部实现细节）
- ✅ 新设计：不导出 `QueuedToast`，只导出必要的 API

**改进 4：智能 Position 处理**
- ❌ 旧设计：在 `sonner.tsx` 中使用响应式配置，单个 toast 调用时无法自定义位置
- ✅ 新设计：`toastQueue` 根据 `isMobile` 动态设置 position，移动端强制响应式，桌面端允许自定义

**改进 5：延迟就绪避免竞态条件**
- ❌ 旧设计：`markReady()` 在 `isMobile` 初始化前可能执行，导致早期 toast 使用错误的响应式位置
- ✅ 新设计：`ToasterWrapper` 等待 `isMobile` 确定后再调用 `markReady()`，确保队列刷新时状态正确

### 依赖关系

- ✅ sonner 2.0.7（已安装）- 原生支持 `position`, `swipeDirections`, `mobileOffset`
- ✅ useResponsive hook（已存在）- 检测移动端状态
- ✅ React 19（已安装）- 支持 Hooks 和 Promise

### 兼容性

- ✅ 不保留 `enqueue()` 方法，统一使用 Promise-based API
- ✅ 保留 `markReady()` 方法，用于触发队列刷新
- ✅ 类型安全：TypeScript 完整支持
- ⚠️  **BREAKING**：所有 `import { toast } from 'sonner'` 需要改为 `import { toastQueue } from '@/lib/toast'`（约 10 个文件）
- ⚠️  **BREAKING**：`toastQueue` 方法返回 `Promise<T>` 而不是同步返回值（但现有代码不使用返回值，无破坏性影响）

### 性能影响

- ✅ 响应式检测使用 `useMediaQuery` hook，性能开销可忽略
- ✅ Toast 数量不变，无额外内存开销
- ✅ Promise 创建开销可忽略（V8 引擎优化）
- ✅ 无网络请求，无依赖增加

### 开发测试页面

**目的**：为开发者提供一个便捷的测试界面，用于验证 Toast 系统的各种功能和边界情况。

**实现方案**：
- 在设置页面添加新的 Tab："Toast 测试"（仅开发环境显示）
- 提供分组测试按钮：
  - **toastQueue 方法测试**：success, error, warning, info, loading
  - **rawToast 位置测试**：6 个不同位置（top/bottom × left/center/right）
  - **队列机制测试**：快速连续触发、dismiss 单个/全部
  - **Promise 测试**：promise 方法的 success/error/loading 状态

**技术细节**：
- 使用 `import.meta.env.DEV` 确保只在开发环境渲染
- 使用 `import.meta.env.PROD` 在生产环境返回空组件
- 懒加载路由配置，避免生产环境打包测试页面代码
- 国际化支持（中文/英文）

**访问路径**：`/setting/toast-test`（开发环境）
