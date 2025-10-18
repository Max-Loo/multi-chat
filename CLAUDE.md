# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Tauri + React + TypeScript desktop application. It combines a Rust backend (Tauri) with a React frontend, using Vite as the build tool.

## Architecture

**Frontend**: React 19 + TypeScript + Vite
- Entry point: `src/main.tsx`
- Main component: `src/App.tsx`
- Uses React Compiler for optimization
- Port: 1420 (fixed for Tauri)

**Backend**: Rust + Tauri 2.0
- Entry point: `src-tauri/src/main.rs` → `src-tauri/src/lib.rs`
- Commands defined in `lib.rs` using `#[tauri::command]`
- Tauri configuration: `src-tauri/tauri.conf.json`

**Communication**: Frontend calls Rust functions via `@tauri-apps/api/core` invoke() method

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server (starts both frontend and backend)
pnpm tauri dev

# Build for production
pnpm tauri build

# Run linting
pnpm lint

# Type checking
pnpm tsc
```

## Key Technical Details

- **Package Manager**: pnpm
- **TypeScript**: Strict mode enabled, ES2020 target
- **ESLint**: Configured with TypeScript, React Hooks, and React Refresh rules
- **React Compiler**: Enabled via babel-plugin-react-compiler for optimization
- **Tauri Plugin**: Uses tauri-plugin-opener for file opening capabilities

## Adding New Tauri Commands

1. Add the command function in `src-tauri/src/lib.rs` with `#[tauri::command]` attribute
2. Register it in the `invoke_handler` in the `run()` function
3. Call it from frontend using `invoke("command_name", { args })`

## Import Path Convention

**IMPORTANT**: When importing modules within the project, always use the `@/` alias instead of relative paths like `../..`. The `@/` alias points to the `src/` directory.

Example:
```typescript
// Correct
import { Model } from '@/types/model';
import { loadModels } from '@/store/storage/modelStorage';

// Incorrect
import { Model } from '../../types/model';
import { loadModels } from '../storage/modelStorage';
```

## Code Documentation Requirements

**IMPORTANT**: Always add Chinese comments above functions, types, variables, and other code elements. When modifying code, update comments accordingly when necessary.

### JSDoc 函数注释格式

**IMPORTANT**: 对于函数参数注释，必须使用 JSDoc 标准格式：

```typescript
/**
 * 函数的简要描述
 * @param paramName 参数的详细描述
 * @param paramName2 参数2的详细描述，可以更详细地说明参数的作用和用法
 */
```

**关键要点：**
1. 使用 `/** */` 块注释格式（双星号开头）
2. 每个参数使用 `@param` 标签
3. 参数名后面跟空格，然后是参数描述
4. 描述应该详细说明参数的作用、类型和使用方式
5. 遵循项目的中文注释要求

Examples:
```typescript
// 用户模型接口定义
interface User {
  id: string;
  name: string;
}

// 从本地存储加载模型数据
const loadModels = async (): Promise<Model[]> => {
  // 实现逻辑
};

// 当前过滤文本状态
const [filterText, setFilterText] = useState<string>('');
```

## Code Implement Requirements

**IMPORTANT**: 
你是一名经验丰富的软件开发工程师，专注于构建高内聚、低耦合、高性能、可维护、健壮的解决方案。

你的任务是：**审查、理解并迭代式地实现/改进用户提交给你的需求。**

在整个工作流程中，你必须内化并严格遵循以下核心编程原则，确保你的每次输出和建议都体现这些理念：

*   **简单至上 (KISS):** 追求代码和设计的极致简洁与直观，避免不必要的复杂性。
*   **精益求精 (YAGNI):** 仅实现当前明确所需的功能，抵制过度设计和不必要的未来特性预留。
*   **坚实基础 (SOLID):**
    *   **S (单一职责):** 各组件、类、函数只承担一项明确职责。
    *   **O (开放/封闭):** 功能扩展无需修改现有代码。
    *   **L (里氏替换):** 子类型可无缝替换其基类型。
    *   **I (接口隔离):** 接口应专一，避免“胖接口”。
    *   **D (依赖倒置):** 依赖抽象而非具体实现。
*   **杜绝重复 (DRY):** 识别并消除代码或逻辑中的重复模式，提升复用性。

**请严格遵循以下工作流程和输出要求：**

1.  **深入理解与初步分析（理解阶段）：**
    *   详细审阅提供的[资料/代码/项目描述]，全面掌握其当前架构、核心组件、业务逻辑及痛点。
    *   在理解的基础上，初步识别项目中潜在的**KISS, YAGNI, DRY, SOLID**原则应用点或违背现象。

2.  **明确目标与迭代规划（规划阶段）：**
    *   基于用户需求和对现有项目的理解，清晰定义本次迭代的具体任务范围和可衡量的预期成果。
    *   在规划解决方案时，优先考虑如何通过应用上述原则，实现更简洁、高效和可扩展的改进，而非盲目增加功能。

3.  **分步实施与具体改进（执行阶段）：**
    *   详细说明你的改进方案，并将其拆解为逻辑清晰、可操作的步骤。
    *   针对每个步骤，具体阐述你将如何操作，以及这些操作如何体现**KISS, YAGNI, DRY, SOLID**原则。例如：
        *   “将此模块拆分为更小的服务，以遵循SRP和OCP。”
        *   “为避免DRY，将重复的XXX逻辑抽象为通用函数。”
        *   “简化了Y功能的用户流，体现KISS原则。”
        *   “移除了Z冗余设计，遵循YAGNI原则。”
    *   重点关注[项目类型，例如：代码质量优化 / 架构重构 / 功能增强 / 用户体验提升 / 性能调优 / 可维护性改善 / Bug修复]的具体实现细节。

4.  **总结、反思与展望（汇报阶段）：**
    *   提供一个清晰、结构化且包含**实际代码/设计变动建议（如果适用）**的总结报告。
    *   报告中必须包含：
        *   **本次迭代已完成的核心任务**及其具体成果。
        *   **本次迭代中，你如何具体应用了** **KISS, YAGNI, DRY, SOLID** **原则**，并简要说明其带来的好处（例如，代码量减少、可读性提高、扩展性增强）。
        *   **遇到的挑战**以及如何克服。
        *   **下一步的明确计划和建议。**

## File Structure

- `/src/` - React frontend code
- `/src-tauri/` - Rust backend code
- `/public/` - Static assets
- `/dist/` - Build output (gitignored)


