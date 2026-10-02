<script setup lang="ts">
/**
 * 底部导航栏组件（对应旧版 BottomNav/index.tsx）
 * 仅在 Mobile 模式下显示（方案A）
 */
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';
import { NAVIGATION_ITEMS } from '@/config/navigation';
import { cn } from '@/utils/utils';

const router = useRouter();
const route = useRoute();
const { isMobile } = useResponsive();
const { t } = useTranslation();

/** 底部导航项展示数据 */
const navItems = computed(() =>
  NAVIGATION_ITEMS.map((item) => ({
    path: item.path,
    name: t(item.i18nKey),
    Icon: item.icon,
    id: item.id,
    baseClassName: item.theme.base,
    activeClassName: item.theme.active,
    inactiveClassName: item.theme.inactive,
  })),
);

// 方案A：仅在 Mobile 模式下显示底部导航栏
const visible = computed(() => isMobile.value);
</script>

<template>
  <nav
    v-if="visible"
    :aria-label="t('common.a11y.bottomNav')"
    class="fixed bottom-0 left-0 z-50 h-16 w-full border-t bg-background"
  >
    <div class="flex h-full items-center justify-around">
      <Button
        v-for="item in navItems"
        :key="item.path"
        variant="ghost"
        :title="item.name"
        :aria-label="item.name"
        :aria-current="route.path.startsWith(item.path) && item.path !== '/' ? 'page' : undefined"
        :class="cn(
          'flex h-full w-full flex-col items-center justify-center gap-1 rounded-none',
          item.baseClassName,
          route.path.startsWith(item.path) && item.path !== '/'
            ? item.activeClassName
            : item.inactiveClassName,
        )"
        @click="router.push(item.path)"
      >
        <component :is="item.Icon" class="h-5 w-5" />
        <span class="text-xs">{{ item.name }}</span>
      </Button>
    </div>
  </nav>
</template>
