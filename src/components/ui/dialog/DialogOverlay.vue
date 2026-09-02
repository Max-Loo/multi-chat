<script setup lang="ts">
import type { DialogOverlayProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { DialogOverlay } from "reka-ui"
import { cn } from "@/utils/utils"

/**
 * 遮罩层组件属性
 */
interface Props extends DialogOverlayProps {
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <DialogOverlay
    data-slot="dialog-overlay"
    :class="
      cn(
        'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        props.class,
      )
    "
  />
</template>
