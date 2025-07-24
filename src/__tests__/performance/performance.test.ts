import { render } from '@testing-library/react'
import { EvaluatorDashboardUltraOptimized } from '@/components/dashboard/evaluator/EvaluatorDashboardUltraOptimized'
import { mockEvaluations, mockAssignments } from '@/__tests__/utils/test-utils'

// Mock the context hook
jest.mock('@/contexts/optimized-evaluation-context', () => ({
  useOptimizedEvaluation: () => ({
    getEvaluationsByMonth: jest.fn(() => mockEvaluations),
    getAssignmentsByMonth: jest.fn(() => mockAssignments),
    getMonthlyStats: jest.fn(() => ({
      totalEvaluations: 2,
      completedEvaluations: 1,
      averageScore: 4.5,
      completionRate: 50
    })),
    completedEvaluations: mockEvaluations.filter(e => e.status === 'completed'),
    pendingAssignments: mockAssignments.filter(a => a.status === 'pending')
  })
}))

describe('성능 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 성능 측정을 위한 타이머 모킹
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('대시보드 렌더링 시간이 100ms 이내여야 한다', () => {
    const startTime = performance.now()
    
    render(<EvaluatorDashboardUltraOptimized />)
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    expect(renderTime).toBeLessThan(100)
  })

  it('메모이제이션이 올바르게 작동해야 한다', () => {
    const { rerender } = render(<EvaluatorDashboardUltraOptimized />)
    
    // 첫 번째 렌더링
    const firstRenderTime = performance.now()
    rerender(<EvaluatorDashboardUltraOptimized />)
    const secondRenderTime = performance.now()
    
    // 두 번째 렌더링이 더 빠르거나 비슷해야 함
    expect(secondRenderTime - firstRenderTime).toBeLessThan(50)
  })

  it('대용량 데이터에서도 성능이 유지되어야 한다', () => {
    // 대용량 데이터 생성
    const largeEvaluations = Array.from({ length: 1000 }, (_, i) => ({
      id: `eval_${i}`,
      employeeId: `emp_${i}`,
      employeeName: `직원${i}`,
      department: '개발팀',
      score: Math.floor(Math.random() * 5) + 1,
      comment: '테스트 평가',
      strengths: '강점',
      improvements: '개선점',
      date: '2024-01-15',
      status: 'completed' as const,
      evaluatorId: 'eval_1'
    }))

    const largeAssignments = Array.from({ length: 1000 }, (_, i) => ({
      id: `assign_${i}`,
      employeeId: `emp_${i}`,
      employeeName: `직원${i}`,
      department: '개발팀',
      dueDate: '2024-01-31',
      status: 'pending' as const,
      priority: 'medium' as const,
      evaluatorId: 'eval_1'
    }))

    // 대용량 데이터로 모킹
    jest.doMock('@/contexts/optimized-evaluation-context', () => ({
      useOptimizedEvaluation: () => ({
        getEvaluationsByMonth: jest.fn(() => largeEvaluations),
        getAssignmentsByMonth: jest.fn(() => largeAssignments),
        getMonthlyStats: jest.fn(() => ({
          totalEvaluations: 1000,
          completedEvaluations: 500,
          averageScore: 3.5,
          completionRate: 50
        })),
        completedEvaluations: largeEvaluations.filter(e => e.status === 'completed'),
        pendingAssignments: largeAssignments.filter(a => a.status === 'pending')
      })
    }))

    const startTime = performance.now()
    render(<EvaluatorDashboardUltraOptimized />)
    const endTime = performance.now()
    
    // 대용량 데이터에서도 200ms 이내에 렌더링되어야 함
    expect(endTime - startTime).toBeLessThan(200)
  })

  it('가상화가 올바르게 작동해야 한다', () => {
    const { container } = render(<EvaluizedTable 
      data={Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }))}
      columns={[{ key: 'name', header: 'Name' }]}
      rowHeight={48}
      visibleRows={10}
    />)
    
    // 실제로 렌더링된 DOM 노드 수 확인
    const tableRows = container.querySelectorAll('tbody tr')
    
    // 가상화로 인해 실제 렌더링된 행은 visibleRows + buffer 정도여야 함
    expect(tableRows.length).toBeLessThan(20)
  })

  it('지연 로딩이 올바르게 작동해야 한다', () => {
    const { container } = render(<LazyLoader>테스트 콘텐츠</LazyLoader>)
    
    // 초기에는 placeholder가 표시되어야 함
    expect(container.textContent).not.toContain('테스트 콘텐츠')
    
    // Intersection Observer 트리거 시뮬레이션
    const observer = new IntersectionObserver(() => {})
    const entries = [{ isIntersecting: true }]
    observer.callback(entries)
    
    // 콘텐츠가 로드되어야 함
    expect(container.textContent).toContain('테스트 콘텐츠')
  })

  it('디바운스가 올바르게 작동해야 한다', () => {
    const mockCallback = jest.fn()
    const debouncedCallback = useDebounce(mockCallback, 300)
    
    // 여러 번 호출
    debouncedCallback()
    debouncedCallback()
    debouncedCallback()
    
    // 아직 실행되지 않아야 함
    expect(mockCallback).not.toHaveBeenCalled()
    
    // 300ms 후 실행되어야 함
    jest.advanceTimersByTime(300)
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('메모리 누수가 없어야 한다', () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
    
    // 여러 번 렌더링/언마운트
    for (let i = 0; i < 10; i++) {
      const { unmount } = render(<EvaluatorDashboardUltraOptimized />)
      unmount()
    }
    
    // 가비지 컬렉션 강제 실행 (실제로는 불가능하지만 테스트 목적)
    if (global.gc) {
      global.gc()
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
    
    // 메모리 사용량이 크게 증가하지 않아야 함
    expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024) // 10MB
  })

  it('네트워크 요청이 최적화되어야 한다', () => {
    const mockFetch = jest.fn()
    global.fetch = mockFetch
    
    render(<EvaluatorDashboardUltraOptimized />)
    
    // 필요한 API 호출만 발생해야 함
    expect(mockFetch).toHaveBeenCalledTimes(2) // evaluations, assignments
    
    // 중복 요청이 없어야 함
    const uniqueUrls = new Set(mockFetch.mock.calls.map(call => call[0]))
    expect(uniqueUrls.size).toBe(2)
  })
}) 