# 硬编码文本清单

> 生成时间: 2026-03-10
> 识别范围: `src/components/`, `src/pages/`, `src/hooks/`
> 排除范围: `src/__test__/`, 代码注释, 技术标识符, 控制台日志

## 概览

- **总文件数**: 82 个 TSX 文件
- **包含中文的文件**: 58 个
- **发现的硬编码文本实例**: ~15 处需要国际化
- **状态**: 大部分组件已使用 i18next，仅少数残留硬编码

## 硬编码文本详情

### 1. aria-label 属性 (8 处)

| 文件 | 行号 | 硬编码文本 | 建议命名空间 | 建议键值 | 备注 |
|------|------|-----------|------------|---------|------|
| `src/components/ui/spinner.tsx` | 9 | `"Loading"` | `common` | `loading` | 通用加载状态 |
| `src/pages/Chat/.../ModelSelect.tsx` | 147 | `"打开模型供应商列表"` | `model` | `openProviderList` | 模型管理功能 |
| `src/pages/Chat/.../ChatPlaceholder.tsx` | 30 | `"打开聊天列表"` | `navigation` | `openChatList` | 导航功能 |
| `src/pages/Chat/.../ChatPlaceholder.tsx` | 40 | `"新增聊天"` | `navigation` | `createChat` | 已存在 chat.createChat，可复用 |
| `src/pages/Chat/.../ChatPanelHeader.tsx` | 71 | `"打开聊天列表"` | `navigation` | `openChatList` | 同上 |
| `src/pages/Chat/.../ChatPanelHeader.tsx` | 136 | `"新增聊天"` | `navigation` | `createChat` | 同上 |
| `src/components/ProviderLogo/index.tsx` | 73 | `${providerName} logo` | *动态* | N/A | 动态实体名称，保持原样 |
| `src/components/BottomNav/index.tsx` | 63 | `item.name` | *动态* | N/A | 动态导航项，保持原样 |

### 2. title 属性 (4 处)

| 文件 | 行号 | 硬编码文本 | 建议命名空间 | 建议键值 | 备注 |
|------|------|-----------|------------|---------|------|
| `src/components/chat/ChatBubble.tsx` | 83 | `"思考中" / "思考完成"` | `chat` | `thinking` / `thinkingComplete` | **已存在**，直接使用 |
| `src/components/Sidebar/index.tsx` | 88 | `item.name` | *动态* | N/A | 动态导航项，保持原样 |
| `src/components/BottomNav/index.tsx` | 62 | `item.name` | *动态* | N/A | 动态导航项，保持原样 |
| `src/pages/Model/.../ModelSidebar.tsx` | 100 | `provider.providerName` | *动态* | N/A | 动态供应商名称，保持原样 |

### 3. JSX 文本内容 (2 处)

| 文件 | 行号 | 硬编码文本 | 建议命名空间 | 建议键值 | 备注 |
|------|------|-----------|------------|---------|------|
| `src/components/MobileDrawer/index.tsx` | 38 | `<SheetTitle>侧边栏</SheetTitle>` | `navigation` | `mobileDrawer.title` | 新增键值 |
| `src/components/MobileDrawer/index.tsx` | 39 | `<SheetDescription>侧边栏</SheetDescription>` | `navigation` | `mobileDrawer.description` | 新增键值 |

### 4. aria-description 属性 (1 处)

| 文件 | 行号 | 硬编码文本 | 建议命名空间 | 建议键值 | 备注 |
|------|------|-----------|------------|---------|------|
| `src/components/MobileDrawer/index.tsx` | 33 | `"抽屉内容"` | `navigation` | `mobileDrawer.ariaDescription` | 新增键值 |

## 需要新增的翻译键值

### common.json

```json
{
  "loading": "加载中"
}
```

### navigation.json

```json
{
  "mobileDrawer": {
    "title": "侧边栏",
    "description": "侧边栏",
    "ariaDescription": "抽屉内容"
  },
  "openChatList": "打开聊天列表",
  "createChat": "新建聊天"
}
```

### model.json

```json
{
  "openProviderList": "打开模型供应商列表"
}
```

## 动态实体名称处理

以下文本包含动态变量，按设计文档**保持原样**：

1. `ProviderLogo`: `${providerName} logo` - 供应商名称动态
2. `BottomNav`: `item.name` - 导航项名称动态
3. `Sidebar`: `item.name` - 导航项名称动态
4. `ModelSidebar`: `provider.providerName` - 供应商名称动态

## 已存在但未使用的翻译

以下翻译键值已存在于翻译文件中，但组件仍使用硬编码：

| 文件 | 硬编码文本 | 已存在键值 | 操作 |
|------|-----------|-----------|------|
| `ChatBubble.tsx` | "思考中" / "思考完成" | `chat.thinking` / `chat.thinkingComplete` | 直接替换 |
| `ChatPlaceholder.tsx` | "新增聊天" | `chat.createChat` | 可复用或创建 `navigation.createChat` |

## 误报排除（不需要国际化）

以下内容在初步搜索中被发现，但**不需要国际化**：

1. **类型定义文件** (`src/@types/`) - 仅包含类型定义
2. **技术标识符** - 如 HTML `id`, CSS `class`, 数据结构键名
3. **错误消息** (`throw new Error(...)`) - 开发者调试信息
4. **代码注释** - 注释中的中文或英文

## 下一步行动

1. ✅ 完成硬编码文本识别（Phase 1: grep 搜索）
2. ⏭️ 进行 AST 静态分析（Phase 2，可选，当前误报率已较低）
3. ⏭️ 人工审查并过滤最终清单
4. ⏭️ 扩展翻译资源文件（所有 3 种语言）
5. ⏭️ 运行翻译完整性检查 (`npm run lint:i18n`)
6. ⏭️ 逐个替换硬编码文本为 i18n 调用

## 预估工作量

- **需要国际化的实例**: ~15 处
- **需要新增的翻译键值**: ~8 个
- **预估时间**: 2-3 小时（包括测试验证）
- **风险等级**: 低（影响范围小，大部分组件已使用 i18next）

---

**注意**: 此清单基于 grep 搜索结果，可能存在遗漏。建议在实施过程中进行多语言切换测试，验证覆盖范围。
