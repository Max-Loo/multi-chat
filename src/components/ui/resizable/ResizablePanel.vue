<script lang="ts" setup>
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 分割面板属性
 */
interface ResizablePanelProps {
  /** 初始尺寸百分比 */
  defaultSize?: number
}

const props = withDefaults(defineProps<ResizablePanelProps>(), {
  defaultSize: 100,
})

/**
 * 面板记录（与 PanelGroup 内部结构对应）
 */
interface PanelRecord {
  id: symbol
  size: number
}

interface ResizableGroupContext {
  registerPanel: (defaultSize: number) => PanelRecord
  unregisterPanel: (record: PanelRecord) => void
}

const group = inject<ResizableGroupContext>('resizableGroup')

// 注册后由 Group 管理的尺寸记录
const record = ref<PanelRecord | null>(null)

onMounted(() => {
  if (group) {
    record.value = group.registerPanel(props.defaultSize)
  }
})

onBeforeUnmount(() => {
  if (group && record.value) {
    group.unregisterPanel(record.value)
  }
})

// 响应式读取 Group 管理的尺寸；未注册时使用初始值
const flexBasis = computed(() => `${record.value?.size ?? props.defaultSize}%`)

const style = computed(() => ({
  flex: `0 0 ${flexBasis.value}`,
}))
</script>

<template>
  <div :style="style" class="min-w-0 min-h-0 overflow-hidden" data-resizable-panel>
    <slot />
  </div>
</template>
