<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/utils/utils"

/**
 * 提示框标题属性
 */
interface Props {
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <h5
    data-slot="alert-title"
    :class="cn('mb-1 font-medium leading-none tracking-tight', props.class)"
  >
    <slot />
  </h5>
</template>
