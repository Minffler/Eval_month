'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { EvaluationResult, Holiday } from '@/lib/types';
import type { WorkRateDetailsResult } from '@/lib/work-rate-calculator';
import { Button } from '../ui/button';
import { ArrowUpDown, Download, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';

interface WorkRateManagementProps {
  results: EvaluationResult[];
  workRateDetails: WorkRateDetailsResult;
  selectedDate: { year: number, month: number };
  holidays: Holiday[];
}

interface WorkRateSummary {
  uniqueId: string;
  name: string;
  attendanceDays: number;
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
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);

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
        attendanceDays: 0,
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
        summaries[detail.uniqueId].attendanceDays++;
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
      '근태(D)': item.attendanceDays,
      '근태(H)': item.deductionHoursAttendance,
      '임신(H)': item.deductionHoursPregnancy,
      '육아/돌봄(H)': item.deductionHoursCare,
      '총 근무시간': item.totalWorkHours,
      '근무율': item.monthlyWorkRate,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '근무율');
    const fileName = `${selectedDate.year}.${selectedDate.month}_근무율.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
              <div>
                <CardTitle>근무율 조회</CardTitle>
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
                <span className="font-semibold text-foreground">{selectedDate.year}년 {selectedDate.month}월 소정근로시간:</span> 8시간 * {businessDays}일 = <span className="font-bold text-primary">{monthlyStandardHours}</span>시간
            </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer" onClick={() => requestSort('uniqueId')}><div className="flex items-center">고유사번{getSortIcon('uniqueId')}</div></TableHead>
                            <TableHead className="cursor-pointer" onClick={() => requestSort('name')}><div className="flex items-center">이름{getSortIcon('name')}</div></TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('attendanceDays')}><div className="flex items-center justify-end">근태(D){getSortIcon('attendanceDays')}</div></TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('deductionHoursAttendance')}><div className="flex items-center justify-end">근태(H){getSortIcon('deductionHoursAttendance')}</div></TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('deductionHoursPregnancy')}><div className="flex items-center justify-end">임신(H){getSortIcon('deductionHoursPregnancy')}</div></TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('deductionHoursCare')}><div className="flex items-center justify-end">육아/돌봄(H){getSortIcon('deductionHoursCare')}</div></TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('totalWorkHours')}><div className="flex items-center justify-end">총 근무시간{getSortIcon('totalWorkHours')}</div></TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('monthlyWorkRate')}><div className="flex items-center justify-end">근무율{getSortIcon('monthlyWorkRate')}</div></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedData.map(summary => (
                        <TableRow key={summary.uniqueId}>
                          <TableCell>{summary.uniqueId}</TableCell>
                          <TableCell>{summary.name}</TableCell>
                          <TableCell className="text-right">{summary.attendanceDays}일</TableCell>
                          <TableCell className="text-right">{summary.deductionHoursAttendance.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{summary.deductionHoursPregnancy.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{summary.deductionHoursCare.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{summary.totalWorkHours.toFixed(2)}</TableCell>
                          <TableCell className="font-bold text-primary text-right">{(summary.monthlyWorkRate * 100).toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
  );
}
