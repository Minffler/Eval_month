'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { EvaluationResult, Grade, GradeInfo, EvaluationGroupCategory, User, EvaluatorView, Employee, Holiday, AttendanceType, Approval, AppNotification, ApprovalStatus, WorkRateInputs } from '@/lib/types';
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
import { cn } from '@/lib/utils';

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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Check, Download, ArrowUpDown, ArrowUp, ArrowDown, Edit, GripVertical, ChevronUp, ChevronDown, PlusCircle, Save, X, Trash2, Users, Bell, CheckCircle2, ThumbsUp, ThumbsDown, Inbox, ChevronsUpDown } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { GradeHistogram } from './grade-histogram';
import { Input } from '../ui/input';
import * as XLSX from 'xlsx';
import { Checkbox } from '../ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  AlertDialogContent as AlertDialogContent2,
  AlertDialogDescription as AlertDialogDescription2,
  AlertDialogFooter as AlertDialogFooter2,
  AlertDialogHeader as AlertDialogHeader2,
  AlertDialogTitle as AlertDialogTitle2,
} from '@/components/ui/alert-dialog';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { getPositionSortValue } from '@/lib/data';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import WorkRateManagement from './work-rate-management';
import type { WorkRateDetailsResult } from '@/lib/work-rate-calculator';
import WorkRateDetails from './work-rate-details';
import EvaluatorNotifications from './evaluator-dashboard-notifications';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { useNotifications } from '@/contexts/notification-context';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"


interface EvaluatorDashboardProps {
  allResults: EvaluationResult[];
  currentMonthResults: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  selectedDate: { year: number; month: number };
  setSelectedDate: (date: { year: number; month: number }) => void;
  handleEvaluatorAssignmentChange: (userId: string, newEvaluatorId: string) => void;
  evaluatorUser?: User | null;
  activeView: EvaluatorView;
  onClearMyEvaluations: (year: number, month: number, evaluatorId: string) => void;
  workRateDetails: WorkRateDetailsResult;
  workRateInputs: Record<string, WorkRateInputs>;
  holidays: Holiday[];
  allUsers: User[];
  attendanceTypes: AttendanceType[];
  onApprovalAction: (approval: Approval) => void;
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'isRead'>) => void;
  deleteNotification: (notificationId: string) => void;
  approvals: Approval[];
  handleResultsUpdate?: (updatedResults: EvaluationResult[]) => void;
}

type SortConfig = {
  key: keyof EvaluationResult;
  direction: 'ascending' | 'descending';
} | null;

type Groups = Record<string, { name: string; members: EvaluationResult[] }>;


const getBGroupIndicatorStyle = (workRate: number): { style: React.CSSProperties, className: string } => {
    if (workRate >= 0.7 || workRate < 0.25) return { style: {}, className: 'bg-gray-100' };

    const normalized = (workRate - 0.25) / (0.70 - 0.25);

    // Dark brown base: hsl(25, 25%, 25%)
    // Light brown base: hsl(25, 25%, 95%)
    const hue = 25; 
    const saturation = 25; 
    const lightness = 95 - (normalized * (95 - 25));

    const style = {
        backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    };
    
    const className = lightness < 60 ? 'text-white' : 'text-stone-800';

    return { style, className };
};


// Helper component for a single draggable table row
const DraggableTableRow = ({ employee, gradingScale, selected, onSelect, onGradeChange, onMemoChange, onSave, isBGroupView }: {
    employee: EvaluationResult,
    gradingScale: Record<NonNullable<Grade>, GradeInfo>,
    selected: boolean,
    onSelect: (id: string, checked: boolean) => void,
    onGradeChange: (id: string, grade: Grade) => void,
    onMemoChange: (id: string, memo: string) => void,
    onSave: () => void,
    isBGroupView: boolean;
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
            <TableCell className="p-2 w-[80px]">
                <div className='flex items-center gap-1'>
                  <Button variant="ghost" size="icon" className="cursor-grab h-8 w-8" {...attributes} {...listeners}>
                      <GripVertical className="h-4 w-4" />
                  </Button>
                  <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => onSelect(employee.id, Boolean(checked))}
                      aria-label={`Select ${employee.name}`}
                  />
                </div>
            </TableCell>
            {isBGroupView ? (
                <TableCell className="py-1 px-2">
                    <div className="flex items-center justify-center">
                        {(() => {
                            const { style, className } = getBGroupIndicatorStyle(employee.workRate);
                            return (
                                <div className={cn("flex items-center justify-center rounded-full text-xs font-semibold w-24 h-6", className)} style={style}>
                                    {employee.detailedGroup1}
                                </div>
                            );
                        })()}
                    </div>
                </TableCell>
            ) : (
                <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.uniqueId}</TableCell>
            )}
            <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.company}</TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.department}</TableCell>
            <TableCell className="font-medium whitespace-nowrap py-1 px-2 text-center">{employee.name}</TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.title}</TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.growthLevel}</TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2 text-center">{(employee.workRate * 100).toFixed(1)}%</TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2 text-center">
                <Select value={employee.grade || ''} onValueChange={(g: Grade) => onGradeChange(employee.id, g)}>
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
            <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.score}</TableCell>
            <TableCell className="py-1 px-2">
                <Input
                    value={employee.memo || ''}
                    onChange={(e) => onMemoChange(employee.id, e.target.value)}
                    onBlur={onSave}
                    className="h-8"
                    placeholder=''
                />
            </TableCell>
        </TableRow>
    );
};


