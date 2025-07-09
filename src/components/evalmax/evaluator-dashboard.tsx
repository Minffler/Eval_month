'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { EvaluationResult, Grade, GradeInfo, EvaluationGroupCategory, User, EvaluatorView } from '@/lib/types';
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
  arrayMove,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
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
import { Check, Download, ArrowUpDown, ArrowUp, ArrowDown, Edit, GripVertical, ChevronUp, ChevronDown, PlusCircle, Save, X } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MonthSelector } from './month-selector';
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
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

interface EvaluatorDashboardProps {
  allResults: EvaluationResult[];
  currentMonthResults: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  selectedDate: { year: number; month: number };
  setSelectedDate: (date: { year: number; month: number }) => void;
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
  handleDepartmentNameUpdate?: (oldName: string, newName: string, year: number, month: number) => void;
  evaluatorUser?: User;
  activeView: EvaluatorView;
}

type SortConfig = {
  key: keyof EvaluationResult;
  direction: 'ascending' | 'descending';
} | null;

type Groups = Record<string, { name: string; members: EvaluationResult[] }>;


// Helper component for a single draggable table row
const DraggableTableRow = ({ employee, gradingScale, selected, onSelect, onGradeChange, onMemoChange, onSave, activeId }: {
    employee: EvaluationResult,
    gradingScale: Record<NonNullable<Grade>, GradeInfo>,
    selected: boolean,
    onSelect: (id: string, checked: boolean) => void,
    onGradeChange: (id: string, grade: Grade) => void,
    onMemoChange: (id: string, memo: string) => void,
    onSave: () => void,
    activeId: string | null;
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
                  <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => onSelect(employee.id, Boolean(checked))}
                      aria-label={`Select ${employee.name}`}
                  />
                  <Button variant="ghost" size="icon" className="cursor-grab h-8 w-8" {...attributes} {...listeners}>
                      <GripVertical className="h-4 w-4" />
                  </Button>
                </div>
            </TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2">{employee.uniqueId}</TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2">{employee.company}</TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2">{employee.department}</TableCell>
            <TableCell className="font-medium whitespace-nowrap py-1 px-2">{employee.name}</TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2">{employee.title}</TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2">{employee.growthLevel}</TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2">{(employee.workRate * 100).toFixed(1)}%</TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2">
                <Select value={employee.grade || ''} onValueChange={(g: Grade) => onGradeChange(employee.id, g)}>
                    <SelectTrigger className="w-[80px] h-8">
                        <SelectValue placeholder="등급 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.keys(gradingScale).map(grade => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2">{employee.score}</TableCell>
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


const EvaluationInputView = ({ myEmployees, gradingScale, selectedDate, setSelectedDate, handleResultsUpdate, allResults }: {
  myEmployees: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  selectedDate: { year: number; month: number };
  setSelectedDate: (date: { year: number; month: number }) => void;
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
  allResults: EvaluationResult[];
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<EvaluationGroupCategory>('전체');
  const [groups, setGroups] = React.useState<Groups>({});
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = React.useState('');
  const [isChartOpen, setIsChartOpen] = React.useState(false);
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState('');
  const [idsForNewGroup, setIdsForNewGroup] = React.useState<Set<string>>(new Set());
  const [departmentFilter, setDepartmentFilter] = React.useState('all');
  const [positionFilter, setPositionFilter] = React.useState('all');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const categorizedEmployees = React.useMemo(() => {
    const categories: Record<EvaluationGroupCategory, EvaluationResult[]> = {
      '전체': myEmployees,
      '70% 이상': myEmployees.filter(emp => emp.workRate >= 0.7 && emp.group !== '별도평가' && emp.group !== '미평가'),
      '별도평가': myEmployees.filter(emp => emp.group === '별도평가'),
      '미평가': myEmployees.filter(emp => emp.group === '미평가'),
    };
    return categories;
  }, [myEmployees]);

  const visibleEmployees = categorizedEmployees[activeTab];

  React.useEffect(() => {
    const groupWithinCategory = (employees: EvaluationResult[]): Groups => {
        return employees.reduce((acc, emp) => {
            const groupKey = emp.detailedGroup2 || '기타';
            if (!acc[groupKey]) {
                acc[groupKey] = { name: groupKey, members: [] };
            }
            acc[groupKey].members.push(emp);
            return acc;
        }, {} as Groups);
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
    const updatedResults = flattenGroupsToResults();
    handleResultsUpdate(updatedResults);
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
    const dataToExport = visibleEmployees.map(r => ({ '고유사번': r.uniqueId, '회사': r.company, '소속부서': r.department, '이름': r.name, '근무율': `${(r.workRate * 100).toFixed(1)}%`, '등급': r.grade, '점수': r.score, '비고': r.memo }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `평가결과-${activeTab}`);
    XLSX.writeFile(workbook, `PL월성과평가_${selectedDate.year}_${selectedDate.month}_평가자결과.xlsx`);
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
    const finalUpdatedResults = allResults.map(res => idsForNewGroup.has(res.id) ? { ...res, detailedGroup2: newGroupName.trim() } : res);
    handleResultsUpdate(finalUpdatedResults);
    toast({ title: '성공', description: `'${newGroupName.trim()}' 그룹이 생성되었습니다.` });
    setIsAddGroupDialogOpen(false);
  };
  
  const activeEmployee = activeId ? myEmployees.find(emp => emp.id === activeId) : null;
  const isBulkDrag = activeId ? selectedIds.has(activeId) && selectedIds.size > 1 : false;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">평가 입력</h2>
          <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>
        <Card>
          <Collapsible open={isChartOpen} onOpenChange={setIsChartOpen}>
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 p-4">
              <div className="flex-1"><CardTitle>평가 진행 현황</CardTitle><CardDescription>{selectedDate.year}년 {selectedDate.month}월 성과평가</CardDescription></div>
              <div className="w-full sm:w-64 space-y-1">
                <div className='flex justify-between items-baseline'><h4 className="font-semibold text-sm">종합 진행률</h4><span className="font-bold text-base text-primary">{totalCompletionRate.toFixed(1)}%</span></div>
                <Progress value={totalCompletionRate} className="h-2" /><p className="text-xs text-muted-foreground text-right">{totalMyCompleted} / {totalMyEmployees} 명 완료</p>
              </div>
            </CardHeader>
            <CollapsibleContent><CardContent className='p-4 pt-0 space-y-2'><h3 className="font-semibold">{`${activeTab} 등급 분포`}</h3><div className="border rounded-lg p-2"><GradeHistogram data={gradeDistribution} gradingScale={gradingScale} /></div></CardContent></CollapsibleContent>
            <CollapsibleTrigger asChild><div className="border-t w-full text-center p-2 text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded-b-lg"><div className="flex items-center justify-center">{isChartOpen ? "차트 숨기기" : "차트 보기"}{isChartOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}</div></div></CollapsibleTrigger>
          </Collapsible>
        </Card>
        <Tabs defaultValue="전체" onValueChange={(val) => setActiveTab(val as EvaluationGroupCategory)}>
          <TabsList className="w-full grid grid-cols-4">{Object.keys(categorizedEmployees).map(category => (<TabsTrigger key={category} value={category}>{category} ({categorizedEmployees[category as EvaluationGroupCategory].length})</TabsTrigger>))}</TabsList>
          <div className="flex justify-end my-4 gap-2">
            <Button onClick={handleOpenAddGroupDialog} variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" />새 그룹 추가</Button>
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
                      <CardContent className="overflow-x-auto p-0">
                        <SortableContext items={group.members.map(m => m.id)} strategy={verticalListSortingStrategy}>
                          <Table>
                              <TableHeader><TableRow>
                                  <TableHead className="w-[80px] p-2"><Checkbox checked={isIndeterminate ? 'indeterminate' : allSelectedInGroup} onCheckedChange={(checked) => handleToggleGroupSelection(group, Boolean(checked))} aria-label={`Select all in ${group.name}`}/></TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2">고유사번</TableHead><TableHead className="whitespace-nowrap py-2 px-2">회사</TableHead><TableHead className="whitespace-nowrap py-2 px-2">소속부서</TableHead><TableHead className="whitespace-nowrap py-2 px-2">이름</TableHead><TableHead className="whitespace-nowrap py-2 px-2">직책</TableHead><TableHead className="whitespace-nowrap py-2 px-2">성장레벨</TableHead><TableHead className="whitespace-nowrap py-2 px-2">근무율</TableHead><TableHead className="whitespace-nowrap py-2 px-2">등급</TableHead><TableHead className="whitespace-nowrap py-2 px-2">점수</TableHead><TableHead className="whitespace-nowrap w-[200px] py-2 px-2">비고</TableHead>
                              </TableRow></TableHeader>
                              <TableBody>{group.members.map(emp => (<DraggableTableRow key={emp.id} employee={emp} gradingScale={gradingScale} selected={selectedIds.has(emp.id)} onSelect={handleToggleSelection} onGradeChange={handleGradeChange} onMemoChange={handleMemoChange} onSave={handleSave} activeId={activeId} />))}</TableBody>
                          </Table>
                          </SortableContext>
                      </CardContent>
                  </Card>
                )
            }) : (<Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">이 분류에 해당하는 평가 대상자가 없습니다.</p></CardContent></Card>)}
          </TabsContent>
        </Tabs>
        <div className="flex justify-end mt-4"><Button onClick={handleSave} size="lg"><Check className="mr-2"/> 모든 평가 저장</Button></div>
      </div>
      <DragOverlay>{activeId && activeEmployee ? (<Table className="bg-background shadow-lg relative"><TableBody><TableRow><TableCell className="p-1 w-[80px]"><div className='flex items-center gap-1'><Checkbox checked={selectedIds.has(activeId)} readOnly /><Button variant="ghost" size="icon" className="cursor-grabbing h-8 w-8"><GripVertical className="h-4 w-4" /></Button></div>{isBulkDrag && <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{selectedIds.size}</div>}</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.uniqueId}</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.company}</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.department}</TableCell><TableCell className="font-medium whitespace-nowrap py-1 px-2">{activeEmployee.name}</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.title}</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.growthLevel}</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{(activeEmployee.workRate * 100).toFixed(1)}%</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.grade}</TableCell><TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.score}</TableCell><TableCell className="py-1 px-2">{activeEmployee.memo}</TableCell></TableRow></TableBody></Table>) : null}</DragOverlay>
      <Dialog open={isAddGroupDialogOpen} onOpenChange={setIsAddGroupDialogOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>새 그룹 추가</DialogTitle><DialogDescription>새로운 평가 그룹을 만들고 멤버를 추가합니다.</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="group-name" className="text-right">그룹 이름</Label><Input id="group-name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="col-span-3"/></div><Card><CardHeader><CardTitle>멤버 선택</CardTitle><div className="flex gap-2 pt-2"><Select value={departmentFilter} onValueChange={setDepartmentFilter}><SelectTrigger><SelectValue placeholder="소속부서 필터" /></SelectTrigger><SelectContent>{allDepartments.map(dep => <SelectItem key={dep} value={dep}>{dep === 'all' ? '모든 부서' : dep}</SelectItem>)}</SelectContent></Select><Select value={positionFilter} onValueChange={setPositionFilter}><SelectTrigger><SelectValue placeholder="직책 필터" /></SelectTrigger><SelectContent>{positionOptions.map(pos => <SelectItem key={pos} value={pos}>{pos === 'all' ? '모든 직책' : pos}</SelectItem>)}</SelectContent></Select></div></CardHeader><CardContent><ScrollArea className="h-[300px] border rounded-md"><Table><TableHeader><TableRow><TableHead><Checkbox checked={filteredEmployeesForDialog.length > 0 && idsForNewGroup.size === filteredEmployeesForDialog.length} onCheckedChange={(checked) => { const allIds = new Set(filteredEmployeesForDialog.map(e => e.id)); if (checked) setIdsForNewGroup(new Set([...idsForNewGroup, ...allIds])); else setIdsForNewGroup(new Set([...idsForNewGroup].filter(id => !allIds.has(id)))); }}/></TableHead><TableHead>이름</TableHead><TableHead>소속부서</TableHead><TableHead>직책</TableHead><TableHead>현재 그룹</TableHead></TableRow></TableHeader><TableBody>{filteredEmployeesForDialog.map(emp => (<TableRow key={emp.id}><TableCell><Checkbox checked={idsForNewGroup.has(emp.id)} onCheckedChange={(checked) => { const newIds = new Set(idsForNewGroup); if (checked) newIds.add(emp.id); else newIds.delete(emp.id); setIdsForNewGroup(newIds); }}/></TableCell><TableCell>{emp.name}</TableCell><TableCell>{emp.department}</TableCell><TableCell>{emp.title}</TableCell><TableCell>{emp.detailedGroup2}</TableCell></TableRow>))}</TableBody></Table></ScrollArea></CardContent></Card></div><DialogFooter><Button variant="outline" onClick={() => setIsAddGroupDialogOpen(false)}>취소</Button><Button onClick={handleCreateGroup}>그룹 생성</Button></DialogFooter></DialogContent></Dialog>
    </DndContext>
  );
}

