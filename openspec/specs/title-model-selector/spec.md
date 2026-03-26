# Title Model Selector 优化

## Purpose

将 `Title` 组件中的 `models` selector 从订阅完整数组改为在 selector 内部精确查找目标模型，消除其他模型数据变化对本组件的干扰。

## Requirements

### Requirement: Title 组件使用精确查找的 models selector

系统 SHALL 将 `Title` 组件中的 `models` selector 合并为单个 `useAppSelector`，在 selector 内部完成模型查找。

#### Scenario: 合并两步操作为单步 selector
- **WHEN** `Title` 组件需要获取当前模型
- **THEN** 使用 `useAppSelector(state => state.models.models.find(model => model.id === chatModel.modelId))` 直接查找
- **AND** 不再先订阅整个 `models` 数组再用 `useMemo(find)` 筛选
- **AND** 仅当目标模型对象本身的引用发生变化时才重渲染

### Requirement: 移除不再需要的 useMemo 和变量

系统 SHALL 移除优化后不再需要的代码。

#### Scenario: 清理冗余代码
- **WHEN** selector 合并完成后
- **THEN** 移除 `const models = useAppSelector(...)` 行
- **AND** 移除 `const currentModel = useMemo(...)` 块
- **AND** 更新 import 行，移除 `useMemo`（如仅在此处使用）

### Requirement: 不需要 shallowEqual

系统 SHALL 确认 `===` 严格比较已足够，无需额外的 `shallowEqual`。

#### Scenario: 严格比较行为正确
- **WHEN** 其他模型被修改（但目标模型未被修改）
- **THEN** Redux Toolkit 的 Immer 保持未修改对象的引用不变
- **AND** `find` 返回相同引用，`===` 比较通过，不触发重渲染

### Requirement: 后续使用代码保持不变

系统 SHALL 确保 `currentModel` 的后续使用代码完全不变。

#### Scenario: currentModel 后续使用不变
- **WHEN** `currentModel` 被后续代码使用
- **THEN** `isNil(currentModel)` 的错误提示逻辑不变
- **AND** `displayName` 计算逻辑不变
- **AND** `statusTag` 渲染逻辑不变

### Requirement: 边界情况安全处理

系统 SHALL 确保在各种边界情况下组件行为安全。

#### Scenario: 模型被删除
- **WHEN** 模型的 `isDeleted` 为 `true`
- **THEN** `find` 仍返回该模型对象
- **AND** `Title` 正确显示"已删除" Badge

#### Scenario: 模型不存在
- **WHEN** `chatModel.modelId` 在模型列表中找不到对应模型
- **THEN** `find` 返回 `undefined`
- **AND** `isNil(currentModel)` 分支正常显示错误 Badge

#### Scenario: chatModel.modelId 变化
- **WHEN** `chatModel.modelId` 发生变化
- **THEN** selector 重新执行
- **AND** `find` 返回新模型，正确更新显示

### Requirement: 现有测试同步更新

系统 SHALL 同步更新 Title 相关测试。

#### Scenario: 测试 mock 更新
- **WHEN** `DetailTitle.test.tsx` 执行
- **THEN** mock store 的 `models` 数组包含测试所需的模型对象
- **AND** 模型名称、状态 Badge、Tooltip 内容渲染正常
- **AND** 模型删除/禁用状态正确显示
