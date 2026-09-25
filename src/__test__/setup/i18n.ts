/**
 * react-i18next 全局默认 Mock
 *
 * 纯默认 i18n mock 全局提升（design D2）：无自定义翻译键需求的测试文件
 * 不再逐份声明 vi.mock('react-i18next')，统一依赖本注册。
 * 工厂复用 helpers/mocks/i18n.ts 的 __mockI18n 纯默认行为（经 setup/base.ts
 * 注册到 globalThis，规避 vi.mock 工厂的 hoisting 限制）。
 *
 * 需要自定义翻译键的文件仍可通过文件级
 * vi.mock('react-i18next', () => globalThis.__mockI18n(自定义键)) 覆盖；
 * 依赖真实 react-i18next 行为的文件用 vi.unmock('react-i18next') 恢复。
 */

import { vi } from 'vitest';

vi.mock('react-i18next', () => globalThis.__mockI18n());
