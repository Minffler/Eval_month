import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

// 타입 정의
interface Evaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  score: number;
  comment: string;
  strengths: string;
  improvements: string;
  date: string;
  status: 'pending' | 'completed';
  evaluatorId: string;
}

interface Assignment {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  evaluatorId: string;
}

interface EvaluationState {
  evaluations: Evaluation[];
  assignments: Assignment[];
  loading: boolean;
  error: string | null;
}

type EvaluationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EVALUATIONS'; payload: Evaluation[] }
  | { type: 'SET_ASSIGNMENTS'; payload: Assignment[] }
  | { type: 'ADD_EVALUATION'; payload: Evaluation }
  | { type: 'UPDATE_EVALUATION'; payload: { id: string; updates: Partial<Evaluation> } }
  | { type: 'DELETE_EVALUATION'; payload: string }
  | { type: 'UPDATE_ASSIGNMENT'; payload: { id: string; updates: Partial<Assignment> } };

// 리듀서
const evaluationReducer = (state: EvaluationState, action: EvaluationAction): EvaluationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_EVALUATIONS':
      return { ...state, evaluations: action.payload };
    case 'SET_ASSIGNMENTS':
      return { ...state, assignments: action.payload };
    case 'ADD_EVALUATION':
      return { ...state, evaluations: [...state.evaluations, action.payload] };
    case 'UPDATE_EVALUATION':
      return {
        ...state,
        evaluations: state.evaluations.map(eval =>
          eval.id === action.payload.id ? { ...eval, ...action.payload.updates } : eval
        )
      };
    case 'DELETE_EVALUATION':
      return {
        ...state,
        evaluations: state.evaluations.filter(eval => eval.id !== action.payload)
      };
    case 'UPDATE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.map(assignment =>
          assignment.id === action.payload.id ? { ...assignment, ...action.payload.updates } : assignment
        )
      };
    default:
      return state;
  }
};

// Context 생성
interface OptimizedEvaluationContextType {
  // 상태
  state: EvaluationState;
  
  // 기본 액션
  dispatch: React.Dispatch<EvaluationAction>;
  
  // 메모이제이션된 계산값들
  completedEvaluations: Evaluation[];
  pendingAssignments: Assignment[];
  
  // 성능 최적화된 쿼리 함수들
  getEvaluationsByMonth: (year: number, month: number) => Evaluation[];
  getAssignmentsByMonth: (year: number, month: number) => Assignment[];
  getEvaluationsByEmployee: (employeeId: string) => Evaluation[];
  getAssignmentsByEvaluator: (evaluatorId: string) => Assignment[];
  
  // 통계 계산 함수들
  getMonthlyStats: (year: number, month: number) => {
    totalEvaluations: number;
    completedEvaluations: number;
    averageScore: number;
    completionRate: number;
  };
  
  // 액션 함수들
  addEvaluation: (evaluation: Omit<Evaluation, 'id'>) => void;
  updateEvaluation: (id: string, updates: Partial<Evaluation>) => void;
  deleteEvaluation: (id: string) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
}

const OptimizedEvaluationContext = createContext<OptimizedEvaluationContextType | undefined>(undefined);

// Provider 컴포넌트
interface OptimizedEvaluationProviderProps {
  children: React.ReactNode;
}

export const OptimizedEvaluationProvider: React.FC<OptimizedEvaluationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(evaluationReducer, {
    evaluations: [],
    assignments: [],
    loading: false,
    error: null
  });

  // 메모이제이션된 계산값들
  const completedEvaluations = useMemo(() => 
    state.evaluations.filter(eval => eval.status === 'completed'),
    [state.evaluations]
  );

  const pendingAssignments = useMemo(() => 
    state.assignments.filter(assignment => assignment.status === 'pending'),
    [state.assignments]
  );

  // 성능 최적화된 쿼리 함수들
  const getEvaluationsByMonth = useCallback((year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return state.evaluations.filter(eval => {
      const evalDate = new Date(eval.date);
      return evalDate >= startDate && evalDate <= endDate;
    });
  }, [state.evaluations]);

  const getAssignmentsByMonth = useCallback((year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return state.assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.dueDate);
      return assignmentDate >= startDate && assignmentDate <= endDate;
    });
  }, [state.assignments]);

  const getEvaluationsByEmployee = useCallback((employeeId: string) => {
    return state.evaluations.filter(eval => eval.employeeId === employeeId);
  }, [state.evaluations]);

  const getAssignmentsByEvaluator = useCallback((evaluatorId: string) => {
    return state.assignments.filter(assignment => assignment.evaluatorId === evaluatorId);
  }, [state.assignments]);

  // 통계 계산 함수들
  const getMonthlyStats = useCallback((year: number, month: number) => {
    const monthlyEvaluations = getEvaluationsByMonth(year, month);
    const totalEvaluations = monthlyEvaluations.length;
    const completedEvaluations = monthlyEvaluations.filter(eval => eval.status === 'completed').length;
    const averageScore = totalEvaluations > 0 
      ? monthlyEvaluations.reduce((sum, eval) => sum + eval.score, 0) / totalEvaluations 
      : 0;
    const completionRate = totalEvaluations > 0 ? (completedEvaluations / totalEvaluations) * 100 : 0;

    return {
      totalEvaluations,
      completedEvaluations,
      averageScore,
      completionRate
    };
  }, [getEvaluationsByMonth]);

  // 액션 함수들
  const addEvaluation = useCallback((evaluation: Omit<Evaluation, 'id'>) => {
    const newEvaluation: Evaluation = {
      ...evaluation,
      id: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    dispatch({ type: 'ADD_EVALUATION', payload: newEvaluation });
  }, []);

  const updateEvaluation = useCallback((id: string, updates: Partial<Evaluation>) => {
    dispatch({ type: 'UPDATE_EVALUATION', payload: { id, updates } });
  }, []);

  const deleteEvaluation = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EVALUATION', payload: id });
  }, []);

  const updateAssignment = useCallback((id: string, updates: Partial<Assignment>) => {
    dispatch({ type: 'UPDATE_ASSIGNMENT', payload: { id, updates } });
  }, []);

  const value = useMemo(() => ({
    state,
    dispatch,
    completedEvaluations,
    pendingAssignments,
    getEvaluationsByMonth,
    getAssignmentsByMonth,
    getEvaluationsByEmployee,
    getAssignmentsByEvaluator,
    getMonthlyStats,
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,
    updateAssignment
  }), [
    state,
    completedEvaluations,
    pendingAssignments,
    getEvaluationsByMonth,
    getAssignmentsByMonth,
    getEvaluationsByEmployee,
    getAssignmentsByEvaluator,
    getMonthlyStats,
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,
    updateAssignment
  ]);

  return (
    <OptimizedEvaluationContext.Provider value={value}>
      {children}
    </OptimizedEvaluationContext.Provider>
  );
};

// Hook
export const useOptimizedEvaluation = () => {
  const context = useContext(OptimizedEvaluationContext);
  if (context === undefined) {
    throw new Error('useOptimizedEvaluation must be used within an OptimizedEvaluationProvider');
  }
  return context;
}; 