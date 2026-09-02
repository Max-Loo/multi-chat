<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { Primitive } from "reka-ui"
import { type ButtonVariants, buttonVariants } from "."
import { cn } from "@/utils/utils"

/**
 * 按钮组件属性
 */
interface Props extends PrimitiveProps {
  /** 变体样式 */
  variant?: ButtonVariants["variant"]
  /** 尺寸样式 */
  size?: ButtonVariants["size"]
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
})
</script>

<template>
  <Primitive
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
