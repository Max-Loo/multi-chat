<script setup lang="ts">
/**
 * 侧边导航栏组件（对应旧版 Sidebar/index.tsx）
 *
 * 渲染全局导航项；切到聊天页时记忆「上一次查看的聊天」。
 */
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isNotNil } from 'es-toolkit';
import { Button } from '@/components/ui/button';
import { useCurrentSelectedChat } from '@/composables/useCurrentSelectedChat';
import { useNavigateToChat } from '@/composables/useNavigateToPage';
import { useTranslation } from '@/composables/useTranslation';
import { NAVIGATION_ITEMS, type NavigationItem } from '@/config/navigation';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();

const { t } = useTranslation();
const router = useRouter();
const route = useRoute();

const selectedChat = useCurrentSelectedChat();
const { navigateToChat } = useNavigateToChat();

/** 导航项展示数据（翻译后的名称与主题类名） */
interface NavigationDisplayItem {
  id: string;
  name: string;
  icon: NavigationItem['icon'];
  path: string;
  baseClassName: string;
  activeClassName: string;
  inactiveClassName: string;
}

// 提前构建好类名，避免在渲染中动态拼接
const navigationItems = computed<NavigationDisplayItem[]>(() =>
  NAVIGATION_ITEMS.map((item) => ({
    id: item.id,
    name: t(item.i18nKey),
    icon: item.icon,
    path: item.path,
    baseClassName: item.theme.base,
    activeClassName: item.theme.active,
    inactiveClassName: item.theme.inactive,
  })),
);

/**
 * 处理导航点击
 */
const handleNavigation = (item: NavigationDisplayItem) => {
  // 就在当前页面就不用跳转
  if (route.path === item.path) return;

  // 处理记忆「上一次点击查看的聊天」
  if (item.path === '/chat' && isNotNil(selectedChat.value)) {
    navigateToChat({ chatId: selectedChat.value.id });
    return;
  }

  void router.push(item.path);
};
</script>

<template>
  <nav
    :aria-label="t('common.a11y.mainNav')"
    :class="cn('h-full w-auto border-r border-gray-200 bg-gray-50', props.class)"
  >
    <div class="flex flex-col items-center space-y-2 py-4">
      <Button
        v-for="item in navigationItems"
        :key="item.id"
        variant="ghost"
        :title="item.name"
        :aria-current="route.path.startsWith(item.path) ? 'page' : undefined"
        :class="cn(
          'ml-1 mr-1 flex h-10 w-10 items-center justify-center rounded-xl text-xl',
          '[&_svg]:size-5',
          item.baseClassName,
          route.path.startsWith(item.path) ? item.activeClassName : item.inactiveClassName,
        )"
        @click="handleNavigation(item)"
      >
        <component :is="item.icon" :size="24" />
      </Button>
    </div>
  </nav>
</template>
