<script setup lang="ts">
import type { AlertDialogActionProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { AlertDialogAction } from "reka-ui"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/utils/utils"

/**
 * 警告对话框确认按钮属性
 */
interface Props extends AlertDialogActionProps {
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <AlertDialogAction
    v-bind="props"
    data-slot="alert-dialog-action"
    :class="cn(buttonVariants(), props.class)"
  >
    <slot />
  </AlertDialogAction>
</template>
