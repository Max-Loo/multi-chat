<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTranslation } from 'i18next-vue';
import { Button } from '@/components/ui/button';
import { NAVIGATION_ITEMS } from '@/config/navigation';
import { useResponsive } from '@/composables/useResponsive';
import { cn } from '@/utils/utils';

/**
 * 底部导航栏组件（方案A：仅在 Mobile 模式下显示）
 */
const { t } = useTranslation();
const route = useRoute();
const router = useRouter();
const { isMobile } = useResponsive();

/** 导航项视图模型（含翻译名称） */
const navItems = computed(() =>
  NAVIGATION_ITEMS.map((item) => ({
    path: item.path,
    name: t(item.i18nKey),
    icon: item.icon,
    baseClassName: item.theme.base,
    activeClassName: item.theme.active,
    inactiveClassName: item.theme.inactive,
  })),
);
</script>

<template>
  <nav
    v-if="isMobile"
    :aria-label="t('common.a11y.bottomNav')"
    class="border-t bg-background h-16 fixed bottom-0 left-0 w-full z-50"
  >
    <div class="flex h-full items-center justify-around">
      <Button
        v-for="item in navItems"
        :key="item.path"
        variant="ghost"
        :title="item.name"
        :aria-label="item.name"
        :aria-current="
          route.path.startsWith(item.path) && item.path !== '/' ? 'page' : undefined
        "
        :class="
          cn(
            'flex flex-col items-center justify-center gap-1 w-full h-full rounded-none',
            item.baseClassName,
            route.path.startsWith(item.path) && item.path !== '/'
              ? item.activeClassName
              : item.inactiveClassName,
          )
        "
        @click="router.push(item.path)"
      >
        <component :is="item.icon" class="h-5 w-5" />
        <span class="text-xs">{{ item.name }}</span>
      </Button>
    </div>
  </nav>
</template>
