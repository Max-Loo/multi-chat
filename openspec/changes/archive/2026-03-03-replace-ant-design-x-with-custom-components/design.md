## Context

### 当前状态
项目使用 `@ant-design/x` 的两个组件：
- **Bubble**：聊天气泡组件，用于显示用户和 AI 消息
- **Think**：推理内容折叠组件，用于显示 AI 思考过程

这两个组件的使用位置：
- `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatBubble.tsx`

### 依赖问题
`@ant-design/x` 引入了 81MB 的依赖：
- `@ant-design/x`: 16MB
- `antd@6.1.0` (peer dependency): 65MB

项目已经有完整的 shadcn/ui + Radix UI 栈，完全具备实现相同功能的能力。

### 约束条件
- **保持功能不变**：用户不应感知到组件切换
- **样式一致性**：必须匹配现有 UI 设计
- **测试覆盖**：所有现有测试必须通过
- **零外部依赖**：不引入新的重量级库

## Goals / Non-Goals

**Goals:**
- 移除 81MB 不必要的依赖
- 使用 shadcn/ui + Radix UI 重新实现聊天气泡和推理内容组件
- 保持所有现有功能和行为不变
- 提升代码可维护性和可控性

**Non-Goals:**
- 不改变聊天功能的用户交互
- 不重构聊天数据流或状态管理
- 不优化性能（除了包体积减少）
- 不添加新功能或动画效果

## Decisions

### 1. 使用 shadcn/ui Card 组件作为气泡容器

**决策**：使用 `src/components/ui/card.tsx` 作为聊天气泡的基础容器。

**理由**：
- Card 组件已存在，无需额外依赖
- 支持 `variant` prop，可以实现 `variant="borderless"`（AI 消息样式）
- 通过 Tailwind CSS className 可以轻松实现左/右对齐

**替代方案**：
- **使用 div**：需要重复编写样式和类名
- **使用 antd Card**：引入了我们要移除的依赖

### 2. 使用 React useState 实现折叠功能

**决策**：不使用任何 UI 库的折叠组件，直接用 React state + 条件渲染。

**理由**：
- 逻辑简单：一个 boolean state 控制 show/hide
- 完全控制：可以添加自定义动画
- 无额外依赖：避免引入如 Radix UI Collapsible（虽然项目有 Radix，但不需要）

**实现**：
```typescript
const [expanded, setExpanded] = useState(initialState);
```

**后续扩展**：如果需要平滑动画，可以检查项目是否已有 Framer Motion，选择性集成。

### 3. Markdown 渲染保持不变

**决策**：继续使用现有的 `markdown-it` + `highlight.js` + `DOMPurify` 组合。

**理由**：
- 已在项目中使用，无需更改
- `DOMPurify` 提供 XSS 防护
- `highlight.js` 提供代码高亮
- 功能完整且稳定

**保留代码**：
```typescript
const generateCleanHtml = (dirtyMarkdown: string) => {
  const marked = markdownit({ /* config */ });
  return DOMPurify.sanitize(marked.render(dirtyMarkdown));
}
```

### 4. 组件拆分策略

**决策**：创建两个独立的组件文件，而不是在现有文件中直接修改。

**新组件**：
1. **`ChatBubble.tsx`**：聊天气泡组件
   - 位置：`src/components/chat/ChatBubble.tsx`
   - Props: `role`, `content`, `isRunning?`
   - 使用 Card 组件 + Flexbox 布局

2. **`ThinkingSection.tsx`**：推理内容折叠组件
   - 位置：`src/components/chat/ThinkingSection.tsx`
   - Props: `title`, `content`, `expanded`, `onExpand`, `loading?`
   - 使用 Card + Button + 条件渲染

**理由**：
- 关注点分离：气泡和折叠是两个独立的功能
- 可复用性：ThinkingSection 可能在其他地方使用
- 测试友好：每个组件可以独立测试

**替代方案**：
- **合并到现有 ChatBubble.tsx**：会增加文件复杂度（已有 118 行）
- **使用复合组件模式**：过度设计，当前需求简单

### 5. 保留现有 ChatBubble.tsx 的文件名

**决策**：保留现有文件路径和名称，只修改内部实现。

**理由**：
- 避免批量重命名导入
- 保持项目结构稳定
- 降低 merge 冲突风险

**实施**：
```typescript
// 文件：src/pages/Chat/.../ChatBubble.tsx
// 修改前：
import { Bubble, Think } from '@ant-design/x';

// 修改后：
import { ChatBubble as CustomChatBubble } from '@/components/chat/ChatBubble';
import { ThinkingSection } from '@/components/chat/ThinkingSection';
```

