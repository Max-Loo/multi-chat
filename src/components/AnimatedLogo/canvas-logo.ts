/**
 * Canvas 动态 Logo 绘制逻辑
 * 纯 TypeScript 文件，处理动画状态和绘制函数
 */

// ============== 常量定义 ==============

/** 逻辑坐标系尺寸 */
const LOGICAL_SIZE = 200;

/** 配色方案 */
export const COLORS = {
  /** 机器人轮廓 */
  outline: "#333333",
  /** 机器人填充 */
  fill: "#FFFFFF",
  /** LED 眼睛 / 品牌蓝 */
  accent: "#4269C4",
  /** 桌面线条 */
  desk: "#666666",
  /** 键盘 */
  keyboard: "#E5E5E5",
  /** 按键 */
  key: "#FFFFFF",
  /** 聊天气泡 */
  bubble: "#4269C4",
  /** 气泡内文字 */
  bubbleText: "#FFFFFF",
} as const;

// ============== 类型定义 ==============

/** 动画状态 */
export interface AnimationState {
  /** 时间戳 (毫秒) */
  time: number;
  /** 聊天气泡三点相位 [0, 1, 2] */
  bubbleDots: [number, number, number];
  /** 眼睛亮度 (0-1) */
  eyeBrightness: number;
  /** 天线角度 (弧度) */
  antennaAngle: number;
  /** 头部倾斜角度 (弧度) */
  headTilt: number;
  /** 身体呼吸偏移 */
  breathOffset: number;
  /** 左手按键位置 Y 偏移 */
  leftKeyY: number;
  /** 右手按键位置 Y 偏移 */
  rightKeyY: number;
  /** 当前按下的按键索引 */
  activeKeyIndex: number;
  /** 整体漂浮偏移 */
  floatOffset: number;
}

/** 绘制上下文 */
export interface DrawContext {
  ctx: CanvasRenderingContext2D;
  /** 缩放比例 */
  scale: number;
  /** Canvas 宽度 */
  width: number;
  /** Canvas 高度 */
  height: number;
}

// ============== 动画状态管理 ==============

/**
 * 创建初始动画状态
 */
export function createInitialState(): AnimationState {
  return {
    time: 0,
    bubbleDots: [0, 0, 0],
    eyeBrightness: 1,
    antennaAngle: 0,
    headTilt: 0,
    breathOffset: 0,
    leftKeyY: 0,
    rightKeyY: 0,
    activeKeyIndex: 0,
    floatOffset: 0,
  };
}

/**
 * 更新动画状态
 * @param state 当前状态
 * @param deltaTime 距离上一帧的时间 (毫秒)
 */
export function updateState(
  state: AnimationState,
  deltaTime: number
): AnimationState {
  const time = state.time + deltaTime;

  // 聊天气泡三点依次跳动 (周期 0.9s，相位差 0.3s)
  const bubbleDots: [number, number, number] = [
    Math.sin((time / 900) * Math.PI * 2) * 0.5 + 0.5,
    Math.sin(((time - 300) / 900) * Math.PI * 2) * 0.5 + 0.5,
    Math.sin(((time - 600) / 900) * Math.PI * 2) * 0.5 + 0.5,
  ];

  // LED 眼睛闪烁 (周期 1.5s)
  const eyeBrightness = 0.7 + Math.sin((time / 1500) * Math.PI * 2) * 0.3;

  // 天线晃动 (周期 2s)
  const antennaAngle = Math.sin((time / 2000) * Math.PI * 2) * 0.1;

  // 头部倾斜 (周期 3s)
  const headTilt = Math.sin((time / 3000) * Math.PI * 2) * 0.05;

  // 身体呼吸 (周期 2s)
  const breathOffset = Math.sin((time / 2000) * Math.PI * 2) * 2;

  // 打字动作 - 左右手交替 (周期 0.4s)
  const typingPhase = (time / 400) * Math.PI * 2;
  const leftKeyY = Math.max(0, Math.sin(typingPhase)) * 3;
  const rightKeyY = Math.max(0, Math.sin(typingPhase + Math.PI)) * 3;

  // 当前按下的按键 (循环切换)
  const activeKeyIndex = Math.floor((time / 400) % 6);

  // 整体漂浮 (周期 4s)
  const floatOffset = Math.sin((time / 4000) * Math.PI * 2) * 2;

  return {
    time,
    bubbleDots,
    eyeBrightness,
    antennaAngle,
    headTilt,
    breathOffset,
    leftKeyY,
    rightKeyY,
    activeKeyIndex,
    floatOffset,
  };
}

