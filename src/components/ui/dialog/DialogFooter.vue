<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/utils/utils"

/**
 * 对话框底部属性
 */
interface Props {
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <div
    data-slot="dialog-footer"
    :class="
      cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', props.class)
    "
  >
    <slot />
  </div>
</template>
