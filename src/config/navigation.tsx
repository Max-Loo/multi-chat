import { MessageSquare, Bot, Settings } from "lucide-react";
import type { ReactNode } from "react";

/**
 * 导航项 ID 类型
 */
export type NavigationItemId = "chat" | "model" | "setting";

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
  /** 图标组件（已渲染的 ReactNode，用于 Sidebar） */
  icon: ReactNode;
  /** 图标组件类（用于 BottomNav 等需要动态渲染的场景） */
  IconComponent: React.ComponentType<{ className?: string }>;
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
    id: "chat",
    i18nKey: "navigation.chat",
    path: "/chat",
    // 对于 Sidebar，直接提供已渲染的 React 元素
    icon: <MessageSquare size={24} />,
    // 对于 BottomNav，提供组件类
    IconComponent: MessageSquare,
    theme: {
      base: "text-nav-chat",
      active: "bg-nav-chat-muted text-nav-chat",
      inactive: "hover:text-nav-chat hover:bg-nav-chat-muted",
    },
  },
  {
    id: "model",
    i18nKey: "navigation.model",
    path: "/model",
    icon: <Bot size={24} />,
    IconComponent: Bot,
    theme: {
      base: "text-nav-model",
      active: "bg-nav-model-muted text-nav-model",
      inactive: "hover:text-nav-model hover:bg-nav-model-muted",
    },
  },
  {
    id: "setting",
    i18nKey: "navigation.setting",
    path: "/setting",
    icon: <Settings size={24} />,
    IconComponent: Settings,
    theme: {
      base: "text-nav-setting",
      active: "bg-nav-setting-muted text-nav-setting",
      inactive: "hover:text-nav-setting hover:bg-nav-setting-muted",
    },
  },
] as const;

/**
 * 导航项 ID 映射表（用于 O(1) 查找）
 */
export const NAVIGATION_ITEM_MAP = new Map(
  NAVIGATION_ITEMS.map((item) => [item.id, item])
);
