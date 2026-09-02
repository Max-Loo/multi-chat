<script setup lang="ts">
import type { DialogTitleProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { DialogTitle } from "reka-ui"
import { cn } from "@/utils/utils"

/**
 * 对话框标题属性
 */
interface Props extends DialogTitleProps {
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <DialogTitle
    data-slot="dialog-title"
    :class="cn('text-lg font-semibold leading-none tracking-tight', props.class)"
  >
    <slot />
  </DialogTitle>
</template>
