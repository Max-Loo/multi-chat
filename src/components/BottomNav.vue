<script setup lang="ts">
/**
 * 底部导航栏（Vue 版 BottomNav）
 * 仅移动端模式显示，行为与 React 版 BottomNav 保持一致
 */
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';
import { cn } from '@/utils/utils';
import { NAVIGATION_ITEMS } from '@/config/navigationVue';
import { Button } from '@/components/ui-vue/button';

const route = useRoute();
const router = useRouter();
const { isMobile } = useResponsive();
const { t } = useTranslation();

const navItems = computed(() =>
  NAVIGATION_ITEMS.map((item) => ({
    path: item.path,
    name: t(item.i18nKey as never),
    IconComponent: item.IconComponent,
    id: item.id,
    baseClassName: item.theme.base,
    activeClassName: item.theme.active,
    inactiveClassName: item.theme.inactive,
  })),
);

const handleNavigate = (path: string) => {
  void router.push(path);
};
</script>

<template>
  <!-- 方案A：仅在 Mobile 模式下显示底部导航栏 -->
  <nav
    v-if="isMobile"
    :aria-label="t('common.a11y.bottomNav') as string"
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
          route.path.startsWith(item.path) && item.path !== '/' ? item.activeClassName : item.inactiveClassName,
        )"
        @click="handleNavigate(item.path)"
      >
        <component :is="item.IconComponent" class="h-5 w-5" />
        <span class="text-xs">{{ item.name }}</span>
      </Button>
    </div>
  </nav>
</template>
