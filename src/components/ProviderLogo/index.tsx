import React, { useState, useEffect, useRef } from 'react';
import { getProviderLogoUrl } from '@/utils/providerUtils';

/**
 * ProviderLogo 组件的属性
 */
interface ProviderLogoProps {
  /** 供应商唯一标识 */
  providerKey: string;
  /** 供应商名称（用于降级显示和可访问性） */
  providerName: string;
  /** logo 容器尺寸，默认 40px */
  size?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 超时常量定义
 * 防止网络挂起导致长时间等待
 */
const LOGO_LOAD_TIMEOUT = 5000; // 5 秒超时

/**
 * ProviderLogo 组件
 * 显示供应商 logo，支持渐进显示、错误降级和性能优化
 * 
 * @example
 * ```tsx
 * <ProviderLogo
 *   providerKey="openai"
 *   providerName="OpenAI"
 *   size={40}
 * />
 * ```
 */
export const ProviderLogo = React.memo<ProviderLogoProps>(
  ({ providerKey, providerName, size = 40, className = '' }) => {
    // 错误状态：logo 加载失败或超时
    const [imgError, setImgError] = useState(false);
    // 加载状态：logo 是否成功加载
    const [imgLoaded, setImgLoaded] = useState(false);
    // 使用 ref 避免闭包陷阱（在 setTimeout 回调中读取最新值）
    const imgLoadedRef = useRef(false);

    // 超时机制和状态重置
    useEffect(() => {
      // 重置状态当 providerKey 变化
      setImgError(false);
      setImgLoaded(false);
      imgLoadedRef.current = false;

      // 设置超时：如果 LOGO_LOAD_TIMEOUT 毫秒后仍未加载成功，降级到首字母
      const timeoutId = setTimeout(() => {
        if (!imgLoadedRef.current) {
          setImgError(true);
        }
      }, LOGO_LOAD_TIMEOUT);

      return () => clearTimeout(timeoutId);
    }, [providerKey]);

    // 提取首字母（大写）
    const initialLetter = providerName.charAt(0).toUpperCase();

    return (
      <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
        {/* 首字母占位符 - 始终渲染，通过 opacity 控制显示 */}
        <div
          className="flex items-center justify-center rounded-lg bg-primary/10 absolute inset-0 transition-opacity duration-300"
          style={{ opacity: imgLoaded && !imgError ? 0 : 1 }}
          role="img"
          aria-label={`${providerName} logo`}
        >
          <span className="font-bold text-primary" style={{ fontSize: size * 0.5 }}>
            {initialLetter}
          </span>
        </div>

        {/* Logo 图片 - 加载成功后淡入 */}
        {!imgError && (
          <div
            className="flex items-center justify-center rounded-lg bg-muted absolute inset-0 transition-opacity duration-300"
            style={{ opacity: imgLoaded ? 1 : 0 }}
          >
            <img
              key={providerKey} // 确保 providerKey 变化时重新渲染 img 元素
              src={getProviderLogoUrl(providerKey)}
              alt={`${providerName} logo`}
              className="object-contain"
              style={{
                filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))',
                maxWidth: size * 0.8,
                maxHeight: size * 0.8
              }}
              onLoad={() => {
                imgLoadedRef.current = true; // 同步更新 ref
                setImgLoaded(true);
              }}
              onError={() => setImgError(true)}
            />
          </div>
        )}
      </div>
    );
  },
  // 自定义比较函数：只有当关键 props 变化时才重新渲染
  (prevProps, nextProps) => {
    return (
      prevProps.providerKey === nextProps.providerKey &&
      prevProps.providerName === nextProps.providerName &&
      prevProps.size === nextProps.size
    );
  }
);

ProviderLogo.displayName = 'ProviderLogo';
