<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  createInitialState,
  updateState,
  draw,
  drawStaticFrame,
  calculateScale,
  type AnimationState,
} from './canvas-logo';

/**
 * 动态 Logo 组件
 * 使用 Canvas 绘制机器人打字思考场景动画
 */

/** Canvas 元素引用 */
const canvasRef = ref<HTMLCanvasElement | null>(null);
/** 动画帧 ID */
let animationFrameId: number | null = null;
/** 动画状态 */
let animationState: AnimationState = createInitialState();
/** 上一帧时间戳 */
let lastTime = 0;
/** 用户是否偏好减少动画 */
const prefersReducedMotion = ref(false);
/** Canvas 是否受支持（不支持时降级为静态文本） */
const canvasSupported = ref(true);

/** 媒体查询与 ResizeObserver（卸载时清理） */
let mediaQuery: MediaQueryList | null = null;
let resizeObserver: ResizeObserver | null = null;

/**
 * 动画循环
 * @param timestamp 当前帧时间戳
 */
function animate(timestamp: number): void {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 计算时间差
  const deltaTime = lastTime ? timestamp - lastTime : 16;
  lastTime = timestamp;

  // 更新状态
  animationState = updateState(animationState, deltaTime);

  // 计算缩放（使用 CSS 像素尺寸）
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.width / dpr;
  const cssHeight = canvas.height / dpr;
  const scale = calculateScale(cssWidth, cssHeight);

  draw({ ctx, scale, width: cssWidth, height: cssHeight }, animationState);

  // 继续动画循环
  animationFrameId = requestAnimationFrame(animate);
}

/**
 * 重设 Canvas 像素尺寸（处理高 DPR 屏幕）并按需重绘
 */
function resizeCanvas(): void {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  // 设置实际像素尺寸为 CSS 尺寸乘以 DPR，确保高分辨率屏幕清晰显示
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  // 重置变换矩阵并缩放 Canvas 上下文，使绘制逻辑仍使用 CSS 像素坐标
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  const cssWidth = canvas.width / dpr;
  const cssHeight = canvas.height / dpr;
  const scale = calculateScale(cssWidth, cssHeight);
  const drawCtx = { ctx, scale, width: cssWidth, height: cssHeight };

  // 强制重绘一次，避免 resize 后画面空白或错位
  if (prefersReducedMotion.value) {
    drawStaticFrame(drawCtx);
  } else if (!animationFrameId) {
    draw(drawCtx, animationState);
  }
}

/**
 * 停止动画循环
 */
function stopAnimation(): void {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

// 减少动画偏好切换：静态帧 ↔ 动画循环
watch(prefersReducedMotion, (reduced) => {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !canvasSupported.value || !ctx) return;

  stopAnimation();

  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.width / dpr;
  const cssHeight = canvas.height / dpr;
  const scale = calculateScale(cssWidth, cssHeight);
  const drawCtx = { ctx, scale, width: cssWidth, height: cssHeight };

  if (reduced) {
    // 静态帧模式
    drawStaticFrame(drawCtx);
  } else {
    // 启动动画
    lastTime = 0;
    animationFrameId = requestAnimationFrame(animate);
  }
});

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) {
    canvasSupported.value = false;
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvasSupported.value = false;
    return;
  }

  canvasSupported.value = true;

  // 检测用户是否偏好减少动画
  mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReducedMotion.value = mediaQuery.matches;
  mediaQuery.addEventListener('change', onReducedMotionChange);

  resizeCanvas();

  // 使用 ResizeObserver 监听容器尺寸变化
  resizeObserver = new ResizeObserver(() => resizeCanvas());
  resizeObserver.observe(canvas);
});

/**
 * 减少动画偏好变化回调
 * @param event 媒体查询变化事件
 */
function onReducedMotionChange(event: MediaQueryListEvent): void {
  prefersReducedMotion.value = event.matches;
}

onBeforeUnmount(() => {
  stopAnimation();
  mediaQuery?.removeEventListener('change', onReducedMotionChange);
  resizeObserver?.disconnect();
});
</script>

<template>
  <!-- Canvas 不支持时显示降级内容 -->
  <div
    v-if="!canvasSupported"
    class="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 flex items-center justify-center"
    aria-label="Multi-Chat Logo"
    role="img"
  >
    <span class="text-4xl md:text-6xl lg:text-8xl font-bold text-primary">MC</span>
  </div>

  <canvas
    v-else
    ref="canvasRef"
    class="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64"
    aria-label="Multi-Chat 动态 Logo"
    role="img"
  />
</template>
