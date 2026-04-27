**English** | [中文](./README.zh-CN.md)

# Multi-Chat

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://max-loo.github.io/multi-chat/)
[![Deploy to GitHub Pages](https://github.com/Max-Loo/multi-chat/actions/workflows/deploy-to-gh-pages.yml/badge.svg)](https://github.com/Max-Loo/multi-chat/actions/workflows/deploy-to-gh-pages.yml)

A multi-model chat application built with Tauri + React + TypeScript, supporting simultaneous conversations with multiple AI models for easy comparison of responses.

## Features

### 🤖 Multi-Model Support

- Add AI models from multiple providers (e.g., DeepSeek, Moonshot)
- Configure independent API keys and endpoints for each model
- Enable/disable model management
- Secure local storage of model configurations
- 🔌 **Remote Model Data**: Fetch model provider definitions dynamically from `models.dev API` to keep data up-to-date
- ⚡ **Performance Optimization**: Lazy-load provider SDKs, reducing initial bundle size by ~125KB (gzipped)

### 💬 Simultaneous Multi-Model Chat

- Create chat sessions to converse with multiple models simultaneously
- Send the same question to multiple models and compare responses side-by-side
- Real-time streaming response display
- Interrupt ongoing conversations

### 📝 Chat Management

- Create, edit, and delete chat sessions
- Persistent chat history storage
- Search and filter chat sessions
- Collapsible sidebar design to save space

### 🎨 Modern UI

- Modern UI design based on shadcn/ui and Radix UI component library
- **Four-level responsive layout system** that automatically adapts to different screen sizes
- Customizable chat window layout (single-column/multi-column display)
- Smooth animations and transitions

### 📱 Responsive Layout

The app supports four levels of responsive layout that automatically adjust based on window width:

- **Desktop** (≥1280px): Full desktop layout, 224px sidebar
- **Compressed** (1024-1279px): Compressed layout, 192px sidebar (smaller fonts and icons)
- **Compact** (768-1023px): Compact layout, 192px sidebar (smaller fonts and icons)
- **Mobile** (<768px): Mobile layout
  - Sidebar integrated into a drawer (slides from left)
  - Bottom navigation bar (Chat/Model/Setting)
  - Touch-optimized interactions

**Technical Features**:
- Automatic smooth switching on window resize (150ms debounce)
- Smooth CSS transition animations
- Full keyboard navigation and ARIA label support

### 🔒 Data Security

- Local data storage to protect privacy
- API keys encrypted with AES-256-GCM
- Master key securely stored in system keychain via `tauri-plugin-keyring`
- Field-level encryption for sensitive data, plaintext storage for non-sensitive data
- Data stored in JSON format for easy backup and inspection

## Tech Stack

- **Frontend Framework**: React 19 + TypeScript
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: Redux Toolkit
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **Internationalization**: i18next + react-i18next
- **Desktop Framework**: Tauri 2
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Rust 1.70+ (for building the Tauri app)

### Install Dependencies

```bash
# Clone the project
git clone [repository-url]
cd multi-chat

# Install dependencies
pnpm install
```

### Development Mode

```bash
# Start Tauri desktop app development mode (starts both frontend and backend)
pnpm tauri dev

# Start web browser development mode (frontend only)
pnpm web:dev
```

### Build the Application

```bash
# Build Tauri desktop app for production
pnpm tauri build

# Build web app for production
pnpm web:build
```

### Deploy to GitHub Pages

This project supports deployment to GitHub Pages for online access.

**Live URL**: [https://max-loo.github.io/multi-chat/](https://max-loo.github.io/multi-chat/)

**Local Deployment Command**:
```bash
# Build and deploy to GitHub Pages
pnpm deploy:gh-pages
```

**GitHub Actions Auto-Deployment**: When a version tag (`v*.*.*`) is created, GitHub Actions uses the official Pages Actions (`actions/upload-pages-artifact` + `actions/deploy-pages`) to automatically build and deploy. The version release workflow:

1. Update the version number in `package.json`
2. Create a PR and merge into the `main` branch
3. `create-tag.yml` workflow automatically creates a version tag
4. `deploy-to-gh-pages.yml` workflow triggers auto-deployment
   - **build job**: Build the web app and upload artifact
   - **deploy job**: Deploy artifact to GitHub Pages

Meanwhile, the desktop build (`build-and-release.yml`) is also triggered in parallel to ensure desktop and web versions are released simultaneously.

**Technical Details**:
- Uses official GitHub Pages Actions (recommended approach)
- Separated build and deploy into two independent jobs
- More secure permission model (`pages: write` + `id-token: write`)
- No need to maintain a gh-pages branch

### Other Common Commands

```bash
# Run linting (using oxlint)
pnpm lint

# Update application version
pnpm update-version

# Generate i18n type definitions
pnpm generate-i18n-types

# Run tests
pnpm test

# Run tests with coverage report
pnpm test:coverage

# Run all tests (including integration tests)
pnpm test:all
```

**Detailed Test Documentation**: The project has comprehensive test specifications and guidelines. See [Test Documentation](./src/__test__/README.md) for:
- Behavior-driven testing principles
- Test isolation and mock strategies
- Test directory structure and organization
- Before/After comparison examples
- Common anti-patterns and solutions

## Usage Guide

### Adding a Model

1. After launching the app, click the "Model" button in the left navigation bar
2. Click the "Add Model" button
3. Select a model provider (e.g., DeepSeek)
4. Fill in the model information:
   - Model nickname (custom name)
   - API key
   - API endpoint
   - Notes (optional)
5. Click "Save" to complete

### Creating a Chat

1. Click the "Chat" button in the left navigation bar
2. Click the "New Chat" button in the chat sidebar
3. Name the chat (optional)
4. Click "Add Model" and select models to chat with
5. Start typing messages to chat with multiple models simultaneously

### Chat Interface Operations

- **Send Message**: Type in the input box and press Enter to send (Shift+Enter for new line)
- **Stop Conversation**: Click the send button to interrupt an ongoing conversation
- **Switch Layout**: Use the top toolbar to switch between single-column/multi-column display
- **View History**: Scroll to view conversation history

## Project Structure

```
multi-chat/
├── src/                        # React frontend code
│   ├── components/             # Shared components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── FilterInput/       # Filter input component
│   │   ├── Layout/            # Layout components
│   │   └── Sidebar/           # Sidebar components
│   ├── pages/                 # Page components
│   │   ├── Chat/              # Chat page
│   │   ├── Model/             # Model management page
│   │   └── Setting/           # Settings page
│   ├── hooks/                 # Custom hooks
│   ├── config/                # Configuration files
│   │   └── initSteps.ts       # Initialization step config
│   ├── locales/               # i18n language files
│   │   ├── en/                # English language pack
│   │   ├── zh/                # Chinese language pack
│   │   └── fr/                # French language pack
│   ├── services/              # Service layer
│   │   ├── chat/              # Chat service (modular)
│   │   ├── modelRemote/       # Remote model service
│   │   ├── i18n.ts            # i18n configuration
│   │   └── global.ts          # Global configuration
│   ├── store/                 # Redux state management
│   │   ├── slices/            # Redux slices
│   │   ├── middleware/        # Middleware
│   │   ├── storage/           # Data persistence
│   │   └── keyring/           # Master key management
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions
│       ├── tauriCompat/       # Tauri compatibility layer
│       ├── crypto.ts          # Crypto utilities
│       └── ...
├── src-tauri/                 # Rust backend code
│   ├── src/
│   │   ├── lib.rs             # Tauri command definitions
│   │   └── main.rs            # Entry file
│   └── tauri.conf.json        # Tauri configuration
├── public/                    # Static assets
└── package.json               # Project dependencies and scripts
```

## Internationalization

### Supported Languages

- Chinese (zh)
- English (en)
- French (fr)

### Language File Structure

Language files are located in the `src/locales/` directory, organized by language code:

- Each language contains multiple JSON files, organized by feature module:
  - `common.json`: Common text (buttons, actions, etc.)
  - `navigation.json`: Navigation menu text
  - `model.json`: Model management text
  - `chat.json`: Chat-related text
  - `provider.json`: Model provider text
  - `setting.json`: Settings text
  - `table.json`: Table-related text
  - `error.json`: Error message text

### Language Switching Mechanism

1. Priority order:
    - Locally stored language preference
    - System language (if supported)
    - Default language (English)
2. Language preference is stored in `localStorage` with the key `multi-chat-language`
3. Uses `i18next` and `react-i18next` for internationalization

**Language Code Auto-Migration**:
- On app upgrade, if language codes have changed (e.g., `zh-CN` → `zh`), the system automatically migrates to the new code
- A notification is displayed after migration informing the user of the new language code
- If the old language code is no longer supported, the system automatically clears the cache and falls back to the system language or English
- Language preference persists to localStorage after manual switching and remains after refresh

**On-Demand Loading & Performance Optimization**:
- ✅ **English as "First-Class Citizen"**: English resources are statically bundled into the main bundle (~5 KB), ensuring offline availability
- ✅ **On-Demand Loading**: Only English + system language are loaded at startup, saving 33%-67% of initial load
- ✅ **Smart Caching**: In-flight load requests are cached to prevent race conditions during rapid switching

**Auto-Persistence**:
- ✅ Language changes are automatically synced to localStorage via Redux Middleware
- ✅ Silent degradation: localStorage write failures log a warning without affecting app operation

**Message Queue Mechanism**:
- ✅ Language switch notifications during initialization are queued
- ✅ Messages are displayed in order after the Toaster component is ready, with 500ms intervals
- ✅ Prevents notification loss from timing issues

### Adding New Language Support

1. Create a new language directory under `src/locales/` (e.g., `fr/`)
2. Copy the existing language file structure and translate the content
3. Add the new language code to `SUPPORTED_LANGUAGE_LIST` in `src/utils/constants.ts`
4. Restart the app for the new language to take effect

## Development Notes

### Code Quality

The project uses the following tools to ensure code quality:

- **oxlint**: Static code analysis tool
  ```bash
  pnpm lint
  ```

- **knip**: Detect unused code, dependencies, and exports
  ```bash
  pnpm analyze:unused
  ```
  This command scans the project and reports:
  - Unused files
  - Unused dependencies (dependencies and devDependencies)
  - Unused exports (functions, variables, types, etc.)

  Configuration is located in `knip.json`, where you can adjust entry points, ignore rules, etc.

### Adding a New Model Provider

1. Add the new provider enum in `src/utils/enums.ts`
2. Register the corresponding Provider factory function in `src/services/chat/providerLoader.ts`
3. Add the provider option in `src/pages/Model/CreateModel/components/ModelSidebar.tsx`

### Code Conventions

- **Import paths**: Always use the `@/` alias for imports, never use relative paths
  ```typescript
  // Correct
  import { Model } from "@/types/model";

  // Wrong
  import { Model } from "../../types/model";
  ```
- **Code comments**: Add comments above functions, types, and variables in Chinese
- **Design principles**: Follow SOLID, KISS, YAGNI, DRY principles
- **Architecture reference**: See [AGENTS.md](./AGENTS.md) for detailed design documentation

### Data Persistence

The app uses the @tauri-apps/plugin-store plugin for data persistence. Data storage locations:

- **Windows**: `%APPDATA%\multi-chat`
- **macOS**: `~/Library/Application Support/multi-chat`
- **Linux**: `~/.config/multi-chat`

#### Data Files

- `models.json`: Model configurations (API key fields are encrypted)
- `chats.json`: Chat records

#### Encryption Mechanism

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Management**:
  - Master key generated by Web Crypto API (256-bit random key)
  - Desktop: Stored in system secure storage (macOS Keychain / Windows DPAPI / Linux Secret Service)
  - Web: Encrypted storage using IndexedDB (corresponding to desktop system keychain)
  - Uses `tauri-plugin-keyring` for unified cross-platform key management
- **Encryption Format**: `enc:base64(ciphertext + auth_tag + nonce)`
- **Desktop Only**: Mobile platforms (iOS/Android) are not supported

## Recommended Development Environment

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## FAQ

### Tauri Build Failure

**Issue**: Error when running `pnpm tauri build`

**Solution**:
1. Ensure Rust toolchain is properly installed: `rustc --version`
2. Ensure Tauri CLI is properly installed: `pnpm tauri --version`
3. Try clearing the cache: `pnpm tauri build --clean`

### Web Environment Key Loss

**Issue**: Unable to decrypt previous data after clearing browser data in the web environment

**Solution**:
- The web environment stores the key seed in `localStorage`. Clearing browser data will result in key loss
- It is recommended to export the master key in advance from the settings page as a backup. After key loss, it can be restored by importing
- For important sensitive data, it is recommended to use the desktop version

## License

MIT License
