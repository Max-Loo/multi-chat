<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { ProgressIndicator, ProgressRoot } from "reka-ui"
import { computed } from "vue"
import { cn } from "@/utils/utils"

/**
 * 进度条组件属性
 */
interface Props {
  /** 当前进度（0-100） */
  value?: number
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()

/** 当前进度（默认 0，确保进度条从 0% 开始） */
const modelValue = computed(() => props.value ?? 0)
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    :model-value="modelValue"
    :class="
      cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
        props.class,
      )
    "
  >
    <ProgressIndicator
      data-slot="progress-indicator"
      class="h-full w-full flex-1 bg-primary transition-all"
      :style="{ transform: `translateX(-${100 - modelValue}%)` }"
    />
  </ProgressRoot>
</template>
