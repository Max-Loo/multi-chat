import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { readFileSync } from "fs";

// 读取 package.json 获取版本号
const packageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, "./package.json"), "utf-8"),
);

// //@ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

/**
 * 从模块路径中提取实际包名，兼容 pnpm 存储路径格式
 * @param id 模块路径
 * @returns 包名（如 "react"、"@ai-sdk/deepseek"），非 node_modules 模块返回 null
 */
function getPackageName(id: string): string | null {
  const match = id.match(
    /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(@[^/]+\/[^/]+|[^/]+)/,
  );
  return match ? match[1] : null;
}

/** 包名精确匹配 → chunk 映射 */
const packageChunkMap: Record<string, string> = {
  // React 生态
  react: "vendor-react",
  "react-dom": "vendor-react",
  scheduler: "vendor-react",
  "loose-envify": "vendor-react",
  // Redux 生态
  "react-redux": "vendor-redux",
  redux: "vendor-redux",
  immer: "vendor-redux",
  reselect: "vendor-redux",
  // Router
  "react-router": "vendor-router",
  // i18n
  i18next: "vendor-i18n",
  "react-i18next": "vendor-i18n",
  // Zod
  zod: "vendor-zod",
  // Markdown
  "markdown-it": "vendor-markdown",
  dompurify: "vendor-markdown",
  // AI SDK
  ai: "vendor-ai",
  "zhipu-ai-provider": "vendor-ai",
  // Icons
  "lucide-react": "vendor-icons",
  // UI 工具
  "class-variance-authority": "vendor-ui-utils",
  clsx: "vendor-ui-utils",
  "tailwind-merge": "vendor-ui-utils",
};

/** scope 前缀 → chunk 映射（匹配 @scope/package 格式） */
const scopeChunkMap: Record<string, string> = {
  "@ai-sdk": "vendor-ai",
  "@radix-ui": "vendor-radix",
  "@tanstack": "vendor-tanstack",
  "@remix-run": "vendor-router",
  "@reduxjs": "vendor-redux",
};

/** highlight.js 预加载语言列表 */
const preloadedLanguages = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
  "xml",
  "css",
  "bash",
  "json",
  "markdown",
  "sql",
  "go",
  "rust",
  "yaml",
  "csharp",
];

