<script setup lang="ts">
/**
 * 模型列表组件（对应旧版 ModelList.tsx）
 * 使用标签云形式展示所有模型
 */
import { Badge } from '@/components/ui/badge';
import type { ModelDetail } from '@/services/modelRemote';

/** 组件属性 */
defineProps<{ models: ModelDetail[] }>();
</script>

<template>
  <div v-if="models.length === 0" class="py-4 text-center text-sm text-muted-foreground">
    没有找到匹配的模型
  </div>
  <div v-else class="flex flex-wrap gap-2">
    <Badge
      v-for="model in models"
      :key="model.modelKey"
      variant="secondary"
      class="px-3 py-1 text-xs font-normal"
    >
      {{ model.modelName }}
      <span class="ml-1 text-muted-foreground">({{ model.modelKey }})</span>
    </Badge>
  </div>
</template>
