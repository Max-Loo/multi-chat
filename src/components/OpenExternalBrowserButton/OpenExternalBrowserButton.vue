<script setup lang="ts">
/**
 * 可以点击打开外部浏览器的按钮（Vue 版 OpenExternalBrowserButton）
 */
import { ExternalLink } from 'lucide-vue-next';
import { Button } from '@/components/ui-vue/button';
import { useNavigateToExternalSite } from '@/composables/useNavigateToExternalSite';

const props = withDefaults(
  defineProps<{
    // 要打开的网址
    siteUrl: string | undefined;
    className?: string;
  }>(),
  { className: '' },
);

const { navToExternalSite } = useNavigateToExternalSite();

// 跳转到外部网站（纯 Web 环境直接新开标签页）
const navToOfficialSite = () => {
  if (props.siteUrl) {
    navToExternalSite(props.siteUrl);
  }
};
</script>

<template>
  <Button v-if="props.siteUrl" variant="ghost" :class="props.className" @click="navToOfficialSite">
    <ExternalLink class="h-4 w-4" />
  </Button>
</template>
