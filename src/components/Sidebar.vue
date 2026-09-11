<script setup lang="ts">
/**
 * 侧边导航栏（Vue 版 Sidebar）
 * 桌面端左侧竖排导航，行为与 React 版 Sidebar 保持一致
 */
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isNotNil } from 'es-toolkit';
import { Button } from '@/components/ui-vue/button';
import { useCurrentSelectedChat } from '@/composables/useCurrentSelectedChat';
import { useNavigateToChat } from '@/composables/useNavigateToPage';
import { useTranslation } from '@/composables/useTranslation';
import { NAVIGATION_ITEMS } from '@/config/navigationVue';

const props = defineProps<{ class?: string }>();

const { t } = useTranslation();
const route = useRoute();
const router = useRouter();

const selectedChat = useCurrentSelectedChat();
const { navigateToChat } = useNavigateToChat();

const navigationItems = computed(() =>
  NAVIGATION_ITEMS.map((item) => ({
    id: item.id,
    name: t(item.i18nKey as never),
    IconComponent: item.IconComponent,
    path: item.path,
    baseClassName: item.theme.base,
    activeClassName: item.theme.active,
    inactiveClassName: item.theme.inactive,
  })),
);

const handleNavigation = (item: { path: string }) => {
  // 就在当前页面就不用跳转
  if (route.path === item.path) return;

  // 处理记忆「上一次点击查看的聊天」
  if (item.path === '/chat' && isNotNil(selectedChat.value)) {
    navigateToChat({ chatId: selectedChat.value!.id });
    return;
  }

  void router.push(item.path);
};
</script>

<template>
  <nav
    :class="`h-full w-auto border-r border-gray-200 bg-gray-50 ${props.class ?? ''}`"
    :aria-label="t('common.a11y.mainNav') as string"
  >
    <div class="flex flex-col items-center space-y-2 py-4">
      <Button
        v-for="item in navigationItems"
        :key="item.id"
        variant="ghost"
        :title="item.name"
        :aria-current="route.path.startsWith(item.path) ? 'page' : undefined"
        :class="`
          flex h-10 w-10 items-center justify-center
          ml-1 mr-1 rounded-xl text-xl
          [&_svg]:size-5
          ${item.baseClassName} ${route.path.startsWith(item.path) ? item.activeClassName : item.inactiveClassName}
        `"
        @click="handleNavigation(item)"
      >
        <component :is="item.IconComponent" :size="24" />
      </Button>
    </div>
  </nav>
</template>
