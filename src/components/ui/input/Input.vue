<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/utils/utils"

/**
 * 输入框组件属性
 */
interface Props {
  /** 自定义类名 */
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()

/** 输入值（v-model 双向绑定） */
const model = defineModel<string | number | readonly string[]>()
</script>

<template>
  <input
    v-model="model"
    data-slot="input"
    :class="
      cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        props.class,
      )
    "
  />
</template>
