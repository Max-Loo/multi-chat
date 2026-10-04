<script lang="ts" setup>
import { provide, ref } from 'vue'

/**
 * 分割面板组属性
 */
interface PanelGroupProps {
  /** 排列方向：horizontal（默认）或 vertical */
  orientation?: 'horizontal' | 'vertical'
}

const props = withDefaults(defineProps<PanelGroupProps>(), {
  orientation: 'horizontal',
})

/**
 * 面板注册信息
 */
interface PanelRecord {
  id: symbol
  size: number
}

/** 面板尺寸列表（按注册顺序，百分比） */
const panels = ref<PanelRecord[]>([])

/** 拖拽中的面板组尺寸（px），用于像素 → 百分比换算 */
const groupEl = ref<HTMLElement | null>(null)

/**
 * 注册面板
 * @param defaultSize 初始尺寸百分比
 * @returns 可追踪的尺寸记录（size 为响应式属性）
 */
function registerPanel(defaultSize: number): PanelRecord {
  const record: PanelRecord = { id: Symbol('panel'), size: defaultSize }
  panels.value.push(record)
  return record
}

/**
 * 注销面板
 */
function unregisterPanel(record: PanelRecord): void {
  const idx = panels.value.indexOf(record)
  if (idx !== -1) {
    panels.value.splice(idx, 1)
  }
}

/** 拖拽的最小面板百分比（防止拖没） */
const MIN_SIZE = 5

/**
 * 开始拖拽指定分隔条（index 为分隔条在面板序列中的位置：第 index 与 index+1 个面板之间）
 * @param handleIndex 分隔条索引
 * @param event 指针按下事件
 */
function startDrag(handleIndex: number, event: PointerEvent): void {
  const el = groupEl.value
  if (!el) return

  const before = panels.value[handleIndex]
  const after = panels.value[handleIndex + 1]
  if (!before || !after) return

  const groupSize = props.orientation === 'horizontal' ? el.clientWidth : el.clientHeight
  if (groupSize <= 0) return

  const startPos = props.orientation === 'horizontal' ? event.clientX : event.clientY
  const initialBefore = before.size
  const initialAfter = after.size

  const onPointerMove = (moveEvent: PointerEvent) => {
    const currentPos = props.orientation === 'horizontal' ? moveEvent.clientX : moveEvent.clientY
    const deltaPercent = ((currentPos - startPos) / groupSize) * 100

    // 限制拖拽范围，保证两侧面板不小于最小值
    // 向右拖上限：after 不小于 MIN_SIZE；向左拖下限：before 不小于 MIN_SIZE
    const maxDelta = initialAfter - MIN_SIZE
    const minDelta = MIN_SIZE - initialBefore
    const clampedDelta = Math.min(Math.max(deltaPercent, minDelta), maxDelta)

    before.size = initialBefore + clampedDelta
    after.size = initialAfter - clampedDelta
  }

  const onPointerUp = () => {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

// 提供给 Panel / Handle 的上下文
provide('resizableGroup', {
  registerPanel,
  unregisterPanel,
  startDrag,
})
</script>

<template>
  <div
    ref="groupEl"
    class="flex h-full w-full"
    :class="props.orientation === 'vertical' ? 'flex-col' : 'flex-row'"
    :data-panel-group-direction="props.orientation"
    :data-orientation="props.orientation"
  >
    <slot />
  </div>
</template>
