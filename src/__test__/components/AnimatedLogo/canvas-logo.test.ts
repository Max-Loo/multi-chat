/**
 * canvas-logo 纯函数单元测试
 *
 * 测试 Canvas Logo 动画的纯函数逻辑：
 * - createInitialState 初始状态创建
 * - updateState 动画状态更新
 * - calculateScale 缩放计算
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  updateState,
  calculateScale,
  COLORS,
} from '@/components/AnimatedLogo/canvas-logo';

describe('canvas-logo 纯函数测试', () => {
  describe('createInitialState', () => {
    it('应该返回包含所有必要字段的初始状态', () => {
      const state = createInitialState();

      expect(state).toHaveProperty('time', 0);
      expect(state).toHaveProperty('bubbleDots');
      expect(state).toHaveProperty('eyeBrightness');
      expect(state).toHaveProperty('antennaAngle');
      expect(state).toHaveProperty('headTilt');
      expect(state).toHaveProperty('breathOffset');
      expect(state).toHaveProperty('leftKeyY');
      expect(state).toHaveProperty('rightKeyY');
      expect(state).toHaveProperty('activeKeyIndex');
      expect(state).toHaveProperty('floatOffset');
    });

    it('应该返回零值初始状态', () => {
      const state = createInitialState();

      expect(state.time).toBe(0);
      expect(state.bubbleDots).toEqual([0, 0, 0]);
      expect(state.eyeBrightness).toBe(1);
      expect(state.antennaAngle).toBe(0);
      expect(state.headTilt).toBe(0);
      expect(state.breathOffset).toBe(0);
      expect(state.leftKeyY).toBe(0);
      expect(state.rightKeyY).toBe(0);
      expect(state.activeKeyIndex).toBe(0);
      expect(state.floatOffset).toBe(0);
    });

    it('应该每次调用都返回新的对象实例', () => {
      const state1 = createInitialState();
      const state2 = createInitialState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
      expect(state1.bubbleDots).not.toBe(state2.bubbleDots);
    });
  });

  describe('updateState', () => {
    it('应该累加时间 当传入 deltaTime', () => {
      const initial = createInitialState();
      const updated = updateState(initial, 16);

      expect(updated.time).toBe(16);
    });

    it('应该连续累加时间 当多次调用', () => {
      let state = createInitialState();
      state = updateState(state, 16);
      state = updateState(state, 16);

      expect(state.time).toBe(32);
    });

    it('不应该修改原始状态 当更新', () => {
      const initial = createInitialState();
      const copy = { ...initial };
      updateState(initial, 16);

      expect(initial.time).toBe(copy.time);
    });

    it('应该计算 bubbleDots 在 0-1 范围内', () => {
      let state = createInitialState();

      // 模拟一段时间
      for (let i = 0; i < 100; i++) {
        state = updateState(state, 16);
        state.bubbleDots.forEach((dot) => {
          expect(dot).toBeGreaterThanOrEqual(0);
          expect(dot).toBeLessThanOrEqual(1);
        });
      }
    });

    it('应该计算 eyeBrightness 在 0.4-1.0 范围内', () => {
      let state = createInitialState();

      for (let i = 0; i < 100; i++) {
        state = updateState(state, 16);
        expect(state.eyeBrightness).toBeGreaterThanOrEqual(0.4);
        expect(state.eyeBrightness).toBeLessThanOrEqual(1.0);
      }
    });

    it('应该计算 antennaAngle 在小范围内波动', () => {
      let state = createInitialState();

      for (let i = 0; i < 100; i++) {
        state = updateState(state, 16);
        expect(Math.abs(state.antennaAngle)).toBeLessThanOrEqual(0.15);
      }
    });

    it('应该计算 breathOffset 在小范围内波动', () => {
      let state = createInitialState();

      for (let i = 0; i < 100; i++) {
        state = updateState(state, 16);
        expect(Math.abs(state.breathOffset)).toBeLessThanOrEqual(3);
      }
    });

    it('应该交替更新左右手打字偏移', () => {
      // 在某些时刻左手有偏移，某些时刻右手有偏移
      let leftHasMovement = false;
      let rightHasMovement = false;

      let state = createInitialState();
      for (let i = 0; i < 50; i++) {
        state = updateState(state, 16);
        if (state.leftKeyY > 0) leftHasMovement = true;
        if (state.rightKeyY > 0) rightHasMovement = true;
      }

      expect(leftHasMovement).toBe(true);
      expect(rightHasMovement).toBe(true);
    });

    it('应该循环切换 activeKeyIndex 在 0-5 范围内', () => {
      let state = createInitialState();

      for (let i = 0; i < 200; i++) {
        state = updateState(state, 16);
        expect(state.activeKeyIndex).toBeGreaterThanOrEqual(0);
        expect(state.activeKeyIndex).toBeLessThanOrEqual(5);
      }
    });

    it('应该计算 floatOffset 在小范围内波动', () => {
      let state = createInitialState();

      for (let i = 0; i < 100; i++) {
        state = updateState(state, 16);
        expect(Math.abs(state.floatOffset)).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('calculateScale', () => {
    it('应该基于较短边计算缩放比例', () => {
      // LOGICAL_SIZE = 200
      const scale = calculateScale(400, 300);
      // min(400, 300) / 200 = 1.5
      expect(scale).toBe(1.5);
    });

    it('应该当宽高相等时返回相同的缩放', () => {
      const scale = calculateScale(200, 200);
      expect(scale).toBe(1);
    });

    it('应该当尺寸小于逻辑尺寸时返回小于 1 的缩放', () => {
      const scale = calculateScale(100, 100);
      expect(scale).toBe(0.5);
    });

    it('应该当宽度较短时基于宽度计算', () => {
      const scale = calculateScale(100, 400);
      expect(scale).toBe(0.5); // 100 / 200
    });

    it('应该当高度较短时基于高度计算', () => {
      const scale = calculateScale(400, 100);
      expect(scale).toBe(0.5); // 100 / 200
    });
  });

  describe('COLORS 常量', () => {
    it('应该包含所有必要的颜色定义', () => {
      expect(COLORS).toHaveProperty('outline');
      expect(COLORS).toHaveProperty('fill');
      expect(COLORS).toHaveProperty('accent');
      expect(COLORS).toHaveProperty('desk');
      expect(COLORS).toHaveProperty('keyboard');
      expect(COLORS).toHaveProperty('key');
      expect(COLORS).toHaveProperty('bubble');
      expect(COLORS).toHaveProperty('bubbleText');
    });
  });
});
