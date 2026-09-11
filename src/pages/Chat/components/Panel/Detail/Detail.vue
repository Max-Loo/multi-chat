<script setup lang="ts">
/**
 * 聊天详情面板（Vue 版 Detail 过渡实现）
 * 任务 4.3 后续推进：迁移 Detail/index.tsx（消息列表、流式滚动、Title、气泡接线）
 */
const props = defineProps<{ chatModel: { modelId: string } }>();
</script>

<template>
  <div :data-testid="`detail-${props.chatModel.modelId}`" class="flex h-full w-full items-center justify-center">
    <span class="text-muted-foreground">Detail（迁移中）</span>
  </div>
</template>
