/**
 * Vue 应用入口
 *
 * 创建并挂载 Vue 应用：Pinia 状态、vue-router 路由。
 * 初始化流程（InitializationManager）与 i18n 绑定在阶段 3 迁移中接入。
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './main.css';
import App from './App.vue';
import router from './router/vueRouter';

// 打印应用版本号到控制台（与 迁移前入口行为一致）
console.log(
  `%c Multi Chat %c v${__APP_VERSION__} `,
  'background:#2563eb; color:white; border-radius:3px 0 0 3px; padding:2px 5px;',
  'background:#1e40af; color:white; border-radius:0 3px 3px 0; padding:2px 5px;',
);

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#root');
