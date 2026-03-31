# 应用启动初始化流程

本文档说明应用的启动初始化流程，包括 InitializationManager 工作原理、依赖关系和错误处理机制。

## 动机

应用启动时需要执行多个初始化步骤，这些步骤之间存在依赖关系。为了保证：
- **可靠性**：关键步骤失败时应用能正确处理
- **性能**：无依赖的步骤可以并行执行
- **用户体验**：根据错误严重程度提供不同的用户提示

我们使用 `InitializationManager` 来管理初始化流程。

## 架构

### InitializationManager 工作原理

`InitializationManager` 是一个初始化管理器，负责：
1. **解析依赖关系**：构建初始化步骤的依赖图
2. **拓扑排序**：确定执行顺序，支持并行执行
3. **错误处理**：根据错误严重程度采取不同策略

### 初始化步骤配置

配置位于 `src/config/initSteps.ts`，包含 7 个初始化步骤：

1. **i18n**（致命）
   - 初始化国际化配置
   - 无依赖
   - 失败时显示全屏错误提示

2. **masterKey**（致命）
   - 初始化主密钥（系统钥匙串或 IndexedDB）
   - 无依赖
   - 失败时显示全屏错误提示

3. **models**（警告）
   - 加载模型数据
   - 依赖：masterKey
   - 失败时显示 Toast 警告

4. **chatList**（警告）
   - 加载聊天列表
   - 无依赖
   - 失败时显示 Toast 警告

5. **appLanguage**（警告）
   - 加载应用语言配置
   - 依赖：i18n
   - 失败时显示 Toast 警告

6. **includeReasoningContent**（可忽略）
   - 加载推理内容配置
   - 无依赖
   - 失败时仅在控制台记录

7. **autoNamingEnabled**（可忽略）
   - 加载自动命名功能配置
   - 无依赖
   - 失败时仅在控制台记录

8. **modelProvider**（警告）
   - 从远程 API 获取模型供应商定义
   - 无依赖
   - 失败时显示 Toast 警告

### 执行顺序

使用拓扑排序优化并行执行，示例执行顺序：
```
第一阶段（并行）：i18n, masterKey, chatList, includeReasoningContent, autoNamingEnabled, modelProvider
第二阶段（并行）：models（依赖 masterKey）
第三阶段：appLanguage（依赖 i18n）
```

### 三级错误处理

根据 `critical` 标记和错误严重程度，采取不同策略：

| 错误级别 | 行为 | 适用步骤 |
|---------|------|---------|
| **致命** | 显示全屏错误提示，阻止应用使用 | i18n, masterKey |
| **警告** | 显示 Toast 提示，允许继续使用 | models, chatList, appLanguage, modelProvider |
| **可忽略** | 仅在控制台记录，不影响使用 | includeReasoningContent, autoNamingEnabled |

## 关键模块

### InitStep 接口

每个初始化步骤实现 `InitStep` 接口：
- `name`: 步骤名称
- `critical`: 是否关键步骤
- `dependencies`: 依赖的其他步骤（可选）
- `execute`: 执行函数，返回结果
- `onError`: 错误处理函数，返回错误信息

### Context 对象

`context` 对象用于在步骤间传递数据：
- `setResult(key, value)`: 设置步骤结果
- `getResult(key)`: 获取其他步骤的结果

示例：`models` 步骤依赖 `masterKey` 步骤的结果：
```typescript
const key = await context.getResult('masterKey');
```

## 实现位置

- **配置文件**：`src/config/initSteps.ts`
- **类型定义**：`src/services/initialization.ts`
- **执行入口**：应用启动时的 `main.tsx`

## 使用示例

添加新的初始化步骤：

```typescript
export const initSteps: InitStep[] = [
  // ... 现有步骤
  {
    name: 'newFeature',
    critical: false,
    dependencies: ['i18n'], // 可选
    execute: async (context) => {
      const result = await initializeNewFeature();
      context.setResult('newFeature', result);
      return result;
    },
    onError: (error) => ({
      severity: 'warning', // 'fatal' | 'warning' | 'ignorable'
      message: '新功能初始化失败',
      originalError: error,
    }),
  },
];
```

## 注意事项

1. **避免循环依赖**：确保步骤依赖关系不形成循环
2. **合理设置错误级别**：
   - 阻止应用使用的功能 → 致命
   - 可降级使用的功能 → 警告
   - 可选功能 → 可忽略
3. **考虑性能**：无依赖的步骤会自动并行执行，充分利用这一点
4. **测试错误处理**：确保每个步骤的错误处理都能正常工作
