<script setup lang="ts">
/**
 * 推理内容折叠组件（对应旧版 chat/ThinkingSection.tsx）
 * 显示 AI 的推理内容，支持折叠/展开交互
 */
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-vue-next';
import StreamingContent from './StreamingContent.vue';

/** 组件属性 */
const props = withDefaults(
  defineProps<{
    /** 区域标题 */
    title: string;
    /** 推理内容（Markdown 格式） */
    content: string;
    /** 是否处于加载状态 */
    loading?: boolean;
    /** 初始展开状态（默认折叠） */
    initiallyExpanded?: boolean;
  }>(),
  { loading: false, initiallyExpanded: false },
);

// 折叠状态
const expanded = ref(props.initiallyExpanded);

/** 切换折叠状态 */
const toggleExpanded = (): void => {
  expanded.value = !expanded.value;
};
</script>

<template>
  <div class="mb-2">
    <Button
      variant="ghost"
      size="sm"
      :aria-expanded="expanded"
      class="w-full font-normal hover:bg-muted/50"
      @click="toggleExpanded"
    >
      <div class="flex w-full items-center">
        <span
          :data-testid="props.loading ? 'thinking-loading' : undefined"
          :class="`mr-2 text-left text-sm ${props.loading && 'animate-pulse-fade'}`"
        >
          {{ title }}
        </span>
        <ChevronDown v-if="expanded" :size="4" data-testid="chevron-down" />
        <ChevronRight v-else :size="4" data-testid="chevron-right" />
      </div>
    </Button>

    <div v-if="expanded" class="mt-2 border-l-2 border-gray-300 pb-4 pl-4">
      <StreamingContent
        class="text-sm text-muted-foreground"
        :content="content"
        :is-running="props.loading"
      />
    </div>
  </div>
</template>
