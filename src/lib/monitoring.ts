/**
 * 애플리케이션 모니터링 시스템
 * 성능, 에러, 사용자 행동을 추적합니다.
 */

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

interface ErrorInfo {
  message: string;
  stack?: string;
  component?: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

interface UserAction {
  action: string;
  component: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

class MonitoringSystem {
  private static instance: MonitoringSystem;
  private performanceObserver: PerformanceObserver | null = null;
  private errorQueue: ErrorInfo[] = [];
  private actionQueue: UserAction[] = [];
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializePerformanceMonitoring();
    this.initializeErrorMonitoring();
    this.initializeUserActionMonitoring();
  }

  public static getInstance(): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem();
    }
    return MonitoringSystem.instance;
  }

  /**
   * 성능 모니터링 초기화
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Core Web Vitals 모니터링
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackPerformanceMetric(entry);
          }
        });

        this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
      } catch (error) {
        console.warn('Performance monitoring initialization failed:', error);
      }
    }
  }

  /**
   * 에러 모니터링 초기화
   */
  private initializeErrorMonitoring(): void {
    if (typeof window !== 'undefined') {
      // JavaScript 에러 캐치
      window.addEventListener('error', (event) => {
        this.trackError({
          message: event.message,
          stack: event.error?.stack,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
      });

      // Promise rejection 캐치
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError({
          message: event.reason?.message || 'Unhandled Promise Rejection',
          stack: event.reason?.stack,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
      });
    }
  }

  /**
   * 사용자 행동 모니터링 초기화
   */
  private initializeUserActionMonitoring(): void {
    if (typeof window !== 'undefined') {
      // 페이지 뷰 추적
      this.trackPageView();

      // 클릭 이벤트 추적
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target) {
          this.trackUserAction('click', target.tagName.toLowerCase(), {
            text: target.textContent?.slice(0, 50),
            className: target.className,
            id: target.id
          });
        }
      });

      // 폼 제출 추적
      document.addEventListener('submit', (event) => {
        const form = event.target as HTMLFormElement;
        this.trackUserAction('form_submit', form.tagName.toLowerCase(), {
          action: form.action,
          method: form.method
        });
      });
    }
  }

  /**
   * 성능 메트릭 추적
   */
  private trackPerformanceMetric(entry: PerformanceEntry): void {
    const metrics: Partial<PerformanceMetrics> = {};

    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        metrics.pageLoadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
        break;

      case 'paint':
        const paintEntry = entry as PerformancePaintTiming;
        if (paintEntry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = paintEntry.startTime;
        }
        break;

      case 'largest-contentful-paint':
        const lcpEntry = entry as PerformanceEntry;
        metrics.largestContentfulPaint = lcpEntry.startTime;
        break;

      case 'layout-shift':
        const clsEntry = entry as any;
        metrics.cumulativeLayoutShift = clsEntry.value;
        break;

      case 'first-input':
        const fidEntry = entry as any;
        metrics.firstInputDelay = fidEntry.processingStart - fidEntry.startTime;
        break;
    }

    if (Object.keys(metrics).length > 0) {
      this.sendPerformanceData(metrics);
    }
  }

  /**
   * 에러 추적
   */
  public trackError(error: ErrorInfo): void {
    this.errorQueue.push(error);
    
    // 큐가 너무 커지면 즉시 전송
    if (this.errorQueue.length >= 10) {
      this.flushErrorQueue();
    }

    // 개발 환경에서는 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('Tracked Error:', error);
    }
  }

  /**
   * 사용자 행동 추적
   */
  public trackUserAction(action: string, component: string, metadata?: any): void {
    const userAction: UserAction = {
      action,
      component,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.actionQueue.push(userAction);
    
    // 큐가 너무 커지면 즉시 전송
    if (this.actionQueue.length >= 20) {
      this.flushActionQueue();
    }
  }

  /**
   * 페이지 뷰 추적
   */
  private trackPageView(): void {
    this.trackUserAction('page_view', 'navigation', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer
    });
  }

  /**
   * 성능 데이터 전송
   */
  private async sendPerformanceData(metrics: Partial<PerformanceMetrics>): Promise<void> {
    try {
      await fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          sessionId: this.sessionId,
          timestamp: Date.now(),
          url: window.location.href
        })
      });
    } catch (error) {
      console.warn('Failed to send performance data:', error);
    }
  }

  /**
   * 에러 큐 플러시
   */
  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errors,
          sessionId: this.sessionId,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.warn('Failed to send error data:', error);
    }
  }

  /**
   * 액션 큐 플러시
   */
  private async flushActionQueue(): Promise<void> {
    if (this.actionQueue.length === 0) return;

    const actions = [...this.actionQueue];
    this.actionQueue = [];

    try {
      await fetch('/api/monitoring/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actions,
          sessionId: this.sessionId,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.warn('Failed to send action data:', error);
    }
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 모든 큐 플러시 (페이지 언로드 시)
   */
  public flushAllQueues(): void {
    this.flushErrorQueue();
    this.flushActionQueue();
  }

  /**
   * 커스텀 이벤트 추적
   */
  public trackCustomEvent(eventName: string, data?: any): void {
    this.trackUserAction(eventName, 'custom', data);
  }

  /**
   * 성능 측정 시작
   */
  public startPerformanceMeasurement(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.trackCustomEvent('performance_measurement', {
        name,
        duration,
        timestamp: Date.now()
      });
    };
  }
}

// 전역 인스턴스 생성
export const monitoring = MonitoringSystem.getInstance();

// 페이지 언로드 시 큐 플러시
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    monitoring.flushAllQueues();
  });
}

// React 컴포넌트용 훅
export const useMonitoring = () => {
  return {
    trackError: (error: Error, component?: string) => {
      monitoring.trackError({
        message: error.message,
        stack: error.stack,
        component,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    },
    trackAction: (action: string, component: string, metadata?: any) => {
      monitoring.trackUserAction(action, component, metadata);
    },
    trackCustomEvent: (eventName: string, data?: any) => {
      monitoring.trackCustomEvent(eventName, data);
    },
    startPerformanceMeasurement: (name: string) => {
      return monitoring.startPerformanceMeasurement(name);
    }
  };
}; 