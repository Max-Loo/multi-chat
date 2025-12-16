# 项目 i18n 改造文案清单

本文档列出了项目中所有需要使用 i18n 进行国际化改造的硬编码中文文案及其对应的i18n键。

## 文案分类清单

### 1. 导航和侧边栏

| 原始文案 | i18n键 | 文件位置 |
|---------|--------|----------|
| `'聊天'` | `navigation.chat` | `src/components/Sidebar/index.tsx` |
| `'模型'` | `navigation.model` | `src/components/Sidebar/index.tsx` |
| `'设置'` | `navigation.setting` | `src/components/Sidebar/index.tsx` |

### 2. 模型管理页面

#### 2.1 表格列标题
| 原始文案 | i18n键 | 文件位置 |
|---------|--------|----------|
| `'大模型服务商'` | `table.modelProvider` | `src/hooks/useBasicModelTable.tsx` |
| `'模型名称'` | `table.modelName` | `src/hooks/useBasicModelTable.tsx` |
| `'最近更新时间'` | `table.lastUpdateTime` | `src/hooks/useBasicModelTable.tsx` |
| `'创建时间'` | `table.createTime` | `src/hooks/useBasicModelTable.tsx` |
| `'备注'` | `table.note` | `src/hooks/useBasicModelTable.tsx` |
| `'昵称'` | `table.nickname` | 表格列标题 |
| `'操作'` | `table.operation` | `src/pages/Model/ModelTable/index.tsx` |

#### 2.2 模型列表页面
| 原始文案 | i18n键 | 文件位置 |
|---------|--------|----------|
| `'搜索昵称或备注'` | `model.searchPlaceholder` | `src/pages/Model/ModelTable/index.tsx` |
| `'请修复错误后重新加载数据'` | `model.fixErrorReload` | `src/pages/Model/ModelTable/index.tsx` |
| `'暂无模型数据，点击"添加模型"创建第一个模型'` | `model.noModelData` | `src/pages/Model/ModelTable/index.tsx` |
| `'确认删除'` | `model.confirmDelete` | `src/pages/Model/ModelTable/index.tsx` |
| `'确定'` | `common.confirm` | `src/pages/Model/ModelTable/index.tsx` |
| `'取消'` | `common.cancel` | `src/pages/Model/ModelTable/index.tsx` |
| `'数据加载失败'` | `model.dataLoadFailed` | `src/pages/Model/ModelTable/index.tsx` |
| `'操作失败'` | `model.operationFailed` | `src/pages/Model/ModelTable/index.tsx` |
| `'模型删除成功'` | `model.deleteModelSuccess` | `src/pages/Model/ModelTable/index.tsx` |
| `'模型删除失败'` | `model.deleteModelFailed` | `src/pages/Model/ModelTable/index.tsx` |
| `'确定要删除模型 「{{nickname}}」 吗？'` | `model.confirmDeleteDescription` | 模型删除确认对话框 |

#### 2.3 添加/编辑模型页面
| 原始文案 | i18n键 | 文件位置 |
|---------|--------|----------|
| `'模型服务商'` | `model.modelProvider` | `src/pages/Model/CreateModel/components/ModelSidebar.tsx` |
| `'搜索模型'` | `model.searchModel` | `src/pages/Model/CreateModel/components/ModelSidebar.tsx` |
| `'模型添加成功'` | `model.addModelSuccess` | `src/pages/Model/CreateModel/index.tsx` |
| `'模型添加失败'` | `model.addModelFailed` | `src/pages/Model/CreateModel/index.tsx` |
| `'模型编辑成功'` | `model.editModelSuccess` | `src/pages/Model/ModelTable/components/EditModelModal.tsx` |
| `'模型编辑失败'` | `model.editModelFailed` | `src/pages/Model/ModelTable/components/EditModelModal.tsx` |

#### 2.4 模型配置表单
| 原始文案 | i18n键 | 文件位置 |
|---------|--------|----------|
| `'模型昵称'` | `model.modelNickname` | `src/pages/Model/components/ModelConfigForm.tsx` |
| `'请输入当前模型的昵称'` | `model.modelNicknameRequired` | `src/pages/Model/components/ModelConfigForm.tsx` |
| `'API 密钥'` | `model.apiKey` | `src/pages/Model/components/ModelConfigForm.tsx` |
| `'请输入你的 API 密钥'` | `model.apiKeyRequired` | `src/pages/Model/components/ModelConfigForm.tsx` |
| `'API 地址'` | `model.apiAddress` | `src/pages/Model/components/ModelConfigForm.tsx` |
| `'请输入服务商对应的 API 地址'` | `model.apiAddressRequired` | `src/pages/Model/components/ModelConfigForm.tsx` |
| `'# 结尾表示自定义'` | `provider.apiAddressCustom` | `src/pages/Model/components/ModelConfigForm.tsx` |
| `'备注'` | `common.remark` | `src/pages/Model/components/ModelConfigForm.tsx` |
| `'模型'` | `model.model` | `src/pages/Model/components/ModelConfigForm.tsx` |
| `'请选择你想要使用的具体模型'` | `model.modelRequired` | `src/pages/Model/components/ModelConfigForm.tsx` |

### 3. 聊天页面

