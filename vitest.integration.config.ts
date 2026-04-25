import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // 集成测试配置
    setupFiles: ['./src/__test__/integration/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    maxConcurrency: 1,
    isolate: true,

    // 使用 forks 池避免 react-redux ESM 模块初始化竞态
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1, // 保持串行语义
      },
    },

    // 环境
    environment: 'happy-dom',
    globals: true,

    // 仅运行集成测试
    include: ['src/__test__/integration/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/', 'dist/'],

    // 优化依赖项预构建（与 vite.config.ts 同步）
    deps: {
      optimizer: {
        web: {
          include: [
            'use-sync-external-store',
            'cookie',
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react-redux',
            'react-remove-scroll',
            '@radix-ui/react-slot',
          ],
        },
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