// ============== 绘制函数 ==============

/**
 * 绘制圆角矩形
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * 绘制桌面和键盘
 */
function drawDesk(ctx: CanvasRenderingContext2D): void {
  // 桌面
  ctx.strokeStyle = COLORS.desk;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 145);
  ctx.lineTo(180, 145);
  ctx.stroke();

  // 键盘底座 (带圆角)
  ctx.fillStyle = COLORS.keyboard;
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, 45, 148, 110, 30, 4);
  ctx.fill();
  ctx.stroke();
}

/**
 * 绘制键盘按键
 */
function drawKeyboard(
  ctx: CanvasRenderingContext2D,
  activeKeyIndex: number
): void {
  const keyWidth = 12;
  const keyHeight = 10;
  const keyGap = 3;
  const startX = 55;
  const startY = 153;
  const keysPerRow = 6;

  for (let i = 0; i < 12; i++) {
    const row = Math.floor(i / keysPerRow);
    const col = i % keysPerRow;
    const x = startX + col * (keyWidth + keyGap);
    const y = startY + row * (keyHeight + keyGap);

    // 判断是否是当前激活的按键
    const isActive = i === activeKeyIndex;

    ctx.fillStyle = isActive ? COLORS.accent : COLORS.key;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1;

    drawRoundedRect(ctx, x, y, keyWidth, keyHeight, 2);
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * 绘制机器人身体
 */
function drawBody(
  ctx: CanvasRenderingContext2D,
  breathOffset: number
): void {
  const y = 95 + breathOffset;

  ctx.fillStyle = COLORS.fill;
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 2;

  drawRoundedRect(ctx, 75, y, 50, 30, 5);
  ctx.fill();
  ctx.stroke();
}

/**
 * 绘制打字手臂
 */
function drawTypingArms(
  ctx: CanvasRenderingContext2D,
  leftKeyY: number,
  rightKeyY: number
): void {
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  // 左手臂 (打字)
  ctx.beginPath();
  ctx.moveTo(75, 105);
  ctx.quadraticCurveTo(55, 125, 60 + leftKeyY, 155);
  ctx.stroke();

  // 左手指 (圆点)
  ctx.fillStyle = COLORS.outline;
  ctx.beginPath();
  ctx.arc(60 + leftKeyY, 155, 4, 0, Math.PI * 2);
  ctx.fill();

  // 右手臂 (打字)
  ctx.beginPath();
  ctx.moveTo(125, 105);
  ctx.quadraticCurveTo(145, 125, 140 + rightKeyY, 155);
  ctx.stroke();

  // 右手指 (圆点)
  ctx.beginPath();
  ctx.arc(140 + rightKeyY, 155, 4, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 绘制机器人头部
 */
function drawHead(
  ctx: CanvasRenderingContext2D,
  headTilt: number,
  breathOffset: number
): void {
  ctx.save();
  ctx.translate(100, 65 + breathOffset);
  ctx.rotate(headTilt);

  ctx.fillStyle = COLORS.fill;
  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 2;

  // 头部轮廓
  drawRoundedRect(ctx, -30, -20, 60, 40, 8);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * 绘制 LED 眼睛
 */
function drawEyes(
  ctx: CanvasRenderingContext2D,
  eyeBrightness: number,
  headTilt: number,
  breathOffset: number
): void {
  ctx.save();
  ctx.translate(100, 65 + breathOffset);
  ctx.rotate(headTilt);

  // LED 像素眼睛 (3x3 像素矩阵)
  const pixelSize = 4;
  const eyePixels = [
    [-12, -5], [-8, -5], [-4, -5],
    [-12, -1], [-8, -1], [-4, -1],
    [-12, 3], [-8, 3], [-4, 3],
    [4, -5], [8, -5], [12, -5],
    [4, -1], [8, -1], [12, -1],
    [4, 3], [8, 3], [12, 3],
  ];

  ctx.fillStyle = `rgba(66, 105, 196, ${eyeBrightness})`;
  eyePixels.forEach(([px, py]) => {
    ctx.fillRect(px - pixelSize / 2, py - pixelSize / 2, pixelSize, pixelSize);
  });

  ctx.restore();
}

/**
 * 绘制嘴巴
 */
function drawMouth(
  ctx: CanvasRenderingContext2D,
  headTilt: number,
  breathOffset: number
): void {
  ctx.save();
  ctx.translate(100, 65 + breathOffset);
  ctx.rotate(headTilt);

  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.quadraticCurveTo(0, 15, 10, 10);
  ctx.stroke();

  ctx.restore();
}

/**
 * 绘制天线
 */
function drawAntenna(
  ctx: CanvasRenderingContext2D,
  antennaAngle: number,
  breathOffset: number
): void {
  ctx.save();
  ctx.translate(100, 45 + breathOffset);

  ctx.strokeStyle = COLORS.outline;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  // 左天线
  ctx.save();
  ctx.rotate(-0.3 + antennaAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-15, -20);
  ctx.stroke();
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.arc(-15, -20, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 右天线
  ctx.save();
  ctx.rotate(0.3 - antennaAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(15, -20);
  ctx.stroke();
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.arc(15, -20, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 绘制聊天气泡 (带尾巴的气泡框，里面有三个跳动的点)
 * 位于右上角
 */
function drawChatBubble(
  ctx: CanvasRenderingContext2D,
  bubbleDots: [number, number, number],
  floatOffset: number
): void {
  // 右上角位置
  const bubbleX = 130;
  const bubbleY = 5 + floatOffset;
  const bubbleWidth = 55;
  const bubbleHeight = 22;
  const bubbleRadius = 6;

  ctx.save();

  // 气泡主体 (圆角矩形)
  ctx.fillStyle = COLORS.bubble;
  drawRoundedRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleRadius);
  ctx.fill();

  // 气泡尾巴 (指向左下方)
  ctx.beginPath();
  ctx.moveTo(bubbleX + 5, bubbleY + bubbleHeight);
  ctx.lineTo(bubbleX - 5, bubbleY + bubbleHeight + 10);
  ctx.lineTo(bubbleX + 12, bubbleY + bubbleHeight);
  ctx.closePath();
  ctx.fill();

  // 气泡内的三个跳动的点
  const dotSize = 3.5;
  const dotSpacing = 12;
  const dotsStartX = bubbleX + (bubbleWidth - dotSpacing * 2) / 2;
  const dotBaseY = bubbleY + bubbleHeight / 2;

  ctx.fillStyle = COLORS.bubbleText;
  [0, 1, 2].forEach((i) => {
    const scale = 0.8 + bubbleDots[i] * 0.4;
    const yOffset = bubbleDots[i] * -3;
    ctx.beginPath();
    ctx.arc(
      dotsStartX + i * dotSpacing,
      dotBaseY + yOffset,
      dotSize * scale,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });

  ctx.restore();
}

/**
 * 主绘制函数
 */
export function draw(drawCtx: DrawContext, state: AnimationState): void {
  const { ctx, scale } = drawCtx;

  ctx.save();
  ctx.scale(scale, scale);

  // 清除画布
  ctx.clearRect(0, 0, LOGICAL_SIZE, LOGICAL_SIZE);

  // 绘制整体漂浮偏移
  ctx.save();
  ctx.translate(0, state.floatOffset);

  // 按层次绘制各元素
  drawDesk(ctx);
  drawKeyboard(ctx, state.activeKeyIndex);
  drawBody(ctx, state.breathOffset);
  drawTypingArms(ctx, state.leftKeyY, state.rightKeyY);
  drawHead(ctx, state.headTilt, state.breathOffset);
  drawEyes(ctx, state.eyeBrightness, state.headTilt, state.breathOffset);
  drawMouth(ctx, state.headTilt, state.breathOffset);
  drawAntenna(ctx, state.antennaAngle, state.breathOffset);
  drawChatBubble(ctx, state.bubbleDots, state.floatOffset);

  ctx.restore();
  ctx.restore();
}

/**
 * 绘制静态帧 (用于 prefers-reduced-motion)
 */
export function drawStaticFrame(drawCtx: DrawContext): void {
  const staticState: AnimationState = {
    time: 0,
    bubbleDots: [0.5, 0.5, 0.5],
    eyeBrightness: 1,
    antennaAngle: 0,
    headTilt: 0,
    breathOffset: 0,
    leftKeyY: 0,
    rightKeyY: 0,
    activeKeyIndex: 0,
    floatOffset: 0,
  };

  draw(drawCtx, staticState);
}

/**
 * 计算缩放比例
 */
export function calculateScale(width: number, height: number): number {
  return Math.min(width, height) / LOGICAL_SIZE;
}
