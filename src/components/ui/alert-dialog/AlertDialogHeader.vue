<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/utils/utils"

/**
 * 警告对话框头部属性
 */
interface Props {
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <div
    data-slot="alert-dialog-header"
    :class="cn('flex flex-col space-y-2 text-center sm:text-left', props.class)"
  >
    <slot />
  </div>
</template>
