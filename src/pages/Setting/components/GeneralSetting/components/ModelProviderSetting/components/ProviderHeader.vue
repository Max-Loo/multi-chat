<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { RefreshCw } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

/**
 * ProviderHeader 组件的属性
 */
interface ProviderHeaderProps {
  /** 是否正在加载 */
  loading: boolean;
  /** 最后更新时间（ISO 8601 格式） */
  lastUpdate: string | null;
}

const props = defineProps<ProviderHeaderProps>();

const emit = defineEmits<{
  /** 刷新按钮点击 */
  (e: 'refresh'): void;
}>();

const { t, i18next } = useTranslation();

/** 格式化最后更新时间（跟随当前语言） */
const formattedLastUpdate = computed(() => {
  if (!props.lastUpdate) return null;
  const date = new Date(props.lastUpdate);
  const locale = i18next.language === 'zh' ? 'zh-CN' : 'en-US';
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
});
</script>

<!-- 供应商设置页面头部：标题、刷新按钮和最后更新时间 -->
<template>
  <div class="space-y-4">
    <div class="flex items-start justify-between">
      <div>
        <h3 class="text-lg font-semibold">{{ t('setting.modelProvider.title') }}</h3>
        <p class="text-sm text-muted-foreground">
          {{ t('setting.modelProvider.description') }}
        </p>
      </div>

      <div class="flex flex-col items-end gap-2">
        <Button variant="outline" size="sm" :disabled="props.loading" @click="emit('refresh')">
          <RefreshCw :class="['mr-2 h-4 w-4', props.loading && 'animate-spin']" />
          {{ props.loading ? t('setting.modelProvider.refreshing') : t('setting.modelProvider.refreshButton') }}
        </Button>

        <div v-if="props.lastUpdate" class="text-sm text-muted-foreground">
          {{ t('setting.modelProvider.lastUpdateLabel') }} {{ formattedLastUpdate }}
        </div>
      </div>
    </div>
  </div>
</template>