#### 3.1 聊天侧边栏
| 原始文案 | i18n键 | 文件位置 |
|---------|--------|----------|
| `'加载中'` | `chat.loading` | `src/pages/Chat/components/ChatSidebar/index.tsx` |
| `'重命名'` | `chat.rename` | `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx` |
| `'删除'` | `chat.delete` | `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx` |
| `'是否确定删除'` | `chat.confirmDelete` | 聊天删除确认 |
| `'删除聊天成功'` | `chat.deleteChatSuccess` | `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx` |
| `'删除聊天失败'` | `chat.deleteChatFailed` | `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx` |
| `'聊天被删除后，所有相关聊天记录将无法找回'` | `chat.deleteChatConfirm` | `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx` |
| `'编辑聊天成功'` | `chat.editChatSuccess` | `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx` |
| `'编辑聊天失败'` | `chat.editChatFailed` | `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx` |
| `'未命名'` | `chat.unnamed` | `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx` |

#### 3.2 模型选择
| 原始文案 | i18n键 | 文件位置 |
|---------|--------|----------|
| `'请选择你想要使用的模型'` | `chat.selectModelHint` | `src/pages/Chat/components/ChatContent/components/ModelSelect.tsx` |
| `'编辑聊天成功'` | `chat.editChatSuccess` | `src/pages/Chat/components/ChatContent/components/ModelSelect.tsx` |
| `'编辑聊天失败'` | `chat.editChatFailed` | `src/pages/Chat/components/ChatContent/components/ModelSelect.tsx` |
| `'搜索昵称或备注'` | `chat.searchPlaceholder` | `src/pages/Chat/components/ChatContent/components/ModelSelect.tsx` |

#### 3.3 聊天面板
| 原始文案 | i18n键 | 文件位置 |
|---------|--------|----------|
| `'停止发送'` | `chat.stopSending` | `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelSender.tsx` |
| `'发送消息'` | `chat.sendMessage` | `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelSender.tsx` |
| `'取消'` | `common.cancel` | `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelSender.tsx` |
| `'未命名'` | `chat.unnamed` | `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelHeader.tsx` |
| `'滚动到底部'` | `chat.scrollToBottom` | `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/index.tsx` |
| `'思考中...'` | `chat.thinking` | `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/components/ChatBubble.tsx` |
| `'思考完毕'` | `chat.thinkingComplete` | `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/components/ChatBubble.tsx` |
| `'模型已删除'` | `chat.modelDeleted` | 聊天中模型状态提示 |
| `'已删除'` | `chat.deleted` | 聊天中模型状态提示 |
| `'被禁用'` | `chat.disabled` | 聊天中模型状态提示 |

### 4. 通用组件

| 原始文案 | i18n键 | 文件位置 |
|---------|--------|----------|
| `'提交'` | `common.submit` | 通用提交按钮 |
| `'语言'` | `common.language` | 语言选择 |
| `'搜索'` | `common.search` | `src/components/FilterInput/index.tsx` |
| `'备注'` | `common.remark` | `src/pages/Model/components/ModelConfigForm.tsx` |
| `'取消'` | `common.cancel` | 通用取消按钮 |
| `'确定'` | `common.confirm` | 通用确认按钮 |

### 5. 模型提供商

| 原始文案 | i18n键 | 文件位置 |
|---------|--------|----------|
| `'智谱AI'` | `provider.bigModel` | `src/lib/factory/modelProviderFactory/providers/BigModelProvider.ts` |
| `'月之暗面'` | `provider.kimi` | `src/lib/factory/modelProviderFactory/providers/KimiProvider.ts` |
| `'/ 结尾会忽略v1，# 结尾表示自定义'` | `provider.apiAddressKimi` | `src/lib/factory/modelProviderFactory/providers/KimiProvider.ts` |
| `'深度求索'` | `provider.deepseek` | `src/lib/factory/modelProviderFactory/providers/DeepseekProvider.ts` |
| `'# 结尾表示自定义'` | `provider.apiAddressCustom` | `src/lib/factory/modelProviderFactory/providers/DeepseekProvider.ts` |

### 6. 设置页面

| 原始文案 | i18n键 | 文件位置 |
|---------|--------|----------|
| `'常规设置'` | `setting.generalSetting` | 设置页面标题 |

## i18n文件结构

```
src/locales/
├── zh/
│   ├── common.json      # 通用文案（按钮、操作等）
│   ├── navigation.json  # 导航菜单
│   ├── model.json       # 模型管理相关
│   ├── chat.json        # 聊天相关
│   ├── provider.json    # 模型提供商
│   ├── setting.json     # 设置相关
│   └── table.json       # 表格相关
└── en/
    ├── common.json      # 对应中文版本
    ├── navigation.json
    ├── model.json
    ├── chat.json
    ├── provider.json
    ├── setting.json
    └── table.json
```

## 使用方法

在React组件中使用i18n：

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      {t('navigation.chat')}  // 显示"聊天"或"Chat"
    </div>
  );
}
```

## 注意事项

1. 错误信息已直接修改为英文硬编码，不需要进行i18n处理
2. 确保所有组件正确导入和使用 `useTranslation` Hook
3. 中英文文件的键名和层级结构保持完全一致
4. 对于动态内容，可以使用插值语法：`t('key', { variable: value })`