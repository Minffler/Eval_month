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
import { 
  ChevronUp, 
  ChevronDown, 
  Download, 
  Plus, 
  Edit, 
  X, 
  Check, 
  GripVertical
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
}

type Groups = Record<string, { name: string; members: EvaluationResult[]; isCustom?: boolean }>;

export default function EvaluationInputView({ 
  myEmployees, 
  gradingScale, 
  selectedDate, 
  onClearMyEvaluations, 
  onSave 
}: EvaluationInputViewProps) {
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
  const [customGroups, setCustomGroups] = React.useState<Record<string, string[]>>({});
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [localEmployees, setLocalEmployees] = React.useState<EvaluationResult[]>(myEmployees);
  const { toast } = useToast();

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

  // 로컬 상태를 visibleEmployees로 사용
  const visibleEmployees = localEmployees;

  // myEmployees가 변경될 때 localEmployees 업데이트
  React.useEffect(() => {
    setLocalEmployees(myEmployees);
  }, [myEmployees]);

  // 진행률 계산
  const totalMyEmployees = visibleEmployees.length;
  const totalMyCompleted = visibleEmployees.filter(e => e.grade).length;
  const totalCompletionRate = totalMyEmployees > 0 ? (totalMyCompleted / totalMyEmployees) * 100 : 0;

  // 그룹별 데이터 관리
  const groupWithinCategory = (employees: EvaluationResult[]): Groups => {
    const groups: Groups = {};
    
    // 기본 그룹 생성
    employees.forEach(emp => {
      let groupKey = '';
      if (['센터장', '지부장'].includes(emp.title)) {
        groupKey = '센터장/지부장';
      } else if (['팀장', '지점장'].includes(emp.title)) {
        groupKey = '팀장/지점장';
      } else if (emp.growthLevel === 'Lv.2' || emp.growthLevel === 'Lv.3') {
        groupKey = 'Lv.2~3';
      } else if (emp.growthLevel === 'Lv.1') {
        groupKey = 'Lv.1';
      } else {
        groupKey = '기타';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = { name: groupKey, members: [] };
      }
      groups[groupKey].members.push(emp);
    });

    // 커스텀 그룹 추가
    Object.entries(customGroups).forEach(([groupName, employeeIds]) => {
      const customMembers = employees.filter(emp => employeeIds.includes(emp.id));
      if (customMembers.length > 0) {
        groups[groupName] = { 
          name: groupName, 
          members: customMembers, 
          isCustom: true 
        };
      }
    });

    return groups;
  };

  const groups = groupWithinCategory(visibleEmployees);

  // 등급 분포 계산
  const gradeDistribution = React.useMemo(() => {
    const counts = visibleEmployees.reduce((acc, result) => {
      if (result.grade) {
        const gradeKey = result.grade as string;
        acc[gradeKey] = (acc[gradeKey] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(gradingScale).map(grade => ({
      name: grade,
      value: counts[grade] || 0,
    }));
  }, [visibleEmployees, gradingScale]);

  // 그룹별 점수 계산
  const calculateGroupScore = (members: EvaluationResult[]) => {
    return members.reduce((total, member) => total + (member.score || 0), 0);
  };

  // 등급 변경 핸들러
  const handleGradeChange = React.useCallback((employeeId: string, grade: Grade | null) => {
    const updatedEmployees = localEmployees.map(e => {
      if (e.id === employeeId) {
        const gradeInfo = grade ? gradingScale[grade] : { score: 0 };
        return { 
          ...e, 
          grade, 
          score: gradeInfo?.score || 0 
        };
      }
      return e;
    });
    
    setLocalEmployees(updatedEmployees);
    onSave(updatedEmployees);
    
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
  }, [localEmployees, gradingScale, onSave, toast, groups]);

  // 메모 변경 핸들러 (로컬 상태만 업데이트)
  const handleMemoChange = React.useCallback((employeeId: string, memo: string) => {
    setLocalEmployees(prev => prev.map(e => 
      e.id === employeeId ? { ...e, memo } : e
    ));
  }, []);

  // 메모 포커스 해제 시 저장
  const handleMemoBlur = React.useCallback((employeeId: string) => {
    const employee = localEmployees.find(e => e.id === employeeId);
    if (employee) {
      onSave(localEmployees);
    }
  }, [localEmployees, onSave]);

  // 저장 핸들러
  const handleSaveChanges = React.useCallback(() => {
    onSave(localEmployees);
    toast({
      title: '저장 완료',
      description: `${selectedDate.year}년 ${selectedDate.month}월 평가 결과가 저장되었습니다.`,
    });
  }, [localEmployees, onSave, selectedDate, toast]);

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

    setCustomGroups(prev => ({
      ...prev,
      [newGroupName]: Array.from(idsForNewGroup)
    }));

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
    setCustomGroups(prev => {
      const newGroups = { ...prev };
      delete newGroups[groupName];
      return newGroups;
    });
    
    toast({
      title: '그룹 삭제 완료',
      description: `'${groupName}' 그룹이 삭제되었습니다.`,
    });
  };

  // 그룹명 편집 시작
  const handleStartEditing = (groupId: string, currentName: string) => { 
    setEditingGroupId(groupId); 
    setEditingGroupName(currentName); 
  };

  // 그룹명 편집 취소
  const handleCancelEditing = () => { 
    setEditingGroupId(null); 
    setEditingGroupName(''); 
  };

  // 그룹명 업데이트
  const handleUpdateGroupName = () => {
    if (!editingGroupId || !editingGroupName.trim()) { 
      handleCancelEditing(); 
      return; 
    }
    
    if (customGroups[editingGroupId]) {
      setCustomGroups(prev => {
        const newGroups = { ...prev };
        if (editingGroupName !== editingGroupId) {
          newGroups[editingGroupName] = prev[editingGroupId];
          delete newGroups[editingGroupId];
        }
        return newGroups;
      });
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
  };

  // 드래그 종료
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const isBulkDrag = selectedIds.has(activeId) && selectedIds.size > 1;
    const movedIds = isBulkDrag ? Array.from(selectedIds) : [activeId];

    // 드래그 로직 구현 (그룹 간 이동)
    const updatedEmployees = visibleEmployees.map(emp => {
      if (movedIds.includes(emp.id)) {
        return { ...emp, detailedGroup2: overId };
      }
      return emp;
    });

    onSave(updatedEmployees);
    setSelectedIds(new Set());
    
    toast({
      title: '그룹 이동 완료',
      description: `${movedIds.length}명의 직원이 이동되었습니다.`,
    });
  };

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
  const DraggableTableRow = ({ 
    employee, 
    selected, 
    onSelect, 
    onGradeChange, 
    onMemoChange, 
    onMemoBlur,
    onSave 
  }: {
    employee: EvaluationResult;
    selected: boolean;
    onSelect: (id: string, checked: boolean) => void;
    onGradeChange: (id: string, grade: Grade | null) => void;
    onMemoChange: (id: string, memo: string) => void;
    onMemoBlur: (id: string) => void;
    onSave: () => void;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: employee.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
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
              <GripVertical className="h-4 w-4" />
            </Button>
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect(employee.id, Boolean(checked))}
              aria-label={`Select ${employee.name}`}
            />
          </div>
        </TableCell>
        
        {/* ID 또는 구분 */}
        {isBGroupView ? (
          <TableCell className="py-1 px-2">
            <div className="flex items-center justify-center">
              {(() => {
                const { style, className } = getBGroupIndicatorStyle(employee.workRate);
                return (
                  <div className={cn("flex items-center justify-center rounded-full text-xs font-semibold w-24 h-6", className)} style={style}>
                    {employee.detailedGroup1 || '미지정'}
                  </div>
                );
              })()}
            </div>
          </TableCell>
        ) : (
          <TableCell className="whitespace-nowrap py-1 px-2 text-center">
            {employee.uniqueId}
          </TableCell>
        )}
        
        {/* 기본 정보 */}
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.company}</TableCell>
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.department}</TableCell>
        <TableCell className="font-medium whitespace-nowrap py-1 px-2 text-center">{employee.name}</TableCell>
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.title}</TableCell>
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.growthLevel}</TableCell>
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">
          {(employee.workRate * 100).toFixed(1)}%
        </TableCell>
        
        {/* 등급 선택 드롭다운 */}
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">
          <Select 
            value={employee.grade || ''} 
            onValueChange={(g) => onGradeChange(employee.id, g === '' ? null : g as Grade)}
          >
            <SelectTrigger className="w-[80px] h-8 mx-auto">
              <SelectValue placeholder="등급 선택" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(gradingScale).map(grade => (
                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        
        {/* 점수 */}
        <TableCell className="whitespace-nowrap py-1 px-2 text-center">
          {employee.score}
        </TableCell>
        
        {/* 비고 입력 필드 */}
        <TableCell className="py-1 px-2">
          <Input
            value={employee.memo || ''}
            onChange={(e) => onMemoChange(employee.id, e.target.value)}
            onBlur={() => onMemoBlur(employee.id)}
            className="h-8"
            placeholder=''
          />
        </TableCell>
      </TableRow>
    );
  };

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
                <GradeHistogram data={gradeDistribution} gradingScale={gradingScale} highlightGrade={null} />
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
                      {/* 카드 헤더 */}
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
                          <SortableContext items={group.members.map(m => m.id)} strategy={verticalListSortingStrategy}>
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-white border-b border-border">
                                  <TableHead className="w-[80px] p-2 text-center">
                                    <Checkbox 
                                      checked={isIndeterminate ? 'indeterminate' : allSelectedInGroup} 
                                      onCheckedChange={(checked) => handleToggleGroupSelection(group, Boolean(checked))} 
                                      aria-label={`Select all in ${group.name}`}
                                    />
                                  </TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">
                                    {isBGroupView ? '구분' : 'ID'}
                                  </TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">회사</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">소속부서</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">이름</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">직책</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">성장레벨</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">근무율</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">등급</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center text-sm font-semibold text-muted-foreground">점수</TableHead>
                                  <TableHead className="whitespace-nowrap w-[200px] py-2 px-2 text-center text-sm font-semibold text-muted-foreground">비고</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.members.map(emp => (
                                  <DraggableTableRow
                                    key={emp.id}
                                    employee={emp}
                                    selected={selectedIds.has(emp.id)}
                                    onSelect={handleToggleSelection}
                                    onGradeChange={handleGradeChange}
                                    onMemoChange={handleMemoChange}
                                    onMemoBlur={handleMemoBlur}
                                    onSave={handleSaveChanges}
                                  />
                                ))}
                              </TableBody>
                            </Table>
                          </SortableContext>
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
      <Card className="shadow-sm border-border">
        <CardContent className="p-4">
          <div className="flex justify-end gap-2">
            <Button onClick={handleSaveChanges} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Check className="mr-2 h-4 w-4" />
              모든 평가 저장
            </Button>
            <Button onClick={() => setIsClearConfirmOpen(true)} size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              <X className="mr-2 h-4 w-4" />
              평가 이력 삭제
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 선택된 항목들에 대한 일괄 작업 UI */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20">
          <Card className="flex items-center gap-4 p-3 shadow-lg animate-in fade-in-50 slide-in-from-bottom-5">
            <p className="text-sm font-medium">{selectedIds.size}명 선택됨</p>
            <Select value={bulkGrade || ''} onValueChange={(g) => setBulkGrade(g === '' ? null : g as Grade)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="등급 일괄 적용" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(gradingScale).map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleBulkGradeApply} disabled={!bulkGrade} size="sm" className="bg-primary hover:bg-primary/90">적용</Button>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group-name" className="text-right">그룹 이름</Label>
              <Input 
                id="group-name" 
                value={newGroupName} 
                onChange={(e) => setNewGroupName(e.target.value)} 
                className="col-span-3"
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>멤버 선택</CardTitle>
                <div className="flex gap-2 pt-2">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="소속부서 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      {allDepartments.map(dep => 
                        <SelectItem key={dep} value={dep}>
                          {dep === 'all' ? '모든 부서' : dep}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="직책 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      {positionOptions.map(pos => 
                        <SelectItem key={pos} value={pos}>
                          {pos === 'all' ? '모든 직책' : pos}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] border rounded-md">
                  <Table>
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