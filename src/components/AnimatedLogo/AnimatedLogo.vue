<script setup lang="ts">
/**
 * 动态 Logo 组件（Vue 版）
 * 使用 Canvas 绘制机器人打字思考场景动画，绘制逻辑复用框架无关的 canvas-logo.ts
 * 行为与 React 版 AnimatedLogo.tsx 保持一致：高 DPR 适配、ResizeObserver、
 * prefers-reduced-motion 时显示静态帧、Canvas 不可用时降级为文字 Logo
 */
import { ref, onMounted, onUnmounted, watch } from 'vue';
import {
  createInitialState,
  updateState,
  draw,
  drawStaticFrame,
  calculateScale,
  type AnimationState,
} from './canvas-logo';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrame: number | null = null;
let state: AnimationState = createInitialState();
let lastTime = 0;
let resizeHandler: (() => void) | null = null;
let resizeObserver: ResizeObserver | null = null;
let mediaQuery: MediaQueryList | null = null;
let mediaChangeHandler: ((e: MediaQueryListEvent) => void) | null = null;

const prefersReducedMotion = ref(false);
const canvasSupported = ref(true);

/** 绘制一帧（动画模式） */
const drawFrame = (timestamp: number) => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 计算时间差
  const deltaTime = lastTime ? timestamp - lastTime : 16;
  lastTime = timestamp;

  // 更新状态
  state = updateState(state, deltaTime);

  // 计算缩放（使用 CSS 像素尺寸）
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.width / dpr;
  const cssHeight = canvas.height / dpr;
  const scale = calculateScale(cssWidth, cssHeight);

  draw({ ctx, scale, width: cssWidth, height: cssHeight }, state);

  animationFrame = requestAnimationFrame(drawFrame);
};

/** 启动/重启动画循环 */
const startAnimation = () => {
  const canvas = canvasRef.value;
  if (!canvas || !canvasSupported.value) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 清理之前的动画
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.width / dpr;
  const cssHeight = canvas.height / dpr;
  const drawCtx = { ctx, scale: calculateScale(cssWidth, cssHeight), width: cssWidth, height: cssHeight };

  if (prefersReducedMotion.value) {
    // 静态帧模式
    drawStaticFrame(drawCtx);
  } else {
    // 启动动画
    lastTime = 0;
    animationFrame = requestAnimationFrame(drawFrame);
  }
};

const stopAnimation = () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
};

// 偏好变化时切换动画/静态帧
watch(prefersReducedMotion, () => {
  startAnimation();
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
  mediaChangeHandler = (e: MediaQueryListEvent) => {
    prefersReducedMotion.value = e.matches;
  };
  mediaQuery.addEventListener('change', mediaChangeHandler);

  // 设置 Canvas 尺寸（处理高 DPR 屏幕）并触发重绘
  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // 强制重绘一次，避免 resize 后画面空白或错位
    if (prefersReducedMotion.value) {
      const cssWidth = canvas.width / dpr;
      const cssHeight = canvas.height / dpr;
      drawStaticFrame({
        ctx,
        scale: calculateScale(cssWidth, cssHeight),
        width: cssWidth,
        height: cssHeight,
      });
    } else if (!animationFrame) {
      const cssWidth = canvas.width / dpr;
      const cssHeight = canvas.height / dpr;
      draw(
        { ctx, scale: calculateScale(cssWidth, cssHeight), width: cssWidth, height: cssHeight },
        state,
      );
    }
  };

  resizeHandler = resizeCanvas;
  resizeCanvas();

  resizeObserver = new ResizeObserver(() => {
    resizeHandler?.();
  });
  resizeObserver.observe(canvas);

  startAnimation();
});

onUnmounted(() => {
  stopAnimation();
  if (mediaQuery && mediaChangeHandler) {
    mediaQuery.removeEventListener('change', mediaChangeHandler);
  }
  resizeObserver?.disconnect();
});
</script>

<template>
  <!-- Canvas 不支持时显示降级内容 -->
  <div
    v-if="!canvasSupported"
    class="flex h-32 w-32 items-center justify-center md:h-48 md:w-48 lg:h-64 lg:w-64"
    aria-label="Multi-Chat Logo"
    role="img"
  >
    <span class="text-4xl font-bold text-primary md:text-6xl lg:text-8xl">MC</span>
  </div>
  <canvas
    v-else
    ref="canvasRef"
    class="h-32 w-32 md:h-48 md:w-48 lg:h-64 lg:w-64"
    aria-label="Multi-Chat 动态 Logo"
    role="img"
  />
</template>