### 6. 不使用 TypeScript 接口继承

**决策**：创建独立的 Props 接口，不继承或扩展 @ant-design/x 的类型。

**理由**：
- 完全解耦：不依赖被移除库的类型
- 简洁清晰：只包含我们需要的属性
- 避免类型冲突

**实施**：
```typescript
// 新组件使用独立的接口定义
interface ChatBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoningContent?: string;
  isRunning?: boolean;
}
```

### 7. Props 范围决策

**决策**：只实现当前使用的 props，保持简洁。

**当前使用的 props**（从代码分析得出）：
- **Bubble**: `content`, `placement`, `variant`, `classNames`, `contentRender`
- **Think**: `title`, `expanded`, `onExpand`, `loading`

**不实现的 props**（未在项目中使用）：
- **Bubble**: `avatar`, `actions`, `timestamp`, `style`
- **Think**: `style`, `className`（除了通过 contentRender 传递的）

**理由**：
- YAGNI 原则（You Aren't Gonna Need It）
- 减少实现复杂度
- 后续需要时可以添加

**记录日期**: 2026-03-03

### 8. 折叠动画决策

**决策**：先实现无动画版本，后续可扩展。

**理由**：
- 降低复杂度
- 避免引入 Framer Motion（约 50KB）
- 优先保证功能正确性

**后续扩展条件**：
- 用户反馈需要动画
- 产品明确要求
- 性能测试显示无影响

**记录日期**: 2026-03-03

### 9. 推理内容默认展开状态

**决策**：保持当前行为 - 加载时展开，完成后自动折叠。

**当前行为**（从现有代码分析）：
```typescript
const [thinkingExpanded, setThinkingExpanded] = useState(isRunningBubble && true)

useEffect(() => {
  // 思考完毕以后，折叠思考内容
  if (content) {
    setThinkingExpanded(false)
  }
}, [content])
```

**理由**：
- 符合用户预期（正在生成时展示过程）
- 完成后节省空间
- 不改变现有交互模式

**记录日期**: 2026-03-03

### 10. 代码高亮主题

**决策**：先保持固定主题（atom-one-dark），后续评估需求。

**理由**：
- 当前项目主要使用暗色模式
- 避免引入额外的主题切换逻辑
- 减少实现复杂度

**后续扩展条件**：
- 用户反馈在亮色模式下看不清
- 产品明确要求支持亮色主题

**记录日期**: 2026-03-03

## Risks / Trade-offs

### 风险 1: 样式不一致

**风险描述**：自定义组件可能与原组件的视觉效果有细微差异。

**缓解措施**：

**步骤 1: 创建对比清单**
- [ ] 字体大小、行高、字重
- [ ] 内外边距（padding/margin）
- [ ] 圆角（border-radius）
- [ ] 阴影效果（box-shadow）
- [ ] 背景色和文字色
- [ ] 边框样式
- [ ] 响应式断点行为

**步骤 2: 视觉回归测试**
1. 使用原组件生成 10 个不同场景的截图
2. 使用新组件生成相同场景的截图
3. 使用浏览器 DevTools 对比样式
4. 人工审核关键差异

**步骤 3: 验收标准**
- [ ] 正常消息样式差异 < 2px
- [ ] 代码块高亮颜色一致
- [ ] 折叠功能流畅（如有动画）
- [ ] 暗色模式样式正确

**回滚触发条件**：
- 发现 3 个以上明显的样式问题
- 用户反馈"界面变丑了"

### 风险 2: 遗漏边缘情况

**风险描述**：可能遗漏原组件的某些边缘行为（如特殊字符处理、超长文本截断）。

**缓解措施**：
- 完整阅读现有测试文件
- 运行所有测试用例
- 进行手动回归测试
- 添加新测试用例覆盖发现的边缘情况

### 风险 3: 回滚困难

**风险描述**：如果新组件有问题，可能需要快速回滚。

**缓解措施**：
- 使用 Git 分支开发
- 保留完整的 commit 历史
- 创建详细的 rollback 计划（见下方）
- 在合并前进行完整测试

### 风险 4: 动画性能

**风险描述**：如果后续添加折叠动画，可能影响性能。

**缓解措施**：
- 优先使用 CSS transition（GPU 加速）
- 避免 JavaScript 动画
- 测试低端设备性能
- 提供禁用动画的选项（如 `prefers-reduced-motion`）

### 风险 5: 依赖清理破坏构建

**风险描述**：antd 可能被其他包间接依赖，直接移除可能导致构建失败。

