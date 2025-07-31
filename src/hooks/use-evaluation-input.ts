import * as React from 'react';
import { useEvaluation } from '@/contexts/evaluation-context';
import { useToast } from '@/hooks/use-toast';
import type { Grade, EvaluationResult } from '@/lib/types';

interface UseEvaluationInputProps {
  selectedDate: { year: number; month: number };
  evaluatorId?: string;
}

export function useEvaluationInput({ selectedDate, evaluatorId }: UseEvaluationInputProps) {
  const { 
    updateEvaluationMemo, 
    updateEvaluationGrade, 
    updateEvaluationGroup,
    monthlyEvaluationTargets,
    monthlyEvaluationTargetsByEvaluator,
    gradingScale
  } = useEvaluation();
  
  const { toast } = useToast();
  
  // UI 상태들 - 메모이제이션 강화
  const [changedEvaluations, setChangedEvaluations] = React.useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isDistributionChartOpen, setIsDistributionChartOpen] = React.useState(true);
  const [departmentFilter, setDepartmentFilter] = React.useState('all');
  const [positionFilter, setPositionFilter] = React.useState('all');
  const [bulkGrade, setBulkGrade] = React.useState<Grade | null>(null);
  
  // 평가 대상자 필터링 - 메모이제이션 강화
  const myEmployees = React.useMemo(() => {
    if (evaluatorId) {
      return monthlyEvaluationTargetsByEvaluator(selectedDate, evaluatorId);
    }
    return monthlyEvaluationTargets(selectedDate);
  }, [evaluatorId, selectedDate.year, selectedDate.month, monthlyEvaluationTargets, monthlyEvaluationTargetsByEvaluator]);
  
  // 필터링된 직원들 - 메모이제이션 강화
  const visibleEmployees = React.useMemo(() => {
    return myEmployees.filter(emp => {
      const deptMatch = departmentFilter === 'all' || emp.department === departmentFilter;
      const posMatch = positionFilter === 'all' || emp.title === positionFilter;
      return deptMatch && posMatch;
    });
  }, [myEmployees, departmentFilter, positionFilter]);
  
  // 메모 변경 핸들러 - 메모이제이션 강화
  const handleMemoChange = React.useCallback((employeeId: string, memo: string) => {
    const cleanMemo = memo ? memo.trim() : '';
    setChangedEvaluations(prev => new Set([...prev, employeeId]));
    if (updateEvaluationMemo) {
      updateEvaluationMemo(employeeId, cleanMemo, selectedDate.year, selectedDate.month);
    }
  }, [updateEvaluationMemo, selectedDate.year, selectedDate.month]);
  
  // 등급 변경 핸들러 - 메모이제이션 강화
  const handleGradeChange = React.useCallback((employeeId: string, grade: Grade | null) => {
    setChangedEvaluations(prev => new Set([...prev, employeeId]));
    
    if (updateEvaluationGrade) {
      updateEvaluationGrade(employeeId, grade, selectedDate.year, selectedDate.month);
    }
    
    toast({
      title: '등급 변경 완료',
      description: '등급이 변경되었습니다.',
    });
  }, [updateEvaluationGrade, selectedDate.year, selectedDate.month, toast]);
  
  // 그룹 변경 핸들러 - 메모이제이션 강화
  const handleGroupChange = React.useCallback((employeeId: string, groupName: string) => {
    setChangedEvaluations(prev => new Set([...prev, employeeId]));
    
    if (updateEvaluationGroup) {
      updateEvaluationGroup(employeeId, groupName, selectedDate.year, selectedDate.month);
    }
  }, [updateEvaluationGroup, selectedDate.year, selectedDate.month]);
  
  // 선택 관련 핸들러들 - 메모이제이션 강화
  const handleSelectAll = React.useCallback((checked: boolean) => {
    const allIds = new Set(visibleEmployees.map(e => e.uniqueId));
    if (checked) {
      setSelectedIds(new Set([...selectedIds, ...allIds]));
    } else {
      setSelectedIds(new Set([...selectedIds].filter(id => !allIds.has(id))));
    }
  }, [visibleEmployees, selectedIds]);
  
  const handleSelectEmployee = React.useCallback((employeeId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newIds = new Set(prev);
      if (checked) {
        newIds.add(employeeId);
      } else {
        newIds.delete(employeeId);
      }
      return newIds;
    });
  }, []);
  
  // 일괄 등급 적용 - 메모이제이션 강화
  const handleBulkGradeApply = React.useCallback(() => {
    if (!bulkGrade) return;
    
    selectedIds.forEach(employeeId => {
      handleGradeChange(employeeId, bulkGrade);
    });
    
    setSelectedIds(new Set());
    setBulkGrade(null);
    
    toast({
      title: '일괄 등급 적용 완료',
      description: `${selectedIds.size}명의 등급이 변경되었습니다.`,
    });
  }, [bulkGrade, selectedIds, handleGradeChange, toast]);
  
  // 변경사항 초기화 - 메모이제이션 강화
  const clearChangedEvaluations = React.useCallback(() => {
    setChangedEvaluations(new Set());
  }, []);
  
  // 성능 최적화를 위한 메모이제이션된 값들
  const changedEvaluationsSize = React.useMemo(() => changedEvaluations.size, [changedEvaluations]);
  const selectedIdsSize = React.useMemo(() => selectedIds.size, [selectedIds]);
  
  return {
    // 상태들
    changedEvaluations,
    changedEvaluationsSize,
    selectedIds,
    selectedIdsSize,
    isDistributionChartOpen,
    departmentFilter,
    positionFilter,
    bulkGrade,
    myEmployees,
    visibleEmployees,
    gradingScale,
    
    // 핸들러들
    handleMemoChange,
    handleGradeChange,
    handleGroupChange,
    handleSelectAll,
    handleSelectEmployee,
    handleBulkGradeApply,
    clearChangedEvaluations,
    
    // 설정 함수들
    setChangedEvaluations,
    setSelectedIds,
    setIsDistributionChartOpen,
    setDepartmentFilter,
    setPositionFilter,
    setBulkGrade,
  };
} 