const EvaluationInputView = ({ myEmployees, gradingScale, selectedDate, handleResultsUpdate, allResults, onClearMyEvaluations }: {
  myEmployees: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  selectedDate: { year: number; month: number };
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
  allResults: EvaluationResult[];
  onClearMyEvaluations: (year: number, month: number) => void;
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<EvaluationGroupCategory | '전체'>('A. 정규평가');
  const [groups, setGroups] = React.useState<Groups>({});
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = React.useState('');
  const [isChartOpen, setIsChartOpen] = React.useState(false);
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = React.useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState('');
  const [idsForNewGroup, setIdsForNewGroup] = React.useState<Set<string>>(new Set());
  const [departmentFilter, setDepartmentFilter] = React.useState('all');
  const [positionFilter, setPositionFilter] = React.useState('all');
  const [bulkGrade, setBulkGrade] = React.useState<Grade | ''>('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const categorizedEmployees = React.useMemo(() => {
    const categories: Partial<Record<EvaluationGroupCategory | '전체', EvaluationResult[]>> = {
      'A. 정규평가': myEmployees.filter(emp => emp.evaluationGroup === 'A. 정규평가'),
      'B. 별도평가': myEmployees.filter(emp => emp.evaluationGroup === 'B. 별도평가'),
      'C. 미평가': myEmployees.filter(emp => emp.evaluationGroup === 'C. 미평가'),
      '전체': myEmployees,
    };
    return categories;
  }, [myEmployees]);

  const visibleEmployees = categorizedEmployees[activeTab] ?? [];

  React.useEffect(() => {
    const groupWithinCategory = (employees: EvaluationResult[]): Groups => {
        const initialGroups = employees.reduce((acc, emp) => {
            const groupKey = emp.detailedGroup2 || '기타';
            if (!acc[groupKey]) {
                acc[groupKey] = { name: groupKey, members: [] };
            }
            acc[groupKey].members.push(emp);
            return acc;
        }, {} as Groups);
        
        // Sort members within each group
        for (const key in initialGroups) {
            initialGroups[key].members.sort((a, b) => {
                const companyCompare = a.company.localeCompare(b.company);
                if (companyCompare !== 0) return companyCompare;

                const departmentCompare = a.department.localeCompare(b.department);
                if (departmentCompare !== 0) return departmentCompare;

                const levelA = parseInt(a.growthLevel.replace('Lv.', ''), 10) || 99;
                const levelB = parseInt(b.growthLevel.replace('Lv.', ''), 10) || 99;
                if (levelA !== levelB) return levelA - levelB;
                
                return b.workRate - a.workRate;
            });
        }
        return initialGroups;
    };
    setGroups(groupWithinCategory(visibleEmployees));
    setSelectedIds(new Set());
  }, [visibleEmployees]);

  const handleGradeChange = (employeeId: string, newGrade: Grade) => {
    setGroups(prevGroups => {
        const newGroups = JSON.parse(JSON.stringify(prevGroups));
        for (const key in newGroups) {
            const memberIndex = newGroups[key].members.findIndex((m: EvaluationResult) => m.id === employeeId);
            if (memberIndex !== -1) {
                const score = newGrade ? gradingScale[newGrade]?.score || 0 : 0;
                newGroups[key].members[memberIndex].grade = newGrade;
                newGroups[key].members[memberIndex].score = score;
                break;
            }
        }
        return newGroups;
    });
  };

  const handleMemoChange = (employeeId: string, memo: string) => {
     setGroups(prevGroups => {
        const newGroups = JSON.parse(JSON.stringify(prevGroups));
        for (const key in newGroups) {
            const memberIndex = newGroups[key].members.findIndex((m: EvaluationResult) => m.id === employeeId);
            if (memberIndex !== -1) {
                newGroups[key].members[memberIndex].memo = memo;
                break;
            }
        }
        return newGroups;
    });
  }
  
  const flattenGroupsToResults = (): EvaluationResult[] => {
    const allGroupMembers = Object.values(groups).flatMap(group => 
        group.members.map(member => ({ ...member, detailedGroup2: group.name }))
    );
    const myEmployeeIds = new Set(myEmployees.map(e => e.id));
    const updatedMemberMap = new Map(allGroupMembers.map(m => [m.id, m]));
    const updatedResultsInScope = allResults.map(res => {
      if (!myEmployeeIds.has(res.id)) return res;
      const updatedMember = updatedMemberMap.get(res.id);
      if (updatedMember) return updatedMember;
      return res;
    });
    return updatedResultsInScope;
  };
  
  const handleSave = () => {
    // This function is now just for local state saving, not pushing to parent.
    // The parent component should have a master save button if needed.
    toast({ title: '성공!', description: '평가가 성공적으로 저장되었습니다.' });
  };

  const findGroupAndMemberInfo = (id: string, groupsSource: Groups) => {
    for (const key in groupsSource) {
      const memberIndex = groupsSource[key].members.findIndex((m: EvaluationResult) => m.id === id);
      if (memberIndex > -1) return { groupKey: key, index: memberIndex, member: groupsSource[key].members[memberIndex] };
    }
    return null;
  }

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const isBulkDrag = selectedIds.has(activeId) && selectedIds.size > 1;
    const movedIds = isBulkDrag ? Array.from(selectedIds) : [activeId];

    setGroups(currentGroups => {
        const newGroups = JSON.parse(JSON.stringify(currentGroups));

        const sourceInfos = movedIds.map(id => findGroupAndMemberInfo(id, newGroups)).filter(Boolean) as {groupKey: string, index: number, member: EvaluationResult}[];
        const overInfo = findGroupAndMemberInfo(overId, newGroups);
        
        let destinationGroupKey = overInfo?.groupKey;
        let destinationIndex = overInfo?.index ?? 0;

        if (!destinationGroupKey) {
            const isDroppingOnGroup = Object.keys(newGroups).includes(overId);
            if(isDroppingOnGroup) {
              destinationGroupKey = overId;
              destinationIndex = newGroups[overId].members.length;
            } else {
              return currentGroups; // Invalid drop target
            }
        }
        
        const movedItems: EvaluationResult[] = [];
        sourceInfos.sort((a, b) => b.index - a.index).forEach(info => {
            const [item] = newGroups[info.groupKey].members.splice(info.index, 1);
            movedItems.unshift(item); // Keep original order
        });
        
        newGroups[destinationGroupKey!].members.splice(destinationIndex, 0, ...movedItems);

        return newGroups;
    });

    if (isBulkDrag) {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelection = (id: string, checked: boolean) => {
      setSelectedIds(prev => {
          const newSelection = new Set(prev);
          if (checked) newSelection.add(id);
          else newSelection.delete(id);
          return newSelection;
      });
  };

  const handleToggleGroupSelection = (group: {name: string, members: EvaluationResult[]}, checked: boolean) => {
    setSelectedIds(prev => {
        const newSelection = new Set(prev);
        const memberIds = group.members.map(m => m.id);
        if (checked) memberIds.forEach(id => newSelection.add(id));
        else memberIds.forEach(id => newSelection.delete(id));
        return newSelection;
    });
  };
  
  const handleStartEditing = (groupId: string, currentName: string) => { setEditingGroupId(groupId); setEditingGroupName(currentName); };
  const handleCancelEditing = () => { setEditingGroupId(null); setEditingGroupName(''); };
  const handleUpdateGroupName = () => {
    if (!editingGroupId || !editingGroupName.trim()) { handleCancelEditing(); return; }
    setGroups(prev => {
        const newGroups = {...prev};
        if (newGroups[editingGroupId]) newGroups[editingGroupId].name = editingGroupName;
        return newGroups;
    });
    handleCancelEditing();
  };

  const totalMyEmployees = myEmployees.length;
  const totalMyCompleted = myEmployees.filter(e => e.grade).length;
  const totalCompletionRate = totalMyEmployees > 0 ? (totalMyCompleted / totalMyEmployees) * 100 : 0;
  const gradeDistribution = Object.keys(gradingScale).map(grade => ({ name: grade, value: visibleEmployees.filter(g => g.grade === grade).length }));

  const handleDownloadExcel = () => {
    const dataToExport = visibleEmployees.map(r => ({ 'ID': r.uniqueId, '회사': r.company, '소속부서': r.department, '이름': r.name, '근무율': `${(r.workRate * 100).toFixed(1)}%`, '등급': r.grade, '점수': r.score, '비고': r.memo }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: dataToExport.length > 0 ? Object.keys(dataToExport[0]) : [] });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `평가결과-${activeTab}`);
    const fileName = `${selectedDate.year}.${String(selectedDate.month).padStart(2, '0')}_월성과데이터.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const allDepartments = React.useMemo(() => ['all', ...Array.from(new Set(visibleEmployees.map(e => e.department)))], [visibleEmployees]);
  const positionOptions = ['all', '팀장', '지점장', '센터장', '지부장', '직책 없음'];
  const validPositions = ['팀장', '지점장', '센터장', '지부장'];

  const filteredEmployeesForDialog = React.useMemo(() => {
    return visibleEmployees.filter(emp => {
      const depMatch = departmentFilter === 'all' || emp.department === departmentFilter;
      let posMatch = true;
      if (positionFilter !== 'all') {
        if (positionFilter === '직책 없음') posMatch = !validPositions.includes(emp.position);
        else posMatch = emp.position === positionFilter;
      }
      return depMatch && posMatch;
    });
  }, [visibleEmployees, departmentFilter, positionFilter]);

  const handleOpenAddGroupDialog = () => { setNewGroupName(''); setIdsForNewGroup(new Set()); setDepartmentFilter('all'); setPositionFilter('all'); setIsAddGroupDialogOpen(true); };
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) { toast({ variant: 'destructive', title: '오류', description: '그룹 이름을 입력해주세요.' }); return; }
    if (idsForNewGroup.size === 0) { toast({ variant: 'destructive', title: '오류', description: '그룹에 추가할 멤버를 한 명 이상 선택해주세요.' }); return; }
    if (Object.keys(groups).includes(newGroupName.trim())) { toast({ variant: 'destructive', title: '오류', description: '이미 존재하는 그룹 이름입니다.' }); return; }
    
    setGroups(prevGroups => {
        const newGroups = { ...prevGroups };
        
        // Remove members from their old groups
        idsForNewGroup.forEach(id => {
            for (const key in newGroups) {
                const index = newGroups[key].members.findIndex(m => m.id === id);
                if (index > -1) {
                    newGroups[key].members.splice(index, 1);
                }
            }
        });

        // Add new group
        newGroups[newGroupName.trim()] = {
            name: newGroupName.trim(),
            members: allResults.filter(r => idsForNewGroup.has(r.id)),
        };

        return newGroups;
    });

    handleSave();
    
    toast({ title: '성공', description: `'${newGroupName.trim()}' 그룹이 생성되었습니다.` });
    setIsAddGroupDialogOpen(false);
  };

  const handleBulkGradeApply = () => {
    if (!bulkGrade) return;

    setGroups(prevGroups => {
        const newGroups = JSON.parse(JSON.stringify(prevGroups));
        selectedIds.forEach(employeeId => {
            for (const key in newGroups) {
                const memberIndex = newGroups[key].members.findIndex((m: EvaluationResult) => m.id === employeeId);
                if (memberIndex !== -1) {
                    const score = bulkGrade ? gradingScale[bulkGrade]?.score || 0 : 0;
                    newGroups[key].members[memberIndex].grade = bulkGrade;
                    newGroups[key].members[memberIndex].score = score;
                    break; 
                }
            }
        });
        return newGroups;
    });
    
    toast({
        title: '일괄 적용 완료',
        description: `${selectedIds.size}명의 등급이 '${bulkGrade}'(으)로 변경되었습니다.`
    });
    
    setSelectedIds(new Set());
    setBulkGrade('');
  };
  
  const handleClearData = () => {
    onClearMyEvaluations(selectedDate.year, selectedDate.month);
    toast({ title: '삭제 완료', description: '담당하는 대상자의 평가 데이터가 삭제되었습니다.' });
    setIsClearConfirmOpen(false);
  };

  const activeEmployee = activeId ? myEmployees.find(emp => emp.id === activeId) : null;
  const isBulkDrag = activeId ? selectedIds.has(activeId) && selectedIds.size > 1 : false;
  const isBGroupView = activeTab === 'B. 별도평가';

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <Card className="bg-[hsl(30,30%,98%)] border-transparent shadow-none">
          <Collapsible open={isChartOpen} onOpenChange={setIsChartOpen}>
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 p-4">
              <div className="flex-1"><CardTitle>평가 진행 현황</CardTitle><CardDescription>{selectedDate.year}년 {selectedDate.month}월 성과평가 ({selectedDate.month === 12 ? 1 : selectedDate.month + 1}월 급여반영)</CardDescription></div>
              <div className="w-full sm:w-64 space-y-1">
                <div className='flex justify-between items-baseline'><h4 className="font-semibold text-sm">종합 진행률</h4><span className="font-bold text-base text-primary">{totalCompletionRate.toFixed(1)}%</span></div>
                <Progress value={totalCompletionRate} className="h-2" indicatorClassName="bg-primary" />
                <p className="text-xs text-muted-foreground text-right">{totalMyCompleted} / {totalMyEmployees} 명 완료</p>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className='p-4 pt-0 space-y-2'>
                <GradeHistogram 
                  data={gradeDistribution} 
                  gradingScale={gradingScale} 
                  highlightAll={true}
                  title={`${activeTab} 등급 분포`}
                  showFilters={true}
                  onFilterChange={(filter) => {
                    // 필터 변경 로직 구현
                    console.log('Filter changed:', filter);
                  }}
                  activeFilter="전체"
                />
              </CardContent>
            </CollapsibleContent>
            <CollapsibleTrigger asChild>
              <div className="border-t w-full text-center p-2 text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded-b-lg">
                <div className="flex items-center justify-center">
                  {isChartOpen ? "차트 숨기기" : "차트 보기"}
                  {isChartOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                </div>
              </div>
            </CollapsibleTrigger>
          </Collapsible>
        </Card>
        <Tabs defaultValue="A. 정규평가" onValueChange={(val) => setActiveTab(val as EvaluationGroupCategory | '전체')}>
          <TabsList className="w-full grid grid-cols-4">{Object.entries(categorizedEmployees).map(([category, employees]) => (<TabsTrigger key={category} value={category}>{category} ({employees?.length ?? 0})</TabsTrigger>))}</TabsList>
          <div className="flex justify-between my-4 gap-2">
            <Button onClick={handleOpenAddGroupDialog} variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" />새 그룹 추가</Button>
            <div className="flex-grow" />
            <Button onClick={handleDownloadExcel} variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />현재 탭 엑셀 다운로드</Button>
          </div>
          <TabsContent value={activeTab} className="pt-0">
            {Object.keys(groups).length > 0 ? Object.entries(groups).map(([groupKey, group]) => {
                const selectedInGroupCount = group.members.filter(m => selectedIds.has(m.id)).length;
                const allSelectedInGroup = group.members.length > 0 && selectedInGroupCount === group.members.length;
                const isIndeterminate = selectedInGroupCount > 0 && !allSelectedInGroup;
                const availableScore = group.members.length * 100;
                const usedScore = group.members.reduce((acc, curr) => acc + (curr.score || 0), 0);
                return (
                  <Card key={groupKey} className="mb-4">
                      <CardHeader className="py-3 px-4">
                        <div className="flex justify-between items-center">
                          <div className='flex items-center gap-2'>
                          {editingGroupId === groupKey ? (
                            <div className='flex items-center gap-2'>
                              <Input value={editingGroupName} onChange={(e) => setEditingGroupName(e.target.value)} onBlur={handleUpdateGroupName} onKeyDown={(e) => e.key === 'Enter' && handleUpdateGroupName()} autoFocus className="h-8"/>
                               <Button size="sm" onClick={handleUpdateGroupName}>저장</Button><Button size="sm" variant="ghost" onClick={handleCancelEditing}>취소</Button>
                            </div>
                           ) : (
                            <><CardTitle>{group.name}</CardTitle><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartEditing(groupKey, group.name)}><Edit className="h-4 w-4" /></Button></>
                           )}
                          </div>
                          <div className="text-sm"><span className="font-semibold">그룹 점수 현황: </span><span className={usedScore > availableScore ? 'text-destructive font-bold' : ''}>{usedScore}</span> / {availableScore} 점</div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <SortableContext items={group.members.map(m => m.id)} strategy={verticalListSortingStrategy}>
                          <Table>
                              <TableHeader><TableRow>
                                  <TableHead className="w-[80px] p-2 text-center"><Checkbox checked={isIndeterminate ? 'indeterminate' : allSelectedInGroup} onCheckedChange={(checked) => handleToggleGroupSelection(group, Boolean(checked))} aria-label={`Select all in ${group.name}`}/></TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center">{isBGroupView ? '구분' : 'ID'}</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center">회사</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center">소속부서</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center">이름</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center">직책</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center">성장레벨</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center">근무율</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center">등급</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2 text-center">점수</TableHead>
                                  <TableHead className="whitespace-nowrap w-[200px] py-2 px-2 text-center">비고</TableHead>
                              </TableRow></TableHeader>
                              <TableBody>{group.members.map(emp => (<DraggableTableRow key={emp.id} employee={emp} gradingScale={gradingScale} selected={selectedIds.has(emp.id)} onSelect={handleToggleSelection} onGradeChange={handleGradeChange} onMemoChange={handleMemoChange} onSave={handleSave} isBGroupView={isBGroupView} />))}</TableBody>
                          </Table>
                          </SortableContext>
                      </CardContent>
                  </Card>
                )
            }) : (<Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">이 분류에 해당하는 평가 대상자가 없습니다.</p></CardContent></Card>)}
          </TabsContent>
        </Tabs>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20">
          <Card className="flex items-center gap-4 p-3 shadow-lg animate-in fade-in-50 slide-in-from-bottom-5">
            <p className="text-sm font-medium">{selectedIds.size}명 선택됨</p>
            <Select value={bulkGrade || ''} onValueChange={(g) => setBulkGrade(g as Grade)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="등급 일괄 적용" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(gradingScale).map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleBulkGradeApply} disabled={!bulkGrade} size="sm">적용</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedIds(new Set())}>
              <X className="h-4 w-4" />
              <span className="sr-only">선택 해제</span>
            </Button>
          </Card>
        </div>
      )}

      <div className="flex justify-between mt-4">
        <Button onClick={() => setIsClearConfirmOpen(true)} variant="destructive" size="lg" disabled={myEmployees.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            평가이력 삭제
        </Button>
        <Button onClick={handleSave} size="lg"><Check className="mr-2"/> 모든 평가 저장</Button>
      </div>
      <DragOverlay>{activeId && activeEmployee ? (<Table className="bg-background shadow-lg relative"><TableBody><TableRow><TableCell className="p-1 w-[80px]"><div className='flex items-center gap-1'><Button variant="ghost" size="icon" className="cursor-grabbing h-8 w-8"><GripVertical className="h-4 w-4" /></Button><Checkbox checked={selectedIds.has(activeId)} readOnly /></div>{isBulkDrag && <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{selectedIds.size}</div>}</TableCell>
      {isBGroupView ? (
          <TableCell className="py-1 px-2">
              <div className="flex items-center justify-center">
                  {(() => {
                      const { style, className } = getBGroupIndicatorStyle(activeEmployee.workRate);
                      return (
                          <div className={cn("flex items-center justify-center rounded-full text-xs font-semibold w-24 h-6", className)} style={style}>
                              {activeEmployee.detailedGroup1}
                          </div>
                      );
                  })()}
              </div>
          </TableCell>
      ) : (
          <TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.uniqueId}</TableCell>
      )}
      <TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.company}</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.department}</TableCell><TableCell className="font-medium whitespace-nowrap py-1 px-2">{activeEmployee.name}</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.title}</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.growthLevel}</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{(activeEmployee.workRate * 100).toFixed(1)}%</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.grade}</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.score}</TableCell><TableCell className="py-1 px-2">{activeEmployee.memo}</TableCell></TableRow></TableBody></Table>) : null}</DragOverlay>
      <Dialog open={isAddGroupDialogOpen} onOpenChange={setIsAddGroupDialogOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>새 그룹 추가</DialogTitle><DialogDescription>새로운 평가 그룹을 만들고 멤버를 추가합니다.</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="group-name" className="text-right">그룹 이름</Label><Input id="group-name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="col-span-3"/></div><Card><CardHeader><CardTitle>멤버 선택</CardTitle><div className="flex gap-2 pt-2"><Select value={departmentFilter} onValueChange={setDepartmentFilter}><SelectTrigger><SelectValue placeholder="소속부서 필터" /></SelectTrigger><SelectContent>{allDepartments.map(dep => <SelectItem key={dep} value={dep}>{dep === 'all' ? '모든 부서' : dep}</SelectItem>)}</SelectContent></Select><Select value={positionFilter} onValueChange={setPositionFilter}><SelectTrigger><SelectValue placeholder="직책 필터" /></SelectTrigger><SelectContent>{positionOptions.map(pos => <SelectItem key={pos} value={pos}>{pos === 'all' ? '모든 직책' : pos}</SelectItem>)}</SelectContent></Select></div></CardHeader><CardContent><ScrollArea className="h-[300px] border rounded-md"><Table><TableHeader><TableRow><TableHead><Checkbox checked={filteredEmployeesForDialog.length > 0 && idsForNewGroup.size === filteredEmployeesForDialog.length} onCheckedChange={(checked) => { const allIds = new Set(filteredEmployeesForDialog.map(e => e.id)); if (checked) setIdsForNewGroup(new Set([...idsForNewGroup, ...allIds])); else setIdsForNewGroup(new Set([...idsForNewGroup].filter(id => !allIds.has(id)))); }}/></TableHead><TableHead>이름</TableHead><TableHead>소속부서</TableHead><TableHead>직책</TableHead><TableHead>현재 그룹</TableHead></TableRow></TableHeader><TableBody>{filteredEmployeesForDialog.map(emp => (<TableRow key={emp.id}><TableCell><Checkbox checked={idsForNewGroup.has(emp.id)} onCheckedChange={(checked) => { const newIds = new Set(idsForNewGroup); if (checked) newIds.add(emp.id); else newIds.delete(emp.id); setIdsForNewGroup(newIds); }}/></TableCell><TableCell>{emp.name}</TableCell><TableCell>{emp.department}</TableCell><TableCell>{emp.title}</TableCell><TableCell>{emp.detailedGroup2}</TableCell></TableRow>))}</TableBody></Table></ScrollArea></CardContent></Card></div><DialogFooter><Button variant="outline" onClick={() => setIsAddGroupDialogOpen(false)}>취소</Button><Button onClick={handleCreateGroup}>그룹 생성</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
        <AlertDialogContent2>
            <AlertDialogHeader2>
                <AlertDialogTitle2>평가 데이터 삭제</AlertDialogTitle2>
                <AlertDialogDescription2>
                    {selectedDate.year}년 {selectedDate.month}월의 담당 평가 대상자 {myEmployees.length}명의 평가 데이터를 모두 삭제(등급 및 비고 삭제)합니다. 진행하시겠습니까?
                </AlertDialogDescription2>
            </AlertDialogHeader2>
            <AlertDialogFooter2>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearData}>확인</AlertDialogAction>
            </AlertDialogFooter2>
        </AlertDialogContent2>
      </AlertDialog>
    </DndContext>
  );
}

const AllResultsView = ({ currentMonthResults, allEmployees, gradingScale, handleResultsUpdate }: {
  currentMonthResults: EvaluationResult[];
  allEmployees: Employee[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
}) => {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);
  const [companyFilter, setCompanyFilter] = React.useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = React.useState<string>('all');
  const [positionFilter, setPositionFilter] = React.useState<string>('all');

  const filteredResults = React.useMemo(() => {
    return currentMonthResults.filter(r => {
      const companyMatch = companyFilter === 'all' || r.company === companyFilter;
      const departmentMatch = departmentFilter === 'all' || r.department === departmentFilter;
      const positionMatch = positionFilter === 'all' || r.position === positionFilter;
      return companyMatch && departmentMatch && positionMatch;
    });
  }, [currentMonthResults, companyFilter, departmentFilter, positionFilter]);

  const sortedFilteredResults = React.useMemo(() => {
    let sortableItems = [...filteredResults];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === 'title') {
            const orderA = getPositionSortValue(a.title);
            const orderB = getPositionSortValue(b.title);
            if (orderA !== orderB) {
                return sortConfig.direction === 'ascending' ? orderA - orderB : orderB - orderA;
            }
        }
        
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredResults, sortConfig]);
  
  const allCompanies = React.useMemo(() => ['all', ...Array.from(new Set(currentMonthResults.map(e => e.company).filter(Boolean)))], [currentMonthResults]);
  const allDepartments = React.useMemo(() => ['all', ...Array.from(new Set(currentMonthResults.map(e => e.department).filter(Boolean)))].sort(), [currentMonthResults]);
  const allPositions = React.useMemo(() => ['all', ...Array.from(new Set(currentMonthResults.map(e => e.position).filter(Boolean)))].sort((a,b) => getPositionSortValue(a) - getPositionSortValue(b)), [currentMonthResults]);

  const requestSort = (key: keyof EvaluationResult) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof EvaluationResult) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <ArrowUp className="ml-2 h-4 w-4 text-primary" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(value);
  }
  
  const EvaluationGroupIcon = ({ group }: { group: string }) => {
    const groupChar = group.charAt(0);
    switch (groupChar) {
      case 'A':
        return <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-stone-700" style={{ backgroundColor: 'hsl(25, 15%, 75%)' }}>{groupChar}</div>;
      case 'B':
        return <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-stone-800" style={{ backgroundColor: 'hsl(25, 20%, 92%)' }}>{groupChar}</div>;
      case 'C':
        return <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-stone-400" style={{ backgroundColor: 'hsl(30, 20%, 98%)' }}>{groupChar}</div>;
      default:
        return <span>{group}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="회사 선택" /></SelectTrigger>
              <SelectContent>{allCompanies.map(c => <SelectItem key={c} value={c}>{c === 'all' ? '모든 회사' : c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="부서 선택" /></SelectTrigger>
              <SelectContent>{allDepartments.map(d => <SelectItem key={d} value={d}>{d === 'all' ? '모든 부서' : d}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="직책 선택" /></SelectTrigger>
              <SelectContent>{allPositions.map(p => <SelectItem key={p} value={p}>{p === 'all' ? '모든 직책' : p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="cursor-pointer whitespace-nowrap text-center" onClick={() => requestSort('company')}><div className="flex items-center justify-center">회사{getSortIcon('company')}</div></TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap text-center" onClick={() => requestSort('department')}><div className="flex items-center justify-center">소속부서{getSortIcon('department')}</div></TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap text-center" onClick={() => requestSort('name')}><div className="flex items-center justify-center">이름{getSortIcon('name')}</div></TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap text-center" onClick={() => requestSort('title')}><div className="flex items-center justify-center">직책{getSortIcon('title')}</div></TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap text-center" onClick={() => requestSort('evaluationGroup')}><div className="flex items-center justify-center">구분{getSortIcon('evaluationGroup')}</div></TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap text-center" onClick={() => requestSort('workRate')}><div className="flex items-center justify-center">근무율{getSortIcon('workRate')}</div></TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap text-center" onClick={() => requestSort('grade')}><div className="flex items-center justify-center">등급{getSortIcon('grade')}</div></TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap text-center" onClick={() => requestSort('score')}><div className="flex items-center justify-center">점수{getSortIcon('score')}</div></TableHead>
                <TableHead className="text-right cursor-pointer whitespace-nowrap text-center" onClick={() => requestSort('baseAmount')}><div className="flex items-center justify-center">기준금액{getSortIcon('baseAmount')}</div></TableHead>
                <TableHead className="text-right cursor-pointer whitespace-nowrap text-center" onClick={() => requestSort('finalAmount')}><div className="flex items-center justify-center">최종금액{getSortIcon('finalAmount')}</div></TableHead>
                <TableHead className="whitespace-nowrap text-center">비고</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {sortedFilteredResults.length > 0 ? sortedFilteredResults.map(result => (
                  <TableRow key={`${result.year}-${result.month}-${result.id}`}>
                    <TableCell className="text-center">{result.company}</TableCell>
                    <TableCell className="text-center">{result.department}</TableCell>
                    <TableCell className="text-center">{result.name}</TableCell>
                    <TableCell className="text-center">{result.title}</TableCell>
                    <TableCell className="text-center"><EvaluationGroupIcon group={result.evaluationGroup} /></TableCell>
                    <TableCell className="text-center">{(result.workRate * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-center">{result.grade}</TableCell>
                    <TableCell className="text-center">{result.score}</TableCell>
                    <TableCell className="text-right">{formatCurrency(result.baseAmount)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(result.finalAmount)}</TableCell>
                    <TableCell className="text-center">{result.memo || ''}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={11} className="text-center h-24">해당 조건의 결과가 없습니다.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface AssignmentManagementViewProps {
  myEmployees: EvaluationResult[];
  currentMonthResults: EvaluationResult[];
  allUsers: User[];
  handleEvaluatorAssignmentChange: (updatedUserId: string, newEvaluatorId: string) => void;
  evaluatorId: string;
  evaluatorName: string;
}


const AssignmentManagementView = ({ myEmployees, currentMonthResults, allUsers, handleEvaluatorAssignmentChange, evaluatorId, evaluatorName }: AssignmentManagementViewProps) => {
  const { toast } = useToast();
  
  const [company, setCompany] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [position, setPosition] = React.useState('');

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);
  const [groupToChange, setGroupToChange] = React.useState<{
    company: string;
    department: string;
    position: string;
    currentEvaluatorName: string;
    currentEvaluatorUniqueId: string;
    memberCount: number;
  } | null>(null);

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [selectedGroupDetails, setSelectedGroupDetails] = React.useState<{
    group: { company: string; department: string; position: string; count: number };
    members: EvaluationResult[];
  } | null>(null);

  const { addNotification } = useNotifications();

  const allCompanies = React.useMemo(() => [...new Set(currentMonthResults.map(e => e.company).filter(Boolean))], [currentMonthResults]);
  const allPositions = React.useMemo(() => [...new Set(currentMonthResults.map(e => e.position).filter(Boolean))].sort((a,b) => getPositionSortValue(a) - getPositionSortValue(b)), [currentMonthResults]);

  const managedGroups = React.useMemo(() => {
    const groups: Record<string, { company: string; department: string; position: string; count: number }> = {};
    myEmployees.forEach(emp => {
      const key = `${emp.company}|${emp.department}|${emp.position}`;
      if (!groups[key]) {
        groups[key] = { company: emp.company, department: emp.department, position: emp.position, count: 0 };
      }
      groups[key].count++;
    });
    return Object.entries(groups)
      .map(([key, value]) => ({ ...value, id: key }))
      .sort((a,b) => b.count - a.count);
  }, [myEmployees]);

  const handleShowDetails = (group: { company: string; department: string; position: string; count: number; }) => {
    const members = currentMonthResults.filter(e => 
        e.company === group.company && e.department === group.department && e.position === group.position
    );
    setSelectedGroupDetails({ group, members });
    setIsDetailsDialogOpen(true);
  };

  const handleInquire = () => {
    if (!company || !department.trim() || !position) {
      toast({ variant: 'destructive', title: '오류', description: '회사, 부서, 직책을 모두 입력/선택해주세요.' });
      return;
    }
    const trimmedDepartment = department.trim();

    const targetEmployees = currentMonthResults.filter(e => 
      e.company === company && e.department === trimmedDepartment && e.position === position
    );

    if (targetEmployees.length === 0) {
      toast({ title: '정보', description: '해당 조건의 소속 그룹이 존재하지 않습니다.' });
      return;
    }
    
    const firstMember = targetEmployees[0];
    const currentEvaluator = allUsers.find(u => u.uniqueId === firstMember.evaluatorId);
    
    setGroupToChange({
      company,
      department: trimmedDepartment,
      position,
      currentEvaluatorName: currentEvaluator?.name || '미지정',
      currentEvaluatorUniqueId: currentEvaluator?.uniqueId || 'N/A',
      memberCount: targetEmployees.length,
    });
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmChange = () => {
    if (!groupToChange) return;
    
    if (groupToChange.currentEvaluatorUniqueId === evaluatorId) {
        toast({ title: '정보', description: '이미 담당하고 있는 소속입니다.' });
        setIsConfirmDialogOpen(false);
        setGroupToChange(null);
        return;
    }

    const targetEmployees = currentMonthResults.filter(res => 
      res.company === groupToChange.company && 
      res.department === groupToChange.department && 
      res.position === groupToChange.position
    );

    targetEmployees.forEach(emp => {
      const user = allUsers.find(u => u.uniqueId === emp.uniqueId);
      if (user) {
        handleEvaluatorAssignmentChange(user.id, evaluatorId);
      }
    });
    
    addNotification({ recipientId: '1911042', message: `${evaluatorName} 평가자가 ${groupToChange.department} 소속의 담당자가 되었습니다.` });
    addNotification({ recipientId: evaluatorId, message: `이제 ${groupToChange.department} 소속의 평가를 담당합니다.` });

    toast({ title: '변경 완료', description: `'${groupToChange.department}' 소속의 담당자가 성공적으로 변경되었습니다.` });
    
    setIsConfirmDialogOpen(false);
    setGroupToChange(null);
    setCompany('');
    setDepartment('');
    setPosition('');
  };

  const handleReleaseGroup = (groupKey: string) => {
    const [company, department, position] = groupKey.split('|');
    const targetEmployees = myEmployees.filter(res => 
        res.company === company && 
        res.department === department && 
        res.position === position
    );

    targetEmployees.forEach(emp => {
      const user = allUsers.find(u => u.uniqueId === emp.uniqueId);
      if (user) {
        handleEvaluatorAssignmentChange(user.id, '');
      }
    });

    toast({ title: '담당 해제 완료', description: `'${department}' 소속을 더 이상 담당하지 않습니다.` });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>담당 소속 추가/변경</CardTitle>
          <CardDescription>담당을 원하는 소속 그룹의 정보를 입력하고 조회하여 담당자를 변경할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-2">
            <div className="grid flex-1 gap-1.5 w-full"><Label htmlFor="change-company">회사</Label><Select value={company} onValueChange={setCompany}><SelectTrigger id="change-company"><SelectValue placeholder="회사를 선택하세요" /></SelectTrigger><SelectContent>{allCompanies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid flex-1 gap-1.5 w-full"><Label htmlFor="change-department">부서명</Label><Input id="change-department" placeholder="부서명을 정확히 입력하세요" value={department} onChange={(e) => setDepartment(e.target.value)} /></div>
            <div className="grid flex-1 gap-1.5 w-full"><Label htmlFor="change-position">직책</Label><Select value={position} onValueChange={setPosition}><SelectTrigger id="change-position"><SelectValue placeholder="직책을 선택하세요" /></SelectTrigger><SelectContent>{allPositions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <Button onClick={handleInquire} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" />조회 및 변경 요청</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>담당 소속</CardTitle><CardDescription>현재 담당하고 있는 소속 그룹 목록입니다.</CardDescription></CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead className="text-center">회사</TableHead>
                    <TableHead className="text-center">부서</TableHead>
                    <TableHead className="text-center">직책</TableHead>
                    <TableHead className="text-center">담당 인원</TableHead>
                    <TableHead className="text-center">담당 해제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managedGroups.length > 0 ? (
                  managedGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="text-center">{group.company}</TableCell>
                      <TableCell className="text-center">{group.department}</TableCell>
                      <TableCell className="text-center">{group.position}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span>{group.count}명</span>
                          <Button variant="outline" size="sm" className="h-7 px-2 py-1" onClick={() => handleShowDetails(group)}>상세보기</Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleReleaseGroup(group.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : <TableRow><TableCell colSpan={5} className="text-center h-24">현재 담당하는 소속이 없습니다.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>담당자 변경 확인</DialogTitle><DialogDescription>선택한 소속 그룹의 담당자를 변경하시겠습니까?</DialogDescription></DialogHeader>
          {groupToChange && (
            <div className="space-y-4 py-4">
              <p className="text-sm"><span className="font-semibold text-muted-foreground">소속:</span> {groupToChange.company} / {groupToChange.department} / {groupToChange.position}</p>
              <p className="text-sm"><span className="font-semibold text-muted-foreground">인원:</span> {groupToChange.memberCount}명</p>
              <p className="text-sm"><span className="font-semibold text-muted-foreground">현재 담당자:</span> {groupToChange.currentEvaluatorName} (ID: {groupToChange.currentEvaluatorUniqueId})</p>
              <p className="text-sm pt-4 font-bold text-primary">이 그룹의 담당자를 현재 로그인한 평가자({evaluatorName})님으로 변경합니다.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>아니오</Button>
            <Button onClick={handleConfirmChange}>예, 변경합니다</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>담당 인원 상세 정보</DialogTitle>
                {selectedGroupDetails && (
                <DialogDescription>
                    {selectedGroupDetails.group.company} / {selectedGroupDetails.group.department} / {selectedGroupDetails.group.position} 그룹의 구성원 목록입니다.
                </DialogDescription>
                )}
            </DialogHeader>
            {selectedGroupDetails && (
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">회사</TableHead>
                                <TableHead className="text-center">부서</TableHead>
                                <TableHead className="text-center">ID</TableHead>
                                <TableHead className="text-center">이름</TableHead>
                                <TableHead className="text-center">직책</TableHead>
                                <TableHead className="text-center">성장레벨</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedGroupDetails.members.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell className="text-center">{member.company}</TableCell>
                                    <TableCell className="text-center">{member.department}</TableCell>
                                    <TableCell className="text-center">{member.uniqueId}</TableCell>
                                    <TableCell className="text-center">{member.name}</TableCell>
                                    <TableCell className="text-center">{member.title}</TableCell>
                                    <TableCell className="text-center">{member.growthLevel}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
            <DialogFooter>
                <Button onClick={() => setIsDetailsDialogOpen(false)}>닫기</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default function EvaluatorDashboard({ allResults, currentMonthResults, gradingScale, selectedDate, setSelectedDate, handleEvaluatorAssignmentChange, evaluatorUser, activeView, onClearMyEvaluations, workRateDetails, workRateInputs, holidays, allUsers, attendanceTypes, onApprovalAction, notifications, addNotification, deleteNotification, approvals, handleResultsUpdate }: EvaluatorDashboardProps) {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [effectiveUser, setEffectiveUser] = React.useState<User | null>(null);
  const [approvalDetailModalOpen, setApprovalDetailModalOpen] = React.useState(false);
  const [selectedApproval, setSelectedApproval] = React.useState<Approval | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  
  React.useEffect(() => {
    if (evaluatorUser) {
        setEffectiveUser(evaluatorUser);
    } else {
        setEffectiveUser(authUser);
    }
  }, [evaluatorUser, authUser]);
  
  const myEmployees = React.useMemo(() => {
    if (!effectiveUser) return [];
    return currentMonthResults.filter(r => r.evaluatorId === effectiveUser.uniqueId);
  }, [effectiveUser, currentMonthResults]);
  
  const myAllTimeResults = React.useMemo(() => {
    if (!effectiveUser) return [];
    return allResults.filter(r => r.evaluatorId === effectiveUser.uniqueId);
  }, [effectiveUser, allResults]);
  
  const myManagedWorkRateDetails: WorkRateDetailsResult = React.useMemo(() => {
    if (!effectiveUser) return { shortenedWorkDetails: [], dailyAttendanceDetails: [] };
    const myManagedEmployeeIds = new Set(myEmployees.map(e => e.uniqueId));
    return {
      shortenedWorkDetails: workRateDetails.shortenedWorkDetails.filter(d => myManagedEmployeeIds.has(d.uniqueId)),
      dailyAttendanceDetails: workRateDetails.dailyAttendanceDetails.filter(d => myManagedEmployeeIds.has(d.uniqueId)),
    }
  }, [effectiveUser, myEmployees, workRateDetails]);
  
    const formatTimestamp = (isoString: string | null) => {
        if (!isoString) return '-';
        return format(new Date(isoString), 'yyyy.MM.dd HH:mm');
    };
    
    const formatTimestampShort = (isoString: string | null) => {
        if (!isoString) return '-';
        return format(new Date(isoString), 'MM.dd HH:mm');
    };

    const StatusBadge = ({ status }: { status: ApprovalStatus }) => {
        const styles: Record<ApprovalStatus, {bgColor: string, textColor: string}> = {
          '결재중': { bgColor: 'hsl(30, 20%, 98%)', textColor: 'hsl(var(--muted-foreground))' }, 
          '현업승인': { bgColor: 'hsl(25, 20%, 92%)', textColor: 'hsl(var(--secondary-foreground))' },
          '최종승인': { bgColor: 'hsl(140, 60%, 92%)', textColor: 'hsl(140, 80%, 30%)' }, 
          '반려': { bgColor: 'hsl(39, 94%, 94%)', textColor: 'hsl(24, 95%, 53%)'},
        }

        return (
          <div className="flex items-center justify-center">
            <div className={cn("flex items-center justify-center rounded-full text-xs font-semibold w-20 h-6")} style={{ backgroundColor: styles[status].bgColor, color: styles[status].textColor }}>
                {status}
            </div>
          </div>
        );
    };
    
    const handleApprovalModal = (approval: Approval) => {
        setSelectedApproval(approval);
        setRejectionReason('');
        setApprovalDetailModalOpen(true);
    };

    const handleApprovalDecision = (decision: 'approved' | 'rejected') => {
        if (!selectedApproval) return;

        if (decision === 'rejected' && !rejectionReason.trim()) {
            toast({ variant: 'destructive', title: '오류', description: '반려 사유를 입력해주세요.' });
            return;
        }
        
        let newStatus = selectedApproval.status;
        if (decision === 'approved') {
            newStatus = '현업승인';
        } else {
            newStatus = '반려';
        }
        
        onApprovalAction({ 
            ...selectedApproval,
            rejectionReason,
            status: newStatus,
        });
        
        toast({ title: '처리 완료', description: `결재 요청이 ${decision === 'approved' ? '승인' : '반려'}되었습니다.` });
        setApprovalDetailModalOpen(false);
        setSelectedApproval(null);
    };

    const renderApprovalData = (approval: Approval) => {
        const { payload } = approval;
        const data = payload.data;

        const commonFields = [
            { label: '대상자', value: `${data.name} (${data.uniqueId})` },
        ];

        const typeSpecificFields = payload.dataType === 'shortenedWorkHours' ? [
            { label: '유형', value: `단축근로 (${data.type})` },
            { label: '사용기간', value: `${data.startDate} ~ ${data.endDate}` },
            { label: '근무시간', value: `${data.startTime} ~ ${data.endTime}` },
        ] : [
            { label: '유형', value: `일근태 (${data.type})` },
            { label: '사용일자', value: data.date },
        ];

        return (
             <div className="text-sm space-y-4">
                {[...commonFields, ...typeSpecificFields].map(field => (
                     <div key={field.label} className="grid grid-cols-4 items-center">
                        <span className="font-semibold col-span-1">{field.label}</span>
                        <span className="col-span-3">{field.value}</span>
                    </div>
                ))}
            </div>
        );
    }

    const teamApproverInfo = React.useMemo(() => {
        if (!selectedApproval) return null;
        
        const approver = allUsers.find(u => u.uniqueId === selectedApproval.approverTeamId);
        return approver ? `${approver.name} (${approver.uniqueId})` : `미지정 (${selectedApproval.approverTeamId})`;
    }, [selectedApproval, allUsers]);


  if (!effectiveUser) return <div className="p-4 md:p-6 lg:p-8">로딩중...</div>;

  const renderContent = () => {
    switch(activeView) {
      case 'evaluation-input':
        return <EvaluationInputView 
                  myEmployees={myEmployees} 
                  gradingScale={gradingScale}
                  selectedDate={selectedDate}
                  handleResultsUpdate={() => {}}
                  allResults={allResults}
                  onClearMyEvaluations={(year, month) => onClearMyEvaluations(year, month, effectiveUser!.uniqueId)}
                />;
      case 'all-results':
        return <AllResultsView currentMonthResults={currentMonthResults} allEmployees={allUsers} gradingScale={gradingScale} handleResultsUpdate={() => {}} />;
      case 'assignment-management':
        return <AssignmentManagementView 
                 myEmployees={myEmployees} 
                 currentMonthResults={currentMonthResults}
                 allUsers={allUsers}
                 handleEvaluatorAssignmentChange={handleEvaluatorAssignmentChange}
                 evaluatorId={effectiveUser.uniqueId}
                 evaluatorName={effectiveUser.name}
               />;
      case 'work-rate-view':
          return <WorkRateManagement 
            results={myEmployees} 
            workRateInputs={workRateInputs} 
            selectedDate={selectedDate} 
            holidays={holidays} 
            attendanceTypes={attendanceTypes}
            gradingScale={gradingScale}
            handleResultsUpdate={handleResultsUpdate}
            addNotification={addNotification}
          />;
      case 'shortened-work-details':
          return <WorkRateDetails type="shortenedWork" data={myManagedWorkRateDetails.shortenedWorkDetails} selectedDate={selectedDate} allEmployees={allUsers} attendanceTypes={attendanceTypes} onDataChange={()=>{}} />;
      case 'daily-attendance-details':
          return <WorkRateDetails type="dailyAttendance" data={myManagedWorkRateDetails.dailyAttendanceDetails} selectedDate={selectedDate} allEmployees={allUsers} attendanceTypes={attendanceTypes} onDataChange={()=>{}} />;
      case 'approvals': {
            const myApprovals = approvals.filter(a => a.approverTeamId === effectiveUser.uniqueId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return (
              <Card>
                <CardHeader>
                  <CardTitle>결재함</CardTitle>
                  <CardDescription>현업 리더로서 결재를 기다리는 요청 목록입니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  {myApprovals.length > 0 ? (
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead className="text-center">요청일</TableHead>
                          <TableHead className="text-center">대상자 (ID)</TableHead>
                          <TableHead className="text-center">현업 결재자</TableHead>
                          <TableHead className="text-center">요청내용</TableHead>
                          <TableHead className="text-center">현업 결재</TableHead>
                          <TableHead className="text-center">인사부 결재</TableHead>
                          <TableHead className="text-center">현업 승인일</TableHead>
                          <TableHead className="text-center">최종 승인일</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {myApprovals.map(approval => {
                              const approver = allUsers.find(u => u.uniqueId === approval.approverTeamId);
                              return (
                                <TableRow key={approval.id}>
                                  <TableCell className="text-center text-muted-foreground">{formatTimestamp(approval.date)}</TableCell>
                                  <TableCell className="text-center">{`${approval.payload.data.name} (${approval.payload.data.uniqueId})`}</TableCell>
                                  <TableCell className="text-center">{approver ? `${approver.name} (${approver.uniqueId})` : '미지정'}</TableCell>
                                  <TableCell className="text-center">
                                     <Button variant="link" className="underline text-foreground" onClick={() => handleApprovalModal(approval)}>
                                      {approval.payload.dataType === 'shortenedWorkHours' ? '단축근로' : '일근태'} 데이터 {approval.payload.action === 'add' ? '추가' : '변경'}
                                     </Button>
                                  </TableCell>
                                  <TableCell className="text-center"><StatusBadge status={approval.status} /></TableCell>
                                  <TableCell className="text-center"><StatusBadge status={approval.statusHR} /></TableCell>
                                  <TableCell className="text-center text-muted-foreground">{formatTimestampShort(approval.approvedAtTeam)}</TableCell>
                                  <TableCell className="text-center text-muted-foreground">{formatTimestampShort(approval.approvedAtHR)}</TableCell>
                                </TableRow>
                              )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center h-40 text-center">
                        <Inbox className="h-10 w-10 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">새로운 결재가 없습니다.</p>
                   </div>
                  )}
                </CardContent>
              </Card>
            )
        }
      case 'notifications':
          return <EvaluatorNotifications notifications={notifications} deleteNotification={deleteNotification} />;
      default:
        return <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Inbox className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">새로운 알림이 없습니다.</p>
               </div>;
    }
  }

  return (
     <div className="p-4 md:p-6 lg:p-8">
      {renderContent()}
      <Dialog open={approvalDetailModalOpen} onOpenChange={setApprovalDetailModalOpen}>
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>결재 상세 정보</DialogTitle>
            </DialogHeader>
            {selectedApproval && (
                <div className="space-y-4">
                    <div className='space-y-1 text-sm text-left'>
                        <p><strong>요청자:</strong> {selectedApproval.requesterName} ({selectedApproval.requesterId})</p>
                        <p><strong>요청일시:</strong> {formatTimestamp(selectedApproval.date)}</p>
                        <p><strong>요청내용:</strong> {selectedApproval.payload.dataType === 'shortenedWorkHours' ? '단축근로' : '일근태'} 데이터 {selectedApproval.payload.action === 'add' ? '추가' : '변경'}</p>
                    </div>
                    <Separator/>
                    <div className="rounded-md border bg-muted p-4">
                        {renderApprovalData(selectedApproval)}
                    </div>
                    {selectedApproval.status === '반려' && selectedApproval.rejectionReason && (
                        <div>
                            <Label htmlFor="rejectionReason" className="text-destructive mb-1 block">현업 반려 사유</Label>
                            <p className="text-sm text-destructive p-2 border border-destructive rounded-md">{selectedApproval.rejectionReason}</p>
                        </div>
                    )}
                    {selectedApproval.statusHR === '반려' && selectedApproval.rejectionReason && (
                        <div>
                            <Label htmlFor="rejectionReason" className="text-destructive mb-1 block">인사부 반려 사유</Label>
                            <p className="text-sm text-destructive p-2 border border-destructive rounded-md">{selectedApproval.rejectionReason}</p>
                        </div>
                    )}
                    {(selectedApproval.status === '결재중') && (
                         <div>
                            <Label htmlFor="rejectionReason" className="mb-1 block">반려 사유 (반려 시 필수)</Label>
                            <Textarea id="rejectionReason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                        </div>
                    )}
                </div>
            )}
            <DialogFooter className="sm:justify-between items-center pt-2">
                 <div className="text-sm text-muted-foreground">
                    {teamApproverInfo && <p>현업 결재자: <span className="font-semibold text-foreground">{teamApproverInfo}</span></p>}
                </div>
                {selectedApproval && selectedApproval.status === '결재중' ? (
                  <div className="flex gap-2">
                      <Button variant="destructive" onClick={() => handleApprovalDecision('rejected')}>반려</Button>
                      <Button onClick={() => handleApprovalDecision('approved')}>승인</Button>
                  </div>
                ) : (
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => setApprovalDetailModalOpen(false)}>닫기</Button>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
