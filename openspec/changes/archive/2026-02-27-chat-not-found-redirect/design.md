## Context

**当前状态**:
- 应用使用 React Router v6 进行路由管理
- 聊天列表存储在 Redux state 中（`chatSlice`）
- URL 查询参数中的 `chatId` 用于标识当前选中的聊天
- 现有的 `chat-deletion-url-sync` 规范处理了删除聊天时清除 URL 的逻辑
- 当用户通过 URL `/chat?chatId=xxx` 访问应用时，系统会尝试加载对应的聊天数据

**问题**:
- 如果 `chatId` 对应的聊天已被删除或从未存在，应用会尝试加载不存在的数据
- 这可能导致错误状态、空白页面或未定义的行为
- 用户看到的不是正常的聊天界面，而是一个无效状态

**约束**:
- 不能破坏现有的聊天删除 URL 同步机制
- 不能影响正常聊天加载流程的性能
- 需要兼容 Tauri 和 Web 两种运行环境
- 必须处理聊天列表异步加载的时序问题

## Goals / Non-Goals

**Goals:**
- 在用户访问不存在的聊天时自动重定向到 `/chat` 页面
- 确保重定向逻辑不影响正常聊天加载的性能和体验
- 提供清晰、可维护的实现方案
- 与现有的路由和状态管理架构无缝集成

**Non-Goals:**
- 不修改现有的聊天删除 URL 同步逻辑
- 不改变聊天列表的数据结构或存储方式
- 不引入新的外部依赖或库
- 不修改全局错误处理机制（仅在特定场景下处理）

## Decisions

### 决策 1: 在 Chat 组件层实现检查逻辑

**选择**: 在 `Chat` 组件中使用 `useEffect` hook 检查聊天存在性

**原因**:
- Chat 组件可以访问 Redux state（聊天列表）和 navigation API
- 可以处理聊天列表异步加载的时序问题
- 不需要修改路由配置或添加路由守卫
- 符合 React 的数据流和生命周期模式

**替代方案**:
- **方案 A**: 在路由守卫（loader）中检查
  - 缺点: 需要访问 Redux state，增加了复杂度
  - 缺点: 需要修改路由配置
- **方案 B**: 在 Redux slice 中检查
  - 缺点: Redux 不应包含导航逻辑
  - 缺点: 违反了单一职责原则

### 决策 2: 基于 Redux state 进行本地检查

**选择**: 在 Redux state 的聊天列表中查找 `chatId`，不发起额外的 API 请求

**原因**:
- 聊天列表已经在应用启动时加载到 Redux state
- 避免额外的网络请求，提升性能
- 减少服务器负载
- 逻辑简单，易于维护

**替代方案**:
- **方案 A**: 发起 API 请求检查聊天是否存在
  - 缺点: 增加网络延迟
  - 缺点: 服务器负载增加
  - 优点: 可以检测到刚删除的聊天（如果本地 state 未更新）

**边缘情况处理**:
- 如果聊天列表尚未加载完成（loading 状态），则等待加载完成后再检查
- 如果聊天列表加载失败，则不执行重定向（避免错误状态下的重定向）

### 决策 3: 使用统一的 `useNavigateToChat` 钩子进行重定向

**选择**: 使用项目统一的 `useNavigateToChat` 钩子中的 `navigateToChatWithoutParams` 方法

**原因**:
- 保持项目导航逻辑的一致性
- 该钩子已封装了 React Router 的 `useNavigate`，提供统一的导航接口
- 支持完整的 `NavigateOptions` 类型（包括 `replace`、`state` 等选项）
- 便于未来维护和扩展

**实现细节**:
```typescript
import { useNavigateToChat } from '@/hooks/useNavigateToPage';

const { navigateToChatWithoutParams } = useNavigateToChat();

// 当检测到 chatId 不存在时
navigateToChatWithoutParams({ replace: true });
```

**技术改进**:
- 扩展了 `useNavigateToChat` 钩子，使其支持完整的 `NavigateOptions` 类型
- `navigateToChat({ chatId, ...options })` - 导航到指定聊天
- `navigateToChatWithoutParams(options)` - 导航到默认聊天页面
- 两个方法都支持所有 React Router 导航选项（`replace`、`state` 等）

### 决策 4: 添加防重定向循环机制

**选择**: 使用组件内部状态标记是否已执行重定向

**原因**:
- 避免在重定向后再次触发重定向（导致无限循环）
- 确保每次访问无效 URL 时只重定向一次

**实现细节**:
```typescript
const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);

useEffect(() => {
  if (hasCheckedRedirect) return;

  // 检查逻辑...
  if (shouldRedirect) {
    navigate('/chat', { replace: true });
    setHasCheckedRedirect(true);
  }
}, [dependencies]);
```

### 决策 5: 不显示任何通知或 Toast

**选择**: 静默重定向，不显示任何提示信息

