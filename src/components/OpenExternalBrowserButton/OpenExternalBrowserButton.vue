<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { openExternal } from '@/utils/openExternal';

/**
 * 可以点击打开外部浏览器的按钮属性
 */
interface OpenExternalBrowserButtonProps {
  /** 要打开的网址 */
  siteUrl: string | undefined;
}

const props = defineProps<OpenExternalBrowserButtonProps>();

/**
 * 跳转到外部网站
 */
function navToOfficialSite(): void {
  if (props.siteUrl) {
    openExternal(props.siteUrl);
  }
}
</script>

<template>
  <Button v-if="props.siteUrl" variant="ghost" @click="navToOfficialSite">
    <ExternalLink class="h-4 w-4" />
  </Button>
</template>
