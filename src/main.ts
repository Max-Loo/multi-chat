/**
 * 应用入口
 *
 * 启动流程：HTML Spinner → 动态加载 initSteps → 初始化动画 → 主应用挂载
 * 与迁移前 main.tsx 的阶段划分保持一致
 */
import './main.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import { interceptClickAToJump } from '@/services/global';
import App from '@/App.vue';
import router from '@/router';

// 打印应用版本号到控制台
console.log(
  `%c Multi Chat %c v${__APP_VERSION__} `,
  'background:#2563eb; color:white; border-radius:3px 0 0 3px; padding:2px 5px;',
  'background:#1e40af; color:white; border-radius:0 3px 3px 0; padding:2px 5px;',
);

// 异步导入 initSteps，确保依赖模块正确初始化
const { initSteps } = await import('@/config/initSteps');

// 创建应用：注册 Pinia、路由与 i18n 绑定层
const app = createApp(App, { initSteps });
app.use(createPinia());
app.use(router);
app.use(I18NextVue, { i18next });
app.mount('#root');

// 外部链接拦截：应用内点击外链一律走新标签页打开
interceptClickAToJump();
