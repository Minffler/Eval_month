import { useCallback, useRef, useEffect, useMemo } from 'react';

/**
 * 성능 최적화를 위한 커스텀 훅들
 */

// 디바운스 훅
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;
}

// 쓰로틀 훅
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0);
  const lastCallTimer = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall.current >= delay) {
        callback(...args);
        lastCall.current = now;
      } else {
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current);
        }
        lastCallTimer.current = setTimeout(() => {
          callback(...args);
          lastCall.current = Date.now();
        }, delay - (now - lastCall.current));
      }
    },
    [callback, delay]
  ) as T;
}

// 무한 스크롤 훅
export function useInfiniteScroll(
  onLoadMore: () => void,
  hasMore: boolean,
  loading: boolean
) {
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore, loading]);

  return loadMoreRef;
}

// 메모이제이션된 정렬 훅
export function useMemoizedSort<T>(
  data: T[],
  sortKey: keyof T | null,
  sortDirection: 'asc' | 'desc' | null
) {
  return useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortKey, sortDirection]);
}

// 메모이제이션된 필터링 훅
export function useMemoizedFilter<T>(
  data: T[],
  filterFn: (item: T) => boolean
) {
  return useMemo(() => {
    return data.filter(filterFn);
  }, [data, filterFn]);
}

// 성능 측정 훅
export function usePerformanceMeasure(name: string) {
  const startTime = useRef<number>();

  const startMeasure = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endMeasure = useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      console.log(`${name} took ${duration.toFixed(2)}ms`);
      startTime.current = undefined;
    }
  }, [name]);

  return { startMeasure, endMeasure };
}

// 리렌더링 방지 훅
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      return callbackRef.current(...args);
    },
    []
  ) as T;
}

// 조건부 렌더링 최적화 훅
export function useConditionalRender<T>(
  condition: boolean,
  trueValue: T,
  falseValue: T
): T {
  return useMemo(() => {
    return condition ? trueValue : falseValue;
  }, [condition, trueValue, falseValue]);
} 