/**
 * 应用入口（Vue 版，对应旧版 main.tsx）
 *
 * 四阶段启动：HTML Spinner（index.html）→ 顶层 await import(initSteps)
 * → 初始化控制器组件逐步执行并展示动画 → 完成后动态加载主应用。
 */
import { createApp, h, Suspense, defineAsyncComponent } from 'vue';
import './main.css';
import App from './App.vue';
import { getAppPinia } from '@/stores/pinia';
import router from '@/router';
import { interceptClickAToJump } from '@/services/global';
import type { InitStep } from '@/services/initialization';

// 阶段 1：异步导入 initSteps，确保依赖模块正确初始化
const initStepsModule = await import('@/config/initSteps');
const initSteps: InitStep[] = initStepsModule.initSteps;

// 打印应用版本号到控制台
console.log(
  `%c Multi Chat %c v${__APP_VERSION__} `,
  'background:#2563eb; color:white; border-radius:3px 0 0 3px; padding:2px 5px;',
  'background:#1e40af; color:white; border-radius:0 3px 3px 0; padding:2px 5px;',
);

// 创建 Vue 应用：根组件为 Suspense 包裹的 App（App 内含异步子组件）
const AsyncApp = defineAsyncComponent(() => Promise.resolve(App));
const app = createApp({
  render: () =>
    h(Suspense, null, {
      default: () => h(AsyncApp, { initSteps }),
    }),
});

// 安装 Pinia（与初始化流程共享同一实例）与路由
app.use(getAppPinia());
app.use(router);

// 挂载到 #root（index.html 中的 HTML Spinner 会被替换）
app.mount('#root');

// 拦截 <a> 点击跳转外部链接
interceptClickAToJump();