const AllResultsView = ({ allResults, gradingScale }: {
  allResults: EvaluationResult[],
  gradingScale: Record<NonNullable<Grade>, GradeInfo>,
}) => {
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear().toString());
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);

  const availableYears = React.useMemo(() => {
    const years = new Set(allResults.map(r => r.year));
    return Array.from(years).sort((a,b) => b - a);
  }, [allResults]);

  const filteredResults = React.useMemo(() => {
    return allResults.filter(r => r.year.toString() === selectedYear);
  }, [allResults, selectedYear]);

  const sortedFilteredResults = React.useMemo(() => {
    let sortableItems = [...filteredResults];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredResults, sortConfig]);

  const requestSort = (key: keyof EvaluationResult) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof EvaluationResult) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4 text-primary" /> : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('ko-KR').format(value);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">전체 결과 조회</h2>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="연도 선택" /></SelectTrigger>
          <SelectContent>{availableYears.map(year => <SelectItem key={year} value={year.toString()}>{year}년</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Card>
        <CardHeader><CardTitle>{selectedYear}년 평가 결과</CardTitle><CardDescription>선택한 연도의 성과 평가 요약입니다.</CardDescription></CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="cursor-pointer" onClick={() => requestSort('month')}><div className="flex items-center">평가월{getSortIcon('month')}</div></TableHead>
                <TableHead>이름</TableHead>
                <TableHead>소속부서</TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('grade')}><div className="flex items-center">등급{getSortIcon('grade')}</div></TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('score')}><div className="flex items-center">점수{getSortIcon('score')}</div></TableHead>
                <TableHead className="text-right">최종금액</TableHead>
                <TableHead>비고</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {sortedFilteredResults.length > 0 ? sortedFilteredResults.sort((a,b) => b.month - a.month).map(result => (
                  <TableRow key={`${result.year}-${result.month}`}>
                    <TableCell>{result.year}년 {result.month}월</TableCell>
                    <TableCell>{result.name}</TableCell>
                    <TableCell>{result.department}</TableCell>
                    <TableCell>{result.grade}</TableCell>
                    <TableCell>{result.score}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(result.finalAmount)} 원</TableCell>
                    <TableCell>{result.memo}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={7} className="text-center h-24">해당 연도의 평가 결과가 없습니다.</TableCell></TableRow>}
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
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
  handleDepartmentNameUpdate?: (oldName: string, newName: string, year: number, month: number) => void;
}