// https://vite.dev/config/
export default defineConfig(async () => ({
  // GitHub Pages 部署通过 BASE_PATH 环境变量设置子路径，默认使用根路径
  base: process.env.BASE_PATH || "/",
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    visualizer({
      // open: true, // 自动打开浏览器
      gzipSize: true, // 显示 gzip 后大小
      brotliSize: true,
      filename: "dist/stats.html", // 生成文件
    }),
  ],

  // 注入版本号到全局变量
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },

  // 配置路径别名
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // 配置 highlight.js 别名，用于动态导入
      "/@highlight.js": path.resolve(__dirname, "./node_modules/highlight.js"),
    },
  },

  // Vitest 测试配置
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/__test__/setup.ts"],
    include: ["src/__test__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", "src/__test__/integration/**"],

    // 使用 forks 池避免 react-redux ESM 模块初始化竞态
    pool: "forks",
    maxForks: 2,

    // 优化依赖项预构建
    deps: {
      optimizer: {
        web: {
          // 预构建 CommonJS/ESM 模块以优化依赖解析速度
          include: [
            "use-sync-external-store",
            "cookie",
            "react",
            "react-dom",
            "react/jsx-runtime",
            "react-redux",
            "react-remove-scroll",
            "@radix-ui/react-slot",
          ],
        },
      },
    },

    // 测试文件匹配模式
    testTimeout: 10000, // 10 秒超时
    hookTimeout: 10000,
    teardownTimeout: 10000,

    // 慢速测试标记
    benchmark: {
      include: ["**/*.bench.ts"],
    },

    // 覆盖率配置
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html", "json", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/__test__/**",
        "src/__mock__/**",
        "src/main.tsx",
        "src/__test__/setup.ts",
        "src/@types/**",
        "src/pages/Model/index.tsx",
        // Tauri 兼容层（依赖系统 API，无法在 web 测试环境运行）
        "src/utils/tauriCompat/http.ts",
        "src/utils/tauriCompat/shell.ts",
        "src/utils/tauriCompat/os.ts",
        "src/utils/tauriCompat/store.ts",
        "src/utils/tauriCompat/env.ts",
        "src/utils/tauriCompat/__mocks__/**",
        // shadcn/ui 自动生成的 UI 原子组件（无自定义逻辑）
        "src/components/ui/sheet.tsx",
        "src/components/ui/sonner.tsx",
        "src/components/ui/skeleton.tsx",
        "src/components/ui/progress.tsx",
        "src/components/ui/avatar.tsx",
        "src/components/ui/card.tsx",
        "src/components/ui/dropdown-menu.tsx",
        "src/components/ui/checkbox.tsx",
        "src/components/ui/select.tsx",
        "src/components/ui/table.tsx",
        "src/components/ui/tooltip.tsx",
        "src/components/ui/spinner.tsx",
        "src/components/ui/dialog.tsx",
        "src/components/ui/alert.tsx",
        "src/components/ui/alert-dialog.tsx",
        "src/components/ui/badge.tsx",
        "src/components/ui/button.tsx",
        "src/components/ui/data-table.tsx",
        "src/components/ui/form.tsx",
        "src/components/ui/input.tsx",
        "src/components/ui/label.tsx",
        "src/components/ui/popover.tsx",
        "src/components/ui/radio-group.tsx",
        "src/components/ui/resizable.tsx",
        "src/components/ui/switch.tsx",
        "src/components/ui/textarea.tsx",
        // Canvas 动画（依赖 Canvas API，无法在 happy-dom 中测试）
        "src/components/AnimatedLogo/canvas-logo.ts",
        // 第三方库薄包装（clsx + twMerge 一行组合，不含业务逻辑）
        "src/utils/utils.ts",
        // 纯动态 import 映射（46 个 switch case，已被上层测试完整 mock）
        "src/utils/highlightLanguageIndex.ts",
        // 仅用于测试的页面组件
        "src/pages/Setting/components/ToastTest/**",
      ],
      // 覆盖率阈值（分模块分级，汇总模式，Istanbul provider）
      thresholds: {
        // 全局底线
        lines: 70,
        functions: 60,
        branches: 60,
        statements: 60,
        // 分模块阈值（汇总，非逐文件）
        '**/src/hooks/**': {
          lines: 90,
          branches: 85,
        },
        '**/src/services/**': {
          lines: 80,
          branches: 75,
        },
        '**/src/store/**': {
          lines: 80,
          branches: 75,
        },
        '**/src/utils/**': {
          lines: 80,
          branches: 70,
        },
        '**/src/components/**': {
          lines: 70,
          branches: 55,
        },
        '**/src/config/**': {
          lines: 55,
          branches: 55,
        },
        '**/src/pages/**': {
          lines: 55,
          branches: 45,
        },
        '**/src/router/**': {
          lines: 50,
          branches: 40,
        },
      },
      // 临时目录
      tempDirectory: "./coverage/tmp",
    },
  },

  // 构建配置
  build: {
    // 通过环境变量 MINIFY=false 禁用代码混淆
    minify: process.env.MINIFY !== "false",
    // 设置 chunk 大小警告限制为 500 KB
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // 手动代码分割配置
        manualChunks: (id) => {
          // chunk-init: 初始化 UI 组件 + initSteps 配置（~60KB gzip 目标）
          if (
            id.includes("config/initSteps") ||
            id.includes("components/InitializationController") ||
            id.includes("components/AnimatedLogo") ||
            id.includes("components/canvas-logo") ||
            id.includes("components/FatalErrorScreen") ||
            id.includes("components/NoProvidersAvailable") ||
            id.includes("components/ui/progress")
          ) {
            return "chunk-init";
          }

          // 只处理 node_modules 中的依赖
          if (!id.includes("node_modules")) return;

          const pkg = getPackageName(id);
          if (!pkg) return "vendor";

          // highlight.js 特殊处理：需要区分子路径
          if (pkg === "highlight.js") {
            if (id.includes("/lib/core")) {
              return "vendor-highlight-core";
            }
            if (id.includes("/lib/languages/")) {
              const isPreloaded = preloadedLanguages.some((lang) =>
                id.endsWith(`/languages/${lang}.js`),
              );
              return isPreloaded
                ? "vendor-highlight-core"
                : "vendor-highlight-languages";
            }
            return "vendor-highlight-core";
          }

          // 精确包名匹配
          if (pkg in packageChunkMap) {
            return packageChunkMap[pkg];
          }

          // scope 前缀匹配（如 @ai-sdk/deepseek → @ai-sdk）
          if (pkg.startsWith("@")) {
            const scope = pkg.split("/")[0];
            if (scope in scopeChunkMap) {
              return scopeChunkMap[scope];
            }
          }

          // Tauri 插件特殊处理
          if (
            pkg.startsWith("@tauri-apps/plugin-") ||
            pkg.startsWith("tauri-plugin-")
          ) {
            return "vendor-tauri";
          }

          // 其他所有 node_modules 依赖
          return "vendor";
        },
      },
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      // 匹配 /deepseek/xxx
      "/deepseek": {
        target: "https://api.deepseek.com",
        changeOrigin: true,
        secure: true,
        // 去掉前缀再转发
        rewrite: (requestPath) => requestPath.replace(/^\/deepseek/, ""),
      },
      "/kimi": {
        target: "https://api.moonshot.cn",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => requestPath.replace(/^\/kimi/, ""),
      },
      "/zhipuai-coding-plan": {
        target: "https://open.bigmodel.cn/api/coding/paas/v4",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) =>
          requestPath.replace(/^\/zhipuai-coding-plan/, ""),
      },
      "/zhipuai": {
        target: "https://open.bigmodel.cn/api/paas/v4",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => requestPath.replace(/^\/zhipuai/, ""),
      },
    },
  },
}));
