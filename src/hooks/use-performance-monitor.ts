import { useEffect, useRef } from 'react';
import { log } from '@/lib/logger';

export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
    startTime.current = performance.now();
    
    log.debug(`${componentName} 렌더링 횟수: ${renderCount.current}`);
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      
      if (duration > 16) { // 60fps 기준
        log.warn(`${componentName} 렌더링 시간: ${duration.toFixed(2)}ms (느림)`);
      } else {
        log.debug(`${componentName} 렌더링 시간: ${duration.toFixed(2)}ms`);
      }
    };
  });
}; 