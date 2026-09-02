<script setup lang="ts">
import type { SVGAttributes } from "vue"
import { Loader2Icon } from "@lucide/vue"
import { useT } from "@/composables/useT"
import { cn } from "@/utils/utils"

/**
 * 加载指示器组件属性
 */
interface Props {
  /** 自定义类名 */
  class?: SVGAttributes["class"]
}

const props = defineProps<Props>()
const t = useT()
</script>

<template>
  <Loader2Icon
    data-slot="spinner"
    role="status"
    :aria-label="t(($) => $.common.loading)"
    :class="cn('size-4 animate-spin', props.class)"
  />
</template>
