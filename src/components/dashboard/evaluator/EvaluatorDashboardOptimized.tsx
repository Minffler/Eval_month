import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '../common/DashboardLayout';
import { StatsCard } from '../common/StatsCard';
import { MonthSelector } from '../common/MonthSelector';
import { AssignmentManagement } from './AssignmentManagement';
import { EvaluationInput } from './EvaluationInput';
import { ResultsView } from './ResultsView';
import { useOptimizedEvaluation } from '@/contexts/optimized-evaluation-context';
import { useFilterState, usePagination } from '@/hooks/use-local-state';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';

/**
 * 최적화된 평가자 대시보드 컴포넌트
 * 로컬 상태를 활용하여 성능 최적화
 */
export const EvaluatorDashboardOptimized: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const { 
    getEvaluationsByMonth, 
    getAssignmentsByMonth, 
    getMonthlyStats,
    completedEvaluations,
    pendingAssignments 
  } = useOptimizedEvaluation();

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

  // 필터링 및 정렬 상태 (로컬 상태)
  const assignmentFilterState = useFilterState(monthlyData.assignments);
  const evaluationFilterState = useFilterState(monthlyData.evaluations);

  // 페이지네이션 (로컬 상태)
  const assignmentPagination = usePagination(assignmentFilterState.data, 10);
  const evaluationPagination = usePagination(evaluationFilterState.data, 10);

  return (
    <DashboardLayout
      title="평가자 대시보드"
      subtitle={`${selectedMonth} 평가 현황`}
    >
      <div className="space-y-6">
        {/* 월 선택기 */}
        <div className="flex justify-between items-center">
          <MonthSelector
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            className="flex-1"
          />
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="총 과제 수"
            value={stats.totalEvaluations}
            icon={<FileText />}
            description="이번 달 배정된 평가 과제"
          />
          <StatsCard
            title="완료된 평가"
            value={stats.completedEvaluations}
            icon={<CheckCircle />}
            description="평가 완료된 과제"
          />
          <StatsCard
            title="대기 중인 평가"
            value={stats.totalEvaluations - stats.completedEvaluations}
            icon={<Clock />}
            description="아직 평가하지 않은 과제"
          />
          <StatsCard
            title="완료율"
            value={`${stats.completionRate.toFixed(1)}%`}
            icon={<Users />}
            description="평가 완료 비율"
          />
        </div>

        {/* 주요 기능 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 과제 관리 */}
          <AssignmentManagement
            assignments={assignmentPagination.currentData}
            selectedMonth={selectedMonth}
            filterState={assignmentFilterState}
            pagination={assignmentPagination}
          />
          
          {/* 평가 입력 */}
          <EvaluationInput
            pendingAssignments={pendingAssignments}
            selectedMonth={selectedMonth}
          />
        </div>

        {/* 결과 조회 */}
        <ResultsView
          evaluations={evaluationPagination.currentData}
          selectedMonth={selectedMonth}
          filterState={evaluationFilterState}
          pagination={evaluationPagination}
        />
      </div>
    </DashboardLayout>
  );
}; 