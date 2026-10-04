import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    // 集成测试配置
    setupFiles: ['./src/__test__/integration/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    maxConcurrency: 1,
    isolate: true,

    // 使用 forks 池获得稳定的测试隔离
    pool: 'forks',
    maxWorkers: 1, // 保持串行语义

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
          include: ['vue', 'pinia', 'vue-router', 'vue-demi', '@vueuse/core'],
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