**缓解措施**：
- 在移除前使用 `grep` 和 `pnpm why` 检查依赖关系
- 先在开发分支测试
- 准备好回滚方案
- 分阶段移除（先移除 @ant-design/x，验证后再清理）

## Migration Plan

### 阶段 1: 准备工作（不破坏现有功能）
1. 创建新目录：`src/components/chat/`
2. 实现 `ChatBubble.tsx`（不修改现有代码）
3. 实现 `ThinkingSection.tsx`
4. 编写单元测试

### 阶段 2: 集成（替换导入）
1. 修改现有 ChatBubble.tsx，替换 `@ant-design/x` 导入
2. 运行测试，验证功能不变
3. 手动测试聊天功能

### 阶段 3: 移除依赖
1. **前置检查**：
   - 运行 `grep -r "antd" src/` 确认无引用
   - 运行 `grep -r "@ant-design" src/` 确认无引用
   - 检查 pnpm lockfile，确认 antd 只被 @ant-design/x 引用
2. 从 package.json 移除 `@ant-design/x`
3. 运行 `pnpm install` 清理 node_modules
4. 验证构建成功
5. 检查打包体积减少

### 阶段 4: 清理
1. 移除未使用的导入
2. 更新文档（如有需要）
3. 合并到主分支

### 回滚策略

#### 场景 A：本地开发阶段（未合并）
**触发条件**：
- 构建失败
- 测试失败
- 功能异常

**回滚方式**：Git branch 切换
```bash
git checkout main
git branch -D remove-ant-design
```

**预计时间**：< 5 分钟

#### 场景 B：已合并但未发布
**触发条件**：
- 合并后发现严重问题
- 用户反馈核心功能受影响

**回滚方式**：git revert + 新 hotfix 分支
```bash
# 1. Revert 合并 commit
git revert <merge-commit-hash>

# 2. 创建 hotfix 分支
git checkout -b hotfix/restore-ant-design

# 3. 恢复 package.json 和相关文件
git checkout <commit-before-change> -- package.json
git checkout <commit-before-change> -- src/pages/Chat/.../ChatBubble.tsx

# 4. 删除新组件
rm -rf src/components/chat

# 5. 重新安装依赖
pnpm install

# 6. 测试验证
pnpm test:run
pnpm tauri dev

# 7. 提交 hotfix
git commit -m "hotfix: restore @ant-design/x due to issues"
```

**预计时间**：15-30 分钟

**风险**：
- 可能需要解决冲突（如果其他人基于此分支工作）

#### 场景 C：已发布到生产
**触发条件**：
- 生产环境出现严重问题
- 大量用户投诉
- 数据安全风险

**回滚方式**：紧急补丁发布
1. 按照"场景 B"的步骤修复代码
2. 创建新版本标签（如 0.2.1 → 0.2.2-hotfix）
3. 重新构建应用
4. 发布到应用商店/分发渠道
5. 通知用户更新

**预计时间**：1-2 小时（含测试和部署）

**影响**：
- 用户需要更新应用
- 可能影响用户体验

#### 回滚决策树
```
是否有用户反馈问题？
├─ 否 → 继续使用新版本，监控日志
└─ 是 → 问题是否影响核心功能？
    ├─ 是 → 问题严重程度？
    │   ├─ 高（数据丢失、安全风险）→ 立即回滚（场景 C）
    │   └─ 中（功能不可用）→ 快速回滚（场景 B）
    └─ 否 → 问题影响范围？
        ├─ 广泛（>50% 用户）→ 评估修复时间 vs 回滚成本
        └─ 局部（<10% 用户）→ 考虑 hotfix 而非回滚
```

## Open Questions（已解决）

### ✅ 1. 是否需要折叠动画？
**决策**：先实现无动画版本

**理由**：
- 降低复杂度
- 避免引入 Framer Motion（约 50KB）
- 优先保证功能正确性

**后续扩展条件**：
- 用户反馈需要动画
- 产品明确要求
- 性能测试显示无影响

**记录日期**: 2026-03-03

### ✅ 2. 是否需要保留原组件的所有 props？
**决策**：只实现当前使用的 props

**当前使用的 props**（从代码分析得出）：
- **Bubble**: `content`, `placement`, `variant`, `classNames`, `contentRender`
- **Think**: `title`, `expanded`, `onExpand`, `loading`

**不实现的 props**（未在项目中使用）：
- **Bubble**: `avatar`, `actions`, `timestamp`, `style`
- **Think**: `style`, `className`

**理由**：YAGNI 原则，保持简洁，后续需要可添加

**记录日期**: 2026-03-03

