<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import type { ModelDetail } from '@/services/modelRemote';

/**
 * 模型列表组件属性
 */
interface ModelListProps {
  /** 模型列表 */
  models: ModelDetail[];
}

const props = defineProps<ModelListProps>();
</script>

<!-- 模型列表：标签云形式展示所有模型 -->
<template>
  <div v-if="props.models.length === 0" class="text-center text-sm text-muted-foreground py-4">
    没有找到匹配的模型
  </div>

  <div v-else class="flex flex-wrap gap-2">
    <Badge
      v-for="model in props.models"
      :key="model.modelKey"
      variant="secondary"
      class="px-3 py-1 text-xs font-normal"
    >
      {{ model.modelName }}
      <span class="ml-1 text-muted-foreground">({{ model.modelKey }})</span>
    </Badge>
  </div>
</template>
