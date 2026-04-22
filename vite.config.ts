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
      "@/test-helpers": path.resolve(
        __dirname,
        "./src/__test__/helpers/index.ts",
      ),
      "@/test-helpers/*": path.resolve(__dirname, "./src/__test__/helpers/*"),
      // 配置 highlight.js 别名，用于动态导入
      "/@highlight.js": path.resolve(__dirname, "./node_modules/highlight.js"),
    },
  },

  // Vitest 测试配置
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/__test__/setup.ts"],
    include: ["src/__test__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", "src/__test__/integration/**"],

    // 并行执行配置
    pool: "threads",
    singleThread: false,
    minThreads: 1,
    maxThreads: 2, // 多线程执行单元测试
    useAtomics: true, // 使用 Atomics API 提升性能

    // 优化依赖项预构建
    deps: {
      optimizer: {
        web: {
          // 预构建 CommonJS/ESM 模块以解决兼容性问题
          // react-redux: ESM 初始化时访问 React.version，需预构建确保 React 先解析
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
      provider: "v8",
      reporter: ["text", "html", "json", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/__test__/**",
        "src/__mock__/**",
        "src/main.tsx",
        "src/__test__/setup.ts",
      ],
      // 覆盖率阈值
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
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
