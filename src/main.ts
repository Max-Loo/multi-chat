import { createApp } from "vue";
import { createPinia, setActivePinia } from "pinia";
import "./main.css";
import { interceptClickAToJump } from "@/services/global";
import App from "./App.vue";
import type { InitStep } from "@/services/initialization";

// 异步导入 initSteps，确保依赖模块正确初始化
const initStepsModule = await import("@/config/initSteps");

// 打印应用版本号到控制台
console.log(
  `%c Multi Chat %c v${__APP_VERSION__} `,
  "background:#2563eb; color:white; border-radius:3px 0 0 3px; padding:2px 5px;",
  "background:#1e40af; color:white; border-radius:0 3px 3px 0; padding:2px 5px;",
);

// 创建 Pinia 实例并激活，允许在组件树之外（initSteps 步骤执行）访问 store
const pinia = createPinia();
setActivePinia(pinia);

// 创建 Vue 应用并注入初始化步骤
const app = createApp(App, {
  initSteps: initStepsModule.initSteps as InitStep[],
});

app.use(pinia);

// 挂载到 #root（HTML Spinner 在挂载前显示，挂载后被应用内容替换）
app.mount("#root");

interceptClickAToJump();
