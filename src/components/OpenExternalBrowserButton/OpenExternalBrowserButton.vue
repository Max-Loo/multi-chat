<script setup lang="ts">
/**
 * 可以点击打开外部浏览器的按钮（对应旧版 OpenExternalBrowserButton/index.tsx）
 */
import { useNavigateToExternalSite } from '@/composables/useNavigateToExternalSite';
import { ExternalLink } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

/** 组件属性 */
withDefaults(
  defineProps<{
    /** 要打开的网址 */
    siteUrl: string | undefined;
    /** 自定义类名 */
    className?: string;
  }>(),
  { className: '' },
);

const { navToExternalSite } = useNavigateToExternalSite();
</script>

<template>
  <Button
    v-if="siteUrl"
    variant="ghost"
    :class="className"
    @click="navToExternalSite(siteUrl)"
  >
    <ExternalLink class="h-4 w-4" />
  </Button>
</template>
