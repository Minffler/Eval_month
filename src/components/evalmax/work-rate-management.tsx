'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { EvaluationResult, Holiday } from '@/lib/types';
import type { WorkRateDetailsResult } from '@/lib/work-rate-calculator';

interface WorkRateManagementProps {
  results: EvaluationResult[];
  workRateDetails: WorkRateDetailsResult;
  selectedDate: { year: number, month: number };
  holidays: Holiday[];
}

interface WorkRateSummary {
  uniqueId: string;
  name: string;
  department: string;
  title: string;
  attendanceDays: number;
  deductionHoursAttendance: number;
  deductionHoursPregnancy: number;
  deductionHoursCare: number;
  totalDeductionHours: number;
  totalWorkHours: number;
  monthlyWorkRate: number;
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
        department: emp.department,
        title: emp.title,
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
      summary.monthlyWorkRate = monthlyStandardHours > 0 ? (summary.totalWorkHours / monthlyStandardHours) * 100 : 0;
    });

    return Object.values(summaries);
  }, [results, workRateDetails, monthlyStandardHours]);

  return (
    <Card>
        <CardHeader>
            <CardTitle>근무율 조회</CardTitle>
            <CardDescription>
                직원의 월별 근로시간, 근태 사용, 단축근로 등을 종합하여 최종 근무율을 조회합니다.
            </CardDescription>
            <div className="pt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">월 소정근로시간:</span> 8시간 * {businessDays}일 = <span className="font-bold text-primary">{monthlyStandardHours}</span>시간
            </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>고유사번</TableHead>
                            <TableHead>이름</TableHead>
                            <TableHead>부서</TableHead>
                            <TableHead>직책</TableHead>
                            <TableHead>근태사용일수</TableHead>
                            <TableHead>차감(근태)</TableHead>
                            <TableHead>차감(임신)</TableHead>
                            <TableHead>차감(육아/돌봄)</TableHead>
                            <TableHead>총 차감시간</TableHead>
                            <TableHead>총 근무시간</TableHead>
                            <TableHead>근무율(월)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workRateSummaries.map(summary => (
                        <TableRow key={summary.uniqueId}>
                          <TableCell>{summary.uniqueId}</TableCell>
                          <TableCell>{summary.name}</TableCell>
                          <TableCell>{summary.department}</TableCell>
                          <TableCell>{summary.title}</TableCell>
                          <TableCell>{summary.attendanceDays}일</TableCell>
                          <TableCell>{summary.deductionHoursAttendance.toFixed(2)}</TableCell>
                          <TableCell>{summary.deductionHoursPregnancy.toFixed(2)}</TableCell>
                          <TableCell>{summary.deductionHoursCare.toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">{summary.totalDeductionHours.toFixed(2)}</TableCell>
                          <TableCell>{summary.totalWorkHours.toFixed(2)}</TableCell>
                          <TableCell className="font-bold text-primary">{summary.monthlyWorkRate.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
  );
}
