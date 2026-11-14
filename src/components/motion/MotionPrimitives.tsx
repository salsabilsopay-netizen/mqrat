'use client';

import React, { useEffect, useRef, useState } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Activates progressive-enhancement reveal CSS only after JS mounts
 * and reduced-motion preferences are verified. If JS fails or is disabled,
 * all sections render immediately visible with zero blank states.
 */
export function MotionInitializer() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      document.documentElement.removeAttribute('data-motion-ready');
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      document.documentElement.setAttribute('data-motion-ready', '1');
    });

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.removeAttribute('data-motion-ready');
      } else {
        document.documentElement.setAttribute('data-motion-ready', '1');
      }
    };

    mql.addEventListener?.('change', onChange);
    return () => {
      window.cancelAnimationFrame(frame);
      mql.removeEventListener?.('change', onChange);
    };
  }, []);

  return null;
}

function useOneShotVisibility(
  ref: React.RefObject<HTMLElement | null>,
  threshold: number = 0.02
): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    let done = false;
    const check = (): boolean => {
      if (done) return true;
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.98) {
        done = true;
        setVisible(true);
        return true;
      }
      return false;
    };

    if (check()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.top <= window.innerHeight * 0.98) {
            done = true;
            setVisible(true);
            cleanup();
            break;
          }
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -10px 0px',
      }
    );

    const onScrollOrHash = () => {
      if (check()) {
        cleanup();
      }
    };

    const cleanup = () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScrollOrHash);
      window.removeEventListener('hashchange', onScrollOrHash);
      window.removeEventListener('resize', onScrollOrHash);
    };

    observer.observe(el);
    window.addEventListener('scroll', onScrollOrHash, { passive: true });
    window.addEventListener('hashchange', onScrollOrHash, { passive: true });
    window.addEventListener('resize', onScrollOrHash, { passive: true });

    return cleanup;
  }, [ref, threshold, visible]);

  return visible;
}

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: 'fade-up' | 'fade-in' | 'image-reveal';
  as?: 'div' | 'section' | 'article';
}

/**
 * GPU-friendly one-shot scroll reveal container.
 * Handles both slow IntersectionObserver reveals and instant scroll jumps,
 * and never re-hides elements after they have entered or passed the viewport.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
  variant = 'fade-up',
  as = 'div',
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const revealed = useOneShotVisibility(ref, 0.02);

  const Tag = as;

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      data-reveal={revealed ? 'visible' : 'pending'}
      data-variant={variant}
      style={{
        transitionDelay: revealed && delay > 0 ? `${delay}ms` : '0ms',
      }}
      className={`reveal-item ${className}`}
    >
      {children}
    </Tag>
  );
}

interface GoldLineProps {
  className?: string;
  origin?: 'right' | 'center';
  delay?: number;
}

/**
 * Animated golden underline/accent rule that draws smoothly once visible.
 */
export function GoldLineDraw({
  className = 'h-0.5 w-6 bg-gold-500 rounded-full',
  origin = 'right',
  delay = 80,
}: GoldLineProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const revealed = useOneShotVisibility(ref, 0.05);

  return (
    <span
      ref={ref}
      data-reveal={revealed ? 'visible' : 'pending'}
      style={{
        transformOrigin: origin === 'center' ? 'center' : 'right',
        transitionDelay: revealed && delay > 0 ? `${delay}ms` : '0ms',
      }}
      className={`inline-block gold-line-draw ${className}`}
    />
  );
}

interface CountUpNumberProps {
  value: number;
  durationMs?: number;
}

/**
 * Smooth one-shot statistical count-up animation from 0 to actual database value.
 * Preserves 0 cleanly and runs strictly once after entering viewport.
 */
export function CountUpNumber({ value, durationMs = 950 }: CountUpNumberProps) {
  const safeTarget = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const [displayValue, setDisplayValue] = useState<number>(0);
  const hasAnimatedRef = useRef(false);
  const inView = useOneShotVisibility(spanRef, 0.1);

  useEffect(() => {
    if (!inView) return;

    if (safeTarget === 0 || prefersReducedMotion()) {
      setDisplayValue(safeTarget);
      hasAnimatedRef.current = true;
      return;
    }

    if (hasAnimatedRef.current) {
      setDisplayValue(safeTarget);
      return;
    }

    hasAnimatedRef.current = true;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(safeTarget * eased));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        setDisplayValue(safeTarget);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [inView, safeTarget, durationMs]);

  return (
    <span ref={spanRef}>
      {displayValue === 0 ? '0' : displayValue.toLocaleString()}
    </span>
  );
}

interface ParallaxLayerProps {
  children: React.ReactNode;
  className?: string;
  maxOffset?: number;
}

/**
 * Lightweight GPU-only scroll parallax using requestAnimationFrame + translate3d.
 * Disabled automatically under prefers-reduced-motion.
 */
export function ParallaxLayer({
  children,
  className = '',
  maxOffset = 10,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let rafPending = false;
    const update = () => {
      rafPending = false;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Normalized position [-1, 1] relative to viewport center
      const centerRatio = ((rect.top + rect.height / 2) - vh / 2) / (vh / 2);
      const clamped = Math.max(-1, Math.min(1, centerRatio));
      const offset = Math.round(clamped * maxOffset * 10) / 10;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const onScroll = () => {
      if (!rafPending) {
        rafPending = true;
        window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (el) el.style.transform = '';
    };
  }, [maxOffset]);

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  );
}
