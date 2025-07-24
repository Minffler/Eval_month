import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoaderProps {
  children: React.ReactNode;
  threshold?: number;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  className?: string;
}

/**
 * 지연 로딩 컴포넌트
 * Intersection Observer를 사용하여 뷰포트에 진입할 때만 렌더링
 */
export const LazyLoader: React.FC<LazyLoaderProps> = ({
  children,
  threshold = 0.1,
  placeholder,
  onLoad,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && !hasLoaded) {
      setIsVisible(true);
      setHasLoaded(true);
      onLoad?.();
    }
  }, [hasLoaded, onLoad]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin: '50px'
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection, threshold]);

  const defaultPlaceholder = (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (placeholder || defaultPlaceholder)}
    </div>
  );
};

// 특정 컴포넌트를 지연 로딩하는 HOC
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  placeholder?: React.ReactNode
) {
  return React.forwardRef<any, P>((props, ref) => (
    <LazyLoader placeholder={placeholder}>
      <Component {...props} ref={ref} />
    </LazyLoader>
  ));
} 