<script setup lang="ts">
import type { DialogDescriptionProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { DialogDescription } from "reka-ui"
import { cn } from "@/utils/utils"

/**
 * 对话框描述属性
 */
interface Props extends DialogDescriptionProps {
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <DialogDescription
    data-slot="dialog-description"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </DialogDescription>
</template>
