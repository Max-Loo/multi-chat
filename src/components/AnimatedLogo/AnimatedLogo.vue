<script setup lang="ts">
/**
 * 动态 Logo 组件（对应旧版 AnimatedLogo.tsx）
 * 使用 Canvas 绘制机器人打字思考场景动画
 */
import {
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import {
  createInitialState,
  updateState,
  draw,
  drawStaticFrame,
  calculateScale,
  type AnimationState,
} from './canvas-logo';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
let state: AnimationState = createInitialState();
let lastTime = 0;
let resizeCanvasHandler: (() => void) | null = null;
let prefersReducedMotionSync = false;
const prefersReducedMotion = ref(false);
const canvasSupported = ref(true);

/**
 * 动画循环
 */
const animate = (timestamp: number): void => {
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

  // 绘制
  draw({ ctx, scale, width: cssWidth, height: cssHeight }, state);

  // 继续动画循环
  animationFrameId = requestAnimationFrame(animate);
};

onMounted(() => {
  // 检测 Canvas 支持
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
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReducedMotionSync = mediaQuery.matches;
  prefersReducedMotion.value = mediaQuery.matches;

  const handleChange = (e: MediaQueryListEvent): void => {
    prefersReducedMotionSync = e.matches;
    prefersReducedMotion.value = e.matches;
  };

  mediaQuery.addEventListener('change', handleChange);

  // 设置 Canvas 尺寸（处理高 DPR 屏幕）并触发重绘
  const resizeCanvas = (): void => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    // 重置变换矩阵并缩放 Canvas 上下文
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;
    const scale = calculateScale(cssWidth, cssHeight);
    const drawCtx = { ctx, scale, width: cssWidth, height: cssHeight };

    // 强制重绘一次，避免 resize 后画面空白或错位
    if (prefersReducedMotionSync) {
      drawStaticFrame(drawCtx);
    } else if (!animationFrameId) {
      draw(drawCtx, state);
    }
  };

  // 存储 resize handler，确保 ResizeObserver 始终调用最新版本
  resizeCanvasHandler = resizeCanvas;
  resizeCanvas();

  // 使用 ResizeObserver 监听容器尺寸变化
  const resizeObserver = new ResizeObserver(() => {
    resizeCanvasHandler?.();
  });
  resizeObserver.observe(canvas);

  // 卸载清理
  onBeforeUnmount(() => {
    mediaQuery.removeEventListener('change', handleChange);
    resizeObserver.disconnect();
  });
});

// 偏好变化时切换动画/静态模式
watch([prefersReducedMotion, canvasSupported], () => {
  const canvas = canvasRef.value;
  if (!canvas || !canvasSupported.value) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 清理之前的动画
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.width / dpr;
  const cssHeight = canvas.height / dpr;
  const scale = calculateScale(cssWidth, cssHeight);
  const drawCtx = { ctx, scale, width: cssWidth, height: cssHeight };

  if (prefersReducedMotion.value) {
    // 静态帧模式
    drawStaticFrame(drawCtx);
  } else {
    // 启动动画
    lastTime = 0;
    animationFrameId = requestAnimationFrame(animate);
  }
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
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
    <span class="text-4xl font-bold text-primary md:text-6xl lg:text-8xl">
      MC
    </span>
  </div>
  <canvas
    v-else
    ref="canvasRef"
    class="h-32 w-32 md:h-48 md:w-48 lg:h-64 lg:w-64"
    aria-label="Multi-Chat 动态 Logo"
    role="img"
  />
</template>
