import { useEffect, useRef, useState, useCallback } from "react";
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
const AnimatedLogo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const stateRef = useRef<AnimationState>(createInitialState());
  const lastTimeRef = useRef<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [canvasSupported, setCanvasSupported] = useState(true);

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

    // 计算缩放
    const scale = calculateScale(canvas.width, canvas.height);

    // 绘制
    draw(
      { ctx, scale, width: canvas.width, height: canvas.height },
      stateRef.current
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
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    // 设置 Canvas 尺寸
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      // 使用 CSS 像素尺寸，绘制逻辑会处理缩放
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();

    // 使用 ResizeObserver 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(resizeCanvas);
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

    // 计算缩放
    const scale = calculateScale(canvas.width, canvas.height);
    const drawCtx = { ctx, scale, width: canvas.width, height: canvas.height };

    if (prefersReducedMotion) {
      // 静态帧模式
      drawStaticFrame(drawCtx);
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
