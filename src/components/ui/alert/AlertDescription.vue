<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/utils/utils"

/**
 * 提示框描述属性
 */
interface Props {
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <div
    data-slot="alert-description"
    :class="cn('text-sm [&_p]:leading-relaxed', props.class)"
  >
    <slot />
  </div>
</template>
