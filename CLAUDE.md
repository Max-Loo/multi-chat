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

## File Structure

- `/src/` - React frontend code
- `/src-tauri/` - Rust backend code
- `/public/` - Static assets
- `/dist/` - Build output (gitignored)