'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { GradeHistogram } from '../grade-histogram';
import { useToast } from '@/hooks/use-toast';
import { useEvaluation } from '@/contexts/evaluation-context';
import { useEvaluationInput } from '@/hooks/use-evaluation-input';
import { EvaluationTable } from './evaluation-table';
import { 
  ChevronUp, 
  ChevronDown, 
  Download, 
  Plus, 
  Edit, 
  X, 
  Check, 
  GripVertical,
  RefreshCw
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { log } from '@/lib/logger';
import type { EvaluationResult, Grade, GradeInfo, EvaluationGroupCategory } from '@/lib/types';

interface EvaluationInputViewProps {
  selectedDate: { year: number; month: number };
  onClearMyEvaluations: (year: number, month: number) => void;
  evaluatorId?: string;
  customGroups?: Record<string, string[]>;
  onCustomGroupsChange?: (newCustomGroups: Record<string, string[]>) => void;
}

type Groups = Record<string, { name: string; members: EvaluationResult[]; isCustom?: boolean }>;

export default function EvaluationInputView({ 
  selectedDate, 
  onClearMyEvaluations, 
  evaluatorId,
  customGroups: externalCustomGroups,
  onCustomGroupsChange
}: EvaluationInputViewProps) {
  const { toast } = useToast();
  
  // 커스텀 훅으로 UI 로직 분리
  const {
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
    handleMemoChange,
    handleGradeChange,
    handleGroupChange,
    handleSelectAll,
    handleSelectEmployee,
    handleBulkGradeApply,
    clearChangedEvaluations,
    setChangedEvaluations,
    setSelectedIds,
    setIsDistributionChartOpen,
    setDepartmentFilter,
    setPositionFilter,
    setBulkGrade,
  } = useEvaluationInput({ selectedDate, evaluatorId });
  
  // 기존 UI 상태들 (커스텀 훅에서 관리하지 않는 것들)
  const [isRowDragging, setIsRowDragging] = React.useState(false);
  const [draggedEmployee, setDraggedEmployee] = React.useState<EvaluationResult | null>(null);
  const [customGroups, setCustomGroups] = React.useState<Record<string, string[]>>(externalCustomGroups || {});
  const [activeTab, setActiveTab] = React.useState<EvaluationGroupCategory>('A. 정규평가');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = React.useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState('');
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = React.useState('');
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [activeGradeFilter, setActiveGradeFilter] = React.useState("전체");
  
  // React StrictMode 대응을 위한 플래그
  const isFirstRender = React.useRef(true);
  
  // 드래그 중 업데이트 지연을 위한 ref
  const dragUpdateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // 외부에서 전달받은 customGroups가 변경되면 내부 상태 업데이트
  React.useEffect(() => {
    if (externalCustomGroups) {
      setCustomGroups(externalCustomGroups);
    }
  }, [externalCustomGroups]);
  
  // 내부 customGroups 변경 시 외부로 알림
  const updateCustomGroups = React.useCallback((newCustomGroups: Record<string, string[]>) => {
    setCustomGroups(newCustomGroups);
    if (onCustomGroupsChange) {
      onCustomGroupsChange(newCustomGroups);
    }
  }, [onCustomGroupsChange]);

  // DnD 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // B그룹 뷰 여부 확인
  const isBGroupView = activeTab === 'B. 별도평가';

  // B그룹 인디케이터 스타일 함수
  const getBGroupIndicatorStyle = (workRate: number) => {
    if (workRate >= 0.8) {
      return {
        style: { backgroundColor: 'hsl(var(--muted))' },
        className: 'text-muted-foreground'
      };
    } else if (workRate >= 0.6) {
      return {
        style: { backgroundColor: 'hsl(var(--secondary))' },
        className: 'text-secondary-foreground'
      };
    } else {
      return {
        style: { backgroundColor: 'hsl(var(--background))' },
        className: 'text-muted-foreground'
      };
    }
  };

  // 탭별 데이터 분류
  const categorizedData = React.useMemo(() => {
    const categories: Record<EvaluationGroupCategory, EvaluationResult[]> = {
      'A. 정규평가': myEmployees.filter(r => r.evaluationGroup === 'A. 정규평가'),
      'B. 별도평가': myEmployees.filter(r => r.evaluationGroup === 'B. 별도평가'),
      'C. 미평가': myEmployees.filter(r => r.evaluationGroup === 'C. 미평가'),
      '전체': myEmployees,
    };
    return categories;
  }, [myEmployees]);



  // cleanup 함수로 메모리 누수 방지
  React.useEffect(() => {
    return () => {
      if (dragUpdateTimeoutRef.current) {
        clearTimeout(dragUpdateTimeoutRef.current);
      }
      
      // 컴포넌트 언마운트 시 변경사항이 있으면 알림
      if (changedEvaluations.size > 0) {
        console.log('=== 컴포넌트 언마운트 시 변경사항 알림 ===');
        console.log('변경된 평가 수:', changedEvaluations.size);
        console.log('변경된 평가 ID들:', Array.from(changedEvaluations));
      }
    };
  }, [changedEvaluations]);

  // 진행률 계산
  const currentTabEmployees = categorizedData[activeTab] || [];
  const totalMyEmployees = currentTabEmployees?.length || 0;
  const totalMyCompleted = currentTabEmployees?.filter(e => e.grade)?.length || 0;
  const totalCompletionRate = totalMyEmployees > 0 ? (totalMyCompleted / totalMyEmployees) * 100 : 0;

  // 그룹별 데이터 관리
  const groupWithinCategory = (employees: EvaluationResult[]): Groups => {
    const groups: Groups = {};
    const processedEmployeeIds = new Set<string>(); // 중복 방지를 위한 Set

    // 1단계: 기본 그룹 순서 정의 (고정 순서)
    const defaultGroups = ['센터장/지부장', '팀장/지점장', 'Lv.2~3', 'Lv.1', '기타'];
    
    // 2단계: 기본 그룹들을 미리 생성 (순서 보장)
    defaultGroups.forEach(groupName => {
      groups[groupName] = { name: groupName, members: [] };
    });
    
    // 3단계: 직원들을 그룹에 분류 (중복 방지)
    employees.forEach(emp => {
      // 이미 처리된 직원은 건너뛰기
      if (processedEmployeeIds.has(emp.uniqueId)) {
        return;
      }

      // 커스텀 그룹(detailedGroup2)이 있으면 우선 사용, 없으면 자동 분류
      const groupKey = emp.detailedGroup2
        ? emp.detailedGroup2
        : (['센터장', '지부장'].includes(emp.title) ? '센터장/지부장'
          : ['팀장', '지점장'].includes(emp.title) ? '팀장/지점장'
          : (emp.growthLevel === 'Lv.2' || emp.growthLevel === 'Lv.3') ? 'Lv.2~3'
          : emp.growthLevel === 'Lv.1' ? 'Lv.1'
          : '기타');

      if (!groups[groupKey]) {
        groups[groupKey] = { name: groupKey, members: [] };
      }
      groups[groupKey].members.push(emp);
      processedEmployeeIds.add(emp.uniqueId); // 처리된 직원 ID 기록
    });

    // 4단계: 커스텀 그룹 추가 (detailedGroup2와 동기화, 중복 방지)
    Object.entries(customGroups).forEach(([groupName, employeeIds]) => {
      // detailedGroup2가 해당 그룹명이고 아직 처리되지 않은 직원들만 필터링
      const customMembers = employees.filter(emp => 
        emp.detailedGroup2 === groupName && 
        employeeIds.includes(emp.uniqueId) && 
        !processedEmployeeIds.has(emp.uniqueId)
      );
      
      if (customMembers.length > 0) {
        // 기존 그룹이 있으면 멤버 추가, 없으면 새로 생성
        if (groups[groupName]) {
          groups[groupName].members.push(...customMembers);
        } else {
        groups[groupName] = { 
          name: groupName, 
          members: customMembers, 
          isCustom: true 
        };
      }
        
        // 처리된 직원 ID 기록
        customMembers.forEach(emp => processedEmployeeIds.add(emp.uniqueId));
      }
    });

    // 5단계: 고정된 순서로 그룹 객체 생성
    const orderedGroups: Groups = {};
    
    // 먼저 기본 그룹들을 고정 순서로 추가
    defaultGroups.forEach(groupName => {
      if (groups[groupName] && groups[groupName].members.length > 0) {
        orderedGroups[groupName] = groups[groupName];
      }
    });
    
    // 그 다음 커스텀 그룹들을 추가 (기본 그룹이 아닌 것들만)
    Object.entries(groups).forEach(([groupName, group]) => {
      if (!defaultGroups.includes(groupName) && group.members.length > 0) {
        orderedGroups[groupName] = group;
      }
    });

    return orderedGroups;
  };

  // 현재 탭에 해당하는 직원들로 그룹 생성
  const groups = React.useMemo(() => {
    return groupWithinCategory(categorizedData[activeTab] || []);
  }, [categorizedData, activeTab]);

  // 등급 분포 계산 (드래그 중에는 업데이트 지연)
  const gradeDistribution = React.useMemo(() => {
    let filteredEmployees = categorizedData[activeTab] || [];
    
    // 필터 적용
    switch (activeGradeFilter) {
      case "A.정규":
        filteredEmployees = (categorizedData[activeTab] || []).filter(emp => emp.company === 'OK');
        break;
      case "B.별도":
        filteredEmployees = (categorizedData[activeTab] || []).filter(emp => emp.company !== 'OK');
        break;
      case "직책자":
        filteredEmployees = (categorizedData[activeTab] || []).filter(emp => emp.title && emp.title.includes('팀장') || emp.title.includes('과장') || emp.title.includes('부장'));
        break;
      case "비직책자":
        filteredEmployees = (categorizedData[activeTab] || []).filter(emp => !emp.title || (!emp.title.includes('팀장') && !emp.title.includes('과장') && !emp.title.includes('부장')));
        break;
      default:
        filteredEmployees = categorizedData[activeTab] || [];
    }

    // gradingScale이 비어있으면 빈 배열 반환
    if (!gradingScale || Object.keys(gradingScale).length === 0) {
      return [];
    }

    return Object.keys(gradingScale).map(grade => ({ 
      name: grade, 
      value: filteredEmployees.filter(g => g.grade === grade).length 
    }));
  }, [categorizedData, activeTab, gradingScale, activeGradeFilter]);

  // 그룹별 점수 계산
  const calculateGroupScore = (members: EvaluationResult[]) => {
    return members.reduce((total, member) => total + (member.score || 0), 0);
  };


  

  


  // 평가 그룹 초기화 (입력한 평가등급, 비고는 그대로 유지)
  const handleResetGroups = () => {
    // 모든 직원의 그룹을 초기화
    myEmployees.forEach(emp => {
      handleGroupChange(emp.uniqueId, '');
    });
    
    // 새로 만든 그룹들도 모두 초기화
    updateCustomGroups({});
    
    toast({
      title: '평가 그룹 초기화',
      description: '평가 그룹이 초기 상태로 되돌아갔습니다. (등급과 비고는 유지됩니다)',
    });
  };

  // 엑셀 다운로드
  const handleDownloadExcel = () => {
    const dataToExport = (categorizedData[activeTab] || []).map(r => ({
      'ID': r.uniqueId,
      '회사': r.company,
      '소속부서': r.department,
      '이름': r.name,
      '직책': r.title,
      '성장레벨': r.growthLevel,
      '근무율': `${(r.workRate * 100).toFixed(1)}%`,
      '등급': r.grade || '미평가',
      '점수': r.score,
      '비고': r.memo || ''
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `평가결과-${activeTab}`);
    XLSX.writeFile(workbook, `${selectedDate.year}.${String(selectedDate.month).padStart(2, '0')}_월성과데이터.xlsx`);
  };

  // 평가 이력 삭제 확인
  const handleConfirmClear = () => {
    onClearMyEvaluations(selectedDate.year, selectedDate.month);
    setIsClearConfirmOpen(false);
    toast({
      title: '삭제 완료',
      description: '평가 이력이 삭제되었습니다.',
    });
  };

  // 새 그룹 생성
  const handleCreateGroup = () => {
    if (!newGroupName.trim() || selectedIds.size === 0) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '그룹 이름과 멤버를 선택해주세요.',
      });
      return;
    }

    // 선택된 멤버의 detailedGroup2(현재 그룹) 필드를 새 그룹명으로 변경
    const updatedEmployees = myEmployees.map(emp =>
      selectedIds.has(emp.uniqueId)
          ? { ...emp, detailedGroup2: newGroupName }
          : emp
    );
    
    // setLocalEmployees(updatedEmployees); // 이 부분은 이제 Context에서 관리

    // Context 업데이트 (즉시 저장)
    Array.from(selectedIds).forEach(employeeId => {
      if (updateEvaluationGroup) {
        updateEvaluationGroup(employeeId, newGroupName, selectedDate.year, selectedDate.month);
      }
    });

    // 변경사항 추적
    setChangedEvaluations(prev => new Set([...prev, ...selectedIds]));

    // customGroups 업데이트 (기존 그룹에서 제거하고 새 그룹에 추가)
    const newCustomGroups = { ...customGroups };
    
    // 선택된 멤버들을 기존 커스텀 그룹에서 제거
    Array.from(selectedIds).forEach(employeeId => {
      Object.keys(newCustomGroups).forEach(groupName => {
        if (newCustomGroups[groupName].includes(employeeId)) {
          newCustomGroups[groupName] = newCustomGroups[groupName].filter(id => id !== employeeId);
          // 그룹이 비어있으면 삭제
          if (newCustomGroups[groupName].length === 0) {
            delete newCustomGroups[groupName];
          }
        }
      });
    });
    
    // 새 그룹에 멤버 추가
    newCustomGroups[newGroupName] = Array.from(selectedIds);
    
    updateCustomGroups(newCustomGroups);

    setNewGroupName('');
    setSelectedIds(new Set());
    setIsCreateGroupOpen(false);
    
    toast({
      title: '그룹 생성 완료',
      description: `'${newGroupName}' 그룹이 생성되었습니다.`,
    });
  };



  // 커스텀 그룹 삭제
  const handleDeleteCustomGroup = (groupName: string) => {
    const newGroups = { ...customGroups };
      delete newGroups[groupName];
    updateCustomGroups(newGroups);
    
    toast({
      title: '그룹 삭제 완료',
      description: `'${groupName}' 그룹이 삭제되었습니다.`,
    });
  };

  // 그룹명 편집 시작
  const handleStartEditing = (groupId: string, currentName: string) => { 
    console.log('=== handleStartEditing ===');
    console.log('groupId:', groupId);
    console.log('currentName:', currentName);
    setEditingGroupId(groupId); 
    setEditingGroupName(currentName); 
  };

  // 그룹명 편집 취소
  const handleCancelEditing = () => { 
    console.log('=== handleCancelEditing ===');
    setEditingGroupId(null); 
    setEditingGroupName(''); 
  };

  // 그룹명 업데이트
  const handleUpdateGroupName = () => {
    if (!editingGroupId || !editingGroupName.trim()) { 
      handleCancelEditing(); 
      return; 
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('=== handleUpdateGroupName Debug ===');
      console.debug('selectedDate:', selectedDate);
      console.debug('editingGroupId:', editingGroupId);
      console.debug('editingGroupName:', editingGroupName);
    }
    
    const updatedEmployees = myEmployees.map(emp => {
      if (emp.detailedGroup2 === editingGroupId) {
        const updatedEmployee = { ...emp, detailedGroup2: editingGroupName };
        if (process.env.NODE_ENV === 'development') {
          console.debug('Updated employee:', updatedEmployee);
        }
        return updatedEmployee;
      }
      return emp;
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('updatedEmployees.length:', updatedEmployees.length);
    }
    
    // setLocalEmployees(updatedEmployees); // 이 부분은 이제 Context에서 관리
    
    // 변경사항 추적
    const changedIds = updatedEmployees
      .filter(emp => emp.detailedGroup2 === editingGroupName)
      .map(emp => emp.uniqueId);
    setChangedEvaluations(prev => new Set([...prev, ...changedIds]));
    
    // Context 액션 사용 - 모든 해당 그룹의 직원들에 대해 업데이트
    updatedEmployees.forEach(emp => {
      if (emp.detailedGroup2 === editingGroupName) {
        if (updateEvaluationGroup) {
          updateEvaluationGroup(emp.uniqueId, editingGroupName, selectedDate.year, selectedDate.month);
        }
      }
    });
    
    // customGroups도 업데이트 (그룹명 변경)
    if (customGroups[editingGroupId]) {
      const newCustomGroups = { ...customGroups };
      newCustomGroups[editingGroupName] = newCustomGroups[editingGroupId];
      delete newCustomGroups[editingGroupId];
      updateCustomGroups(newCustomGroups);
    }
    
    handleCancelEditing();
    toast({
      title: '그룹명 변경 완료',
      description: '그룹명이 변경되었습니다.',
    });
  };

  // 드래그 시작
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsDragging(true);
    // 기존 타임아웃 정리
    if (dragUpdateTimeoutRef.current) {
      clearTimeout(dragUpdateTimeoutRef.current);
    }
  };

  // 드래그 종료
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);
    // 기존 타임아웃 정리
    if (dragUpdateTimeoutRef.current) {
      clearTimeout(dragUpdateTimeoutRef.current);
    }
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 현재 그룹 정보 찾기
    let sourceGroupKey: string | null = null;
    let targetGroupKey: string | null = null;
    let sourceIndex = -1;
    let targetIndex = -1;
    Object.entries(groups).forEach(([groupKey, group]) => {
      group.members.forEach((emp, idx) => {
        if (emp.uniqueId === activeId) {
          sourceGroupKey = groupKey;
          sourceIndex = idx;
        }
        if (emp.uniqueId === overId) {
          targetGroupKey = groupKey;
          targetIndex = idx;
        }
      });
    });
    if (!sourceGroupKey || !targetGroupKey) return;

    // deep copy
    let updatedEmployees = [...myEmployees]; // 이 부분은 이제 Context에서 관리
    // 그룹 내 순서 변경
    if (sourceGroupKey === targetGroupKey) {
      const groupMembers = groups[sourceGroupKey].members.map(e => e.uniqueId);
      const from = sourceIndex;
      let to = targetIndex;
      if (from < to) to--;
      // 해당 그룹 멤버만 순서대로 재배치
      const reordered = groups[sourceGroupKey].members.slice();
      const moved = reordered.splice(from, 1)[0];
      reordered.splice(to, 0, moved);
      // 전체 employees 배열에서 해당 그룹 멤버만 순서대로 교체
      let idx = 0;
      updatedEmployees = updatedEmployees.map(emp => {
        if (emp.detailedGroup2 === sourceGroupKey && groupMembers.includes(emp.uniqueId)) {
          return reordered[idx++];
      }
      return emp;
    });
    } else {
      // 그룹 간 이동
      updatedEmployees = updatedEmployees.map(emp =>
        emp.uniqueId === activeId ? { ...emp, detailedGroup2: targetGroupKey! } : emp
      );
      
      // Context 업데이트 (즉시 저장)
      if (updateEvaluationGroup) {
        updateEvaluationGroup(activeId, targetGroupKey!, selectedDate.year, selectedDate.month);
      }
      
      // 변경사항 추적
      setChangedEvaluations(prev => new Set([...prev, activeId]));
      
      // customGroups 업데이트 (새 그룹에서 멤버 제거)
      const newCustomGroups = { ...customGroups };
      
      // 출발 그룹이 커스텀 그룹인 경우 해당 멤버 제거
      if (newCustomGroups[sourceGroupKey!]) {
        newCustomGroups[sourceGroupKey!] = newCustomGroups[sourceGroupKey!].filter(
          id => id !== activeId
        );
        
        // 그룹이 비어있으면 삭제
        if (newCustomGroups[sourceGroupKey!].length === 0) {
          delete newCustomGroups[sourceGroupKey!];
        }
      }
      
      // 도착 그룹이 커스텀 그룹인 경우 해당 멤버 추가
      if (newCustomGroups[targetGroupKey!]) {
        if (!newCustomGroups[targetGroupKey!].includes(activeId)) {
          newCustomGroups[targetGroupKey!] = [...newCustomGroups[targetGroupKey!], activeId];
        }
      }
      
      updateCustomGroups(newCustomGroups);
    }
    // setLocalEmployees(updatedEmployees); // 이 부분은 이제 Context에서 관리
  };

  // 드래그 중 상태 업데이트 지연 함수
  const debouncedSetIsDragging = React.useCallback((value: boolean) => {
    if (dragUpdateTimeoutRef.current) {
      clearTimeout(dragUpdateTimeoutRef.current);
    }
    dragUpdateTimeoutRef.current = setTimeout(() => {
      setIsDragging(value);
    }, 100); // 100ms 지연으로 조정
  }, []);

  // 개별 선택 토글
  const handleToggleSelection = React.useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev);
      if (checked) newSelection.add(id);
      else newSelection.delete(id);
      return newSelection;
    });
  }, []);

  // 그룹 전체 선택 토글
  const handleToggleGroupSelection = React.useCallback((group: {name: string, members: EvaluationResult[]}, checked: boolean) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev);
      const memberIds = group.members.map(m => m.uniqueId);
      if (checked) memberIds.forEach(id => newSelection.add(id));
      else memberIds.forEach(id => newSelection.delete(id));
      return newSelection;
    });
  }, []);









  


  const allDepartments = React.useMemo(() => {
    const depts = Array.from(new Set(visibleEmployees.map(emp => emp.department)));
    return ['all', ...depts];
  }, [visibleEmployees.length]); // 직원 수가 바뀔 때만 재계산

  const positionOptions = React.useMemo(() => {
    const positions = Array.from(new Set(visibleEmployees.map(emp => emp.title)));
    return ['all', ...positions];
  }, [visibleEmployees.length]); // 직원 수가 바뀔 때만 재계산

  // Context 동기화는 통합된 useEffect에서 처리됨

  // 페이지 이탈 방지 (저장되지 않은 변경사항이 있을 때)
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 저장되지 않은 변경사항이 있는지 확인
      const hasUnsavedChanges = (myEmployees || []).some(emp => 
        emp.memo || emp.grade || emp.score > 0
      );
      
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?';
        return '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [myEmployees]);

  return (
    <div className="space-y-4">
      {/* 저장 상태 표시 */}
      {/* 여기서는 별도의 저장 상태 표시 로직을 사용하지 않으므로 제거 */}
      
      {/* 상단 진행률 카드 - 액자식 구조 */}
      <Card className="shadow-sm border-border">
        <Collapsible open={isDistributionChartOpen} onOpenChange={setIsDistributionChartOpen}>
          <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 p-4">
            {/* 제목 영역 */}
            <div className="flex-1">
              <CardTitle className="text-xl font-semibold text-card-foreground">평가 진행 현황</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {selectedDate.year}년 {selectedDate.month}월 성과평가 ({selectedDate.month === 12 ? 1 : selectedDate.month + 1}월 급여반영)
              </CardDescription>
              {/* 변경사항 표시 */}
              {changedEvaluationsSize > 0 && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700 font-medium">
                    📝 {changedEvaluationsSize}개의 평가가 변경되었습니다
                  </p>
                </div>
              )}
            </div>
            
            {/* 진행률 영역 - CSS 변수 사용 */}
            <div className="w-full sm:w-64 space-y-1">
              <div className='flex justify-between items-baseline'>
                <h4 className="font-semibold text-sm text-muted-foreground">종합 진행률</h4>
                <span className="font-bold text-base text-primary">{totalCompletionRate.toFixed(1)}%</span>
              </div>
              <Progress value={totalCompletionRate} className="h-2" indicatorClassName="bg-primary" />
              <p className="text-xs text-muted-foreground text-right">
                {totalMyCompleted} / {totalMyEmployees} 명 완료
              </p>
            </div>
          </CardHeader>
          
          {/* 차트 영역 (접기/펼치기) */}
          <CollapsibleContent>
            <CardContent className='p-4 pt-0 space-y-2'>
              <h3 className="font-semibold text-card-foreground">{`${activeTab} 등급 분포`}</h3>
              <div className="border border-border rounded-lg p-2 bg-muted">
                {Object.keys(gradingScale || {}).length > 0 ? (
                  <GradeHistogram 
                    data={gradeDistribution} 
                    gradingScale={gradingScale} 
                    highlightGrade={null}
                  />
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    등급을 먼저 설정해주세요
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
          
          {/* 차트 토글 버튼 */}
          <CollapsibleTrigger asChild>
            <div className="border-t border-border w-full text-center p-2 text-sm text-muted-foreground cursor-pointer hover:bg-muted rounded-b-lg transition-colors">
              <div className="flex items-center justify-center">
                {isDistributionChartOpen ? "차트 숨기기" : "차트 보기"}
                {isDistributionChartOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </div>
            </div>
          </CollapsibleTrigger>
        </Collapsible>
      </Card>

      {/* 탭 네비게이션 - 액자식 구조 */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as EvaluationGroupCategory)}>
            <TabsList className="w-full grid grid-cols-4 bg-muted p-1 rounded-lg text-muted-foreground">
              {Object.keys(categorizedData).map(category => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary data-[state=active]:border-primary"
                >
                  {category} ({categorizedData[category as EvaluationGroupCategory].length})
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* 액션 버튼들 */}
            <div className="flex justify-between my-4 gap-2">
              <Button onClick={() => setIsCreateGroupOpen(true)} variant="outline" size="sm" className="border-border hover:bg-accent hover:border-accent">
                <Plus className="mr-2 h-4 w-4" />
                새 그룹 추가
              </Button>
              <div className="flex-grow" />
              <Button onClick={handleDownloadExcel} variant="outline" size="sm" className="border-border hover:bg-accent hover:border-accent">
                <Download className="mr-2 h-4 w-4" />
                현재 탭 엑셀 다운로드
              </Button>
            </div>
            
            {/* 그룹별 카드들 */}
            <TabsContent value={activeTab} className="pt-0 space-y-4">
              <DndContext 
                sensors={sensors} 
                collisionDetection={closestCenter} 
                onDragStart={handleDragStart} 
                onDragEnd={handleDragEnd}
              >
                {Object.keys(groups).length > 0 ? Object.entries(groups).map(([groupKey, group]) => {
                  const selectedInGroupCount = group.members.filter(m => selectedIds.has(m.uniqueId)).length;
                  const allSelectedInGroup = group.members.length > 0 && selectedInGroupCount === group.members.length;
                  const isIndeterminate = selectedInGroupCount > 0 && !allSelectedInGroup;
                  const availableScore = group.members.length * 100;
                  const usedScore = group.members.reduce((acc, curr) => acc + (curr.score || 0), 0);
                  
                  return (
                    <Card key={groupKey} className="shadow-sm border-border overflow-hidden">
                      {/* 카드 헤더 (droppable 제거) */}
                      <CardHeader className="py-3 px-4 bg-muted border-b border-border">
                        <div className="flex justify-between items-center">
                          <div className='flex items-center gap-2'>
                            {editingGroupId === groupKey ? (
                              <div className='flex items-center gap-2'>
                                <Input 
                                  value={editingGroupName} 
                                  onChange={(e) => setEditingGroupName(e.target.value)} 
                                  onBlur={handleUpdateGroupName} 
                                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateGroupName()} 
                                  autoFocus 
                                  className="h-8 border-border"
                                />
                                <Button size="sm" onClick={handleUpdateGroupName} className="bg-primary hover:bg-primary/90">저장</Button>
                                <Button size="sm" variant="ghost" onClick={handleCancelEditing}>취소</Button>
                              </div>
                            ) : (
                              <>
                                <CardTitle className="text-lg font-semibold text-card-foreground">{group.name}</CardTitle>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 hover:bg-accent" 
                                  onClick={() => handleStartEditing(groupKey, group.name)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-semibold">그룹 점수 현황: </span>
                            <span className={usedScore > availableScore ? 'text-destructive font-bold' : 'text-primary font-semibold'}>
                              {usedScore}
                            </span> / {availableScore} 점
                          </div>
                        </div>
                      </CardHeader>
                      {/* 테이블 컨텐츠 */}
                      <CardContent className="p-0">
                                                  <div className="overflow-x-auto">
                              <EvaluationTable
                                employees={group.members}
                                selectedIds={selectedIds}
                                gradingScale={gradingScale}
                                onSelect={handleSelectEmployee}
                                onGradeChange={handleGradeChange}
                                onMemoChange={handleMemoChange}
                              />
                          </div>
                      </CardContent>
                    </Card>
                  );
                }                ) : (
                  <Card className="shadow-sm border-border">
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">이 분류에 해당하는 평가 대상자가 없습니다.</p>
                    </CardContent>
                  </Card>
                )}
                <DragOverlay>
                  {activeId ? (
                    <div className="bg-card border border-border rounded-md p-2 shadow-lg">
                      {visibleEmployees.find(emp => emp.uniqueId === activeId)?.name || 'Unknown'}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 하단 액션 버튼들 - 액자식 구조 */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleResetGroups} size="sm" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          평가 그룹 초기화
        </Button>
        <Button onClick={() => setIsClearConfirmOpen(true)} size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
          <X className="mr-2 h-4 w-4" />
          평가 이력 삭제
        </Button>
      </div>

      {/* 선택된 항목들에 대한 일괄 작업 UI */}
      {selectedIdsSize > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20">
          <Card className="flex items-center gap-4 p-3 shadow-lg animate-in fade-in-50 slide-in-from-bottom-5">
            <p className="text-sm font-medium">{selectedIdsSize}명 선택됨</p>
            {Object.keys(gradingScale || {}).length > 0 ? (
              <>
                <Select value={bulkGrade || 'none'} onValueChange={(g) => setBulkGrade(g === 'none' ? null : g as Grade)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="등급 일괄 적용" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">등급 선택</SelectItem>
                    {Object.keys(gradingScale || {}).map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkGradeApply} disabled={!bulkGrade} size="sm" className="bg-primary hover:bg-primary/90">적용</Button>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">
                등급을 먼저 설정해주세요
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedIds(new Set())}>
              <X className="h-4 w-4" />
            </Button>
          </Card>
        </div>
      )}

      {/* 새 그룹 추가 다이얼로그 */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>새 그룹 추가</DialogTitle>
            <DialogDescription>새로운 평가 그룹을 만들고 멤버를 추가합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 1. 새 그룹 이름 입력창 좌측정렬 */}
            <div className="flex items-center gap-2">
              <Label htmlFor="group-name" className="text-left w-24 font-bold" style={{ fontSize: '1.1em' }}>새 그룹 이름</Label>
              <Input 
                id="group-name" 
                value={newGroupName} 
                onChange={(e) => setNewGroupName(e.target.value)} 
                className="flex-1 w-full bg-[hsl(30,30%,98%)]"
              />
            </div>
            <Card style={{ backgroundColor: 'hsl(0,0%,100%)' }}>
              <CardHeader style={{ backgroundColor: 'hsl(0,0%,100%)' }}>
                <CardTitle>멤버 선택</CardTitle>
                <div className="flex gap-2 pt-2">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="bg-[hsl(30,30%,98%)]">
                      <SelectValue placeholder="소속부서 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      {allDepartments.map(dep => 
                        <SelectItem key={dep} value={dep} className="bg-[hsl(30,30%,98%)]">
                          {dep === 'all' ? '모든 부서' : dep}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="bg-[hsl(30,30%,98%)]">
                      <SelectValue placeholder="직책 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      {positionOptions.map(pos => 
                        <SelectItem key={pos} value={pos} className="bg-[hsl(30,30%,98%)]">
                          {pos === 'all' ? '모든 직책' : pos}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent style={{ backgroundColor: 'hsl(0,0%,100%)' }}>
                <div className="h-[300px] border rounded-md overflow-auto" style={{ backgroundColor: 'hsl(0,0%,100%)' }}>
                  <Table style={{ backgroundColor: 'hsl(0,0%,100%)' }}>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] text-center">
                          <Checkbox 
                            checked={visibleEmployees.length > 0 && selectedIdsSize === visibleEmployees.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="text-center">이름</TableHead>
                        <TableHead className="text-center">소속부서</TableHead>
                        <TableHead className="text-center">직책</TableHead>
                        <TableHead className="text-center">현재 그룹</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleEmployees.map(emp => (
                        <TableRow key={emp.uniqueId}>
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={selectedIds.has(emp.uniqueId)}
                              onCheckedChange={(checked: boolean) => handleSelectEmployee(emp.uniqueId, checked)}
                            />
                          </TableCell>
                          <TableCell className="text-center font-medium">{emp.name}</TableCell>
                          <TableCell className="text-center">{emp.department}</TableCell>
                          <TableCell className="text-center">{emp.title}</TableCell>
                          <TableCell className="text-center">{emp.detailedGroup2 || '미지정'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>취소</Button>
            <Button onClick={handleCreateGroup} className="bg-primary hover:bg-primary/90">그룹 생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 평가 이력 삭제 확인 다이얼로그 */}
      <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>평가 이력 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDate.year}년 {selectedDate.month}월의 모든 평가 이력을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClear} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 