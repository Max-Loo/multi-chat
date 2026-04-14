import { useEffect, useRef, useState, useCallback } from "react";
import {
  createInitialState,
  updateState,
  draw,
  drawStaticFrame,
  calculateScale,
  LIGHT_COLORS,
  DARK_COLORS,
  type AnimationState,
} from "./canvas-logo";

/**
 * 动态 Logo 组件
 * 使用 Canvas 绘制机器人打字思考场景动画
 */
const AnimatedLogo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const stateRef = useRef<AnimationState>(createInitialState());
  const lastTimeRef = useRef<number>(0);
  const resizeHandlerRef = useRef<(() => void) | null>(null);
  const prefersReducedMotionRef = useRef<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [canvasSupported, setCanvasSupported] = useState(true);

  /**
   * 根据当前主题选择调色板
   * 初始化阶段 ThemeProvider 尚未加载，直接检测 .dark class
   * （main.tsx 在 React 渲染前已同步设置该 class）
   */
  const colorsRef = useRef(
    document.documentElement.classList.contains("dark") ? DARK_COLORS : LIGHT_COLORS
  );

  /**
   * 监听主题切换，动态更新调色板
   * 使用 MutationObserver 监听 <html> 的 class 变化，
   * 无需 React 重渲染，动画循环自动读取最新值
   */
  useEffect(() => {
    const observer = new MutationObserver(() => {
      colorsRef.current = document.documentElement.classList.contains("dark")
        ? DARK_COLORS
        : LIGHT_COLORS;
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  /**
   * 动画循环
   */
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 计算时间差
    const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 16;
    lastTimeRef.current = timestamp;

    // 更新状态
    stateRef.current = updateState(stateRef.current, deltaTime);

    // 计算缩放（使用 CSS 像素尺寸）
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;
    const scale = calculateScale(cssWidth, cssHeight);

    // 绘制
    draw(
      { ctx, scale, width: cssWidth, height: cssHeight },
      stateRef.current,
      colorsRef.current
    );

    // 继续动画循环
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // 检测 Canvas 支持
    const canvas = canvasRef.current;
    if (!canvas) {
      setCanvasSupported(false);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCanvasSupported(false);
      return;
    }

    setCanvasSupported(true);

    // 检测用户是否偏好减少动画
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = mediaQuery.matches;
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    // 设置 Canvas 尺寸（处理高 DPR 屏幕）并触发重绘
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      // 设置实际像素尺寸为 CSS 尺寸乘以 DPR，确保高分辨率屏幕清晰显示
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      // 重置变换矩阵并缩放 Canvas 上下文，使绘制逻辑仍使用 CSS 像素坐标
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // 强制重绘一次，避免 resize 后画面空白或错位
      if (prefersReducedMotionRef.current) {
        const cssWidth = canvas.width / dpr;
        const cssHeight = canvas.height / dpr;
        const scale = calculateScale(cssWidth, cssHeight);
        drawStaticFrame({ ctx, scale, width: cssWidth, height: cssHeight }, colorsRef.current);
      } else if (!animationRef.current) {
        // 如果动画未运行，触发一次绘制
        const cssWidth = canvas.width / dpr;
        const cssHeight = canvas.height / dpr;
        const scale = calculateScale(cssWidth, cssHeight);
        draw(
          { ctx, scale, width: cssWidth, height: cssHeight },
          stateRef.current,
          colorsRef.current
        );
      }
    };

    // 存储 resize handler 到 ref，确保 ResizeObserver 始终调用最新版本
    resizeHandlerRef.current = resizeCanvas;

    resizeCanvas();

    // 使用 ResizeObserver 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      resizeHandlerRef.current?.();
    });
    resizeObserver.observe(canvas);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasSupported) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清理之前的动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // 计算缩放（使用 CSS 像素尺寸而非 Canvas 实际像素）
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;
    const scale = calculateScale(cssWidth, cssHeight);
    const drawCtx = { ctx, scale, width: cssWidth, height: cssHeight };

    if (prefersReducedMotion) {
      // 静态帧模式
      drawStaticFrame(drawCtx, colorsRef.current);
    } else {
      // 启动动画
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [prefersReducedMotion, canvasSupported, animate]);

  // Canvas 不支持时显示降级内容
  if (!canvasSupported) {
    return (
      <div
        className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 flex items-center justify-center"
        aria-label="Multi-Chat Logo"
        role="img"
      >
        <span className="text-4xl md:text-6xl lg:text-8xl font-bold text-primary">
          MC
        </span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64"
      aria-label="Multi-Chat 动态 Logo"
      role="img"
    />
  );
};

export default AnimatedLogo;
