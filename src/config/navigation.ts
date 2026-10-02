import { MessageSquare, Bot, Settings } from 'lucide-vue-next';
import { markRaw, type Component } from 'vue';

/**
 * 导航项 ID 类型
 */
export type NavigationItemId = 'chat' | 'model' | 'setting';

/**
 * 导航项配置接口
 */
export interface NavigationItem {
  /** 导航项 ID */
  id: NavigationItemId;
  /** 国际化键路径 */
  i18nKey: `navigation.${NavigationItemId}`;
  /** 路由路径 */
  path: string;
  /** 图标组件（Vue 组件，markRaw 禁用响应式代理避免渲染开销） */
  icon: Component;
  /** 主题色配置 */
  theme: {
    /** 基础颜色类名 */
    base: string;
    /** 激活状态颜色类名 */
    active: string;
    /** 未激活状态颜色类名 */
    inactive: string;
  };
}

/**
 * 导航项配置列表（唯一数据源）
 */
export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  {
    id: 'chat',
    i18nKey: 'navigation.chat',
    path: '/chat',
    icon: markRaw(MessageSquare),
    theme: {
      base: 'text-blue-400!',
      active: 'bg-blue-100! text-blue-500!',
      inactive: 'hover:text-blue-500! hover:bg-blue-100!',
    },
  },
  {
    id: 'model',
    i18nKey: 'navigation.model',
    path: '/model',
    icon: markRaw(Bot),
    theme: {
      base: 'text-emerald-400!',
      active: 'bg-emerald-100! text-emerald-500!',
      inactive: 'hover:text-emerald-500! hover:bg-emerald-100!',
    },
  },
  {
    id: 'setting',
    i18nKey: 'navigation.setting',
    path: '/setting',
    icon: markRaw(Settings),
    theme: {
      base: 'text-violet-400!',
      active: 'bg-violet-100! text-violet-500!',
      inactive: 'hover:text-violet-500! hover:bg-violet-100!',
    },
  },
] as const;

/**
 * 导航项 ID 映射表（用于 O(1) 查找）
 */
export const NAVIGATION_ITEM_MAP = new Map(
  NAVIGATION_ITEMS.map((item) => [item.id, item]),
);
