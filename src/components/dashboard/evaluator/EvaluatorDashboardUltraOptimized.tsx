import React, { useState, useMemo, useCallback } from 'react';
import { DashboardLayout } from '../common/DashboardLayout';
import { MemoizedStatsCard } from '../common/MemoizedStatsCard';
import { MonthSelector } from '../common/MonthSelector';
import { VirtualizedTable } from '../common/VirtualizedTable';
import { LazyLoader } from '../common/LazyLoader';
import { useOptimizedEvaluation } from '@/contexts/optimized-evaluation-context';
import { useFilterState, usePagination } from '@/hooks/use-local-state';
import { 
  useDebounce, 
  useMemoizedSort, 
  useMemoizedFilter,
  usePerformanceMeasure 
} from '@/hooks/use-performance-optimization';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';

interface Assignment {
  id: string;
  employeeName: string;
  department: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface Evaluation {
  id: string;
  employeeName: string;
  department: string;
  score: number;
  date: string;
  status: 'completed' | 'pending';
}

/**
 * 초고성능 최적화된 평가자 대시보드 컴포넌트
 * 모든 성능 최적화 기법 적용
 */
export const EvaluatorDashboardUltraOptimized: React.FC = () => {
  const { startMeasure, endMeasure } = usePerformanceMeasure('Dashboard Render');
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Assignment | keyof Evaluation;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  const { 
    getEvaluationsByMonth, 
    getAssignmentsByMonth, 
    getMonthlyStats,
    completedEvaluations,
    pendingAssignments 
  } = useOptimizedEvaluation();

  // 성능 측정 시작
  React.useEffect(() => {
    startMeasure();
    return () => endMeasure();
  }, [startMeasure, endMeasure]);

  // 선택된 월의 데이터만 필터링 (메모이제이션)
  const monthlyData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return {
      evaluations: getEvaluationsByMonth(year, month),
      assignments: getAssignmentsByMonth(year, month)
    };
  }, [selectedMonth, getEvaluationsByMonth, getAssignmentsByMonth]);

  // 통계 계산 (메모이제이션)
  const stats = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return getMonthlyStats(year, month);
  }, [selectedMonth, getMonthlyStats]);

  // 정렬된 데이터 (메모이제이션)
  const sortedAssignments = useMemoizedSort(
    monthlyData.assignments,
    sortConfig?.key as keyof Assignment | null,
    sortConfig?.direction || null
  );

  const sortedEvaluations = useMemoizedSort(
    monthlyData.evaluations,
    sortConfig?.key as keyof Evaluation | null,
    sortConfig?.direction || null
  );

  // 필터링된 데이터 (메모이제이션)
  const filteredAssignments = useMemoizedFilter(
    sortedAssignments,
    useCallback((assignment: Assignment) => assignment.status !== 'completed', [])
  );

  const filteredEvaluations = useMemoizedFilter(
    sortedEvaluations,
    useCallback((evaluation: Evaluation) => evaluation.status === 'completed', [])
  );

  // 디바운스된 월 변경 핸들러
  const debouncedMonthChange = useDebounce((month: string) => {
    setSelectedMonth(month);
  }, 300);

  // 정렬 핸들러 (메모이제이션)
  const handleSort = useCallback((key: keyof Assignment | keyof Evaluation) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // 테이블 컬럼 정의 (메모이제이션)
  const assignmentColumns = useMemo(() => [
    {
      key: 'employeeName' as keyof Assignment,
      header: '직원',
      width: 150,
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: 'department' as keyof Assignment,
      header: '부서',
      width: 120
    },
    {
      key: 'dueDate' as keyof Assignment,
      header: '마감일',
      width: 120,
      render: (value: string) => new Date(value).toLocaleDateString('ko-KR')
    },
    {
      key: 'priority' as keyof Assignment,
      header: '우선순위',
      width: 100,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value === 'high' ? 'bg-red-100 text-red-800' :
          value === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value === 'high' ? '높음' : value === 'medium' ? '보통' : '낮음'}
        </span>
      )
    }
  ], []);

  const evaluationColumns = useMemo(() => [
    {
      key: 'employeeName' as keyof Evaluation,
      header: '직원',
      width: 150,
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: 'department' as keyof Evaluation,
      header: '부서',
      width: 120
    },
    {
      key: 'score' as keyof Evaluation,
      header: '점수',
      width: 80,
      render: (value: number) => (
        <span className={`font-bold ${
          value >= 4 ? 'text-green-600' :
          value >= 3 ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {value}점
        </span>
      )
    },
    {
      key: 'date' as keyof Evaluation,
      header: '평가일',
      width: 120,
      render: (value: string) => new Date(value).toLocaleDateString('ko-KR')
    }
  ], []);

  return (
    <DashboardLayout
      title="평가자 대시보드 (최적화)"
      subtitle={`${selectedMonth} 평가 현황`}
    >
      <div className="space-y-6">
        {/* 월 선택기 */}
        <div className="flex justify-between items-center">
          <MonthSelector
            selectedMonth={selectedMonth}
            onMonthChange={debouncedMonthChange}
            className="flex-1"
          />
        </div>

        {/* 통계 카드 (메모이제이션) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MemoizedStatsCard
            title="총 과제 수"
            value={stats.totalEvaluations}
            icon={<FileText />}
            description="이번 달 배정된 평가 과제"
          />
          <MemoizedStatsCard
            title="완료된 평가"
            value={stats.completedEvaluations}
            icon={<CheckCircle />}
            description="평가 완료된 과제"
          />
          <MemoizedStatsCard
            title="대기 중인 평가"
            value={stats.totalEvaluations - stats.completedEvaluations}
            icon={<Clock />}
            description="아직 평가하지 않은 과제"
          />
          <MemoizedStatsCard
            title="완료율"
            value={`${stats.completionRate.toFixed(1)}%`}
            icon={<Users />}
            description="평가 완료 비율"
          />
        </div>

        {/* 주요 기능 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 과제 관리 (지연 로딩) */}
          <LazyLoader>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">과제 관리</h3>
              <VirtualizedTable
                data={filteredAssignments}
                columns={assignmentColumns}
                rowHeight={48}
                visibleRows={8}
                className="border rounded-lg"
              />
            </div>
          </LazyLoader>
          
          {/* 평가 입력 (지연 로딩) */}
          <LazyLoader>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">평가 입력</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  대기 중인 과제: {pendingAssignments.length}개
                </p>
                {/* 평가 입력 폼은 별도 컴포넌트로 분리 */}
              </div>
            </div>
          </LazyLoader>
        </div>

        {/* 결과 조회 (지연 로딩) */}
        <LazyLoader>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">평가 결과</h3>
            <VirtualizedTable
              data={filteredEvaluations}
              columns={evaluationColumns}
              rowHeight={48}
              visibleRows={10}
              className="border rounded-lg"
            />
          </div>
        </LazyLoader>
      </div>
    </DashboardLayout>
  );
}; 