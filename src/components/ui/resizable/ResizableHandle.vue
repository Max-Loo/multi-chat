<script lang="ts" setup>
import { inject } from 'vue'
import { GripVertical } from 'lucide-vue-next'

/**
 * 分隔条属性
 */
interface ResizableHandleProps {
  /** 是否显示拖拽手柄图形 */
  withHandle?: boolean
}

defineProps<ResizableHandleProps>()

interface ResizableGroupContext {
  startDrag: (handleIndex: number, event: PointerEvent) => void
}

const group = inject<ResizableGroupContext>('resizableGroup')

/**
 * 指针按下：确定分隔条索引（左侧面板的 0-based 序号）并开始拖拽
 */
function onPointerDown(event: PointerEvent): void {
  if (!group) return

  const el = event.currentTarget as HTMLElement
  const parent = el.parentElement
  if (!parent) return

  // 统计前面的兄弟节点中面板的数量
  let panelsBefore = 0
  for (const child of Array.from(parent.children)) {
    if (child === el) break
    if (child.hasAttribute('data-resizable-panel')) {
      panelsBefore++
    }
  }

  // 左侧面板索引 = 面板数 - 1（至少为 0）
  group.startDrag(Math.max(panelsBefore - 1, 0), event)
}
</script>

<template>
  <div
    role="separator"
    tabindex="0"
    class="relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 hover:bg-ring/50"
    @pointerdown.prevent="onPointerDown"
  >
    <div
      v-if="withHandle"
      class="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border"
    >
      <GripVertical class="h-2.5 w-2.5" />
    </div>
  </div>
</template>
