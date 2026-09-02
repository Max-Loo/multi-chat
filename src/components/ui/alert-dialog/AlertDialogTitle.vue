<script setup lang="ts">
import type { AlertDialogTitleProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { AlertDialogTitle } from "reka-ui"
import { cn } from "@/utils/utils"

/**
 * 警告对话框标题属性
 */
interface Props extends AlertDialogTitleProps {
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <AlertDialogTitle
    data-slot="alert-dialog-title"
    :class="cn('text-lg font-semibold', props.class)"
  >
    <slot />
  </AlertDialogTitle>
</template>
