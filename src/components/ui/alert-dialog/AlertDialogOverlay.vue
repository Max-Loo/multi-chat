<script setup lang="ts">
import type { AlertDialogOverlayProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { AlertDialogOverlay } from "reka-ui"
import { cn } from "@/utils/utils"

/**
 * 警告对话框遮罩层属性
 */
interface Props extends AlertDialogOverlayProps {
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <AlertDialogOverlay
    data-slot="alert-dialog-overlay"
    :class="
      cn(
        'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        props.class,
      )
    "
  />
</template>