### ✅ 3. ThinkingSection 的默认展开状态？
**决策**：保持当前行为

**当前行为**：加载时展开，完成后自动折叠

**理由**：
- 符合用户预期
- 完成后节省空间
- 不改变现有交互

**记录日期**: 2026-03-03

### ✅ 4. 代码高亮主题是否可配置？
**决策**：先保持固定主题（atom-one-dark）

**理由**：
- 当前项目主要使用暗色模式
- 避免引入额外逻辑
- 减少实现复杂度

**后续扩展条件**：用户反馈在亮色模式下看不清

**记录日期**: 2026-03-03

## Implementation Notes

### 文件结构
```
src/
├── components/
│   ├── chat/                    # 新建
│   │   ├── ChatBubble.tsx       # 新建
│   │   └── ThinkingSection.tsx  # 新建
│   └── ui/
│       └── card.tsx             # 已存在，将被使用
├── __test__/
│   └── components/
│       └── chat/                # 新建（测试目录）
│           ├── ChatBubble.test.tsx       # 新建
│           └── ThinkingSection.test.tsx  # 新建
└── pages/
    └── Chat/
        └── .../
            └── ChatBubble.tsx   # 修改：替换导入
```

**测试文件结构说明**：
- 测试文件与源文件放在平行的目录结构中
- 源文件：`src/components/chat/Component.tsx`
- 测试文件：`src/__test__/components/chat/Component.test.tsx`
- 这种结构便于维护和查找

### 代码估算
- **ChatBubble.tsx**: ~80 行（包含类型定义和样式）
- **ThinkingSection.tsx**: ~60 行
- **ChatBubble.test.tsx**: ~150 行（新组件的单元测试）
- **ThinkingSection.test.tsx**: ~120 行（新组件的单元测试）
- **测试代码总计**: ~270 行
- **总代码量**: ~410 行（vs 原 118 行）

### 测试策略

**测试框架**: Vitest（项目已配置）
**测试工具库**: @testing-library/react（项目已安装）
**覆盖率目标**:
- 语句覆盖率：≥ 80%
- 分支覆盖率：≥ 70%

**测试分类**:

1. **单元测试**（新建组件）
   - `src/__test__/components/chat/ChatBubble.test.tsx`
   - `src/__test__/components/chat/ThinkingSection.test.tsx`
   - 重点：组件渲染、交互、props 传递、状态管理

2. **集成测试**（更新现有测试）
   - `src/__test__/components/ChatBubble.test.tsx`（页面组件测试）
   - 重点：验证新组件在页面中的正确使用

3. **手动回归测试**
   - 完整走查聊天功能
   - 测试各种边缘情况

**Mock 策略**:
- **react-i18next**: Mock `useTranslation` hook
- **markdown-it**: 可以 Mock 或使用真实实现（测试 XSS 防护时需要真实实现）
- **DOMPurify**: 可以 Mock 或使用真实实现（测试 XSS 防护时需要真实实现）
- **highlight.js**: 可以 Mock 或使用真实实现

**测试场景清单**:

ChatBubble 组件测试（11 个场景）:
- ✅ 用户消息右对齐显示
- ✅ AI 消息左对齐显示
- ✅ Markdown 内容正确渲染
- ✅ 代码块有语法高亮
- ✅ 空内容时组件正常工作
- ✅ isRunning 状态显示正确
- ✅ 特殊字符处理
- ✅ 超长文本截断
- ✅ XSS 防护
- ✅ 无障碍性（如有要求）
- ✅ 响应式布局

ThinkingSection 组件测试（9 个场景）:
- ✅ 默认展开状态正确
- ✅ 点击按钮切换折叠/展开
- ✅ 加载状态显示正确
- ✅ Markdown 内容在推理中正确渲染
- ✅ onExpand 回调函数正确触发
- ✅ 空推理内容不显示
- ✅ 标题正确显示
- ✅ 折叠状态持久化
- ✅ 动画流畅性（如有动画）

### 开发时间估算
- 实现组件：2-3 小时
- 编写测试：3-4 小时（增加了测试场景和 Mock 配置）
- 集成和调试：1-2 小时
- **总计**: 6-9 小时

### 性能基准测试数据（目标）
| 指标 | 移除前 | 移除后 | 改进 |
|------|--------|--------|------|
| node_modules 体积 | ~766MB | ~685MB | -81MB (-10.6%) |
| 构建产物体积 | 待测 | 待测 | 目标 -5MB |
| 应用启动时间 | 待测 | 待测 | 目标 -5% |
| Web 构建时间 | 待测 | 待测 | 目标 -10% |
