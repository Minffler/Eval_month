'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Settings2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import GradeManagement from './grade-management';
import type { Employee, EvaluationResult, Holiday, ShortenedWorkType, AppNotification, AttendanceType, User, WorkRateInputs, Grade, GradeInfo } from '@/lib/types';
import { calculateWorkRateDetails, type WorkRateDetailsResult, type ShortenedWorkDetail, type DailyAttendanceDetail } from '@/lib/work-rate-calculator';
import { useEvaluation } from '@/contexts/evaluation-context';
import { useNotifications } from '@/contexts/notification-context';
import { cn, formatDateTime } from '@/lib/utils';

interface WorkRateManagementProps {
  results: (EvaluationResult | User)[];
  workRateInputs: Record<string, WorkRateInputs>;
  selectedDate: { year: number, month: number };
  holidays: Holiday[];
  setHolidays?: React.Dispatch<React.SetStateAction<Holiday[]>>;
  attendanceTypes: AttendanceType[];
  setAttendanceTypes?: React.Dispatch<React.SetStateAction<AttendanceType[]>>;
  handleResultsUpdate?: (updatedResults: EvaluationResult[]) => void;
  addNotification?: (notification: Omit<AppNotification, 'id' | 'date' | 'isRead'>) => void;
  gradingScale?: Record<NonNullable<Grade>, GradeInfo>;
}

type DeductionType = 'attendance' | 'pregnancy' | 'care';

interface WorkRateSummary {
  uniqueId: string;
  name: string;
  deductionHoursAttendance: number;
  deductionHoursPregnancy: number;
  deductionHoursCare: number;
  totalDeductionHours: number;
  totalWorkHours: number;
  monthlyWorkRate: number;
  lastModified?: string;
}

type SortConfig = {
  key: keyof WorkRateSummary;
  direction: 'ascending' | 'descending';
} | null;

type DetailDialogInfo = {
  isOpen: boolean;
  title: string;
  data: (ShortenedWorkDetail | DailyAttendanceDetail)[];
  type: 'attendance' | 'shortened';
}

function countBusinessDaysForMonth(year: number, month: number, holidays: Set<string>): number {
  let count = 0;
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    const dateString = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(dateString)) {
      count++;
    }
    date.setDate(date.getDate() + 1);
  }
  return count;
}

const columnConfig = [
  { id: 'attendance' as const, label: '근태' },
  { id: 'pregnancy' as const, label: '임신' },
  { id: 'care' as const, label: '육아/돌봄' },
];

