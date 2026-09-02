<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { type AlertVariants, alertVariants } from "."
import { cn } from "@/utils/utils"

/**
 * 提示框组件属性
 */
interface Props {
  /** 变体样式 */
  variant?: AlertVariants["variant"]
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <div
    data-slot="alert"
    role="alert"
    :class="cn(alertVariants({ variant }), props.class)"
  >
    <slot />
  </div>
</template>
