<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDown, ChevronRight } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import StreamingContent from './StreamingContent.vue';

/**
 * 推理内容折叠组件的属性接口
 */
interface ThinkingSectionProps {
  /** 区域标题 */
  title: string;
  /** 推理内容（Markdown 格式） */
  content: string;
  /** 是否处于加载状态 */
  loading?: boolean;
  /** 初始展开状态（默认折叠） */
  initiallyExpanded?: boolean;
}

const props = withDefaults(defineProps<ThinkingSectionProps>(), {
  loading: false,
  initiallyExpanded: false,
});

/** 是否展开 */
const expanded = ref(props.initiallyExpanded);

/** 切换折叠/展开 */
function toggleExpanded(): void {
  expanded.value = !expanded.value;
}
</script>

<!-- 推理内容折叠组件：显示 AI 的推理内容，支持折叠/展开交互 -->
<template>
  <div class="mb-2">
    <Button
      variant="ghost"
      size="sm"
      :aria-expanded="expanded"
      class="w-full font-normal hover:bg-muted/50"
      @click="toggleExpanded"
    >
      <div class="flex items-center w-full">
        <span
          :data-testid="props.loading ? 'thinking-loading' : undefined"
          :class="['text-sm text-left mr-2', props.loading && 'animate-pulse-fade']"
        >
          {{ props.title }}
        </span>

        <!-- 右侧：折叠/展开图标 -->
        <ChevronDown v-if="expanded" :size="16" data-testid="chevron-down" />
        <ChevronRight v-else :size="16" data-testid="chevron-right" />
      </div>
    </Button>

    <div v-if="expanded" class="pl-4 pb-4 mt-2 border-l-2 border-gray-300">
      <StreamingContent
        class="text-sm text-muted-foreground"
        :content="props.content"
        :is-running="props.loading"
      />
    </div>
  </div>
</template>
