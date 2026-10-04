<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTranslation } from 'i18next-vue';
import { isNotNil } from 'es-toolkit';
import { Button } from '@/components/ui/button';
import { NAVIGATION_ITEMS } from '@/config/navigation';
import { useSelectedChat } from '@/store/selectors/chatSelectors';
import { useNavigateToChat } from '@/composables/useNavigateToPage';

/**
 * 侧边导航栏组件
 *
 * 垂直排列导航项，处理「记住上一次查看的聊天」的跳转逻辑
 */
const { t } = useTranslation();
const route = useRoute();
const router = useRouter();

const selectedChat = useSelectedChat();
const { navigateToChat } = useNavigateToChat();

/** 导航项视图模型（含翻译名称） */
const navigationItems = computed(() =>
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
 * @param item 目标导航项
 */
function handleNavigation(item: { path: string }): void {
  // 就在当前页面就不用跳转
  if (route.path === item.path) return;

  // 处理记忆「上一次点击查看的聊天」
  if (item.path === '/chat' && isNotNil(selectedChat.value)) {
    navigateToChat({ chatId: selectedChat.value!.id });
    return;
  }

  router.push(item.path);
}
</script>

<template>
  <nav
    :aria-label="t('common.a11y.mainNav')"
    class="w-auto h-full bg-gray-50 border-r border-gray-200"
  >
    <div class="flex flex-col items-center py-4 space-y-2">
      <Button
        v-for="item in navigationItems"
        :key="item.id"
        variant="ghost"
        :title="item.name"
        :aria-current="route.path.startsWith(item.path) ? 'page' : undefined"
        :class="[
          'flex items-center justify-center ml-1 mr-1 w-10 h-10 text-xl rounded-xl [&_svg]:size-5',
          item.baseClassName,
          route.path.startsWith(item.path) ? item.activeClassName : item.inactiveClassName,
        ]"
        @click="handleNavigation(item)"
      >
        <component :is="item.icon" />
      </Button>
    </div>
  </nav>
</template>
