<script setup lang="ts">
import type { AlertDialogDescriptionProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { AlertDialogDescription } from "reka-ui"
import { cn } from "@/utils/utils"

/**
 * 警告对话框描述属性
 */
interface Props extends AlertDialogDescriptionProps {
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <AlertDialogDescription
    data-slot="alert-dialog-description"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </AlertDialogDescription>
</template>
