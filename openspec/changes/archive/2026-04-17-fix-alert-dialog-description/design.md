## Context

`KeyManagementSetting` 组件中有两个 `AlertDialog`：重置对话框（已有 `AlertDialogDescription`）和导出密钥对话框（缺少 `AlertDialogDescription`）。导出密钥对话框只有标题和密钥显示区域，没有描述文字，因此 Radix UI 检测到缺少 `aria-describedby` 目标并输出警告。

当前导出密钥对话框结构：
```
AlertDialogContent
├── AlertDialogHeader
│   └── AlertDialogTitle
├── Input (显示密钥)
└── AlertDialogFooter
    ├── AlertDialogCancel
    └── Button (复制)
```

## Goals / Non-Goals

**Goals:**

- 消除控制台中的无障碍访问警告
- 为导出密钥对话框添加符合 Radix UI 要求的描述

**Non-Goals:**

- 不改变对话框的功能行为
- 不修改其他已有的正确使用 `AlertDialogDescription` 的组件

## Decisions

**在标题下方添加可见的 `AlertDialogDescription`**

选择添加可见描述而非使用 `VisuallyHidden` 包裹隐藏描述，因为：
- 导出密钥是一个敏感操作，可见的上下文提示（如"您的加密密钥已生成，请复制并安全保存"）对所有用户都有价值
- 实现简单，不需要引入额外依赖

**替代方案**：使用 `@radix-ui/react-visually-hidden` 包裹隐藏描述。虽然可行，但缺少对可见用户的上下文帮助。

## Risks / Trade-offs

- **无显著风险**：改动仅涉及添加一个描述组件，不改变任何逻辑行为
