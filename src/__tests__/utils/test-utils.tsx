import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { OptimizedEvaluationProvider } from '@/contexts/optimized-evaluation-context'

// Mock data for testing
export const mockEvaluations = [
  {
    id: 'eval_1',
    employeeId: 'emp_1',
    employeeName: '김철수',
    department: '개발팀',
    score: 4,
    comment: '우수한 성과',
    strengths: '문제 해결 능력이 뛰어남',
    improvements: '의사소통 개선 필요',
    date: '2024-01-15',
    status: 'completed' as const,
    evaluatorId: 'eval_1'
  },
  {
    id: 'eval_2',
    employeeId: 'emp_2',
    employeeName: '이영희',
    department: '디자인팀',
    score: 5,
    comment: '매우 우수한 성과',
    strengths: '창의적이고 혁신적',
    improvements: '없음',
    date: '2024-01-16',
    status: 'completed' as const,
    evaluatorId: 'eval_1'
  }
]

export const mockAssignments = [
  {
    id: 'assign_1',
    employeeId: 'emp_1',
    employeeName: '김철수',
    department: '개발팀',
    dueDate: '2024-01-31',
    status: 'completed' as const,
    priority: 'high' as const,
    evaluatorId: 'eval_1'
  },
  {
    id: 'assign_2',
    employeeId: 'emp_2',
    employeeName: '이영희',
    department: '디자인팀',
    dueDate: '2024-01-31',
    status: 'pending' as const,
    priority: 'medium' as const,
    evaluatorId: 'eval_1'
  }
]

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEvaluations?: typeof mockEvaluations
  initialAssignments?: typeof mockAssignments
}

const AllTheProviders = ({ 
  children, 
  initialEvaluations = [], 
  initialAssignments = [] 
}: { 
  children: React.ReactNode
  initialEvaluations?: typeof mockEvaluations
  initialAssignments?: typeof mockAssignments
}) => {
  return (
    <OptimizedEvaluationProvider>
      {children}
    </OptimizedEvaluationProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEvaluations, initialAssignments, ...renderOptions } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders 
        initialEvaluations={initialEvaluations}
        initialAssignments={initialAssignments}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test helpers
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export const createMockUser = (overrides = {}) => ({
  id: 'user_1',
  name: '테스트 사용자',
  email: 'test@example.com',
  role: 'evaluator' as const,
  department: '개발팀',
  ...overrides
})

export const createMockEvaluation = (overrides = {}) => ({
  id: `eval_${Date.now()}`,
  employeeId: 'emp_1',
  employeeName: '김철수',
  department: '개발팀',
  score: 4,
  comment: '우수한 성과',
  strengths: '문제 해결 능력이 뛰어남',
  improvements: '의사소통 개선 필요',
  date: '2024-01-15',
  status: 'completed' as const,
  evaluatorId: 'eval_1',
  ...overrides
})

export const createMockAssignment = (overrides = {}) => ({
  id: `assign_${Date.now()}`,
  employeeId: 'emp_1',
  employeeName: '김철수',
  department: '개발팀',
  dueDate: '2024-01-31',
  status: 'pending' as const,
  priority: 'medium' as const,
  evaluatorId: 'eval_1',
  ...overrides
}) 