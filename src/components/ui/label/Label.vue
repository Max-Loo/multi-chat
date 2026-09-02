<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { Label as RekaLabel } from "reka-ui"
import { computed } from "vue"
import { cn } from "@/utils/utils"

/**
 * 标签组件属性
 */
interface Props {
  /** 关联的表单元素 ID */
  for?: string
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()

/** 标签样式类（与迁移前逐字一致） */
const labelVariants = computed(() =>
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
)
</script>

<template>
  <RekaLabel
    data-slot="label"
    :for="props.for"
    :class="cn(labelVariants, props.class)"
  >
    <slot />
  </RekaLabel>
</template>
