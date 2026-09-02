<script setup lang="ts">
import type { AlertDialogCancelProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { AlertDialogCancel } from "reka-ui"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/utils/utils"

/**
 * 警告对话框取消按钮属性
 */
interface Props extends AlertDialogCancelProps {
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <AlertDialogCancel
    v-bind="props"
    data-slot="alert-dialog-cancel"
    :class="cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', props.class)"
  >
    <slot />
  </AlertDialogCancel>
</template>
