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
import type { EvaluationResult, Grade, GradeInfo, EvaluationGroupCategory } from '@/lib/types';

interface EvaluationInputViewProps {
  myEmployees: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  selectedDate: { year: number; month: number };
  onClearMyEvaluations: (year: number, month: number) => void;
  onSave: (evaluations: EvaluationResult[]) => void;
  evaluatorId?: string;
  customGroups?: Record<string, string[]>;
  onCustomGroupsChange?: (newCustomGroups: Record<string, string[]>) => void;
}

type Groups = Record<string, { name: string; members: EvaluationResult[]; isCustom?: boolean }>;

export default function EvaluationInputView({ 
  myEmployees, 
  gradingScale, 
  selectedDate, 
  onClearMyEvaluations, 
  onSave,
  evaluatorId,
  customGroups: externalCustomGroups,
  onCustomGroupsChange
}: EvaluationInputViewProps) {
  const { updateEvaluationMemo, updateEvaluationGroup, updateEvaluationGrade, evaluations } = useEvaluation();
  const [activeTab, setActiveTab] = React.useState<EvaluationGroupCategory>('A. 정규평가');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = React.useState(false);
  const [isDistributionChartOpen, setIsDistributionChartOpen] = React.useState(true);
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkGrade, setBulkGrade] = React.useState<Grade | null>(null);
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = React.useState('');
  const [newGroupName, setNewGroupName] = React.useState('');
  const [idsForNewGroup, setIdsForNewGroup] = React.useState<Set<string>>(new Set());
  const [departmentFilter, setDepartmentFilter] = React.useState('all');
  const [positionFilter, setPositionFilter] = React.useState('all');
  const [customGroups, setCustomGroups] = React.useState<Record<string, string[]>>(externalCustomGroups || {});
  
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
  const [activeId, setActiveId] = React.useState<string | null>(null);
  // 드래그 중 상태 추가 (성능 최적화용)
  const [isDragging, setIsDragging] = React.useState(false);
  // 드래그 중 업데이트 지연을 위한 ref
  const dragUpdateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  // 로컬 상태로 직원 데이터 관리
  const [localEmployees, setLocalEmployees] = React.useState<EvaluationResult[]>([]);
  const { toast } = useToast();
  const [activeGradeFilter, setActiveGradeFilter] = React.useState("전체");
  
  // 저장 중복 방지를 위한 상태
  const [isSaving, setIsSaving] = React.useState(false);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  

  
  // 디버깅용: gradingScale 값 확인 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.debug('=== EvaluationInputView Debug ===');
    console.debug('gradingScale keys:', Object.keys(gradingScale || {}));
    console.debug('===============================');
  }

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

  // 탭별 데이터 분류 (드래그 중에는 업데이트 지연)
  const categorizedData = React.useMemo(() => {
    const categories: Record<EvaluationGroupCategory, EvaluationResult[]> = {
      'A. 정규평가': localEmployees.filter(r => r.evaluationGroup === 'A. 정규평가'),
      'B. 별도평가': localEmployees.filter(r => r.evaluationGroup === 'B. 별도평가'),
      'C. 미평가': localEmployees.filter(r => r.evaluationGroup === 'C. 미평가'),
      '전체': localEmployees,
    };
    return categories;
  }, [localEmployees]);

  // 현재 탭에 해당하는 직원들만 필터링
  const visibleEmployees = React.useMemo(() => {
    return categorizedData[activeTab] || [];
  }, [categorizedData, activeTab]);

  // myEmployees가 변경될 때 localEmployees 초기화 (안전한 동기화)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('=== EvaluationInputView - Checking for updates ===');
      console.debug('evaluatorId:', evaluatorId);
      console.debug('myEmployees length:', myEmployees.length);
      console.debug('localEmployees length:', localEmployees.length);
    }
    
    // 초기 로드 시에만 강제 동기화, 이후에는 변경 감지 후 동기화
    const isInitialLoad = localEmployees.length === 0 && myEmployees.length > 0;
    const hasEmployeeChanges = myEmployees.length > 0 && (
      myEmployees.length !== localEmployees.length ||
      myEmployees.some(emp => !localEmployees.find(local => local.id === emp.id))
    );
    
    if (isInitialLoad || hasEmployeeChanges) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('=== EvaluationInputView - Safe sync of localEmployees ===');
        console.debug('isInitialLoad:', isInitialLoad);
        console.debug('hasEmployeeChanges:', hasEmployeeChanges);
      }
      
      // 저장된 평가 데이터 가져오기
      const key = `${selectedDate.year}-${selectedDate.month}`;
      const savedEvaluations = JSON.parse(localStorage.getItem('evaluations') || '{}')[key] || [];
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('=== 저장된 평가 데이터 로드 ===');
        console.debug('key:', key);
        console.debug('savedEvaluations length:', savedEvaluations.length);
      }
      
      // 평가 데이터를 Map으로 변환하여 빠른 검색 가능하게 함
      const evaluationMap = new Map(savedEvaluations.map((evaluation: any) => [evaluation.employeeId, evaluation]));
      
      // 기존 입력 데이터 보존하면서 동기화
      const syncedEmployees = myEmployees.map(emp => {
        const existingEmployee = localEmployees.find(local => local.id === emp.id);
        const savedEvaluation = evaluationMap.get(emp.id) as any;
        
        if (process.env.NODE_ENV === 'development') {
          console.debug(`Employee ${emp.id} (${emp.name}):`, {
            existingMemo: existingEmployee?.memo,
            savedMemo: savedEvaluation?.memo,
            existingDetailedGroup2: existingEmployee?.detailedGroup2,
            savedDetailedGroup2: savedEvaluation?.detailedGroup2,
            existingGrade: existingEmployee?.grade,
            savedGrade: savedEvaluation?.grade
          });
        }
        
        return {
          ...emp,
          // 저장된 평가 데이터 우선, 그 다음 기존 입력 데이터, 마지막 기본값
          memo: savedEvaluation?.memo ?? existingEmployee?.memo ?? (emp.memo && !emp.memo.includes('user-') ? emp.memo : ''),
          detailedGroup2: savedEvaluation?.detailedGroup2 ?? existingEmployee?.detailedGroup2 ?? emp.detailedGroup2 ?? '',
          grade: savedEvaluation?.grade ?? existingEmployee?.grade ?? emp.grade ?? null,
          score: existingEmployee?.score ?? emp.score ?? 0
        };
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('syncedEmployees length:', syncedEmployees.length);
      }
      
      setLocalEmployees(syncedEmployees);
    } else if (myEmployees.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Warning: myEmployees is empty');
      }
    }
  }, [myEmployees, localEmployees.length, selectedDate]); // selectedDate도 의존성에 추가

  // evaluatorId가 변경될 때 localEmployees 재초기화 (평가자 변경 시)
  React.useEffect(() => {
    if (evaluatorId && myEmployees.length > 0) {
      console.log('=== EvaluationInputView - Evaluator changed, reinitializing localEmployees ===');
      console.log('New evaluatorId:', evaluatorId);
      console.log('myEmployees.length:', myEmployees.length);
      
      // 새로운 평가자의 데이터로 완전히 재초기화
      const newEmployees = myEmployees.map(emp => ({
          ...emp,
        // memo 데이터 정리
        memo: emp.memo && !emp.memo.includes('user-') ? emp.memo : '',
        // 기본 그룹 정보 유지
        detailedGroup2: emp.detailedGroup2 || '',
        // 기본 평가 정보 유지
        grade: emp.grade || null,
        score: emp.score || 0
      }));
      
      console.log('newEmployees for evaluator:', newEmployees);
      console.log('newEmployees.length:', newEmployees.length);
      setLocalEmployees(newEmployees);
    } else {
      console.log('Warning: evaluatorId or myEmployees is empty');
    }
  }, [evaluatorId, myEmployees]);
  
  // cleanup 함수로 메모리 누수 방지
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (dragUpdateTimeoutRef.current) {
        clearTimeout(dragUpdateTimeoutRef.current);
      }
    };
  }, []);

  // 진행률 계산
  const totalMyEmployees = visibleEmployees.length;
  const totalMyCompleted = visibleEmployees.filter(e => e.grade).length;
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
      if (processedEmployeeIds.has(emp.id)) {
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
      processedEmployeeIds.add(emp.id); // 처리된 직원 ID 기록
    });

    // 4단계: 커스텀 그룹 추가 (detailedGroup2와 동기화, 중복 방지)
    Object.entries(customGroups).forEach(([groupName, employeeIds]) => {
      // detailedGroup2가 해당 그룹명이고 아직 처리되지 않은 직원들만 필터링
      const customMembers = employees.filter(emp => 
        emp.detailedGroup2 === groupName && 
        employeeIds.includes(emp.id) && 
        !processedEmployeeIds.has(emp.id)
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
        customMembers.forEach(emp => processedEmployeeIds.add(emp.id));
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

  // 현재 탭에 해당하는 직원들로 그룹 생성 (드래그 중에는 업데이트 지연)
  const groups = React.useMemo(() => {
    return groupWithinCategory(visibleEmployees);
  }, [visibleEmployees]);

  // 등급 분포 계산 (드래그 중에는 업데이트 지연)
  const gradeDistribution = React.useMemo(() => {
    let filteredEmployees = visibleEmployees;
    
    // 필터 적용
    switch (activeGradeFilter) {
      case "A.정규":
        filteredEmployees = visibleEmployees.filter(emp => emp.company === 'OK');
        break;
      case "B.별도":
        filteredEmployees = visibleEmployees.filter(emp => emp.company !== 'OK');
        break;
      case "직책자":
        filteredEmployees = visibleEmployees.filter(emp => emp.title && emp.title.includes('팀장') || emp.title.includes('과장') || emp.title.includes('부장'));
        break;
      case "비직책자":
        filteredEmployees = visibleEmployees.filter(emp => !emp.title || (!emp.title.includes('팀장') && !emp.title.includes('과장') && !emp.title.includes('부장')));
        break;
      default:
        filteredEmployees = visibleEmployees;
    }

    // gradingScale이 비어있으면 빈 배열 반환
    if (!gradingScale || Object.keys(gradingScale).length === 0) {
      return [];
    }

    return Object.keys(gradingScale).map(grade => ({ 
      name: grade, 
      value: filteredEmployees.filter(g => g.grade === grade).length 
    }));
  }, [visibleEmployees, gradingScale, activeGradeFilter]);

  // 그룹별 점수 계산
  const calculateGroupScore = (members: EvaluationResult[]) => {
    return members.reduce((total, member) => total + (member.score || 0), 0);
  };

  // 등급 변경 핸들러
  const handleGradeChange = React.useCallback((employeeId: string, grade: Grade | null) => {
    console.log('=== handleGradeChange Debug ===');
    console.log('employeeId:', employeeId);
    console.log('new grade:', grade);
    console.log('gradingScale:', gradingScale);
    console.log('localEmployees before update:', localEmployees);
    
    const updatedEmployees = localEmployees.map(e => {
      if (e.id === employeeId) {
        const gradeInfo = grade ? gradingScale[grade] : { score: 0 };
        const updatedEmployee = { 
          ...e, 
          grade, 
          score: gradeInfo?.score || 0 
        };
        console.log('Updated employee:', updatedEmployee);
        return updatedEmployee;
      }
      return e;
    });
    
    console.log('updatedEmployees:', updatedEmployees);
    console.log('updatedEmployees.length:', updatedEmployees.length);
    setLocalEmployees(updatedEmployees);
    
    // 안전한 저장 사용
    safeSave(updatedEmployees);
    
    // 그룹 점수 초과 확인
    const employee = updatedEmployees.find(e => e.id === employeeId);
    if (employee) {
      const employeeGroup = Object.values(groups).find(group => 
        group.members.some(m => m.id === employeeId)
      );
      
      if (employeeGroup) {
        const availableScore = employeeGroup.members.length * 100;
        const usedScore = employeeGroup.members.reduce((acc, curr) => acc + (curr.score || 0), 0);
        
        if (usedScore > availableScore) {
          const overScore = usedScore - availableScore;
          toast({
            variant: 'destructive',
            title: '그룹 점수 초과',
            description: `<${employeeGroup.name}> 그룹의 점수가 <${overScore}>점 초과하였습니다. 등급을 조정해주세요.`,
          });
        } else {
          toast({
            title: '등급 변경 완료',
            description: '등급이 변경되었습니다.',
          });
        }
      }
    }
    console.log('=== handleGradeChange Debug End ===');
  }, [localEmployees, gradingScale, onSave, toast, groups]);

  // 안전한 저장 함수 (디바운스 적용)
  const safeSave = React.useCallback((data: EvaluationResult[]) => {
    console.log('=== safeSave called ===');
    console.log('data.length:', data.length);
    console.log('isSaving:', isSaving);
    console.log('localEmployees.length:', localEmployees.length);
    
    if (isSaving) {
      console.log('Save already in progress, skipping...');
      return;
    }
    
    // 의도적 빈 데이터도 허용하되, 비정상적 초기화는 방지
    const isIntentionalEmpty = data.length === 0 && localEmployees.length === 0;
    const hasValidData = data.length > 0 || isIntentionalEmpty;
    
    console.log('isIntentionalEmpty:', isIntentionalEmpty);
    console.log('hasValidData:', hasValidData);
    
    if (!hasValidData) {
      console.log('Warning: Invalid empty data detected, skipping save');
      return;
    }
    
    // 기존 타임아웃 정리
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // 디바운스 적용 (300ms)
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      console.log('=== Safe Save Executed ===');
      console.log('data.length:', data.length);
      console.log('data sample:', data.slice(0, 2)); // 처음 2개만 로그
      
      onSave(data);
      
      // 저장 완료 후 플래그 해제
      setTimeout(() => setIsSaving(false), 100);
    }, 300);
  }, [localEmployees.length, onSave, isSaving]);

  // 메모 변경 핸들러 (Context 액션 사용)
  const handleMemoChange = React.useCallback((employeeId: string, memo: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('=== handleMemoChange Debug ===');
      console.debug('selectedDate:', selectedDate);
      console.debug('employeeId:', employeeId);
      console.debug('original memo:', memo);
    }
    
    // user-0000584 같은 잘못된 데이터는 저장하지 않음
    const cleanMemo = memo && !memo.includes('user-') ? memo : '';
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('cleanMemo:', cleanMemo);
    }
    
    const updatedEmployees = localEmployees.map(emp => {
      if (emp.id === employeeId) {
        const updatedEmployee = { ...emp, memo: cleanMemo };
        if (process.env.NODE_ENV === 'development') {
          console.debug('Updated employee memo:', updatedEmployee);
        }
        return updatedEmployee;
      }
      return emp;
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('updatedEmployees.length:', updatedEmployees.length);
    }
    
    setLocalEmployees(updatedEmployees);
    
    // Context 액션 사용
    if (process.env.NODE_ENV === 'development') {
      console.debug('=== Context 함수 호출 시도 ===');
      console.debug('updateEvaluationMemo 호출:', {
        employeeId,
        cleanMemo,
        year: selectedDate.year,
        month: selectedDate.month
      });
    }
    
    try {
      updateEvaluationMemo(employeeId, cleanMemo, selectedDate.year, selectedDate.month);
      if (process.env.NODE_ENV === 'development') {
        console.debug('=== Context 함수 호출 성공 ===');
      }
    } catch (error) {
      console.error('Context 함수 호출 실패:', error);
    }
  }, [localEmployees, selectedDate, updateEvaluationMemo]);



  // 저장 핸들러
  const handleSaveChanges = React.useCallback(() => {
    console.log('=== handleSaveChanges Debug ===');
    console.log('localEmployees.length:', localEmployees.length);
    console.log('localEmployees:', localEmployees);
    
    // 안전한 저장 사용
    safeSave(localEmployees);
    
    toast({
      title: '저장 완료',
      description: `${selectedDate.year}년 ${selectedDate.month}월 평가 결과가 저장되었습니다.`,
    });
  }, [localEmployees, safeSave, selectedDate, toast]);

  // 평가 그룹 초기화 (입력한 평가등급, 비고는 그대로 유지)
  const handleResetGroups = () => {
    const resetEmployees = localEmployees.map(emp => ({
      ...emp,
      detailedGroup2: '' // 그룹만 초기화, 등급과 비고는 유지
    }));
    
    console.log('resetEmployees.length:', resetEmployees.length);
    setLocalEmployees(resetEmployees);
    
    if (resetEmployees.length > 0) {
    onSave(resetEmployees);
    } else {
      console.log('Warning: resetEmployees is empty, skipping save in handleResetGroups');
    }
    
    // 새로 만든 그룹들도 모두 초기화
    updateCustomGroups({});
    
    toast({
      title: '평가 그룹 초기화',
      description: '평가 그룹이 초기 상태로 되돌아갔습니다. (등급과 비고는 유지됩니다)',
    });
  };

  // 엑셀 다운로드
  const handleDownloadExcel = () => {
    const dataToExport = visibleEmployees.map(r => ({
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
    if (!newGroupName.trim() || idsForNewGroup.size === 0) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '그룹 이름과 멤버를 선택해주세요.',
      });
      return;
    }

    // 선택된 멤버의 detailedGroup2(현재 그룹) 필드를 새 그룹명으로 변경
    setLocalEmployees(prev =>
      prev.map(emp =>
        idsForNewGroup.has(emp.id)
          ? { ...emp, detailedGroup2: newGroupName }
          : emp
      )
    );

    // customGroups 업데이트 (기존 그룹에서 제거하고 새 그룹에 추가)
    const newCustomGroups = { ...customGroups };
    
    // 선택된 멤버들을 기존 커스텀 그룹에서 제거
    Array.from(idsForNewGroup).forEach(employeeId => {
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
    newCustomGroups[newGroupName] = Array.from(idsForNewGroup);
    
    updateCustomGroups(newCustomGroups);

    setNewGroupName('');
    setIdsForNewGroup(new Set());
    setIsAddGroupDialogOpen(false);
    
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
    
    const updatedEmployees = localEmployees.map(emp => {
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
    
    setLocalEmployees(updatedEmployees);
    
    // Context 액션 사용 - 모든 해당 그룹의 직원들에 대해 업데이트
    updatedEmployees.forEach(emp => {
      if (emp.detailedGroup2 === editingGroupName) {
        updateEvaluationGroup(emp.id, editingGroupName, selectedDate.year, selectedDate.month);
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
        if (emp.id === activeId) {
          sourceGroupKey = groupKey;
          sourceIndex = idx;
        }
        if (emp.id === overId) {
          targetGroupKey = groupKey;
          targetIndex = idx;
        }
      });
    });
    if (!sourceGroupKey || !targetGroupKey) return;

    // deep copy
    let updatedEmployees = [...localEmployees];
    // 그룹 내 순서 변경
    if (sourceGroupKey === targetGroupKey) {
      const groupMembers = groups[sourceGroupKey].members.map(e => e.id);
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
        if (emp.detailedGroup2 === sourceGroupKey && groupMembers.includes(emp.id)) {
          return reordered[idx++];
      }
      return emp;
    });
    } else {
      // 그룹 간 이동
      updatedEmployees = updatedEmployees.map(emp =>
        emp.id === activeId ? { ...emp, detailedGroup2: targetGroupKey! } : emp
      );
      
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
    setLocalEmployees(updatedEmployees);
    onSave(updatedEmployees);
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
  const handleToggleSelection = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev);
      if (checked) newSelection.add(id);
      else newSelection.delete(id);
      return newSelection;
    });
  };

  // 그룹 전체 선택 토글
  const handleToggleGroupSelection = (group: {name: string, members: EvaluationResult[]}, checked: boolean) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev);
      const memberIds = group.members.map(m => m.id);
      if (checked) memberIds.forEach(id => newSelection.add(id));
      else memberIds.forEach(id => newSelection.delete(id));
      return newSelection;
    });
  };

  // 일괄 등급 적용
  const handleBulkGradeApply = () => {
    if (!bulkGrade || selectedIds.size === 0) return;

    const updatedEmployees = visibleEmployees.map(e => {
      if (selectedIds.has(e.id)) {
        const gradeInfo = gradingScale[bulkGrade];
        return { 
          ...e, 
          grade: bulkGrade, 
          score: gradeInfo?.score || 0 
        };
      }
      return e;
    });

    onSave(updatedEmployees);
    
    // 그룹 점수 초과 확인
    const affectedGroups = new Set<string>();
    selectedIds.forEach(id => {
      const employee = updatedEmployees.find(e => e.id === id);
      if (employee) {
        const employeeGroup = Object.values(groups).find(group => 
          group.members.some(m => m.id === id)
        );
        if (employeeGroup) {
          affectedGroups.add(employeeGroup.name);
        }
      }
    });
    
    // 각 영향받은 그룹에 대해 점수 초과 확인
    let hasOverScore = false;
    affectedGroups.forEach(groupName => {
      const group = Object.values(groups).find(g => g.name === groupName);
      if (group) {
        const availableScore = group.members.length * 100;
        const usedScore = group.members.reduce((acc, curr) => acc + (curr.score || 0), 0);
        
        if (usedScore > availableScore) {
          const overScore = usedScore - availableScore;
          hasOverScore = true;
          toast({
            variant: 'destructive',
            title: '그룹 점수 초과',
            description: `<${groupName}> 그룹의 점수가 <${overScore}>점 초과하였습니다. 등급을 조정해주세요.`,
          });
        }
      }
    });
    
    if (!hasOverScore) {
      toast({
        title: '일괄 적용 완료',
        description: `${selectedIds.size}명의 등급이 '${bulkGrade}'(으)로 변경되었습니다.`
      });
    }
    
    setSelectedIds(new Set());
    setBulkGrade(null);
  };

  // 드래그 가능한 테이블 행 컴포넌트
  // 관리자페이지와 동일한 비고 입력 컴포넌트
  const MemoizedMemoInput = React.memo(({ 
    value, 
    employeeId, 
    onMemoChange 
  }: {
    value: string;
    employeeId: string;
    onMemoChange: (id: string, memo: string) => void;
  }) => {
    const [inputValue, setInputValue] = React.useState(value || '');
    
    // value prop이 변경되면 inputValue도 업데이트
    React.useEffect(() => {
      const cleanValue = value && !value.includes('user-') ? value : '';
      console.log('=== MemoizedMemoInput - value prop changed ===');
      console.log('employeeId:', employeeId);
      console.log('original value:', value);
      console.log('cleanValue:', cleanValue);
      setInputValue(cleanValue);
    }, [value, employeeId]);
    
    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.currentTarget.blur(); // 포커스 해제하여 저장 트리거
      }
    }, []);
    
    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('=== MemoizedMemoInput - input change ===');
      console.log('employeeId:', employeeId);
      console.log('new value:', e.target.value);
      setInputValue(e.target.value);
    }, [employeeId]);
    
    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      // 포커스 해제 시에만 저장
      console.log('=== MemoizedMemoInput - blur event ===');
      console.log('employeeId:', employeeId);
      console.log('final value:', e.target.value);
      onMemoChange(employeeId, e.target.value);
    }, [employeeId, onMemoChange]);
    
    return (
      <Input
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-8"
        placeholder='평가 피드백 입력'
        autoComplete="off"
        spellCheck={false}
      />
    );
  });
  
  MemoizedMemoInput.displayName = 'MemoizedMemoInput';

  // DraggableTableRow를 memo로 감싸기 (성능 최적화)
  const DraggableTableRow = React.memo(function DraggableTableRow({ 
    employee, 
    selected, 
    onSelect, 
    onGradeChange, 
    onMemoChange, 
    onSave 
  }: {
    employee: EvaluationResult;
    selected: boolean;
    onSelect: (id: string, checked: boolean) => void;
    onGradeChange: (id: string, grade: Grade | null) => void;
    onMemoChange: (id: string, memo: string) => void;
    onSave: () => void;
  }) {
    // useCallback으로 함수 메모이제이션
    const handleSelect = React.useCallback((checked: boolean) => {
      onSelect(employee.id, checked);
    }, [employee.id, onSelect]);

    const handleGradeChange = React.useCallback((grade: Grade | null) => {
      onGradeChange(employee.id, grade);
    }, [employee.id, onGradeChange]);

    const handleMemoChange = React.useCallback((memo: string) => {
      // Context 액션을 사용하는 메인 handleMemoChange 함수 호출
      onMemoChange(employee.id, memo);
    }, [employee.id, onMemoChange]);

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging: isRowDragging,
      over,
    } = useSortable({ id: employee.id });

              // 드롭 위치를 행간으로 강조
          const isDropTarget = over?.id === employee.id;
    const style = {
      transform: CSS.Transform.toString(transform),
            transition: isRowDragging ? 'none' : transition, // 드래그 중에는 transition 제거
            opacity: isRowDragging ? 0.5 : 1,
            // 드롭 위치 강조: 위쪽/아래쪽 테두리로 구분
            borderTop: isDropTarget ? '2px solid hsl(var(--primary))' : undefined,
            borderBottom: isDropTarget ? '2px solid hsl(var(--primary))' : undefined,
            // 배경색으로 구분 (HSL 0, 0%, 98%)
                            background: isDropTarget ? 'hsl(30, 30%, 96%)' : undefined,
            boxShadow: isRowDragging ? '0 2px 8px rgba(0,0,0,0.15)' : undefined,
            zIndex: isRowDragging ? 10 : undefined,
            // GPU 가속
            willChange: isRowDragging ? 'transform' : 'auto',
            // 드래그 중 성능 최적화
            pointerEvents: isRowDragging ? 'none' as const : 'auto' as const,
    };
    
    return (
      <TableRow ref={setNodeRef} style={style} data-state={selected ? "selected" : "unselected"}>
        {/* 드래그 핸들 + 체크박스 */}
        <TableCell className="p-2 w-[80px]">
          <div className='flex items-center gap-1'>
            <Button 
              variant="ghost" 
              size="icon" 
              className="cursor-grab h-8 w-8" 
              {...attributes} 
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-foreground" />
            </Button>
            <Checkbox
              checked={selected}
              onCheckedChange={handleSelect}
              aria-label={`Select ${employee.name}`}
            />
          </div>
        </TableCell>
        
        {/* ID 또는 구분 */}
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">
            {employee.uniqueId}
          </TableCell>
        
        {/* 기본 정보 - 요구사항 순서: ID | 이름 | 회사 | 소속부서 | 직책 | 성장레벨 | 그룹구분 | 근무율 */}
        <TableCell className="font-medium whitespace-nowrap py-1 px-2 text-center">{employee.name}</TableCell>
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.company}</TableCell>
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.department}</TableCell>
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.title}</TableCell>
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.growthLevel}</TableCell>
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">
          {(() => {
            const workRatePercent = employee.workRate * 100;
            let groupText = '';
            let bgColor = '';
            let textColor = '';
            
            if (workRatePercent >= 70) {
              groupText = '70% 이상';
              bgColor = 'hsl(25, 15%, 70%)';
              textColor = 'inherit';
            } else if (workRatePercent >= 65) {
              groupText = '65 ~ 69%';
              bgColor = 'hsl(25, 15%, 80%)';
              textColor = 'inherit';
            } else if (workRatePercent >= 60) {
              groupText = '60 ~ 64%';
              bgColor = 'hsl(25, 15%, 82%)';
              textColor = 'inherit';
            } else if (workRatePercent >= 55) {
              groupText = '55 ~ 59%';
              bgColor = 'hsl(25, 15%, 84%)';
              textColor = 'inherit';
            } else if (workRatePercent >= 50) {
              groupText = '50 ~ 54%';
              bgColor = 'hsl(25, 15%, 86%)';
              textColor = 'inherit';
            } else if (workRatePercent >= 45) {
              groupText = '45 ~ 49%';
              bgColor = 'hsl(25, 15%, 88%)';
              textColor = 'inherit';
            } else if (workRatePercent >= 40) {
              groupText = '40 ~ 44%';
              bgColor = 'hsl(25, 15%, 90%)';
              textColor = 'inherit';
            } else if (workRatePercent >= 35) {
              groupText = '35 ~ 39%';
              bgColor = 'hsl(25, 15%, 92%)';
              textColor = 'inherit';
            } else if (workRatePercent >= 30) {
              groupText = '30 ~ 34%';
              bgColor = 'hsl(25, 15%, 94%)';
              textColor = 'inherit';
            } else if (workRatePercent >= 25) {
              groupText = '25 ~ 29%';
              bgColor = 'hsl(25, 15%, 96%)';
              textColor = 'inherit';
            } else {
              groupText = '25% 미만';
              bgColor = 'transparent';
              textColor = 'hsl(25, 95%, 53%)'; // 주황색
            }
            
            let borderColor = 'hsl(25, 15%, 40%)';
            if (workRatePercent < 70 && workRatePercent >= 25) {
              borderColor = 'hsl(25, 15%, 40%)';
            } else if (workRatePercent < 25) {
              textColor = 'hsl(25, 15%, 55%)';
              borderColor = 'hsl(25, 15%, 40%)';
            }
            return (
              <div 
                className="px-2 py-1 rounded-full text-xs font-medium border inline-block"
                style={{ 
                  backgroundColor: bgColor,
                  color: textColor,
                  borderColor: borderColor,
                  fontSize: '0.9em',
                  transform: 'scale(0.9)',
                  transformOrigin: 'center'
                }}
              >
                {groupText}
              </div>
            );
          })()}
        </TableCell>
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">
          {(employee.workRate * 100).toFixed(1)}%
        </TableCell>
        
        {/* 등급 선택 드롭다운 */}
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">
          {(() => {
            const workRatePercent = employee.workRate * 100;
            const isUnder25Percent = workRatePercent < 25;
            
            if (isUnder25Percent) {
              // 25% 미만인 경우 '-' 고정 표시
              return (
                <div className="text-sm text-muted-foreground font-medium">
                  -
                </div>
              );
            }
            
            // 25% 이상인 경우에만 등급 선택 드롭다운 표시
            return Object.keys(gradingScale || {}).length > 0 ? (
              <Select 
                value={employee.grade || 'none'} 
                onValueChange={(g) => {
                  console.log('=== Select onValueChange Debug ===');
                  console.log('employee.id:', employee.id);
                  console.log('employee.name:', employee.name);
                  console.log('current grade:', employee.grade);
                  console.log('new grade value:', g);
                  console.log('==================================');
                  handleGradeChange(g === 'none' ? null : g as Grade);
                }}
              >
                <SelectTrigger className="w-[80px] h-8 mx-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {Object.keys(gradingScale).map(grade => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-xs text-muted-foreground">
                등급 미설정
              </div>
            );
          })()}
        </TableCell>
        
        {/* 점수 */}
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">
          {employee.score}
        </TableCell>
        
        {/* 비고 입력 필드 */}
        <TableCell className="py-1 px-2">
          <MemoizedMemoInput
            value={employee.memo || ''}
            employeeId={employee.id}
            onMemoChange={handleMemoChange}
          />
        </TableCell>
      </TableRow>
    );
  }, (prevProps, nextProps) => {
    // 커스텀 비교 함수로 불필요한 리렌더링 방지
    return (
      prevProps.employee.id === nextProps.employee.id &&
      prevProps.selected === nextProps.selected &&
      prevProps.employee.grade === nextProps.employee.grade &&
      prevProps.employee.memo === nextProps.employee.memo &&
      prevProps.employee.detailedGroup2 === nextProps.employee.detailedGroup2
    );
  });

  DraggableTableRow.displayName = 'DraggableTableRow';

  // 새 그룹 추가 다이얼로그용 필터링된 직원들
  const filteredEmployeesForDialog = React.useMemo(() => {
    return visibleEmployees.filter(emp => {
      const deptMatch = departmentFilter === 'all' || emp.department === departmentFilter;
      const posMatch = positionFilter === 'all' || emp.title === positionFilter;
      return deptMatch && posMatch;
    });
  }, [visibleEmployees, departmentFilter, positionFilter]);

  const allDepartments = React.useMemo(() => {
    const depts = Array.from(new Set(visibleEmployees.map(emp => emp.department)));
    return ['all', ...depts];
  }, [visibleEmployees]);

  const positionOptions = React.useMemo(() => {
    const positions = Array.from(new Set(visibleEmployees.map(emp => emp.title)));
    return ['all', ...positions];
  }, [visibleEmployees]);

  // Context의 evaluations 데이터와 localEmployees 동기화
  React.useEffect(() => {
    const key = `${selectedDate.year}-${selectedDate.month}`;
    const savedEvaluations = evaluations[key] || [];
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('=== Context evaluations 동기화 ===');
      console.debug('key:', key);
      console.debug('savedEvaluations.length:', savedEvaluations.length);
      console.debug('localEmployees.length:', localEmployees.length);
    }
    
    // Context의 데이터를 localEmployees에 병합
    const mergedEmployees = localEmployees.map(emp => {
      const savedEval = savedEvaluations.find(evaluation => evaluation.employeeId === emp.id);
      if (savedEval) {
        return {
          ...emp,
          memo: savedEval.memo ?? emp.memo,
          detailedGroup2: savedEval.detailedGroup2 ?? emp.detailedGroup2,
          grade: savedEval.grade ?? emp.grade
        };
      }
      return emp;
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('mergedEmployees.length:', mergedEmployees.length);
    }
    
    setLocalEmployees(mergedEmployees);
  }, [evaluations, selectedDate]);

  return (
    <div className="space-y-4">
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
              <Button onClick={() => setIsAddGroupDialogOpen(true)} variant="outline" size="sm" className="border-border hover:bg-accent hover:border-accent">
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
                  const selectedInGroupCount = group.members.filter(m => selectedIds.has(m.id)).length;
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
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-white border-b border-border">
                                  <TableHead className="w-[80px] p-2 text-center text-sm font-semibold text-muted-foreground">
                                    <Checkbox 
                                      checked={isIndeterminate ? 'indeterminate' : allSelectedInGroup} 
                                      onCheckedChange={(checked) => handleToggleGroupSelection(group, Boolean(checked))} 
                                      aria-label={`Select all in ${group.name}`}
                                    />
                                  </TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">
                                    ID
                                  </TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">이름</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">회사</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">소속부서</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">직책</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">성장레벨</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">그룹구분</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">근무율</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">등급</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">점수</TableHead>
                                  <TableHead className="whitespace-nowrap w-[200px] py-2 px-2 text-center text-sm font-semibold text-muted-foreground">비고</TableHead>
                                </TableRow>
                              </TableHeader>
                            <SortableContext items={group.members.map(m => m.id)} strategy={verticalListSortingStrategy}>
                              <TableBody>
                                {group.members.map(emp => (
                                  <DraggableTableRow
                                    key={emp.id}
                                    employee={emp}
                                    selected={selectedIds.has(emp.id)}
                                    onSelect={handleToggleSelection}
                                    onGradeChange={handleGradeChange}
                                    onMemoChange={handleMemoChange}
                                    onSave={handleSaveChanges}
                                  />
                                ))}
                              </TableBody>
                          </SortableContext>
                          </Table>
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
                      {visibleEmployees.find(emp => emp.id === activeId)?.name || 'Unknown'}
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
      {selectedIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20">
          <Card className="flex items-center gap-4 p-3 shadow-lg animate-in fade-in-50 slide-in-from-bottom-5">
            <p className="text-sm font-medium">{selectedIds.size}명 선택됨</p>
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
      <Dialog open={isAddGroupDialogOpen} onOpenChange={setIsAddGroupDialogOpen}>
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
                className="flex-1 w-full bg-white"
              />
            </div>
            <Card style={{ backgroundColor: 'hsl(0,0%,100%)' }}>
              <CardHeader style={{ backgroundColor: 'hsl(0,0%,100%)' }}>
                <CardTitle>멤버 선택</CardTitle>
                <div className="flex gap-2 pt-2">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="소속부서 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      {allDepartments.map(dep => 
                        <SelectItem key={dep} value={dep} className="bg-white">
                          {dep === 'all' ? '모든 부서' : dep}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="직책 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      {positionOptions.map(pos => 
                        <SelectItem key={pos} value={pos} className="bg-white">
                          {pos === 'all' ? '모든 직책' : pos}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent style={{ backgroundColor: 'hsl(0,0%,100%)' }}>
                <ScrollArea className="h-[300px] border rounded-md" style={{ backgroundColor: 'hsl(0,0%,100%)' }}>
                  <Table style={{ backgroundColor: 'hsl(0,0%,100%)' }}>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] text-center">
                          <Checkbox 
                            checked={filteredEmployeesForDialog.length > 0 && idsForNewGroup.size === filteredEmployeesForDialog.length}
                            onCheckedChange={(checked) => {
                              const allIds = new Set(filteredEmployeesForDialog.map(e => e.id));
                              if (checked) setIdsForNewGroup(new Set([...idsForNewGroup, ...allIds]));
                              else setIdsForNewGroup(new Set([...idsForNewGroup].filter(id => !allIds.has(id))));
                            }}
                          />
                        </TableHead>
                        <TableHead className="text-center">이름</TableHead>
                        <TableHead className="text-center">소속부서</TableHead>
                        <TableHead className="text-center">직책</TableHead>
                        <TableHead className="text-center">현재 그룹</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployeesForDialog.map(emp => (
                        <TableRow key={emp.id}>
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={idsForNewGroup.has(emp.id)}
                              onCheckedChange={(checked) => {
                                const newIds = new Set(idsForNewGroup);
                                if (checked) newIds.add(emp.id);
                                else newIds.delete(emp.id);
                                setIdsForNewGroup(newIds);
                              }}
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
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddGroupDialogOpen(false)}>취소</Button>
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