import * as React from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { GripVertical } from 'lucide-react';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { EvaluationResult, Grade } from '@/lib/types';

interface EvaluationTableProps {
  employees: EvaluationResult[];
  selectedIds: Set<string>;
  gradingScale: Record<NonNullable<Grade>, any>;
  onSelect: (id: string, checked: boolean) => void;
  onGradeChange: (id: string, grade: Grade | null) => void;
  onMemoChange: (employeeId: string, memo: string) => void;
}

// 메모이제이션된 테이블 행 컴포넌트
const DraggableTableRow = React.memo(function DraggableTableRow({ 
  employee, 
  selected, 
  gradingScale,
  onSelect, 
  onGradeChange, 
  onMemoChange
}: {
  employee: EvaluationResult;
  selected: boolean;
  gradingScale: Record<NonNullable<Grade>, any>;
  onSelect: (id: string, checked: boolean) => void;
  onGradeChange: (id: string, grade: Grade | null) => void;
  onMemoChange: (employeeId: string, memo: string) => void;
}) {
  // useCallback으로 함수 메모이제이션
  const handleSelect = React.useCallback((checked: boolean) => {
    onSelect(employee.uniqueId, checked);
  }, [employee.uniqueId, onSelect]);

  const handleGradeChange = React.useCallback((grade: Grade | null) => {
    onGradeChange(employee.uniqueId, grade);
  }, [employee.uniqueId, onGradeChange]);

  const handleMemoChange = React.useCallback((memo: string) => {
    onMemoChange(employee.uniqueId, memo);
  }, [employee.uniqueId, onMemoChange]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isRowDragging,
    over,
  } = useSortable({ id: employee.uniqueId });

  // 드롭 위치를 행간으로 강조
  const isDropTarget = over?.id === employee.uniqueId;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isRowDragging ? 'none' : transition,
    opacity: isRowDragging ? 0.5 : 1,
    borderTop: isDropTarget ? '2px solid hsl(var(--primary))' : undefined,
    borderBottom: isDropTarget ? '2px solid hsl(var(--primary))' : undefined,
    background: isDropTarget ? 'hsl(30, 30%, 96%)' : undefined,
    boxShadow: isRowDragging ? '0 2px 8px rgba(0,0,0,0.15)' : undefined,
    zIndex: isRowDragging ? 10 : undefined,
    willChange: isRowDragging ? 'transform' : 'auto',
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
      
      {/* ID */}
      <TableCell className="whitespace-nowrap py-1 px-2 text-center">
        {employee.uniqueId}
      </TableCell>
      
      {/* 기본 정보 */}
      <TableCell className="font-medium whitespace-nowrap py-1 px-2 text-center">{employee.name}</TableCell>
      <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.company}</TableCell>
      <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.department}</TableCell>
      <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.title}</TableCell>
      <TableCell className="whitespace-nowrap py-1 px-2 text-center">{employee.growthLevel}</TableCell>
      
      {/* 그룹 구분 */}
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
            textColor = 'hsl(25, 95%, 53%)';
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
      
      {/* 근무율 */}
      <TableCell className="whitespace-nowrap py-1 px-2 text-center">
        {(employee.workRate * 100).toFixed(1)}%
      </TableCell>
      
      {/* 등급 선택 드롭다운 */}
      <TableCell className="whitespace-nowrap py-1 px-2 text-center">
        {(() => {
          const workRatePercent = employee.workRate * 100;
          const isUnder25Percent = workRatePercent < 25;
          
          if (isUnder25Percent) {
            return (
              <div className="text-sm text-muted-foreground font-medium">
                -
              </div>
            );
          }
          
          return Object.keys(gradingScale || {}).length > 0 ? (
            <Select 
              value={employee.grade || 'none'} 
              onValueChange={(g) => {
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
          onMemoChange={handleMemoChange}
          isPending={false}
        />
      </TableCell>
    </TableRow>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.employee.uniqueId === nextProps.employee.uniqueId &&
    prevProps.selected === nextProps.selected &&
    prevProps.employee.grade === nextProps.employee.grade &&
    prevProps.employee.memo === nextProps.employee.memo &&
    prevProps.employee.detailedGroup2 === nextProps.employee.detailedGroup2
  );
});

DraggableTableRow.displayName = 'DraggableTableRow';

// 메모이제이션된 메모 입력 컴포넌트
const MemoizedMemoInput = React.memo(({ 
  value, 
  onMemoChange,
  isPending = false
}: {
  value: string;
  onMemoChange: (memo: string) => void;
  isPending?: boolean;
}) => {
  const [inputValue, setInputValue] = React.useState(value || '');
  const [isFocused, setIsFocused] = React.useState(false);
  
  // value prop이 변경되면 inputValue도 업데이트 (외부 변경사항 반영)
  React.useEffect(() => {
    if (!isFocused) {
      setInputValue(value || '');
    }
  }, [value, isFocused]);
  
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cleanValue = inputValue ? inputValue.trim() : '';
      onMemoChange(cleanValue);
      e.currentTarget.blur();
    }
  }, [inputValue, onMemoChange]);
  
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  }, []);
  
  const handleFocus = React.useCallback(() => {
    setIsFocused(true);
  }, []);
  
  const handleBlur = React.useCallback(() => {
    setIsFocused(false);
    const cleanValue = inputValue ? inputValue.trim() : '';
    onMemoChange(cleanValue);
  }, [inputValue, onMemoChange]);
  
  return (
    <div className="relative">
      <input
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`h-8 pr-8 px-3 py-1 text-sm border rounded-md w-full ${
          isPending ? "border-blue-300 bg-blue-50" : ""
        }`}
        placeholder='평가 피드백 입력 (Enter로 저장)'
        autoComplete="off"
        spellCheck={false}
      />
      {isPending && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.isPending === nextProps.isPending
  );
});

MemoizedMemoInput.displayName = 'MemoizedMemoInput';

export function EvaluationTable({ 
  employees, 
  selectedIds, 
  gradingScale, 
  onSelect, 
  onGradeChange, 
  onMemoChange 
}: EvaluationTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px] text-center">선택</TableHead>
          <TableHead className="text-center">ID</TableHead>
          <TableHead className="text-center">이름</TableHead>
          <TableHead className="text-center">회사</TableHead>
          <TableHead className="text-center">소속부서</TableHead>
          <TableHead className="text-center">직책</TableHead>
          <TableHead className="text-center">성장레벨</TableHead>
          <TableHead className="text-center">그룹구분</TableHead>
          <TableHead className="text-center">근무율</TableHead>
          <TableHead className="text-center">등급</TableHead>
          <TableHead className="text-center">점수</TableHead>
          <TableHead className="text-center">비고</TableHead>
        </TableRow>
      </TableHeader>
      <SortableContext items={employees.map(m => m.uniqueId)} strategy={verticalListSortingStrategy}>
        <TableBody>
          {employees.map(emp => (
            <DraggableTableRow
              key={emp.uniqueId}
              employee={emp}
              selected={selectedIds.has(emp.uniqueId)}
              gradingScale={gradingScale}
              onSelect={onSelect}
              onGradeChange={onGradeChange}
              onMemoChange={onMemoChange}
            />
          ))}
        </TableBody>
      </SortableContext>
    </Table>
  );
} 