<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import { useCurrentSelectedChat } from "@/composables/useCurrentSelectedChat";
import { isNotNil } from "es-toolkit";
import { useNavigateToChat } from "@/composables/useNavigateToPage";
import { useT } from "@/composables/useT";
import { NAVIGATION_ITEMS } from "@/config/navigation";
import type { NavigationItem } from "@/config/navigation";

/**
 * 侧边导航栏组件（桌面端）
 */

interface SidebarProps {
  /** 自定义类名 */
  className?: string;
}

const props = withDefaults(defineProps<SidebarProps>(), {
  className: "",
});

const t = useT();
const route = useRoute();
const navigate = useRouter();

const selectedChat = useCurrentSelectedChat();
const { navigateToChat } = useNavigateToChat();

/**
 * 当前激活的导航项判断
 */
function isActive(item: NavigationItem): boolean {
  return route.path.startsWith(item.path);
}

/**
 * 处理导航点击
 */
function handleNavigation(item: NavigationItem): void {
  // 就在当前页面就不用跳转
  if (route.path === item.path) return;

  // 处理记忆「上一次点击查看的聊天」
  if (item.path === "/chat" && isNotNil(selectedChat.value)) {
    navigateToChat({
      chatId: selectedChat.value.id,
    });
    return;
  }

  void navigate.push(item.path);
}

const ariaLabel = computed(() => t(($) => $.common.a11y.mainNav));
</script>

<template>
  <nav
    :aria-label="ariaLabel"
    :class="`w-auto h-full bg-gray-50 border-r border-gray-200 ${props.className}`"
  >
    <div class="flex flex-col items-center py-4 space-y-2">
      <template v-for="item in NAVIGATION_ITEMS" :key="item.id">
        <Button
          variant="ghost"
          :title="t(item.i18nKey as never)"
          :aria-current="isActive(item) ? 'page' : undefined"
          :class="`
            flex items-center justify-center
            ml-1 mr-1 w-10 h-10 text-xl rounded-xl
            [&_svg]:size-5
            ${item.theme.base} ${isActive(item) ? item.theme.active : item.theme.inactive}
          `"
          @click="handleNavigation(item)"
        >
          <component :is="item.icon" :size="24" />
        </Button>
      </template>
    </div>
  </nav>
</template>
