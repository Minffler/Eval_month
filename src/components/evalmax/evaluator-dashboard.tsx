'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { EvaluationResult, Grade, GradeInfo, EvaluationGroupCategory, User } from '@/lib/types';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Check, Download, ArrowUpDown, ArrowUp, ArrowDown, Edit2, GripVertical } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MonthSelector } from './month-selector';
import { GradeHistogram } from './grade-histogram';
import { Input } from '../ui/input';
import * as XLSX from 'xlsx';
import { Checkbox } from '../ui/checkbox';

interface EvaluatorDashboardProps {
  allResults: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  selectedDate: { year: number; month: number };
  setSelectedDate: (date: { year: number; month: number }) => void;
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
  evaluatorUser?: User;
}

type SortConfig = {
  key: keyof EvaluationResult;
  direction: 'ascending' | 'descending';
} | null;

type Groups = Record<string, { name: string; members: EvaluationResult[] }>;


// Helper component for a single draggable table row
const DraggableTableRow = ({ employee, gradingScale, selected, onSelect, onGradeChange, onMemoChange, onSave }: {
    employee: EvaluationResult,
    gradingScale: Record<NonNullable<Grade>, GradeInfo>,
    selected: boolean,
    onSelect: (id: string, checked: boolean) => void,
    onGradeChange: (id: string, grade: Grade) => void,
    onMemoChange: (id: string, memo: string) => void,
    onSave: () => void,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: employee.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const isBulkDrag = React.useContext(DndContext)?.active?.id !== employee.id && selected;


    return (
        <TableRow ref={setNodeRef} style={style} data-state={selected ? "selected" : "unselected"} className={cn(isBulkDrag && "opacity-50")}>
            <TableCell className="p-1 w-[80px]">
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
            <TableCell className="font-medium whitespace-nowrap py-1 px-2">{employee.name}</TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2">{(employee.workRate * 100).toFixed(1)}%</TableCell>
            <TableCell className="whitespace-nowrap py-1 px-2">
                <Select value={employee.grade || ''} onValueChange={(g: Grade) => onGradeChange(employee.id, g)}>
                    <SelectTrigger className="w-[90px] h-8">
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
                    placeholder="메모 입력"
                    className="h-8"
                />
            </TableCell>
        </TableRow>
    );
};


export default function EvaluatorDashboard({ allResults, gradingScale, selectedDate, setSelectedDate, handleResultsUpdate, evaluatorUser }: EvaluatorDashboardProps) {
  const { user: authUser } = useAuth();
  const user = evaluatorUser || authUser;
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = React.useState<EvaluationGroupCategory>('전체');
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);

  const [groups, setGroups] = React.useState<Groups>({});
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = React.useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const myEmployees = React.useMemo(() => {
    if (!user) return [];
    return allResults.filter(r => r.evaluatorId === user.id);
  }, [user, allResults]);

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
    setSelectedIds(new Set()); // Reset selection when tab changes
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
          group.members.map(member => ({...member, detailedGroup2: group.name}))
      );
      const allMemberIds = new Set(allGroupMembers.map(m => m.id));
      const unGroupedEmployees = visibleEmployees.filter(e => !allMemberIds.has(e.id));
      return [...allGroupMembers, ...unGroupedEmployees];
  };
  
  const handleSave = () => {
    const updatedMyResults = flattenGroupsToResults();
    const myEmployeeIds = new Set(myEmployees.map(e => e.id));
    const otherResults = allResults.filter(r => !myEmployeeIds.has(r.id));
    
    handleResultsUpdate([...otherResults, ...updatedMyResults]);
    
    toast({
      title: '성공!',
      description: '평가가 성공적으로 저장되었습니다.',
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const isBulkDrag = selectedIds.has(activeId) && selectedIds.size > 1;
    const movedIds = isBulkDrag ? Array.from(selectedIds) : [activeId];

    setGroups(prev => {
      const newGroups = JSON.parse(JSON.stringify(prev));
      
      const findItemAndGroup = (id: string, groupsSource: Groups) => {
        for (const key in groupsSource) {
          const memberIndex = groupsSource[key].members.findIndex((m: EvaluationResult) => m.id === id);
          if (memberIndex > -1) {
            return { groupKey: key, index: memberIndex, member: groupsSource[key].members[memberIndex] };
          }
        }
        return null;
      }
      
      const overGroupKey = Object.keys(newGroups).find(key => key === over.id || newGroups[key].members.some((m: EvaluationResult) => m.id === over.id));
      if (!overGroupKey) return prev;
      
      let overIndex = newGroups[overGroupKey].members.findIndex((m: EvaluationResult) => m.id === over.id);
      if (overIndex === -1) overIndex = newGroups[overGroupKey].members.length;

      const movedItems: EvaluationResult[] = [];
      const sourceGroupKeys: Record<string, string> = {};

      movedIds.forEach(id => {
          const itemInfo = findItemAndGroup(id, prev);
          if (itemInfo) {
              movedItems.push(itemInfo.member);
              sourceGroupKeys[id] = itemInfo.groupKey;
          }
      });

      movedItems.forEach(item => {
        const sourceGroupKey = sourceGroupKeys[item.id];
        const itemInfo = findItemAndGroup(item.id, newGroups);
        if(itemInfo) {
            newGroups[itemInfo.groupKey].members.splice(itemInfo.index, 1);
        }
      });
      
      newGroups[overGroupKey].members.splice(overIndex, 0, ...movedItems);
      
      return newGroups;
    });
  };

  const handleToggleSelection = (id: string, checked: boolean) => {
      setSelectedIds(prev => {
          const newSelection = new Set(prev);
          if (checked) {
              newSelection.add(id);
          } else {
              newSelection.delete(id);
          }
          return newSelection;
      });
  };

  const handleToggleGroupSelection = (group: {name: string, members: EvaluationResult[]}, checked: boolean) => {
    setSelectedIds(prev => {
        const newSelection = new Set(prev);
        const memberIds = group.members.map(m => m.id);
        if (checked) {
            memberIds.forEach(id => newSelection.add(id));
        } else {
            memberIds.forEach(id => newSelection.delete(id));
        }
        return newSelection;
    });
  };
  
  const handleStartEditing = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setEditingGroupName(currentName);
  };
  
  const handleCancelEditing = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const handleUpdateGroupName = () => {
    if (!editingGroupId || !editingGroupName.trim()) {
        handleCancelEditing();
        return;
    }
    setGroups(prev => {
        const newGroups = {...prev};
        if (newGroups[editingGroupId]) {
            newGroups[editingGroupId].name = editingGroupName;
        }
        // If key was the name, we might need to update the key as well. Assuming keys are stable.
        return newGroups;
    });
    handleCancelEditing();
  };


  const totalMyEmployees = myEmployees.length;
  const totalMyCompleted = myEmployees.filter(e => e.grade).length;
  const totalCompletionRate = totalMyEmployees > 0 ? (totalMyCompleted / totalMyEmployees) * 100 : 0;
  
  const gradeDistribution = Object.keys(gradingScale)
    .map(grade => ({
      name: grade,
      value: visibleEmployees.filter(g => g.grade === grade).length,
    }));

  const handleDownloadExcel = () => {
    const dataToExport = visibleEmployees.map(r => ({
      '고유사번': r.uniqueId,
      '회사': r.company,
      '소속부서': r.department,
      '이름': r.name,
      '근무율': `${(r.workRate * 100).toFixed(1)}%`,
      '등급': r.grade,
      '점수': r.score,
      '비고': r.memo,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `평가결과-${activeTab}`);
    XLSX.writeFile(workbook, `evalmax_${selectedDate.year}_${selectedDate.month}_평가자결과.xlsx`);
  };

  if (!user) return <div>로딩중...</div>;

  const activeEmployee = activeId ? myEmployees.find(emp => emp.id === activeId) : null;
  const isBulkDrag = activeId ? selectedIds.has(activeId) && selectedIds.size > 1 : false;


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">평가 허브</h2>
          {!evaluatorUser && <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">평가 진행 현황</CardTitle>
            <CardDescription>{selectedDate.year}년 {selectedDate.month}월 성과평가 ({(selectedDate.month % 12) + 1}월 급여반영)</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div className="md:col-span-3">
              <GradeHistogram data={gradeDistribution} gradingScale={gradingScale} title={`${activeTab} 등급 분포`} />
            </div>
            <div className="md:col-span-2 space-y-2">
                <div className='flex justify-between items-baseline'>
                    <h4 className="font-semibold">종합 진행률</h4>
                    <span className="font-bold text-lg text-primary">{totalCompletionRate.toFixed(1)}%</span>
                </div>
                <Progress value={totalCompletionRate} />
                <p className="text-sm text-muted-foreground text-right">{totalMyCompleted} / {totalMyEmployees} 명 완료</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="전체" onValueChange={(val) => setActiveTab(val as EvaluationGroupCategory)}>
          <TabsList className="w-full grid grid-cols-4">
              {Object.keys(categorizedEmployees).map(category => (
                  <TabsTrigger key={category} value={category}>{category} ({categorizedEmployees[category as EvaluationGroupCategory].length})</TabsTrigger>
              ))}
          </TabsList>

          <div className="flex justify-end my-4">
              <Button onClick={handleDownloadExcel} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                현재 탭 엑셀 다운로드
              </Button>
          </div>

          <TabsContent value={activeTab} className="pt-4">
            {Object.keys(groups).length > 0 ? Object.entries(groups).map(([groupKey, group]) => {
                const availableScore = group.members.length * 100;
                const usedScore = group.members.reduce((acc, curr) => acc + (curr.score || 0), 0);
                const allSelected = group.members.length > 0 && group.members.every(m => selectedIds.has(m.id));

                return (
                  <Card key={groupKey} className="mb-4">
                      <CardHeader className="py-3 px-4">
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
                                className="h-8"
                              />
                               <Button size="sm" onClick={handleUpdateGroupName}>저장</Button>
                               <Button size="sm" variant="ghost" onClick={handleCancelEditing}>취소</Button>
                            </div>
                           ) : (
                            <>
                              <CardTitle>{group.name}</CardTitle>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartEditing(groupKey, group.name)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </>
                           )}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">그룹 점수 현황: </span>
                            <span className={usedScore > availableScore ? 'text-destructive font-bold' : ''}>{usedScore}</span>
                             / {availableScore} 점
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="overflow-x-auto p-0">
                        <SortableContext items={group.members.map(m => m.id)} strategy={verticalListSortingStrategy}>
                          <Table>
                              <TableHeader><TableRow>
                                  <TableHead className="w-[80px] p-2">
                                    <Checkbox 
                                      checked={allSelected}
                                      onCheckedChange={(checked) => handleToggleGroupSelection(group, Boolean(checked))}
                                      aria-label={`Select all in ${group.name}`}
                                    />
                                  </TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2">고유사번</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2">회사</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2">이름</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2">근무율</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2">등급</TableHead>
                                  <TableHead className="whitespace-nowrap py-2 px-2">점수</TableHead>
                                  <TableHead className="whitespace-nowrap w-[200px] py-2 px-2">비고</TableHead>
                              </TableRow></TableHeader>
                              <TableBody>
                                  {group.members.map(emp => (
                                      <DraggableTableRow
                                          key={emp.id}
                                          employee={emp}
                                          gradingScale={gradingScale}
                                          selected={selectedIds.has(emp.id)}
                                          onSelect={handleToggleSelection}
                                          onGradeChange={handleGradeChange}
                                          onMemoChange={handleMemoChange}
                                          onSave={handleSave}
                                      />
                                  ))}
                              </TableBody>
                          </Table>
                          </SortableContext>
                      </CardContent>
                  </Card>
                )
            }) : (
                  <Card>
                      <CardContent className="pt-6">
                          <p className="text-center text-muted-foreground">이 분류에 해당하는 평가 대상자가 없습니다.</p>
                      </CardContent>
                  </Card>
              )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <Button onClick={handleSave} size="lg">
              <Check className="mr-2"/> 모든 평가 저장
          </Button>
        </div>
      </div>
       <DragOverlay>
        {activeId && activeEmployee ? (
            <Table className="bg-background shadow-lg relative">
                <TableBody>
                     <TableRow>
                        <TableCell className="p-1 w-[80px]">
                           <div className='flex items-center gap-1'>
                            <Checkbox checked={selectedIds.has(activeId)} readOnly />
                            <Button variant="ghost" size="icon" className="cursor-grabbing h-8 w-8">
                                <GripVertical className="h-4 w-4" />
                            </Button>
                           </div>
                           {isBulkDrag && <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{selectedIds.size}</div>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.uniqueId}</TableCell>
                        <TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.company}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap py-1 px-2">{activeEmployee.name}</TableCell>
                        <TableCell className="whitespace-nowrap py-1 px-2">{(activeEmployee.workRate * 100).toFixed(1)}%</TableCell>
                        <TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.grade}</TableCell>
                        <TableCell className="whitespace-nowrap py-1 px-2">{activeEmployee.score}</TableCell>
                        <TableCell className="py-1 px-2">{activeEmployee.memo}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        ) : null}
    </DragOverlay>
    </DndContext>
  );
}