export default function WorkRateManagement({ 
  results, 
  workRateInputs, 
  selectedDate, 
  holidays, 
  setHolidays,
  attendanceTypes,
  setAttendanceTypes,
  handleResultsUpdate,
  addNotification,
  gradingScale,
}: WorkRateManagementProps) {
  const { toast } = useToast();
  const { allEvaluationResults, handleEmployeeUpload } = useEvaluation();
  const { addNotification: contextAddNotification } = useNotifications();
  
  const [detailDialog, setDetailDialog] = React.useState<DetailDialogInfo>({
    isOpen: false,
    title: '',
    data: [],
    type: 'attendance',
  });
  const [visibleColumns, setVisibleColumns] = React.useState<Set<DeductionType>>(
    new Set(['attendance', 'pregnancy', 'care'])
  );
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);

  const workRateDetails = React.useMemo(() => {
    return calculateWorkRateDetails(
      workRateInputs,
      attendanceTypes,
      holidays,
      selectedDate.year,
      selectedDate.month
    );
  }, [workRateInputs, attendanceTypes, holidays, selectedDate]);

  const businessDays = React.useMemo(() => {
    const holidaySet = new Set(holidays.map(h => h.date));
    return countBusinessDaysForMonth(selectedDate.year, selectedDate.month, holidaySet);
  }, [selectedDate, holidays]);

  const monthlyStandardHours = businessDays * 8;

  const workRateSummaries = React.useMemo(() => {
    const resultMap = new Map(results.map(r => [r.uniqueId, r]));
    const summaries: Record<string, WorkRateSummary> = {};
    let lastModifiedTimestamps: Record<string, string> = {};

    // Initialize summaries for all results
    results.forEach(result => {
      summaries[result.uniqueId] = {
        uniqueId: result.uniqueId,
        name: result.name || 'Unknown',
        deductionHoursAttendance: 0,
        deductionHoursPregnancy: 0,
        deductionHoursCare: 0,
        totalDeductionHours: 0,
        totalWorkHours: monthlyStandardHours,
        monthlyWorkRate: 1,
        lastModified: undefined,
      };
    });

    // Process daily attendance details
    workRateDetails.dailyAttendanceDetails.forEach(detail => {
      if (summaries[detail.uniqueId]) {
        summaries[detail.uniqueId].deductionHoursAttendance += detail.totalDeductionHours;
        summaries[detail.uniqueId].totalDeductionHours += detail.totalDeductionHours;
        if (detail.lastModified) {
          lastModifiedTimestamps[detail.uniqueId] = detail.lastModified;
        }
      }
    });

    // Process shortened work details
    workRateDetails.shortenedWorkDetails.forEach(detail => {
      if (summaries[detail.uniqueId]) {
        if (detail.type === '임신') {
          summaries[detail.uniqueId].deductionHoursPregnancy += detail.totalDeductionHours;
        } else if (detail.type === '육아/돌봄') {
          summaries[detail.uniqueId].deductionHoursCare += detail.totalDeductionHours;
        }
        summaries[detail.uniqueId].totalDeductionHours += detail.totalDeductionHours;
        if (detail.lastModified) {
          lastModifiedTimestamps[detail.uniqueId] = detail.lastModified;
        }
      }
    });

    // Calculate final work rates and hours
    Object.values(summaries).forEach(summary => {
      summary.totalWorkHours = monthlyStandardHours - summary.totalDeductionHours;
      summary.monthlyWorkRate = summary.totalWorkHours / monthlyStandardHours;
      summary.lastModified = lastModifiedTimestamps[summary.uniqueId];
    });

    return Object.values(summaries);
  }, [results, workRateDetails, monthlyStandardHours]);

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = workRateSummaries;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(summary => 
        summary.name.toLowerCase().includes(searchLower) ||
        summary.uniqueId.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortConfig.direction === 'ascending' ? comparison : -comparison;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [workRateSummaries, searchTerm, sortConfig]);

  // Event handlers
  const requestSort = (key: keyof WorkRateSummary) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'ascending' ? 'descending' : 'ascending' };
      }
      return { key, direction: 'ascending' };
    });
  };

  const getSortIcon = (key: keyof WorkRateSummary) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="ml-1 h-3 w-3" />;
    return sortConfig.direction === 'ascending' ? 
      <ArrowUp className="ml-1 h-3 w-3" /> : 
      <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const getWorkRateStyle = (rate: number): string => {
    if (rate < 0.25) {
      return "text-orange-600";
    } else {
      return "text-foreground";
    }
  };

  const openDetailsDialog = (employeeId: string, employeeName: string, type: 'attendance' | 'pregnancy' | 'care') => {
    let dialogTitle = '';
    let dialogData: (ShortenedWorkDetail | DailyAttendanceDetail)[] = [];
    let dialogType: 'attendance' | 'shortened' = 'attendance';

    if (type === 'attendance') {
      dialogTitle = `${employeeName}님의 일근태 상세`;
      dialogData = workRateDetails.dailyAttendanceDetails.filter(d => d.uniqueId === employeeId);
      dialogType = 'attendance';
    } else {
      const shortenedType: ShortenedWorkType = type === 'pregnancy' ? '임신' : '육아/돌봄';
      dialogTitle = `${employeeName}님의 ${shortenedType} 단축근로 상세`;
      dialogData = workRateDetails.shortenedWorkDetails.filter(d => d.uniqueId === employeeId && d.type === shortenedType);
      dialogType = 'shortened';
    }

    setDetailDialog({ isOpen: true, title: dialogTitle, data: dialogData, type: dialogType });
  };

  const handleToggleColumn = (columnId: DeductionType) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const handleDownloadExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Prepare data for export
      const exportData = filteredAndSortedData.map(summary => ({
        '고유사번': summary.uniqueId,
        '이름': summary.name,
        '근태(H)': summary.deductionHoursAttendance.toFixed(2),
        '임신(H)': summary.deductionHoursPregnancy.toFixed(2),
        '육아/돌봄(H)': summary.deductionHoursCare.toFixed(2),
        '총 미근로시간': summary.totalDeductionHours.toFixed(2),
        '근로시간': summary.totalWorkHours.toFixed(2),
        '근무율': `${(summary.monthlyWorkRate * 100).toFixed(1)}%`,
        '수정일시': summary.lastModified || '-',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, '근무율 조회');
      
      const fileName = `${selectedDate.year}년_${selectedDate.month}월_근무율_조회.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: '다운로드 완료',
        description: `${fileName} 파일이 다운로드되었습니다.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '다운로드 실패',
        description: '엑셀 파일 생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleApplyWorkRate = () => {
    if (!handleResultsUpdate) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '근무율 반영 기능을 사용할 수 없습니다.',
      });
      return;
    }

    // 근무율 조회/반영 화면에서 계산된 근무율로 모든 결과 업데이트
    const updatedResults = allEvaluationResults.map(result => {
      const summary = workRateSummaries.find(s => s.uniqueId === result.uniqueId);
      if (summary) {
        // 근무율 조회/반영 화면에서 계산된 근무율로 업데이트 (엑셀 데이터 무시)
        const newWorkRate = summary.monthlyWorkRate;
        
        // 등급 정보가 있는 경우 최종 금액 재계산
        let finalAmount = result.finalAmount;
        if (result.grade && gradingScale && gradingScale[result.grade]) {
          const gradeInfo = gradingScale[result.grade];
          const payoutRate = (gradeInfo.payoutRate || 0) / 100;
          const gradeAmount = (result.baseAmount || 0) * payoutRate;
          finalAmount = gradeAmount * newWorkRate;
        }
        
        return {
          ...result,
          workRate: newWorkRate,
          finalAmount: finalAmount,
        };
      }
      return result;
    });
    
    // 중복 제거: uniqueId를 기준으로 중복된 결과 제거
    const uniqueUpdatedResults = updatedResults.filter((result, index, self) => 
      index === self.findIndex(r => r.uniqueId === result.uniqueId)
    );
    
    console.log('=== 중복 제거 전/후 (WorkRateManagement) ===');
    console.log('원본 updatedResults 길이:', updatedResults.length);
    console.log('중복 제거 후 uniqueUpdatedResults 길이:', uniqueUpdatedResults.length);

    // 근무율이 변경된 결과만 필터링
    const resultsWithWorkRateChanges = uniqueUpdatedResults.filter(result => {
      const originalResult = allEvaluationResults.find(r => r.id === result.id);
      return originalResult && Math.abs(result.workRate - originalResult.workRate) > 0.001;
    });

    if (resultsWithWorkRateChanges.length === 0) {
      toast({
        title: '알림',
        description: '변경된 근무율이 없습니다.',
      });
      return;
    }

    // 디버깅용 로그
    console.log('=== 근무율 반영 디버깅 ===');
    console.log('workRateSummaries:', workRateSummaries);
    console.log('uniqueUpdatedResults:', uniqueUpdatedResults);
    console.log('resultsWithWorkRateChanges:', resultsWithWorkRateChanges);
    console.log('========================');

    console.log('=== handleResultsUpdate 호출 전 ===');
    console.log('handleResultsUpdate 함수 존재:', !!handleResultsUpdate);
    console.log('uniqueUpdatedResults 길이:', uniqueUpdatedResults.length);
    
    if (handleResultsUpdate) {
      handleResultsUpdate(uniqueUpdatedResults);
      console.log('=== handleResultsUpdate 호출 완료 ===');
    } else {
      console.log('=== handleResultsUpdate 함수가 없음 ===');
    }
    
    toast({
      title: '근무율 반영 완료',
      description: `${resultsWithWorkRateChanges.length}명의 직원 근무율이 평가 결과에 반영되었습니다.`,
    });

    // Add notification if available
    const notificationHandler = addNotification || contextAddNotification;
    if (notificationHandler) {
      notificationHandler({
        recipientId: 'admin',
        title: '근무율 반영 완료',
        message: `${selectedDate.year}년 ${selectedDate.month}월 근무율이 반영되었습니다.`,
        isImportant: true,
      });
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    return formatDateTime(timestamp);
  };

  // Clickable cell component
  const ClickableCell = ({ value, onClick }: { value: number; onClick: () => void }) => (
    <TableCell className="text-center tabular-nums">
      {value > 0 ? (
        <Button variant="link" size="sm" onClick={onClick} className="h-auto p-0 text-foreground">
          {value.toFixed(2)}
        </Button>
      ) : (
        <span className="text-muted-foreground">-</span>
      )}
    </TableCell>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          {/* 제목 및 액션 버튼 */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
            <div>
              <CardTitle>{selectedDate.year}년 {selectedDate.month}월 근무율 조회/반영</CardTitle>
              <CardDescription>
                직원의 월별 근로시간, 근태 사용, 단축근로 등을 종합하여 최종 근무율을 조회합니다.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {setHolidays && setAttendanceTypes && (
                <Button onClick={() => setIsSettingsDialogOpen(true)} variant="outline" size="sm">
                  <Settings2 className="mr-2 h-4 w-4" />
                  근무기준 설정
                </Button>
              )}
              <Button onClick={handleDownloadExcel} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                엑셀 다운로드
              </Button>
              {handleResultsUpdate && (
                <Button onClick={handleApplyWorkRate} size="sm">근무율 반영</Button>
              )}
            </div>
          </div>
          
          {/* 검색 및 요약 정보 */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="이름 또는 ID로 검색..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                <span className="font-semibold text-foreground">월 소정근로시간:</span> 8시간 * {businessDays}일 = <span className="font-bold text-primary">{monthlyStandardHours}</span>시간
              </div>
              <Tabs defaultValue="all" onValueChange={() => {}}>
                <TabsList className="h-8">
                  {columnConfig.map(col => (
                    <TabsTrigger
                      key={col.id}
                      value={col.id}
                      className={cn(
                        "text-xs px-2 py-1 h-auto",
                        !visibleColumns.has(col.id) && "text-muted-foreground/70"
                      )}
                      data-state={visibleColumns.has(col.id) ? 'active' : 'inactive'}
                      onClick={() => handleToggleColumn(col.id)}
                    >
                      {col.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer text-center" onClick={() => requestSort('uniqueId')}>
                    <div className="flex items-center justify-center">고유사번{getSortIcon('uniqueId')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => requestSort('name')}>
                    <div className="flex items-center justify-center">이름{getSortIcon('name')}</div>
                  </TableHead>
                  {visibleColumns.has('attendance') && (
                    <TableHead className="cursor-pointer text-center" onClick={() => requestSort('deductionHoursAttendance')}>
                      <div className="flex items-center justify-center">근태(H){getSortIcon('deductionHoursAttendance')}</div>
                    </TableHead>
                  )}
                  {visibleColumns.has('pregnancy') && (
                    <TableHead className="cursor-pointer text-center" onClick={() => requestSort('deductionHoursPregnancy')}>
                      <div className="flex items-center justify-center">임신(H){getSortIcon('deductionHoursPregnancy')}</div>
                    </TableHead>
                  )}
                  {visibleColumns.has('care') && (
                    <TableHead className="cursor-pointer text-center" onClick={() => requestSort('deductionHoursCare')}>
                      <div className="flex items-center justify-center">육아/돌봄(H){getSortIcon('deductionHoursCare')}</div>
                    </TableHead>
                  )}
                  <TableHead className="cursor-pointer text-center" onClick={() => requestSort('totalDeductionHours')}>
                    <div className="flex items-center justify-center">총 미근로시간{getSortIcon('totalDeductionHours')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-center min-w-[250px]" onClick={() => requestSort('totalWorkHours')}>
                    <div className="flex items-center justify-center">근로/미근로 시간{getSortIcon('totalWorkHours')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => requestSort('monthlyWorkRate')}>
                    <div className="flex items-center justify-center">근무율{getSortIcon('monthlyWorkRate')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => requestSort('lastModified')}>
                    <div className="flex items-center justify-center">수정일시{getSortIcon('lastModified')}</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {filteredAndSortedData.map(summary => (
                  <TableRow key={summary.uniqueId}>
                    <TableCell className="tabular-nums text-center">{summary.uniqueId}</TableCell>
                    <TableCell className="text-center">{summary.name}</TableCell>
                    {visibleColumns.has('attendance') && (
                      <ClickableCell 
                        value={summary.deductionHoursAttendance} 
                        onClick={() => openDetailsDialog(summary.uniqueId, summary.name, 'attendance')} 
                      />
                    )}
                    {visibleColumns.has('pregnancy') && (
                      <ClickableCell 
                        value={summary.deductionHoursPregnancy} 
                        onClick={() => openDetailsDialog(summary.uniqueId, summary.name, 'pregnancy')} 
                      />
                    )}
                    {visibleColumns.has('care') && (
                      <ClickableCell 
                        value={summary.deductionHoursCare} 
                        onClick={() => openDetailsDialog(summary.uniqueId, summary.name, 'care')} 
                      />
                    )}
                    <TableCell className="text-center tabular-nums">{summary.totalDeductionHours.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Progress 
                        value={summary.totalWorkHours}
                        max={monthlyStandardHours}
                        leftLabel={String(summary.totalWorkHours.toFixed(2))}
                        rightLabel={String(summary.totalDeductionHours.toFixed(2))}
                        indicatorClassName="bg-stone-200"
                        className="w-[200px] mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      <div className={cn("text-center font-semibold w-20 mx-auto", getWorkRateStyle(summary.monthlyWorkRate))}>
                        {(summary.monthlyWorkRate * 100).toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">{formatTimestamp(summary.lastModified)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 상세 팝업 다이얼로그 */}
      <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog(prev => ({ ...prev, isOpen }))}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{detailDialog.title}</DialogTitle>
            <DialogDescription>
              해당 직원의 상세 데이터 내역입니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 px-1">
            <p className="text-sm font-semibold">
              총 미근로시간 소계: <span className="text-primary font-bold">
                {detailDialog.data.reduce((sum, item) => {
                  if ('totalDeductionHours' in item) {
                    return sum + item.totalDeductionHours;
                  }
                  return sum;
                }, 0).toFixed(2)}
              </span> 시간
            </p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
            <Table>
              {detailDialog.type === 'attendance' ? (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">일자</TableHead>
                      <TableHead className="text-center">근태 종류</TableHead>
                      <TableHead className="text-center">단축사용</TableHead>
                      <TableHead className="text-right text-center">차감일수</TableHead>
                      <TableHead className="text-right text-center">실근로(H)</TableHead>
                      <TableHead className="text-right text-center">미근로시간</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(detailDialog.data as DailyAttendanceDetail[]).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center">{item.date}</TableCell>
                        <TableCell className="text-center">{item.type}</TableCell>
                        <TableCell className="text-center">{item.isShortenedDay ? 'Y' : 'N'}</TableCell>
                        <TableCell className="text-right text-center">{item.deductionDays.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-center">{item.actualWorkHours.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-center">{item.totalDeductionHours.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              ) : (
                <>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">시작일</TableHead>
                      <TableHead className="text-center">종료일</TableHead>
                      <TableHead className="text-center">일수</TableHead>
                      <TableHead className="text-center">출근시각</TableHead>
                      <TableHead className="text-center">퇴근시각</TableHead>
                      <TableHead className="text-center">실근로(H)</TableHead>
                      <TableHead className="text-center">미근로시간</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(detailDialog.data as ShortenedWorkDetail[]).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center">{item.startDate}</TableCell>
                        <TableCell className="text-center">{item.endDate}</TableCell>
                        <TableCell className="text-center">{item.businessDays}</TableCell>
                        <TableCell className="text-center">{item.startTime}</TableCell>
                        <TableCell className="text-center">{item.endTime}</TableCell>
                        <TableCell className="text-center">{item.actualWorkHours.toFixed(2)}</TableCell>
                        <TableCell className="text-center">{item.totalDeductionHours.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 근무기준 설정 팝업 다이얼로그 */}
      {setHolidays && setAttendanceTypes && (
        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>근무기준 및 공휴일 관리</DialogTitle>
              <DialogDescription>
                근무율 계산에 사용되는 근무기준과 공휴일을 관리합니다.
              </DialogDescription>
            </DialogHeader>
            <GradeManagement
              isGradeCard={false}
              attendanceTypes={attendanceTypes}
              setAttendanceTypes={setAttendanceTypes}
              holidays={holidays}
              setHolidays={setHolidays}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>닫기</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