const AssignmentManagementView = ({ myEmployees, currentMonthResults, handleResultsUpdate, handleDepartmentNameUpdate }: AssignmentManagementViewProps) => {
  const { toast } = useToast();

  const managedGroups = React.useMemo(() => {
    const groups: Record<string, { company: string; department: string; position: string; count: number }> = {};
    myEmployees.forEach(emp => {
      const key = `${emp.company}|${emp.department}|${emp.position}`;
      if (!groups[key]) {
        groups[key] = {
          company: emp.company,
          department: emp.department,
          position: emp.position,
          count: 0,
        };
      }
      groups[key].count++;
    });
    return Object.entries(groups)
      .map(([key, value]) => ({ ...value, id: key }))
      .sort((a,b) => a.department.localeCompare(b.department));
  }, [myEmployees]);

  const [editableGroups, setEditableGroups] = React.useState(managedGroups);
  
  React.useEffect(() => {
    setEditableGroups(managedGroups);
  }, [managedGroups]);

  const handleGroupChange = (id: string, field: 'company' | 'department', value: string) => {
    setEditableGroups(current =>
      current.map(group =>
        group.id === id ? { ...group, [field]: value } : group
      )
    );
  };

  const handleSaveChanges = () => {
    const myEmployeeIds = new Set(myEmployees.map(e => e.id));
    let hasChanges = false;
    
    const updates = new Map<string, { company: string, department: string }>();
    editableGroups.forEach(eg => {
      const originalGroup = managedGroups.find(mg => mg.id === eg.id);
      if (originalGroup && (originalGroup.company !== eg.company || originalGroup.department !== eg.department)) {
        updates.set(eg.id, { company: eg.company, department: eg.department });
        hasChanges = true;
      }
    });
    
    if (!hasChanges) {
      toast({ title: '변경 없음', description: '변경된 내용이 없습니다.' });
      return;
    }

    const newResults = currentMonthResults.map(res => {
      if (!myEmployeeIds.has(res.id)) {
        return res;
      }

      const originalKey = `${res.company}|${res.department}|${res.position}`;
      const update = updates.get(originalKey);
      
      if (update) {
        return { ...res, company: update.company, department: update.department };
      }
      
      return res;
    });

    handleResultsUpdate(newResults);
    toast({
      title: '저장 완료',
      description: '담당 소속 정보가 성공적으로 변경되었습니다.',
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardDescription>
            담당하고 있는 소속의 정보를 수정할 수 있습니다. 변경사항은 현재 선택된 월 평가에만 적용됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>회사</TableHead>
                  <TableHead>부서명</TableHead>
                  <TableHead>직책</TableHead>
                  <TableHead className="text-right">담당 인원</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editableGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <Input 
                        value={group.company} 
                        onChange={(e) => handleGroupChange(group.id, 'company', e.target.value)} 
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={group.department} 
                        onChange={(e) => handleGroupChange(group.id, 'department', e.target.value)} 
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>{group.position}</TableCell>
                    <TableCell className="text-right">{group.count}명</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleSaveChanges}>변경사항 저장</Button>
        </CardFooter>
      </Card>
    </div>
  );
};


export default function EvaluatorDashboard({ allResults, currentMonthResults, gradingScale, selectedDate, setSelectedDate, handleResultsUpdate, handleDepartmentNameUpdate, evaluatorUser, activeView }: EvaluatorDashboardProps) {
  const { user: authUser } = useAuth();
  const user = evaluatorUser || authUser;
  
  const myEmployees = React.useMemo(() => {
    if (!user) return [];
    return currentMonthResults.filter(r => r.evaluatorId === user.id);
  }, [user, currentMonthResults]);
  
  const myAllTimeResults = React.useMemo(() => {
    if (!user) return [];
    return allResults.filter(r => r.evaluatorId === user.id);
  }, [user, allResults]);

  if (!user) return <div className="p-4 md:p-6 lg:p-8">로딩중...</div>;

  const renderContent = () => {
    switch(activeView) {
      case 'evaluation-input':
        return <EvaluationInputView 
                  myEmployees={myEmployees} 
                  gradingScale={gradingScale}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  handleResultsUpdate={handleResultsUpdate}
                  allResults={allResults}
                />;
      case 'all-results':
        return <AllResultsView allResults={myAllTimeResults} gradingScale={gradingScale} />;
      case 'assignment-management':
        return <AssignmentManagementView 
                 myEmployees={myEmployees} 
                 currentMonthResults={currentMonthResults} 
                 handleResultsUpdate={handleResultsUpdate}
                 handleDepartmentNameUpdate={handleDepartmentNameUpdate ? (oldName, newName) => handleDepartmentNameUpdate(oldName, newName, selectedDate.year, selectedDate.month) : undefined}
               />;
      default:
        return <div>선택된 뷰가 없습니다.</div>;
    }
  }

  return (
     <div className="p-4 md:p-6 lg:p-8">
      {renderContent()}
    </div>
  );
}
