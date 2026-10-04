<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { ExternalLink } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

/**
 * 供应商元数据组件属性
 */
interface ProviderMetadataProps {
  /** API 端点 */
  apiEndpoint: string;
  /** 供应商唯一标识符 */
  providerKey: string;
}

const props = defineProps<ProviderMetadataProps>();

const { t } = useTranslation();

/** 供应商文档链接映射 */
const DOC_URLS: Record<string, string> = {
  deepseek: 'https://platform.deepseek.com/api-docs/',
  moonshotai: 'https://platform.moonshot.cn/docs',
  zhipu: 'https://open.bigmodel.cn/dev/api',
};

/** 文档链接（根据不同供应商回退到通用地址） */
const docUrl = computed(() => DOC_URLS[props.providerKey] || `https://docs.${props.providerKey}.com`);
</script>

<!-- 供应商元数据：API 端点和文档链接 -->
<template>
  <div class="space-y-2 text-sm">
    <div class="flex items-center justify-between">
      <span class="text-muted-foreground">{{ t('setting.modelProvider.apiEndpoint') }}</span>
      <span class="font-mono text-xs bg-muted px-2 py-1 rounded">
        {{ props.apiEndpoint }}
      </span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-muted-foreground">{{ t('setting.modelProvider.providerId') }}</span>
      <span class="font-mono text-xs">{{ props.providerKey }}</span>
    </div>
    <div class="flex justify-end pt-2">
      <Button variant="ghost" size="sm" class="gap-1 text-xs" as-child>
        <a
          :href="docUrl"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
        >
          <ExternalLink class="w-3 h-3" />
          {{ t('setting.modelProvider.viewDocs') }}
        </a>
      </Button>
    </div>
  </div>
</template>
