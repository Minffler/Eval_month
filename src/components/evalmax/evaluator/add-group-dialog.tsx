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

// 최적화된 테이블 행 컴포넌트
const EmployeeTableRow = React.memo(function EmployeeTableRow({
  employee,
  isSelected,
  onSelect,
}: {
  employee: EvaluationResult;
  isSelected: boolean;
  onSelect: (employeeId: string, checked: boolean) => void;
}) {
  const handleSelect = React.useCallback((checked: boolean) => {
    onSelect(employee.id, checked);
  }, [employee.id, onSelect]);

  return (
    <TableRow>
      <TableCell className="text-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleSelect}
        />
      </TableCell>
      <TableCell className="text-center font-medium">{employee.name}</TableCell>
      <TableCell className="text-center">{employee.department}</TableCell>
      <TableCell className="text-center">{employee.title}</TableCell>
      <TableCell className="text-center">
        {employee.detailedGroup2 || '미지정'}
      </TableCell>
    </TableRow>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수로 불필요한 리렌더링 방지
  return (
    prevProps.employee.id === nextProps.employee.id &&
    prevProps.isSelected === nextProps.isSelected
  );
});

EmployeeTableRow.displayName = 'EmployeeTableRow';

// 최적화된 그룹 이름 입력 컴포넌트
const GroupNameInput = React.memo(function GroupNameInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  // 입력 필드 포커스 최적화
  const handleFocus = React.useCallback(() => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  }, []);

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="groupName" className="text-right">
        그룹 이름
      </Label>
      <Input
        ref={inputRef}
        id="groupName"
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        className="col-span-3"
        placeholder="그룹 이름을 입력하세요"
        autoComplete="off"
        spellCheck="false"
        autoFocus
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value;
});

GroupNameInput.displayName = 'GroupNameInput';

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

  // 고유한 부서와 직책 목록 추출 (메모이제이션)
  const departments = React.useMemo(() => {
    const depts = Array.from(new Set(availableEmployees.map(emp => emp.department)));
    return ['모든 부서', ...depts];
  }, [availableEmployees]);

  const positions = React.useMemo(() => {
    const pos = Array.from(new Set(availableEmployees.map(emp => emp.title)));
    return ['모든 직책', ...pos];
  }, [availableEmployees]);

  // 필터링된 직원 목록 (메모이제이션)
  const filteredEmployees = React.useMemo(() => {
    return availableEmployees.filter(emp => {
      const deptMatch = departmentFilter === '모든 부서' || emp.department === departmentFilter;
      const posMatch = positionFilter === '모든 직책' || emp.title === positionFilter;
      return deptMatch && posMatch;
    });
  }, [availableEmployees, departmentFilter, positionFilter]);

  // 전체 선택/해제 상태 (메모이제이션)
  const selectionState = React.useMemo(() => {
  const isAllSelected = filteredEmployees.length > 0 && 
    filteredEmployees.every(emp => selectedEmployees.has(emp.id));
  const isIndeterminate = filteredEmployees.some(emp => selectedEmployees.has(emp.id)) && !isAllSelected;
    return { isAllSelected, isIndeterminate };
  }, [filteredEmployees, selectedEmployees]);

  // 전체 선택/해제 핸들러 (메모이제이션)
  const handleSelectAll = React.useCallback((checked: boolean) => {
    setSelectedEmployees(prev => {
      const newSelected = new Set(prev);
    if (checked) {
      filteredEmployees.forEach(emp => newSelected.add(emp.id));
    } else {
      filteredEmployees.forEach(emp => newSelected.delete(emp.id));
      }
      return newSelected;
    });
  }, [filteredEmployees]);

  // 개별 선택 핸들러 (메모이제이션)
  const handleSelectEmployee = React.useCallback((employeeId: string, checked: boolean) => {
    setSelectedEmployees(prev => {
      const newSelected = new Set(prev);
    if (checked) {
      newSelected.add(employeeId);
    } else {
      newSelected.delete(employeeId);
    }
      return newSelected;
    });
  }, []);

  // 그룹 생성 핸들러 (메모이제이션)
  const handleCreateGroup = React.useCallback(() => {
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
  }, [groupName, selectedEmployees, onGroupCreate, onOpenChange, toast]);

  // 취소 핸들러 (메모이제이션)
  const handleCancel = React.useCallback(() => {
    setGroupName('');
    setSelectedEmployees(new Set());
    setDepartmentFilter('모든 부서');
    setPositionFilter('모든 직책');
    onOpenChange(false);
  }, [onOpenChange]);

  // 그룹 이름 변경 핸들러 (디바운싱 적용)
  const groupNameTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const handleGroupNameChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGroupName(value);
    
    // 기존 타임아웃 정리
    if (groupNameTimeoutRef.current) {
      clearTimeout(groupNameTimeoutRef.current);
    }
    
    // 디바운싱으로 렉 감소 (150ms 지연)
    groupNameTimeoutRef.current = setTimeout(() => {
      // 여기서 필요한 검증이나 추가 로직을 수행할 수 있습니다
      console.log('Group name debounced:', value);
    }, 150);
  }, []);

  // 부서 필터 변경 핸들러 (메모이제이션)
  const handleDepartmentFilterChange = React.useCallback((value: string) => {
    setDepartmentFilter(value);
  }, []);

  // 직책 필터 변경 핸들러 (메모이제이션)
  const handlePositionFilterChange = React.useCallback((value: string) => {
    setPositionFilter(value);
  }, []);

  // 컴포넌트 언마운트 시 타임아웃 정리
  React.useEffect(() => {
    return () => {
      if (groupNameTimeoutRef.current) {
        clearTimeout(groupNameTimeoutRef.current);
      }
    };
  }, []);

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
          <GroupNameInput
              value={groupName}
            onChange={handleGroupNameChange}
            />

          {/* 멤버 선택 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">멤버 선택</h3>
            
            {/* 필터 */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="departmentFilter">부서</Label>
                <Select value={departmentFilter} onValueChange={handleDepartmentFilterChange}>
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
                <Select value={positionFilter} onValueChange={handlePositionFilterChange}>
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
                          checked={selectionState.isIndeterminate ? 'indeterminate' : selectionState.isAllSelected}
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
                      <EmployeeTableRow
                        key={employee.id}
                        employee={employee}
                        isSelected={selectedEmployees.has(employee.id)}
                        onSelect={handleSelectEmployee}
                      />
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