<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { useResponsive } from "@/composables/useResponsive";
import { useT } from "@/composables/useT";
import { cn } from "@/utils/utils";
import { NAVIGATION_ITEMS } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import type { NavigationItem } from "@/config/navigation";

/**
 * 底部导航栏组件（仅移动端显示）
 */

const navigate = useRouter();
const route = useRoute();
const { isMobile } = useResponsive();
const t = useT();

/**
 * 处理导航点击
 */
function handleNavigation(item: NavigationItem): void {
  void navigate.push(item.path);
}

/**
 * 判断导航项是否激活
 */
function isActive(item: NavigationItem): boolean {
  return route.path.startsWith(item.path) && item.path !== "/";
}
</script>

<template>
  <nav
    v-if="isMobile"
    :aria-label="t(($) => $.common.a11y.bottomNav)"
    class="border-t bg-background h-16 fixed bottom-0 left-0 w-full z-50"
  >
    <div class="flex h-full items-center justify-around">
      <Button
        v-for="item in NAVIGATION_ITEMS"
        :key="item.path"
        variant="ghost"
        :class="
          cn(
            'flex flex-col items-center justify-center gap-1 w-full h-full rounded-none',
            item.theme.base,
            isActive(item) ? item.theme.active : item.theme.inactive,
          )
        "
        :title="t(item.i18nKey as never)"
        :aria-label="t(item.i18nKey as never)"
        :aria-current="isActive(item) ? 'page' : undefined"
        @click="handleNavigation(item)"
      >
        <component :is="item.icon" class="h-5 w-5" />
        <span class="text-xs">{{ t(item.i18nKey as never) }}</span>
      </Button>
    </div>
  </nav>
</template>
