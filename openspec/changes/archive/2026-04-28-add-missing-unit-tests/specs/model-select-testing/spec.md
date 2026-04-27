## ADDED Requirements

### Requirement: ModelSelect 渲染所有选项

`ModelSelect` 组件 SHALL 为 `options` 数组中的每个模型渲染一个 `RadioGroupItem`，并通过 `data-testid` 属性 `model-option-<modelKey>` 标识。

#### Scenario: 渲染多个模型选项
- **WHEN** 传入 `options` 包含 2 个 `ModelDetail` 对象（modelKey 分别为 `'model-a'` 和 `'model-b'`）
- **THEN** SHALL 渲染 2 个 `RadioGroupItem`，DOM 中存在 `data-testid="model-option-model-a"` 和 `data-testid="model-option-model-b"`

### Requirement: ModelSelect 在表单验证错误时显示红色边框

当 `useFormField()` 返回的 `error` 有值时，`ModelSelect` 的 `RadioGroup` 容器 SHALL 包含 `border-red-500` 样式。

#### Scenario: 存在验证错误
- **WHEN** `useFormField()` 返回 `{ error: '请选择模型' }`
- **THEN** RadioGroup 容器 SHALL 包含 `border-red-500` CSS 类

#### Scenario: 无验证错误
- **WHEN** `useFormField()` 返回 `{ error: undefined }`
- **THEN** RadioGroup 容器 SHALL NOT 包含 `border-red-500` CSS 类

### Requirement: ModelSelect 选中值变化时调用 onChange

当用户选择不同的 RadioGroupItem 时，`ModelSelect` SHALL 以选中的 `modelKey` 调用 `onChange` 回调。

#### Scenario: 选择模型选项
- **WHEN** 用户点击 `modelKey` 为 `'model-b'` 的选项
- **THEN** SHALL 调用 `onChange('model-b')`
