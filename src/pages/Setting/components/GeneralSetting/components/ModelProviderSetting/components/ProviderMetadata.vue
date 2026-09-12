<script setup lang="ts">
/**
 * 供应商元数据组件（Vue 版 ProviderMetadata）
 * 显示 API 端点和文档链接
 */
import { ExternalLink } from 'lucide-vue-next';
import { Button } from '@/components/ui-vue/button';
import { useTranslation } from '@/composables/useTranslation';

const props = defineProps<{
  /** API 端点 */
  apiEndpoint: string;
  /** 供应商唯一标识符 */
  providerKey: string;
}>();

const { t } = useTranslation();

/** 构建文档链接（根据不同供应商） */
const getDocUrl = () => {
  const docUrls: Record<string, string> = {
    deepseek: 'https://platform.deepseek.com/api-docs/',
    moonshotai: 'https://platform.moonshot.cn/docs',
    zhipu: 'https://open.bigmodel.cn/dev/api',
  };
  return docUrls[props.providerKey] || `https://docs.${props.providerKey}.com`;
};
</script>

<template>
  <div class="space-y-2 text-sm">
    <div class="flex items-center justify-between">
      <span class="text-muted-foreground">{{ t(($) => $.setting.modelProvider.apiEndpoint) }}</span>
      <span class="rounded bg-muted px-2 py-1 font-mono text-xs">
        {{ props.apiEndpoint }}
      </span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-muted-foreground">{{ t(($) => $.setting.modelProvider.providerId) }}</span>
      <span class="font-mono text-xs">{{ props.providerKey }}</span>
    </div>
    <div class="flex justify-end pt-2">
      <Button
        variant="ghost"
        size="sm"
        class="gap-1 text-xs"
        as-child
      >
        <a
          :href="getDocUrl()"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
        >
          <ExternalLink class="h-3 w-3" />
          {{ t(($) => $.setting.modelProvider.viewDocs) }}
        </a>
      </Button>
    </div>
  </div>
</template>