**原因**:
- 用户可能不知道原始 URL（例如从书签或分享链接访问）
- 显示错误提示会造成混淆和负面体验
- 自动重定向到正常页面已经提供了足够好的用户体验
- 符合现代 Web 应用的标准行为（例如 404 页面自动跳转）

**替代方案**:
- **方案 A**: 显示 Toast 提示"聊天不存在，已跳转到默认页面"
  - 缺点: 可能造成用户困惑
  - 缺点: 增加了 UI 复杂度

## Architecture

### 数据流

```
用户访问 /chat?chatId=xxx
    ↓
Chat 组件渲染
    ↓
useEffect 检测 URL chatId 参数
    ↓
从 Redux state 获取聊天列表
    ↓
检查 chatId 是否在聊天列表中
    ↓
┌─────────────┬─────────────┐
│  存在       │  不存在      │
│  ↓          │  ↓          │
│ 正常加载    │ navigate('/chat') │
│ 聊天数据    │ { replace: true } │
└─────────────┴─────────────┘
```

### 代码结构

```
src/
├── components/
│   └── Chat/
│       ├── Chat.tsx           # 添加重定向逻辑
│       └── Chat.test.tsx      # 添加测试用例
├── store/
│   └── slices/
│       └── chatSlice.ts       # 可能需要添加选择器
└── utils/
    └── navigation.ts          # 新增：导航辅助函数（可选）
```

## Risks / Trade-offs

### 风险 1: 聊天列表加载延迟导致误判

**场景**: 用户访问 `/chat?chatId=xxx`，但聊天列表尚未从服务器加载完成，系统误判聊天不存在并重定向。

**缓解措施**:
- 在聊天列表加载完成前（`loading: true`），不执行重定向检查
- 使用 `useEffect` 的依赖数组确保在聊天列表更新后重新检查

**风险级别**: 中

### 风险 2: 并发删除场景

**场景**: 用户 A 在设备 1 上删除聊天，用户 B 在设备 2 上通过书签访问该聊天 URL。由于设备 2 的聊天列表未更新，系统认为聊天存在并尝试加载，导致错误。

**缓解措施**:
- 如果加载聊天数据时 API 返回 404，则在 Chat 组件中捕获错误并重定向
- 这是额外的安全网，不属于主要实现

**风险级别**: 低（边缘场景）

### 权衡 1: 本地检查 vs API 检查

**本地检查（已选择）**:
- ✅ 性能好，无网络延迟
- ✅ 实现简单，易于维护
- ❌ 可能存在数据不一致（跨设备场景）

**API 检查（未选择）**:
- ✅ 数据始终准确
- ❌ 性能差，增加网络延迟
- ❌ 服务器负载增加

**结论**: 对于单设备应用场景，本地检查已足够。跨设备场景的边缘情况可以通过 API 错误处理作为安全网。

## Migration Plan

### 实施步骤

1. **步骤 1**: 在 `Chat.tsx` 中添加聊天存在性检查逻辑
   - 读取 URL 参数中的 `chatId`
   - 从 Redux state 获取聊天列表
   - 如果 `chatId` 不在聊天列表中，执行重定向

2. **步骤 2**: 添加防重定向循环机制
   - 使用 `useState` 跟踪是否已执行检查
   - 确保只在必要时执行一次重定向

3. **步骤 3**: 处理聊天列表加载状态
   - 在聊天列表加载完成前不执行检查
   - 使用依赖数组确保在列表更新后重新检查

4. **步骤 4**: 编写单元测试
   - 测试聊天不存在时的重定向逻辑
   - 测试聊天存在时正常加载流程
   - 测试防重定向循环机制

5. **步骤 5**: 手动测试和验证
   - 测试从书签访问已删除聊天的场景
   - 测试直接在地址栏输入无效 URL 的场景
   - 测试重定向后刷新页面的场景

### 回滚策略

如果实施后出现问题，可以通过以下方式回滚：
- 移除 `Chat.tsx` 中的重定向逻辑
- 恢复到原有的行为（显示错误状态或空白页面）
- 不影响其他功能，回滚风险低

## Open Questions

**问题 1**: 是否需要处理 `chatId` 格式无效的情况（例如非 UUID 格式）？

**讨论**: 如果 `chatId` 格式无效（例如 `chatId=invalid`），可以提前判断为不存在并重定向，避免在聊天列表中查找。

**待决策**: 需要确认 `chatId` 的格式规范（UUID v4？）。如果是，可以添加格式验证作为优化。

**问题 2**: 是否需要在 Redux 中添加 `hasRedirected` 全局状态？

**讨论**: 使用组件内部状态还是 Redux state 来跟踪是否已重定向。

**倾向**: 使用组件内部状态，因为这是组件级别的行为，不需要全局共享。

**问题 3**: 是否需要添加导航辅助函数 `navigateToChatWithoutParams()`？

**讨论**: 提取重定向逻辑为独立的辅助函数，提高复用性。

**待决策**: 需要评估其他组件是否需要类似的重定向逻辑。如果仅 Chat 组件使用，可以内联实现。
