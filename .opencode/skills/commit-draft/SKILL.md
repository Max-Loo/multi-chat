---
name: commit-draft
description: 为当前未提交的代码或文档变更编写简要的 commit message。默认使用简体中文。
license: MIT
compatibility: Universal
metadata:
  author: workspace
  version: "1.1.1"
---

# Commit Message 生成 Skill

分析未提交的变更，生成符合规范的 commit message。

## 触发场景

- 用户说 "写个 commit message"
- 用户说 "帮我生成提交信息"
- 用户说 "draft commit"
- 用户想要为当前变更生成 commit message

## 工作流程

### 1. 收集变更信息

运行以下 git 命令获取变更详情和风格参考：

```bash
git status
git diff --staged
git diff
git log --oneline -5
```

通过 `git log` 了解仓库已有的 commit 风格（scope 命名习惯、中英文偏好、描述风格等），确保生成的 message 保持一致。

### 2. 分析变更归属

分析所有变更文件，判断是否属于同一个相关变更。按以下维度分组：

- **文件路径关联**：同一目录/模块下的文件视为相关
- **功能关联**：类型定义 + 实现 + 测试 视为相关
- **依赖链关联**：接口变更 + 调用方适配 视为相关

**判断逻辑**：

| 场景                         | 处理方式                                           |
| ---------------------------- | -------------------------------------------------- |
| 所有变更属于同一功能/修复    | 直接生成单一 commit message                        |
| 变更包含多个独立功能/修复    | 暂停并向用户确认（见下方「分组确认」流程）         |

**分组确认流程**：

当检测到多个独立变更时，列出分组结果并使用 AskUserQuestion 工具向用户提问。选项上限为 4 个（AskUserQuestion 约束），当独立变更超过 3 组时，按变更量从小到大合并相邻分组。

示例（3 个分组时）：

```json
{
  "question": "检测到多个独立变更：分组A(feat) - file1.ts, file2.ts；分组B(fix) - file3.ts；分组C(docs) - README.md。请选择提交范围：",
  "header": "提交范围",
  "options": [
    { "label": "全部一起提交", "description": "为所有变更生成一个 commit message" },
    { "label": "仅提交分组 A", "description": "只为分组 A 的变更生成 commit message" },
    { "label": "仅提交分组 B", "description": "只为分组 B 的变更生成 commit message" },
    { "label": "仅提交分组 C", "description": "只为分组 C 的变更生成 commit message" }
  ],
  "multiSelect": false
}
```

根据用户选择，仅针对选定的变更生成 commit message。

### 3. 分析变更内容

识别变更类型：

| 变更类型      | 前缀           | 示例                                    |
| ------------- | -------------- | --------------------------------------- |
| 新功能        | `feat`         | feat(chat): 添加消息撤回功能            |
| Bug 修复      | `fix`          | fix(auth): 修复登录状态丢失问题         |
| 文档更新      | `docs`         | docs: 更新 API 使用说明                 |
| 代码重构      | `refactor`     | refactor(utils): 简化时间戳处理逻辑     |
| 性能优化      | `perf`         | perf(list): 优化大列表渲染性能          |
| 测试相关      | `test`         | test(chat): 添加消息发送单元测试        |
| 构建/工具     | `build`        | build: 升级 vite 版本                   |
| 样式修改      | `style`        | style: 统一代码缩进格式                 |
| 其他/杂项     | `chore`        | chore: 更新依赖包                       |

### 4. 确定影响范围

从变更文件路径推断影响范围：

- `src/components/chat/` → `(chat)`
- `src/services/model/` → `(model)`
- `src-tauri/` → `(tauri)`
- `docs/` → 无 scope 或 `(docs)`
- 多个相关模块 → 使用主要模块

### 5. 生成 Commit Message

**格式规范**：

```
<type>(<scope>): <简短描述>
```

**语言规则**：

- 默认使用简体中文
- 用户指定其他语言时使用指定语言
- 描述使用祈使句（如 "添加" 而非 "添加了"）

**输出格式**：

```markdown
## 建议的 Commit Message

\`\`\`
feat(chat): 添加消息已读状态显示
\`\`\`

### 变更摘要

- 修改了 3 个文件
- 主要变更：ChatMessage 组件新增已读状态图标
```

### 6. 提交确认

生成 commit message 后，使用 AskUserQuestion 工具向用户确认是否执行提交：

```json
{
  "question": "是否使用此 commit message 进行提交？",
  "header": "确认提交",
  "options": [
    { "label": "是，立即提交", "description": "校验暂存区后执行 git add 和 git commit" },
    { "label": "否，仅保留 message", "description": "不执行任何 git 操作" },
    { "label": "修改", "description": "手动修改 commit message 后直接提交" }
  ],
  "multiSelect": false
}
```

**当用户选择「是，立即提交」时**：

1. 运行 `git diff --staged --name-only` 获取暂存区文件列表
2. 对比暂存区文件与 commit message 对应的目标文件：
   - 完全匹配（暂存区 = 目标文件集合） → 直接 `git commit`
   - 不匹配（空、不完整、含多余文件、混合情况） → 统一执行：先 `git reset`，再 `git add` 目标文件，最后 `git commit`
3. 提交时使用 HEREDOC 格式，commit message 包含变更摘要作为 body：
   ```bash
   git commit -m "$(cat <<'EOF'
   <commit message>

   变更摘要：

   - 变更摘要项1
   - 变更摘要项2
   EOF
   )"
   ```

**当用户选择「修改」时**：等待用户提供修改后的 message，确认后直接提交，不再重复确认流程。

## Guardrails

- **可执行提交**：经用户确认后可执行 git add 和 git commit
- **不修改代码**：仅分析变更，不做任何代码修改
- **保持简洁**：描述控制在 50 字符以内
- **校验暂存区**：提交前必须校验暂存区内容与 commit message 匹配
- **变更分组**：多个独立变更时必须先向用户确认提交范围
