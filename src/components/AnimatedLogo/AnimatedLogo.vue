<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  createInitialState,
  updateState,
  draw,
  drawStaticFrame,
  calculateScale,
  type AnimationState,
} from "./canvas-logo";

/**
 * 动态 Logo 组件
 * 使用 Canvas 绘制机器人打字思考场景动画
 */
const canvasRef = ref<HTMLCanvasElement | null>(null);
const animationRef = ref<number | null>(null);
const stateRef = ref<AnimationState>(createInitialState());
const lastTimeRef = ref<number>(0);
const prefersReducedMotion = ref(false);
const canvasSupported = ref(true);

let resizeHandler: (() => void) | null = null;
let mediaQuery: MediaQueryList | null = null;
let handleChange: ((e: MediaQueryListEvent) => void) | null = null;

/**
 * 动画循环
 */
function animate(timestamp: number): void {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 计算时间差
  const deltaTime = lastTimeRef.value
    ? timestamp - lastTimeRef.value
    : 16;
  lastTimeRef.value = timestamp;

  // 更新状态
  stateRef.value = updateState(stateRef.value, deltaTime);

  // 计算缩放（使用 CSS 像素尺寸）
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.width / dpr;
  const cssHeight = canvas.height / dpr;
  const scale = calculateScale(cssWidth, cssHeight);

  // 绘制
  draw({ ctx, scale, width: cssWidth, height: cssHeight }, stateRef.value);

  // 继续动画循环
  animationRef.value = requestAnimationFrame(animate);
}

/**
 * 设置 Canvas 尺寸（处理高 DPR 屏幕）并触发重绘
 */
function resizeCanvas(): void {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  // 设置实际像素尺寸为 CSS 尺寸乘以 DPR，确保高分辨率屏幕清晰显示
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  // 重置变换矩阵并缩放 Canvas 上下文，使绘制逻辑仍使用 CSS 像素坐标
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  // 强制重绘一次，避免 resize 后画面空白或错位
  if (prefersReducedMotion.value) {
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;
    const scale = calculateScale(cssWidth, cssHeight);
    drawStaticFrame({ ctx, scale, width: cssWidth, height: cssHeight });
  } else if (!animationRef.value) {
    // 如果动画未运行，触发一次绘制
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;
    const scale = calculateScale(cssWidth, cssHeight);
    draw({ ctx, scale, width: cssWidth, height: cssHeight }, stateRef.value);
  }
}

// 挂载：检测 Canvas 支持、监听系统动画偏好与容器尺寸变化
onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) {
    canvasSupported.value = false;
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvasSupported.value = false;
    return;
  }

  canvasSupported.value = true;

  // 检测用户是否偏好减少动画
  mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  prefersReducedMotion.value = mediaQuery.matches;

  handleChange = (e: MediaQueryListEvent) => {
    prefersReducedMotion.value = e.matches;
  };
  mediaQuery.addEventListener("change", handleChange);

  resizeHandler = resizeCanvas;
  resizeCanvas();

  // 使用 ResizeObserver 监听容器尺寸变化
  const resizeObserver = new ResizeObserver(() => {
    resizeHandler?.();
  });
  resizeObserver.observe(canvas);

  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener("change", handleChange!);
    resizeObserver.disconnect();
  });
});

// 根据动画偏好切换静态帧 / 动画循环
watch(
  [prefersReducedMotion, canvasSupported],
  ([reduced, supported]) => {
    const canvas = canvasRef.value;
    if (!canvas || !supported) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清理之前的动画
    if (animationRef.value) {
      cancelAnimationFrame(animationRef.value);
      animationRef.value = null;
    }

    // 计算缩放（使用 CSS 像素尺寸而非 Canvas 实际像素）
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
      lastTimeRef.value = 0;
      animationRef.value = requestAnimationFrame(animate);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (animationRef.value) {
    cancelAnimationFrame(animationRef.value);
    animationRef.value = null;
  }
});

/** Canvas 不支持时的降级样式 */
const fallbackClasses = computed(
  () =>
    "w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 flex items-center justify-center",
);
</script>

<template>
  <!-- Canvas 不支持时显示降级内容 -->
  <div
    v-if="!canvasSupported"
    :class="fallbackClasses"
    aria-label="Multi-Chat Logo"
    role="img"
  >
    <span class="text-4xl md:text-6xl lg:text-8xl font-bold text-primary">
      MC
    </span>
  </div>
  <canvas
    v-else
    ref="canvasRef"
    class="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64"
    aria-label="Multi-Chat 动态 Logo"
    role="img"
  />
</template>
