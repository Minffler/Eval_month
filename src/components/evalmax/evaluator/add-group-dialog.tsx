'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { EvaluationResult } from '@/lib/types';

interface AddGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableEmployees: EvaluationResult[];
  onGroupCreate: (groupName: string, selectedEmployeeIds: string[]) => void;
}

export default function AddGroupDialog({
  open,
  onOpenChange,
  availableEmployees,
  onGroupCreate,
}: AddGroupDialogProps) {
  const [groupName, setGroupName] = React.useState('');
  const [selectedEmployees, setSelectedEmployees] = React.useState<Set<string>>(new Set());
  const [departmentFilter, setDepartmentFilter] = React.useState('모든 부서');
  const [positionFilter, setPositionFilter] = React.useState('모든 직책');
  const { toast } = useToast();

  // 고유한 부서와 직책 목록 추출
  const departments = React.useMemo(() => {
    const depts = Array.from(new Set(availableEmployees.map(emp => emp.department)));
    return ['모든 부서', ...depts];
  }, [availableEmployees]);

  const positions = React.useMemo(() => {
    const pos = Array.from(new Set(availableEmployees.map(emp => emp.title)));
    return ['모든 직책', ...pos];
  }, [availableEmployees]);

  // 필터링된 직원 목록
  const filteredEmployees = React.useMemo(() => {
    return availableEmployees.filter(emp => {
      const deptMatch = departmentFilter === '모든 부서' || emp.department === departmentFilter;
      const posMatch = positionFilter === '모든 직책' || emp.title === positionFilter;
      return deptMatch && posMatch;
    });
  }, [availableEmployees, departmentFilter, positionFilter]);

  // 전체 선택/해제
  const isAllSelected = filteredEmployees.length > 0 && 
    filteredEmployees.every(emp => selectedEmployees.has(emp.id));
  const isIndeterminate = filteredEmployees.some(emp => selectedEmployees.has(emp.id)) && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedEmployees);
      filteredEmployees.forEach(emp => newSelected.add(emp.id));
      setSelectedEmployees(newSelected);
    } else {
      const newSelected = new Set(selectedEmployees);
      filteredEmployees.forEach(emp => newSelected.delete(emp.id));
      setSelectedEmployees(newSelected);
    }
  };

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    const newSelected = new Set(selectedEmployees);
    if (checked) {
      newSelected.add(employeeId);
    } else {
      newSelected.delete(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '그룹 이름을 입력해주세요.',
      });
      return;
    }

    if (selectedEmployees.size === 0) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '최소 한 명의 멤버를 선택해주세요.',
      });
      return;
    }

    onGroupCreate(groupName.trim(), Array.from(selectedEmployees));
    
    // 모달 초기화
    setGroupName('');
    setSelectedEmployees(new Set());
    setDepartmentFilter('모든 부서');
    setPositionFilter('모든 직책');
    onOpenChange(false);
    
    toast({
      title: '그룹 생성 완료',
      description: `${groupName} 그룹이 생성되었습니다.`,
    });
  };

  const handleCancel = () => {
    setGroupName('');
    setSelectedEmployees(new Set());
    setDepartmentFilter('모든 부서');
    setPositionFilter('모든 직책');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>새 그룹 추가</DialogTitle>
          <DialogDescription>
            새로운 평가 그룹을 만들고 멤버를 추가합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 그룹 이름 입력 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="groupName" className="text-right">
              그룹 이름
            </Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="col-span-3"
              placeholder="그룹 이름을 입력하세요"
            />
          </div>

          {/* 멤버 선택 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">멤버 선택</h3>
            
            {/* 필터 */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="departmentFilter">부서</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="positionFilter">직책</Label>
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(pos => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 멤버 목록 테이블 */}
            <div className="border rounded-lg">
              <ScrollArea className="h-[300px]">
                                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead className="w-[50px] text-center">
                         <Checkbox
                           checked={isIndeterminate ? 'indeterminate' : isAllSelected}
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
                     {filteredEmployees.map((employee) => (
                       <TableRow key={employee.id}>
                         <TableCell className="text-center">
                           <Checkbox
                             checked={selectedEmployees.has(employee.id)}
                             onCheckedChange={(checked) => 
                               handleSelectEmployee(employee.id, Boolean(checked))
                             }
                           />
                         </TableCell>
                         <TableCell className="text-center font-medium">{employee.name}</TableCell>
                         <TableCell className="text-center">{employee.department}</TableCell>
                         <TableCell className="text-center">{employee.title}</TableCell>
                         <TableCell className="text-center">
                           {employee.detailedGroup2 || '미지정'}
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
              </ScrollArea>
            </div>

            {/* 선택된 멤버 수 표시 */}
            <div className="text-sm text-muted-foreground">
              선택된 멤버: {selectedEmployees.size}명
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button onClick={handleCreateGroup}>
            그룹 생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 