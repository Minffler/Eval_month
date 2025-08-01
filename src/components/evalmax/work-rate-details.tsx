'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { Input } from '../ui/input';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Download, PlusCircle, Edit, ChevronsUpDown, CalendarIcon, FileText as Document } from 'lucide-react';

import type { Employee, AttendanceType, Role, Approval, DailyAttendanceRecord, ShortenedWorkHourRecord, WorkRateInputs } from '@/lib/types';
import { calculateWorkRateDetails, type ShortenedWorkDetail, type DailyAttendanceDetail } from '@/lib/work-rate-calculator';
import { Button } from '../ui/button';
import * as XLSX from 'xlsx';
import { Progress } from '../ui/progress';
import { cn, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '../ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { format, isValid, parse } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar } from '../ui/calendar';


type SortConfig<T> = {
  key: keyof T;
  direction: 'ascending' | 'descending';
} | null;

interface WorkRateDetailsProps {
  type: 'shortenedWork' | 'dailyAttendance';
  data: any[];
  workRateInputs: Record<string, WorkRateInputs>;
  selectedDate: { year: number, month: number };
  allEmployees: Employee[];
  attendanceTypes: AttendanceType[];
  viewAs?: Role;
  onDataChange: (data: any[], type: 'shortenedWork' | 'dailyAttendance') => void;
  addApproval?: (approval: Omit<Approval, 'id' | 'date' | 'isRead' | 'status' | 'statusHR' | 'approvedAtTeam' | 'approvedAtHR' | 'rejectionReason'>) => void;
  currentEvaluatorId?: string; // 현재 로그인한 평가자 ID
}

const ShortenedWorkTypeIcon = ({ type }: { type: '임신' | '육아/돌봄' }) => {
    let style: React.CSSProperties, className: string;

    switch (type) {
        case '임신':
            style = { backgroundColor: 'hsl(30, 20%, 98%)' };
            className = "mx-auto flex h-6 w-20 items-center justify-center rounded-md text-xs font-semibold text-stone-700";
            break;
        case '육아/돌봄':
            style = { backgroundColor: 'hsl(25, 20%, 92%)' };
            className = "mx-auto flex h-6 w-20 items-center justify-center rounded-md text-xs font-semibold";
            break;
        default:
            return <span>{type}</span>;
    }
    return <div className={cn(className, "text-stone-600")} style={style}>{type}</div>;
};

const DailyAttendanceIcon = ({ isShortenedDay }: { isShortenedDay: boolean }) => {
    const text = isShortenedDay ? 'Y' : 'N';
    const style = isShortenedDay
        ? { backgroundColor: 'hsl(25, 20%, 92%)' }
        : { backgroundColor: 'hsl(30, 20%, 98%)' };
    const textColor = isShortenedDay ? 'text-stone-800' : 'text-stone-400';
    
    return (
        <div className={cn("mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold", textColor)} style={style}>
            {text}
        </div>
    );
};

const DatePickerWithInput = ({ value, onChange }: { value: string, onChange: (date?: string) => void }) => {
    const [date, setDate] = React.useState<Date | undefined>(value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined);
    const [inputValue, setInputValue] = React.useState<string>(value || '');
    const [popoverOpen, setPopoverOpen] = React.useState(false);

    React.useEffect(() => {
        if (value && isValid(parse(value, 'yyyy-MM-dd', new Date()))) {
            setDate(parse(value, 'yyyy-MM-dd', new Date()));
            setInputValue(value);
        } else if (!value) {
            setDate(undefined);
            setInputValue('');
        }
    }, [value]);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        if (selectedDate) {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            setInputValue(formattedDate);
            onChange(formattedDate);
        } else {
            setInputValue('');
            onChange(undefined);
        }
        setPopoverOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let text = e.target.value.replace(/[^0-9]/g, '');
        if (text.length > 4) text = `${text.slice(0, 4)}-${text.slice(4)}`;
        if (text.length > 7) text = `${text.slice(0, 7)}-${text.slice(7)}`;
        setInputValue(text.slice(0, 10));
    };

    const handleInputBlur = () => {
        const parsedDate = parse(inputValue, 'yyyy-MM-dd', new Date());
        if (isValid(parsedDate)) {
            const formattedDate = format(parsedDate, 'yyyy-MM-dd');
            if (inputValue !== formattedDate) {
                setInputValue(formattedDate);
            }
            setDate(parsedDate);
            onChange(formattedDate);
        } else if (inputValue === '') {
            setDate(undefined);
            onChange(undefined);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="YYYY-MM-DD"
                className="w-full"
            />
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
};

const TimePicker = ({ value, onChange }: { value: string, onChange: (time: string) => void }) => {
    const [hour, minute] = React.useMemo(() => {
        if (!value || !value.includes(':')) return ['', ''];
        const parts = value.split(':');
        return [parts[0] || '', parts[1] || ''];
    }, [value]);

    const handleTimeChange = (part: 'hour' | 'minute', partValue: string) => {
        const newHour = part === 'hour' ? partValue : hour;
        const newMinute = part === 'minute' ? partValue : minute;
        onChange(`${newHour}:${newMinute}`);
    };
    
    const hours = Array.from({ length: 14 }, (_, i) => String(i + 7).padStart(2, '0')); // 07 to 20
    const minutes = ['00', '15', '30', '45'];

    return (
        <div className="flex gap-2 items-center w-full">
            <Select value={hour} onValueChange={(val) => handleTimeChange('hour', val)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="시" /></SelectTrigger>
                <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}시</SelectItem>)}</SelectContent>
            </Select>
            <Select value={minute} onValueChange={(val) => handleTimeChange('minute', val)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="분" /></SelectTrigger>
                <SelectContent>{minutes.map(m => <SelectItem key={m} value={m}>{m}분</SelectItem>)}</SelectContent>
            </Select>
        </div>
    )
}

export default function WorkRateDetails({ type, data, workRateInputs, selectedDate, allEmployees, attendanceTypes, viewAs = 'admin', onDataChange, addApproval, currentEvaluatorId }: WorkRateDetailsProps) {
  const { user, userMap } = useAuth();
  const { addApproval: addNotificationApproval } = useNotifications();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<SortConfig<any>>(null);
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit' | 'delete'>('add');
  const [formData, setFormData] = React.useState<any>({});
  const [selectedRowIds, setSelectedRowIds] = React.useState<Set<string>>(new Set());
  
  // 화면별 독립적인 선택 상태 관리
  const getSelectedRowIdsKey = () => `selectedRowIds_${type}`;
  const [shortenedSelectedIds, setShortenedSelectedIds] = React.useState<Set<string>>(new Set());
  const [dailySelectedIds, setDailySelectedIds] = React.useState<Set<string>>(new Set());
  
  // 현재 화면에 맞는 선택 상태 가져오기
  const currentSelectedIds = type === 'shortenedWork' ? shortenedSelectedIds : dailySelectedIds;
  const setCurrentSelectedIds = type === 'shortenedWork' ? setShortenedSelectedIds : setDailySelectedIds;

  const [employeeSearchOpen, setEmployeeSearchOpen] = React.useState(false);
  const [attendanceTypeSearchOpen, setAttendanceTypeSearchOpen] = React.useState(false);

  const tableData = React.useMemo(() => {
    console.log('work-rate-details tableData 계산 시작');
    console.log('workRateInputs:', workRateInputs);
    console.log('selectedDate:', selectedDate);
    
    const details = calculateWorkRateDetails(workRateInputs, attendanceTypes, [], selectedDate.year, selectedDate.month);
    console.log('calculateWorkRateDetails 결과:', details);
    
    let filteredDetails;
    
    if (type === 'shortenedWork') {
        filteredDetails = details.shortenedWorkDetails;
        console.log('단축근로 상세 데이터:', filteredDetails);
    } else {
        filteredDetails = details.dailyAttendanceDetails;
        console.log('일근태 상세 데이터:', filteredDetails);
    }
    
    // 피평가자 페이지에서는 본인의 데이터만 필터링
    if (viewAs === 'employee' && user) {
        filteredDetails = filteredDetails.filter(item => item.uniqueId === user.uniqueId);
    }
    
    // 평가자 페이지에서는 현재 평가자가 담당하는 피평가자만 필터링
    if (viewAs === 'evaluator' && currentEvaluatorId) {
        filteredDetails = filteredDetails.filter(item => {
            // allEmployees에서 해당 피평가자의 평가자 정보를 찾아서 필터링
            const employee = allEmployees.find(emp => emp.uniqueId === item.uniqueId);
            return employee && employee.evaluatorId === currentEvaluatorId;
        });
    }
    
    console.log('최종 필터링된 데이터:', filteredDetails);
    return filteredDetails;
  }, [workRateInputs, attendanceTypes, selectedDate, type, viewAs, user, currentEvaluatorId, allEmployees]);


  const filteredData = React.useMemo(() => {
    if (!searchTerm) return tableData;
    return tableData.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.uniqueId.includes(searchTerm)
    );
  }, [tableData, searchTerm]);

  const sortedData = React.useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            if (sortConfig.key === 'lastModified') {
                const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
                const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
                return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
            }
            const aValue = a[sortConfig.key] ?? '';
            const bValue = b[sortConfig.key] ?? '';
            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const requestSort = (key: keyof any) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof any) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' 
        ? <ArrowUp className="ml-2 h-4 w-4 text-primary" /> 
        : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const totalDeductionHours = React.useMemo(() => {
    if (!searchTerm) return 0;
    return filteredData.reduce((acc, curr) => acc + (curr.totalDeductionHours || 0), 0);
  }, [filteredData, searchTerm]);
  
  const handleDownloadExcel = () => {
    let dataToExport, fileName;
    if (type === 'shortenedWork') {
      dataToExport = sortedData.map((item: ShortenedWorkDetail) => ({
        'ID': item.uniqueId, '이름': item.name, '구분': item.type,
        '시작일': item.startDate, '종료일': item.endDate, '일수(D)': item.businessDays,
        '출근시각': item.startTime, '퇴근시각': item.endTime, 
        '실근로(H)': Math.floor(item.actualWorkHours), '미근로(H)': 8 - Math.floor(item.actualWorkHours),
        '미근로시간': item.totalDeductionHours,
      }));
      fileName = `${selectedDate.year}.${selectedDate.month}_단축근로상세.xlsx`;
    } else {
      dataToExport = sortedData.map((item: DailyAttendanceDetail) => ({
        'ID': item.uniqueId, '이름': item.name, '일자': item.date,
        '근태 종류': item.type, '단축사용': item.isShortenedDay ? 'Y' : 'N',
        '일수(D)': item.deductionDays, '실근로(H)': item.actualWorkHours,
        '미근로시간': item.totalDeductionHours,
      }));
      fileName = `${selectedDate.year}.${selectedDate.month}_일근태상세.xlsx`;
    }
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '상세내역');
    XLSX.writeFile(workbook, fileName);
  };

  const openAddDialog = () => {
    setDialogMode('add');
    const defaultDate = format(new Date(selectedDate.year, selectedDate.month - 1, 1), 'yyyy-MM-dd');
    let initialData: any = {
      startDate: defaultDate,
      endDate: defaultDate,
      date: defaultDate
    };

    if (viewAs === 'employee' && user) {
        initialData = { ...initialData, uniqueId: user.uniqueId, name: user.name };
    }
    setFormData(initialData);
    setIsDialogOpen(true);
  };
  
  const openEditDialog = () => {
    if (currentSelectedIds.size !== 1) {
        toast({
            variant: 'destructive',
            title: '오류',
            description: '변경할 데이터 한 개를 선택해주세요.',
        });
        return;
    }
    
    setDialogMode('edit');
    const selectedId = Array.from(currentSelectedIds)[0];
    const selectedRecord = tableData.find((item: any) => {
        return item.rowId === selectedId;
    });

    if (selectedRecord) {
        setFormData({ ...selectedRecord, originalData: selectedRecord }); // 원본 데이터 저장
        setIsDialogOpen(true);
    }
  };
  
  const openDeleteDialog = () => {
    if (currentSelectedIds.size !== 1) {
        toast({
            variant: 'destructive',
            title: '오류',
            description: '삭제할 데이터 한 개를 선택해주세요.',
        });
        return;
    }
    
    setDialogMode('delete');
    const selectedId = Array.from(currentSelectedIds)[0];
    const selectedRecord = tableData.find((item: any) => {
        return item.rowId === selectedId;
    });

    if (selectedRecord) {
        setFormData({ ...selectedRecord, originalData: selectedRecord }); // 원본 데이터 저장
        setIsDialogOpen(true);
    }
  };
  
  const handleFormChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setFormData((prev: any) => ({ ...prev, uniqueId: employee.uniqueId, name: employee.name }));
    setEmployeeSearchOpen(false);
  }

  const handleSubmitForApproval = () => {
    if (!user) {
      toast({ variant: 'destructive', title: '오류', description: '로그인 정보가 없습니다.' });
      return;
    }
    
    if (!formData.uniqueId || !formData.name) {
        toast({ variant: 'destructive', title: '오류', description: '대상자를 선택해주세요.' });
        return;
    }

    const employee = allEmployees.find(e => e.uniqueId === formData.uniqueId);
    if (!employee) {
      toast({ variant: 'destructive', title: '오류', description: '해당 ID의 직원을 찾을 수 없습니다.' });
      return;
    }
    
    const dataType: 'shortenedWorkHours' | 'dailyAttendance' = type === 'shortenedWork' ? 'shortenedWorkHours' : 'dailyAttendance';
    const action = dialogMode;
    const teamApproverId = employee.evaluatorId || 'admin'; // Default to admin if no evaluator
    const hrApproverId = 'admin'; // Admin ID

    // 수정 케이스에서 변경된 필드들 추적
    let changes: Record<string, boolean> = {};
    if (action === 'edit' && formData.originalData) {
      if (dataType === 'shortenedWorkHours') {
        changes = {
          startDate: formData.startDate !== formData.originalData.startDate,
          endDate: formData.endDate !== formData.originalData.endDate,
          startTime: formData.startTime !== formData.originalData.startTime,
          endTime: formData.endTime !== formData.originalData.endTime,
          type: formData.type !== formData.originalData.type
        };
      } else {
        changes = {
          date: formData.date !== formData.originalData.date,
          type: formData.type !== formData.originalData.type
        };
      }
    }

    // 삭제 케이스에서는 원본 데이터를 사용
    const dataToSubmit = action === 'delete' ? formData.originalData : formData;

    const approvalData: Omit<Approval, 'id' | 'date' | 'isRead' | 'status' | 'statusHR' | 'approvedAtTeam' | 'approvedAtHR' | 'rejectionReason'> = {
      requesterId: user.uniqueId,
      requesterName: user.name,
      approverTeamId: teamApproverId,
      approverHRId: hrApproverId,
      type: 'workDataChange',
      payload: {
        dataType,
        action,
        data: { ...dataToSubmit, rowId: dataToSubmit.rowId || `row-${Date.now()}`},
      }
    }

    // 결재 생성 후 매핑 정보 저장
    const handleApprovalCreated = (approvalId: string | void) => {
      if (action === 'edit' && formData.originalData && typeof approvalId === 'string') {
        // 매핑 정보 저장
        const mapping = {
          trackingId: approvalId,
          targetTrackingId: formData.originalData.rowId,
          changes: changes
        };
        
        // localStorage에 임시 저장 (실제로는 DB 사용)
        const mappings = JSON.parse(localStorage.getItem('trackingMappings') || '{}');
        mappings[approvalId] = mapping;
        localStorage.setItem('trackingMappings', JSON.stringify(mappings));
      }
    };

    if (addApproval) {
      const approvalId = addApproval(approvalData);
      handleApprovalCreated(approvalId);
    } else if (addNotificationApproval) {
      const approvalId = addNotificationApproval(approvalData);
      handleApprovalCreated(approvalId);
    }
    
    toast({ title: '결재 상신 완료', description: '결재함에서 처리 상태를 확인해주세요.' });
    setIsDialogOpen(false);
  };
  
    const approverInfo = React.useMemo(() => {
    if (!formData.uniqueId) return '미지정';
    
    // 결재함과 동일한 로직 사용
    // 1. 직원의 평가자 ID 찾기
    const employee = allEmployees.find(e => e.uniqueId === formData.uniqueId);
    
    if (!employee) {
      return '미지정';
    }
    
    // 2. 평가자 ID 추출 (EvaluationResult 타입)
    const evaluatorId = (employee as any).evaluatorId;
    
    if (!evaluatorId) {
      return '미지정';
    }
    
    // 3. userMap에서 평가자 정보 찾기 (결재함과 동일한 방식)
    const evaluator = userMap.get(evaluatorId);
    
    if (!evaluator) {
      return '미지정';
    }
    
    return `${evaluator.name} (${evaluator.uniqueId})`;
  }, [formData.uniqueId, allEmployees, userMap]);

  const renderDialogContent = () => {

    const EmployeeSelector = () => {
      // For 'add' mode, when user is evaluator or admin, show popover search.
      if (dialogMode === 'add' && (viewAs === 'admin' || viewAs === 'evaluator')) {
          return (
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-left">대상자</Label>
                    <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="mt-1 w-full justify-between bg-[hsl(30,30%,98%)]">
                                {formData.uniqueId ? `${formData.name} (${formData.uniqueId})` : "직원 선택..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="이름 또는 ID 검색..." />
                                <CommandList>
                                    <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                                    <CommandGroup>
                                        {allEmployees.map((emp) => (
                                            <CommandItem
                                                key={emp.uniqueId}
                                                value={`${emp.name} ${emp.uniqueId}`}
                                                onSelect={() => handleEmployeeSelect(emp)}
                                            >
                                                {emp.name} ({emp.uniqueId})
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                  </div>
              </div>
          );
      }
      // For 'edit' mode, or when user is employee, show disabled inputs.
      return (
          <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-left">ID</Label>
                  <input
                    type="text"
                    value={formData.uniqueId || ''}
                    className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-muted"
                    disabled
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-left">이름</Label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-muted"
                    disabled
                  />
                </div>
              </div>
          </>
      );
    }

    if (type === 'shortenedWork') {
      return (
        <div className="space-y-3">
            <EmployeeSelector />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">단축근로 유형</Label>
                <select
                  value={formData.type || ''}
                  onChange={(e) => handleFormChange('type', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">선택하세요</option>
                  <option value="육아/돌봄">육아/돌봄</option>
                  <option value="임신">임신</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">시작일</Label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => handleFormChange('startDate', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">종료일</Label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">출근시각</Label>
                <input
                  type="time"
                  value={formData.startTime || '09:00'}
                  onChange={(e) => handleFormChange('startTime', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">퇴근시각</Label>
                <input
                  type="time"
                  value={formData.endTime || '18:00'}
                  onChange={(e) => handleFormChange('endTime', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
        </div>
      );
    }
    return (
        <div className="space-y-3">
            <EmployeeSelector />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">일근태 유형</Label>
                <Popover open={attendanceTypeSearchOpen} onOpenChange={setAttendanceTypeSearchOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="mt-1 w-full justify-between bg-[hsl(30,30%,98%)]">
                            {formData.type || "근태 종류를 선택해주세요"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput placeholder="근태 종류를 검색하세요..." />
                            <CommandList>
                                <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                                <CommandGroup>
                                    {attendanceTypes.map((type) => (
                                        <CommandItem
                                            key={type.id}
                                            value={type.name}
                                            onSelect={() => {
                                                handleFormChange('type', type.name);
                                                setAttendanceTypeSearchOpen(false);
                                            }}
                                        >
                                            {type.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-sm font-medium">사용일자</Label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
        </div>
    );
  };
  
  const handleSelectRow = (rowId: string, checked: boolean) => {
    setCurrentSelectedIds(prev => {
        const newSelection = new Set(prev);
        if (checked) {
            newSelection.add(rowId);
        } else {
            newSelection.delete(rowId);
        }
        return newSelection;
    });
  }
  
  const formatTimestamp = (isoString?: string) => {
    return formatDateTime(isoString);
  };

  const renderShortenedWorkTable = () => {
    const tableData = sortedData as ShortenedWorkDetail[];
    return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 px-2 text-center"></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('uniqueId')}><div className="flex items-center justify-center">ID{getSortIcon('uniqueId')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('name')}><div className="flex items-center justify-center">이름{getSortIcon('name')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('type')}><div className="flex items-center justify-center">구분{getSortIcon('type')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('startDate')}><div className="flex items-center justify-center">시작일{getSortIcon('startDate')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('endDate')}><div className="flex items-center justify-center">종료일{getSortIcon('endDate')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('businessDays')}><div className="flex items-center justify-center">일수(D){getSortIcon('businessDays')}</div></TableHead>
              <TableHead className="text-center">출근시각</TableHead>
              <TableHead className="text-center">퇴근시각</TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('actualWorkHours')}><div className="flex items-center justify-center">실근로/미근로(H){getSortIcon('actualWorkHours')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('totalDeductionHours')}><div className="flex items-center justify-center">미근로시간{getSortIcon('totalDeductionHours')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('lastModified')}><div className="flex items-center justify-center">수정일시{getSortIcon('lastModified')}</div></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((item, index) => {
                const actualWorkHours = item.actualWorkHours;
                const nonWorkHours = 8 - actualWorkHours;
                const rowId = item.rowId;
                return (
                    <TableRow key={rowId} data-state={currentSelectedIds.has(rowId) ? 'selected' : 'unselected'}>
                        <TableCell className="px-2 text-center">
                           <Checkbox checked={currentSelectedIds.has(rowId)} onCheckedChange={(checked) => handleSelectRow(rowId, Boolean(checked))} />
                        </TableCell>
                        <TableCell className="text-center">{item.uniqueId}</TableCell>
                        <TableCell className="text-center">{item.name}</TableCell>
                        <TableCell className="text-center"><ShortenedWorkTypeIcon type={item.type} /></TableCell>
                        <TableCell className="text-center">{item.startDate}</TableCell>
                        <TableCell className="text-center">{item.endDate}</TableCell>
                        <TableCell className="text-center">{item.businessDays}</TableCell>
                        <TableCell className="text-center">{item.startTime}</TableCell>
                        <TableCell className="text-center">{item.endTime}</TableCell>
                        <TableCell>
                          <Progress 
                              value={actualWorkHours}
                              max={8} 
                              leftLabel={String(actualWorkHours)} 
                              rightLabel={String(nonWorkHours)}
                              indicatorClassName="bg-stone-200"
                              className="w-[120px] mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-center font-bold">{item.totalDeductionHours.toFixed(2)}</TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">{formatTimestamp(item.lastModified)}</TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
          {searchTerm && (
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={10} className="text-right font-bold">총 미근로시간 소계</TableCell>
                    <TableCell className="font-bold tabular-nums text-center">{totalDeductionHours.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                </TableRow>
            </TableFooter>
          )}
        </Table>
    );
  };

  const renderDailyAttendanceTable = () => {
    const tableData = sortedData as DailyAttendanceDetail[];
    return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 px-2 text-center"></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('uniqueId')}><div className="flex items-center justify-center">ID{getSortIcon('uniqueId')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('name')}><div className="flex items-center justify-center">이름{getSortIcon('name')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('date')}><div className="flex items-center justify-center">일자{getSortIcon('date')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('type')}><div className="flex items-center justify-center">근태 종류{getSortIcon('type')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('isShortenedDay')}><div className="flex items-center justify-center">단축사용{getSortIcon('isShortenedDay')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('deductionDays')}><div className="flex items-center justify-center">일수(D){getSortIcon('deductionDays')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('actualWorkHours')}><div className="flex items-center justify-center">실근로(H){getSortIcon('actualWorkHours')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('totalDeductionHours')}><div className="flex items-center justify-center">미근로시간{getSortIcon('totalDeductionHours')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('lastModified')}><div className="flex items-center justify-center">수정일시{getSortIcon('lastModified')}</div></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((item, index) => {
              const rowId = item.rowId;
              return (
              <TableRow key={rowId} data-state={currentSelectedIds.has(rowId) ? 'selected' : 'unselected'}>
                <TableCell className="px-2 text-center">
                   <Checkbox checked={currentSelectedIds.has(rowId)} onCheckedChange={(checked) => handleSelectRow(rowId, Boolean(checked))} />
                </TableCell>
                <TableCell className="text-center">{item.uniqueId}</TableCell>
                <TableCell className="text-center">{item.name}</TableCell>
                <TableCell className="text-center">{item.date}</TableCell>
                <TableCell className="text-center">{item.type}</TableCell>
                <TableCell className="text-center"><DailyAttendanceIcon isShortenedDay={item.isShortenedDay} /></TableCell>
                <TableCell className="text-center">{item.deductionDays.toFixed(2)}</TableCell>
                <TableCell className="text-center">{item.actualWorkHours.toFixed(2)}</TableCell>
                <TableCell className="text-center font-bold">{item.totalDeductionHours.toFixed(2)}</TableCell>
                <TableCell className="text-center text-xs text-muted-foreground">{formatTimestamp(item.lastModified)}</TableCell>
              </TableRow>
            )})}
          </TableBody>
           {searchTerm && (
              <TableFooter>
                  <TableRow>
                      <TableCell colSpan={8} className="text-right font-bold">총 미근로시간 소계</TableCell>
                      <TableCell className="font-bold tabular-nums text-center">{totalDeductionHours.toFixed(2)}</TableCell>
                      <TableCell></TableCell>
                  </TableRow>
              </TableFooter>
           )}
        </Table>
    );
  };

  const title = type === 'shortenedWork' ? '단축근로 상세' : '일근태 상세';
  const description = `${selectedDate.year}년 ${selectedDate.month}월 ${type === 'shortenedWork' ? '단축근로' : '일근태'} 상세 내역입니다.`;

  return (
    <>
    <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button onClick={handleDownloadExcel} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              엑셀 다운로드
            </Button>
          </div>
            <div className="flex items-center gap-2 mt-4">
                {viewAs !== 'employee' && (
                  <div className="relative flex-grow max-w-md">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          type="search"
                          placeholder="이름 또는 ID로 검색..."
                          className="w-full pl-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                )}
                 <Button onClick={openAddDialog} variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    신규 추가
                </Button>
                <Button onClick={openEditDialog} variant="outline" size="sm" disabled={currentSelectedIds.size !== 1}>
                    <Edit className="mr-2 h-4 w-4" />
                    선택 변경
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg overflow-x-auto">
                {tableData.length > 0 
                  ? (type === 'shortenedWork' ? renderShortenedWorkTable() : renderDailyAttendanceTable())
                  : (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">데이터가 없습니다. 새로운 데이터를 추가하려면 [신규추가] 버튼을 눌러주세요.</p>
                    </div>
                  )
                }
            </div>
        </CardContent>
    </Card>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Document className="h-5 w-5" />
            {dialogMode === 'add' ? '신규 근무 데이터 추가' : '근무 데이터 변경'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 요청 정보 */}
          <div>
            <div className="mb-3">
              <h3 className="text-lg font-semibold">요청 정보</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">요청자:</span> {user?.name} ({user?.uniqueId})
                </div>
                <div>
                  <span className="font-medium">요청일시:</span> <span className="text-muted-foreground">{new Date().toLocaleString('ko-KR')}</span>
                </div>
              </div>
              <div>
                <span className="font-medium">요청내용:</span> {type === 'shortenedWork' ? '단축근로' : '일근태'} 데이터 {dialogMode === 'add' ? '추가' : '변경'}
              </div>
              <div>
                <span className="font-medium">변경 내용:</span>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  {renderDialogContent()}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 결재자 확인 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">결재자 확인</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">1차 현업 결재:</span>
                  <span className="text-muted-foreground">{approverInfo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">-</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">2차 인사부 결재:</span>
                  <span className="text-muted-foreground">관리자 (admin)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between items-center pt-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
            <Button onClick={handleSubmitForApproval}>결재상신</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

