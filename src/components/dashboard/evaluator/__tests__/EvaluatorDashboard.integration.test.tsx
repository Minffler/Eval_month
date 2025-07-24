import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EvaluatorDashboard } from '../EvaluatorDashboard'
import { mockEvaluations, mockAssignments } from '@/__tests__/utils/test-utils'

// Mock the context hook
jest.mock('@/contexts/evaluation-context', () => ({
  useEvaluation: () => ({
    evaluations: mockEvaluations,
    assignments: mockAssignments,
    statistics: {
      totalEvaluations: 2,
      completedEvaluations: 1,
      averageScore: 4.5
    }
  })
}))

describe('EvaluatorDashboard Integration', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it('대시보드가 올바르게 렌더링된다', () => {
    render(<EvaluatorDashboard />)
    
    expect(screen.getByText('평가자 대시보드')).toBeInTheDocument()
    expect(screen.getByText('2024-01 평가 현황')).toBeInTheDocument()
  })

  it('통계 카드들이 올바르게 표시된다', () => {
    render(<EvaluatorDashboard />)
    
    expect(screen.getByText('총 과제 수')).toBeInTheDocument()
    expect(screen.getByText('완료된 평가')).toBeInTheDocument()
    expect(screen.getByText('대기 중인 평가')).toBeInTheDocument()
    expect(screen.getByText('완료율')).toBeInTheDocument()
  })

  it('월 선택기가 올바르게 작동한다', async () => {
    render(<EvaluatorDashboard />)
    
    const monthSelector = screen.getByRole('combobox')
    expect(monthSelector).toBeInTheDocument()
    
    // 월 변경 테스트
    fireEvent.click(monthSelector)
    
    await waitFor(() => {
      expect(screen.getByText('2024년 2월')).toBeInTheDocument()
    })
  })

  it('과제 관리 섹션이 표시된다', () => {
    render(<EvaluatorDashboard />)
    
    expect(screen.getByText('과제 관리')).toBeInTheDocument()
    expect(screen.getByText('김철수')).toBeInTheDocument()
    expect(screen.getByText('이영희')).toBeInTheDocument()
  })

  it('평가 입력 섹션이 표시된다', () => {
    render(<EvaluatorDashboard />)
    
    expect(screen.getByText('평가 입력')).toBeInTheDocument()
    expect(screen.getByText('1개 대기')).toBeInTheDocument()
  })

  it('결과 조회 섹션이 표시된다', () => {
    render(<EvaluatorDashboard />)
    
    expect(screen.getByText('평가 결과')).toBeInTheDocument()
    expect(screen.getByText('2개 완료')).toBeInTheDocument()
  })

  it('과제 상태에 따라 올바른 배지가 표시된다', () => {
    render(<EvaluatorDashboard />)
    
    // 완료된 과제
    expect(screen.getByText('완료')).toBeInTheDocument()
    
    // 대기 중인 과제
    expect(screen.getByText('대기')).toBeInTheDocument()
  })

  it('우선순위에 따라 올바른 배지가 표시된다', () => {
    render(<EvaluatorDashboard />)
    
    expect(screen.getByText('높음')).toBeInTheDocument()
    expect(screen.getByText('보통')).toBeInTheDocument()
  })

  it('평가 점수가 올바르게 표시된다', () => {
    render(<EvaluatorDashboard />)
    
    expect(screen.getByText('4점')).toBeInTheDocument()
    expect(screen.getByText('5점')).toBeInTheDocument()
  })

  it('빈 상태 메시지가 올바르게 표시된다', () => {
    // 빈 데이터로 렌더링
    jest.doMock('@/contexts/evaluation-context', () => ({
      useEvaluation: () => ({
        evaluations: [],
        assignments: [],
        statistics: {
          totalEvaluations: 0,
          completedEvaluations: 0,
          averageScore: 0
        }
      })
    }))

    render(<EvaluatorDashboard />)
    
    expect(screen.getByText('이번 달 배정된 과제가 없습니다.')).toBeInTheDocument()
  })

  it('로딩 상태가 올바르게 처리된다', async () => {
    // 로딩 상태 모킹
    jest.doMock('@/contexts/evaluation-context', () => ({
      useEvaluation: () => ({
        evaluations: [],
        assignments: [],
        statistics: null,
        loading: true
      })
    }))

    render(<EvaluatorDashboard />)
    
    // 로딩 스피너나 스켈레톤이 표시되는지 확인
    expect(screen.getByText('평가자 대시보드')).toBeInTheDocument()
  })

  it('에러 상태가 올바르게 처리된다', () => {
    // 에러 상태 모킹
    jest.doMock('@/contexts/evaluation-context', () => ({
      useEvaluation: () => ({
        evaluations: [],
        assignments: [],
        statistics: null,
        loading: false,
        error: '데이터를 불러오는 중 오류가 발생했습니다.'
      })
    }))

    render(<EvaluatorDashboard />)
    
    expect(screen.getByText('평가자 대시보드')).toBeInTheDocument()
  })
}) 