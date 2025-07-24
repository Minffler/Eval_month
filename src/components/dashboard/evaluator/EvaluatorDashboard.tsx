import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '../common/DashboardLayout';
import { StatsCard } from '../common/StatsCard';
import { MonthSelector } from '../common/MonthSelector';
import { AssignmentManagement } from './AssignmentManagement';
import { EvaluationInput } from './EvaluationInput';
import { ResultsView } from './ResultsView';
import { useEvaluation } from '@/contexts/evaluation-context';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';

/**
 * 평가자 대시보드 메인 컴포넌트
 * 평가 관련 통계, 과제 관리, 평가 입력, 결과 조회 기능을 통합
 */
export const EvaluatorDashboard: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const { evaluations, assignments, statistics } = useEvaluation();

  // 선택된 월의 데이터만 필터링
  const monthlyData = useMemo(() => {
    const monthStart = new Date(selectedMonth + '-01');
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    
    return {
      evaluations: evaluations.filter(eval => {
        const evalDate = new Date(eval.date);
        return evalDate >= monthStart && evalDate <= monthEnd;
      }),
      assignments: assignments.filter(assignment => {
        const assignmentDate = new Date(assignment.dueDate);
        return assignmentDate >= monthStart && assignmentDate <= monthEnd;
      })
    };
  }, [evaluations, assignments, selectedMonth]);

  // 통계 계산
  const stats = useMemo(() => {
    const totalAssignments = monthlyData.assignments.length;
    const completedEvaluations = monthlyData.evaluations.filter(e => e.status === 'completed').length;
    const pendingEvaluations = totalAssignments - completedEvaluations;
    const completionRate = totalAssignments > 0 ? (completedEvaluations / totalAssignments) * 100 : 0;

    return {
      totalAssignments,
      completedEvaluations,
      pendingEvaluations,
      completionRate
    };
  }, [monthlyData]);

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
            value={stats.totalAssignments}
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
            value={stats.pendingEvaluations}
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
            assignments={monthlyData.assignments}
            selectedMonth={selectedMonth}
          />
          
          {/* 평가 입력 */}
          <EvaluationInput
            pendingAssignments={monthlyData.assignments.filter(a => a.status === 'pending')}
            selectedMonth={selectedMonth}
          />
        </div>

        {/* 결과 조회 */}
        <ResultsView
          evaluations={monthlyData.evaluations}
          selectedMonth={selectedMonth}
        />
      </div>
    </DashboardLayout>
  );
}; 