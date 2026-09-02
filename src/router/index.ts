import { defineAsyncComponent } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import Layout from "@/components/Layout";
import PageSkeleton from "@/components/Skeleton/PageSkeleton.vue";
import type { Component } from "vue";

/**
 * 页面懒加载封装
 * 加载期间显示 PageSkeleton（与迁移前 React.lazy + Suspense fallback 行为一致）
 */
function lazyPage(loader: () => Promise<Component>): Component {
  return defineAsyncComponent({
    loader,
    loadingComponent: PageSkeleton,
    // 立即显示骨架屏，避免快速路由切换时的加载闪烁不一致
    delay: 0,
  });
}

// 仅开发环境添加 toast-test 路由
const toastTestRoute = import.meta.env.DEV
  ? {
      path: "toast-test",
      component: () => import("@/pages/Setting/components/ToastTest/index.vue"),
    }
  : null;

// import.meta.env.BASE_URL 会自动读取 vite.config.ts 中的 base 配置
// 注意：它会包含末尾的斜杠，比如 '/my-repo/'
const basename = import.meta.env.BASE_URL;

// 移除末尾的斜杠（createWebHistory 的 base 不需要末尾斜杠）
const routerBasename = basename.endsWith("/")
  ? basename.slice(0, -1) // 移除末尾的斜杠
  : basename;

const router = createRouter({
  history: createWebHistory(routerBasename),
  routes: [
    {
      path: "/",
      component: Layout,
      children: [
        {
          path: "",
          redirect: "/chat",
        },
        {
          path: "chat",
          component: lazyPage(() => import("@/pages/Chat/index.vue")),
        },
        {
          path: "model",
          component: () => import("@/pages/Model/index.vue"),
          children: [
            {
              path: "",
              redirect: "/model/table",
            },
            {
              path: "table",
              component: lazyPage(() => import("@/pages/Model/ModelTable/index.vue")),
            },
            {
              path: "add",
              component: lazyPage(() => import("@/pages/Model/CreateModel/index.vue")),
            },
          ],
        },
        {
          path: "setting",
          component: () => import("@/pages/Setting/index.vue"),
          children: [
            {
              path: "",
              redirect: "/setting/common",
            },
            {
              path: "common",
              component: lazyPage(
                () => import("@/pages/Setting/components/GeneralSetting/index.vue"),
              ),
            },
            {
              path: "key-management",
              component: lazyPage(
                () => import("@/pages/Setting/components/KeyManagementSetting/index.vue"),
              ),
            },
            ...(toastTestRoute ? [toastTestRoute] : []),
          ],
        },
        // 兜底路由，匹配所有未定义的路径
        {
          path: "/:pathMatch(.*)*",
          redirect: "/404",
        },
        {
          path: "404",
          component: lazyPage(() => import("@/pages/NotFound/index.vue")),
        },
      ],
    },
  ],
});

export default router;
