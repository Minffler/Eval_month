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
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Download, PlusCircle } from 'lucide-react';
import type { Employee } from '@/lib/types';
import type { ShortenedWorkDetail, DailyAttendanceDetail } from '@/lib/work-rate-calculator';
import { Button } from '../ui/button';
import * as XLSX from 'xlsx';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortConfig<T> = {
  key: keyof T;
  direction: 'ascending' | 'descending';
} | null;

interface WorkRateDetailsProps {
  type: 'shortenedWork' | 'dailyAttendance';
  data: any[];
  selectedDate: { year: number, month: number };
  allEmployees: Employee[];
}

const ShortenedWorkTypeIcon = ({ type }: { type: '임신' | '육아/돌봄' }) => {
    let style: React.CSSProperties, className: string;

    switch (type) {
        case '임신':
            style = { backgroundColor: 'hsl(30, 20%, 98%)' };
            className = "mx-auto flex h-6 w-20 items-center justify-center rounded-md text-xs font-semibold text-stone-700";
            break;
        case '육아/돌봄':
            style = { backgroundColor: 'hsl(25, 20%, 92%)', color: 'hsl(25, 25%, 35%)' };
            className = "mx-auto flex h-6 w-20 items-center justify-center rounded-md text-xs font-semibold";
            break;
        default:
            return <span>{type}</span>;
    }
    return <div className={cn(className, "text-stone-700")} style={style}>{type}</div>;
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


export default function WorkRateDetails({ type, data, selectedDate, allEmployees }: WorkRateDetailsProps) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<SortConfig<any>>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<any>({});
  
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.uniqueId.includes(searchTerm)
    );
  }, [data, searchTerm]);

  const sortedData = React.useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
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

  const handleOpenDialog = () => {
    let initialData = {};
    const uniqueIdsInData = new Set(filteredData.map(item => item.uniqueId));
    if (filteredData.length > 0 && uniqueIdsInData.size === 1) {
        initialData = { uniqueId: filteredData[0].uniqueId };
    }
    setFormData(initialData);
    setIsDialogOpen(true);
  };
  
  const handleFormChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmitForApproval = () => {
    if (!user) {
      toast({ variant: 'destructive', title: '오류', description: '로그인 정보가 없습니다.' });
      return;
    }
    
    // 1. Find employee and evaluator
    const employee = allEmployees.find(e => e.uniqueId === formData.uniqueId);
    if (!employee) {
      toast({ variant: 'destructive', title: '오류', description: '해당 ID의 직원을 찾을 수 없습니다.' });
      return;
    }
    const evaluator = allEmployees.find(e => e.uniqueId === employee.evaluatorId);
    
    const dataType = type === 'shortenedWork' ? '단축근로' : '일근태';
    const message = `[결재요청] ${employee.name}님의 ${dataType} 데이터 변경 요청이 있습니다.`;

    if (user.roles?.includes('admin')) {
        // Admin auto-approval
        // TODO: Implement actual data saving logic here. For now, just show a toast.
        toast({ title: '자동 승인 완료', description: '관리자 권한으로 데이터가 즉시 저장 및 반영되었습니다.' });
    } else {
        // Start approval workflow
        addNotification({ recipientId: employee.uniqueId, message }); // Notify self
        if (evaluator) {
            addNotification({ recipientId: evaluator.uniqueId, message }); // Notify evaluator
        }
        addNotification({ recipientId: '1911042', message }); // Notify admin
        toast({ title: '결재 상신 완료', description: '결재 라인에 따라 알림이 발송되었습니다.' });
    }

    setIsDialogOpen(false);
  };

  const renderDialogContent = () => {
    if (type === 'shortenedWork') {
      return (
        <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="uniqueId" className="text-right">ID</Label>
              <Input id="uniqueId" value={formData.uniqueId || ''} onChange={(e) => handleFormChange('uniqueId', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">구분</Label>
                <Select value={formData.type || ''} onValueChange={(value) => handleFormChange('type', value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="구분 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="임신">임신</SelectItem>
                        <SelectItem value="육아/돌봄">육아/돌봄</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">시작일</Label>
              <Input id="startDate" type="date" value={formData.startDate || ''} onChange={(e) => handleFormChange('startDate', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">종료일</Label>
              <Input id="endDate" type="date" value={formData.endDate || ''} onChange={(e) => handleFormChange('endDate', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">출근시각</Label>
              <Input id="startTime" type="time" value={formData.startTime || ''} onChange={(e) => handleFormChange('startTime', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">퇴근시각</Label>
              <Input id="endTime" type="time" value={formData.endTime || ''} onChange={(e) => handleFormChange('endTime', e.target.value)} className="col-span-3" />
            </div>
        </div>
      );
    }
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="uniqueId" className="text-right">ID</Label>
              <Input id="uniqueId" value={formData.uniqueId || ''} onChange={(e) => handleFormChange('uniqueId', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">일자</Label>
              <Input id="date" type="date" value={formData.date || ''} onChange={(e) => handleFormChange('date', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">근태 종류</Label>
              <Input id="type" value={formData.type || ''} onChange={(e) => handleFormChange('type', e.target.value)} className="col-span-3" />
            </div>
        </div>
    );
  };
  
  const renderShortenedWorkTable = () => {
    const tableData = sortedData as ShortenedWorkDetail[];
    return (
        <Table>
          <TableHeader>
            <TableRow>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((item, index) => {
                const actualWorkHours = item.actualWorkHours;
                const nonWorkHours = 8 - actualWorkHours;
                return (
                    <TableRow key={`${item.uniqueId}-${index}`}>
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
                    </TableRow>
                )
            })}
          </TableBody>
          {searchTerm && (
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={9} className="text-right font-bold">총 미근로시간 소계</TableCell>
                    <TableCell className="font-bold tabular-nums text-center">{totalDeductionHours.toFixed(2)}</TableCell>
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
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('uniqueId')}><div className="flex items-center justify-center">ID{getSortIcon('uniqueId')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('name')}><div className="flex items-center justify-center">이름{getSortIcon('name')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('date')}><div className="flex items-center justify-center">일자{getSortIcon('date')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('type')}><div className="flex items-center justify-center">근태 종류{getSortIcon('type')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('isShortenedDay')}><div className="flex items-center justify-center">단축사용{getSortIcon('isShortenedDay')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('deductionDays')}><div className="flex items-center justify-center">일수(D){getSortIcon('deductionDays')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('actualWorkHours')}><div className="flex items-center justify-center">실근로(H){getSortIcon('actualWorkHours')}</div></TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => requestSort('totalDeductionHours')}><div className="flex items-center justify-center">미근로시간{getSortIcon('totalDeductionHours')}</div></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((item, index) => (
              <TableRow key={`${item.uniqueId}-${index}`}>
                <TableCell className="text-center">{item.uniqueId}</TableCell>
                <TableCell className="text-center">{item.name}</TableCell>
                <TableCell className="text-center">{item.date}</TableCell>
                <TableCell className="text-center">{item.type}</TableCell>
                <TableCell className="text-center"><DailyAttendanceIcon isShortenedDay={item.isShortenedDay} /></TableCell>
                <TableCell className="text-center">{item.deductionDays.toFixed(2)}</TableCell>
                <TableCell className="text-center">{item.actualWorkHours.toFixed(2)}</TableCell>
                <TableCell className="text-center font-bold">{item.totalDeductionHours.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
           {searchTerm && (
              <TableFooter>
                  <TableRow>
                      <TableCell colSpan={7} className="text-right font-bold">총 미근로시간 소계</TableCell>
                      <TableCell className="font-bold tabular-nums text-center">{totalDeductionHours.toFixed(2)}</TableCell>
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
                 <Button onClick={handleOpenDialog} variant="outline" size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    데이터 추가/변경
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg overflow-x-auto">
                {data.length > 0 
                  ? (type === 'shortenedWork' ? renderShortenedWorkTable() : renderDailyAttendanceTable())
                  : (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">데이터가 없습니다. 파일 업로드 화면에서 데이터를 업로드해주세요.</p>
                    </div>
                  )
                }
            </div>
        </CardContent>
    </Card>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>데이터 추가/변경</DialogTitle>
            <DialogDescription>
                {type === 'shortenedWork' ? '단축근로' : '일근태'} 정보를 입력하고 결재를 상신합니다.
            </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            {renderDialogContent()}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
            <Button onClick={handleSubmitForApproval}>결재상신</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
