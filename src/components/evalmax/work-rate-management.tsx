'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { EvaluationResult, Holiday, ShortenedWorkType } from '@/lib/types';
import type { WorkRateDetailsResult, ShortenedWorkDetail, DailyAttendanceDetail } from '@/lib/work-rate-calculator';
import { Button } from '../ui/button';
import { ArrowUpDown, Download, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface WorkRateManagementProps {
  results: EvaluationResult[];
  workRateDetails: WorkRateDetailsResult;
  selectedDate: { year: number, month: number };
  holidays: Holiday[];
}

interface WorkRateSummary {
  uniqueId: string;
  name: string;
  deductionHoursAttendance: number;
  deductionHoursPregnancy: number;
  deductionHoursCare: number;
  totalDeductionHours: number;
  totalWorkHours: number;
  monthlyWorkRate: number;
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


export default function WorkRateManagement({ results, workRateDetails, selectedDate, holidays }: WorkRateManagementProps) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'monthlyWorkRate', direction: 'ascending' });
  const [detailDialog, setDetailDialog] = React.useState<DetailDialogInfo>({
    isOpen: false,
    title: '',
    data: [],
    type: 'attendance',
  });

  const businessDays = React.useMemo(() => {
    const holidaySet = new Set(holidays.map(h => h.date));
    return countBusinessDaysForMonth(selectedDate.year, selectedDate.month, holidaySet);
  }, [selectedDate, holidays]);

  const monthlyStandardHours = businessDays * 8;

  const workRateSummaries = React.useMemo(() => {
    const summaries: Record<string, WorkRateSummary> = {};

    results.forEach(emp => {
      summaries[emp.uniqueId] = {
        uniqueId: emp.uniqueId,
        name: emp.name,
        deductionHoursAttendance: 0,
        deductionHoursPregnancy: 0,
        deductionHoursCare: 0,
        totalDeductionHours: 0,
        totalWorkHours: 0,
        monthlyWorkRate: 0,
      };
    });
    
    workRateDetails.dailyAttendanceDetails.forEach(detail => {
      if(summaries[detail.uniqueId]) {
        summaries[detail.uniqueId].deductionHoursAttendance += detail.totalDeductionHours;
      }
    });

    workRateDetails.shortenedWorkDetails.forEach(detail => {
       if(summaries[detail.uniqueId]) {
          if (detail.type === '임신') {
            summaries[detail.uniqueId].deductionHoursPregnancy += detail.totalDeductionHours;
          } else {
            summaries[detail.uniqueId].deductionHoursCare += detail.totalDeductionHours;
          }
       }
    });

    Object.values(summaries).forEach(summary => {
      summary.totalDeductionHours = summary.deductionHoursAttendance + summary.deductionHoursPregnancy + summary.deductionHoursCare;
      summary.totalWorkHours = Math.max(0, monthlyStandardHours - summary.totalDeductionHours);
      summary.monthlyWorkRate = monthlyStandardHours > 0 ? (summary.totalWorkHours / monthlyStandardHours) : 0;
    });

    return Object.values(summaries);
  }, [results, workRateDetails, monthlyStandardHours]);

  const sortedData = React.useMemo(() => {
    let sortableItems = [...workRateSummaries];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [workRateSummaries, sortConfig]);

  const requestSort = (key: keyof WorkRateSummary) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof WorkRateSummary) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' 
        ? <ArrowUp className="ml-2 h-4 w-4 text-primary" /> 
        : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const handleDownloadExcel = () => {
    const dataToExport = sortedData.map(item => ({
      '고유사번': item.uniqueId,
      '이름': item.name,
      '근태(H)': item.deductionHoursAttendance,
      '임신(H)': item.deductionHoursPregnancy,
      '육아/돌봄(H)': item.deductionHoursCare,
      '미근로시간': item.totalDeductionHours,
      '근로시간': item.totalWorkHours,
      '근무율': item.monthlyWorkRate,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '근무율');
    const fileName = `${selectedDate.year}.${selectedDate.month}_근무율.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  
  const getWorkRateStyle = (rate: number): string => {
    if (rate >= 0.7) {
      return "";
    } else if (rate >= 0.25) {
      return "text-amber-600";
    } else {
      return "text-stone-400";
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
    <>
    <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
              <div>
                <CardTitle>{selectedDate.year}년 {selectedDate.month}월 소정근로시간</CardTitle>
                <CardDescription>
                    직원의 월별 근로시간, 근태 사용, 단축근로 등을 종합하여 최종 근무율을 조회합니다.
                </CardDescription>
              </div>
              <Button onClick={handleDownloadExcel} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                엑셀 다운로드
              </Button>
            </div>
            <div className="pt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">월 소정근로시간:</span> 8시간 * {businessDays}일 = <span className="font-bold text-primary">{monthlyStandardHours}</span>시간
            </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer text-center" onClick={() => requestSort('uniqueId')}><div className="flex items-center justify-center">고유사번{getSortIcon('uniqueId')}</div></TableHead>
                            <TableHead className="cursor-pointer text-center" onClick={() => requestSort('name')}><div className="flex items-center justify-center">이름{getSortIcon('name')}</div></TableHead>
                            <TableHead className="cursor-pointer text-center" onClick={() => requestSort('deductionHoursAttendance')}><div className="flex items-center justify-center">근태(H){getSortIcon('deductionHoursAttendance')}</div></TableHead>
                            <TableHead className="cursor-pointer text-center" onClick={() => requestSort('deductionHoursPregnancy')}><div className="flex items-center justify-center">임신(H){getSortIcon('deductionHoursPregnancy')}</div></TableHead>
                            <TableHead className="cursor-pointer text-center" onClick={() => requestSort('deductionHoursCare')}><div className="flex items-center justify-center">육아/돌봄(H){getSortIcon('deductionHoursCare')}</div></TableHead>
                            <TableHead className="cursor-pointer text-center" onClick={() => requestSort('totalDeductionHours')}><div className="flex items-center justify-center">총 미근로시간{getSortIcon('totalDeductionHours')}</div></TableHead>
                            <TableHead className="cursor-pointer text-center min-w-[250px]" onClick={() => requestSort('totalWorkHours')}><div className="flex items-center justify-center">근로/미근로 시간{getSortIcon('totalWorkHours')}</div></TableHead>
                            <TableHead className="cursor-pointer text-center" onClick={() => requestSort('monthlyWorkRate')}><div className="flex items-center justify-center">근무율{getSortIcon('monthlyWorkRate')}</div></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedData.map(summary => (
                        <TableRow key={summary.uniqueId}>
                          <TableCell className="tabular-nums text-center">{summary.uniqueId}</TableCell>
                          <TableCell className="text-center">{summary.name}</TableCell>
                          <ClickableCell value={summary.deductionHoursAttendance} onClick={() => openDetailsDialog(summary.uniqueId, summary.name, 'attendance')} />
                          <ClickableCell value={summary.deductionHoursPregnancy} onClick={() => openDetailsDialog(summary.uniqueId, summary.name, 'pregnancy')} />
                          <ClickableCell value={summary.deductionHoursCare} onClick={() => openDetailsDialog(summary.uniqueId, summary.name, 'care')} />
                          <TableCell className="text-center tabular-nums">{summary.totalDeductionHours.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                             <Progress 
                                value={summary.totalWorkHours}
                                max={monthlyStandardHours}
                                leftLabel={String(summary.totalWorkHours)}
                                rightLabel={String(summary.totalDeductionHours)}
                                indicatorClassName="bg-stone-200"
                                className="w-[220px] mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            <div className={cn("px-2 py-1 rounded-md text-center font-semibold w-20 mx-auto", getWorkRateStyle(summary.monthlyWorkRate))}>
                                {(summary.monthlyWorkRate * 100).toFixed(1)}%
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>

    <Dialog open={detailDialog.isOpen} onOpenChange={(isOpen) => setDetailDialog(prev => ({ ...prev, isOpen }))}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>{detailDialog.title}</DialogTitle>
                <DialogDescription>
                    해당 직원의 상세 데이터 내역입니다.
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
                <Table>
                    {detailDialog.type === 'attendance' ? (
                        <>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>일자</TableHead>
                                    <TableHead>근태 종류</TableHead>
                                    <TableHead>단축사용</TableHead>
                                    <TableHead className="text-right">차감일수</TableHead>
                                    <TableHead className="text-right">실근로(H)</TableHead>
                                    <TableHead className="text-right">미근로시간</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(detailDialog.data as DailyAttendanceDetail[]).map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.date}</TableCell>
                                        <TableCell>{item.type}</TableCell>
                                        <TableCell>{item.isShortenedDay ? 'Y' : 'N'}</TableCell>
                                        <TableCell className="text-right">{item.deductionDays.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">{item.actualWorkHours.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">{item.totalDeductionHours.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </>
                    ) : (
                        <>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>시작일</TableHead>
                                    <TableHead>종료일</TableHead>
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
                                        <TableCell>{item.startDate}</TableCell>
                                        <TableCell>{item.endDate}</TableCell>
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
            <DialogFooter>
                <Button onClick={() => setDetailDialog(prev => ({ ...prev, isOpen: false }))}>닫기</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
