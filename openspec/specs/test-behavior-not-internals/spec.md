## MODIFIED Requirements

### Requirement: 组件测试验证实际渲染行为

组件测试 MUST 断言实际渲染内容（可见文本、DOM 结构、可访问性属性），MUST NOT 仅断言组件"不崩溃"（`expect(...).not.toThrow()`）。

#### Scenario: ChatPanelContentDetail 不使用 not.toThrow

- **WHEN** 测试 `ChatPanelContentDetail` 组件的渲染行为
- **THEN** SHALL 使用 `screen.getByText`、`screen.getByRole`、`container.querySelector` 等查询验证实际渲染内容，MUST NOT 使用 `expect(() => render(...)).not.toThrow()`

#### Scenario: ChatPanelContentDetail 不 mock 内部 hooks

- **WHEN** 测试 `ChatPanelContentDetail` 组件
- **THEN** SHALL NOT mock `useSelectedChat` 或 `useIsSending` 等内部 hooks，SHALL 通过 Redux state 驱动 hook 行为
