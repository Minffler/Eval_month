'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { EvaluationResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EmployeeDashboardProps {
  allResults: EvaluationResult[];
}

export default function EmployeeDashboard({ allResults }: EmployeeDashboardProps) {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear().toString());
  const [employeeResults, setEmployeeResults] = React.useState<EvaluationResult[]>([]);

  React.useEffect(() => {
    if (user) {
      const employeeUserResults = allResults.filter(r => r.id === user.employeeId);
      setEmployeeResults(employeeUserResults);
    }
  }, [user, allResults]);

  const formatCurrency = (value: number) => {
    if (isNaN(value)) return '0';
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };
  
  const availableYears = React.useMemo(() => {
      if (!allResults) return [];
      const years = new Set(allResults.map(r => r.year));
      return Array.from(years).sort((a,b) => b - a);
  }, [allResults]);

  const filteredResults = React.useMemo(() => {
    return employeeResults.filter(r => r.year.toString() === selectedYear);
  }, [employeeResults, selectedYear]);


  if (!user) {
    return <div>결과를 불러오는 중입니다...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">내 성과 리뷰</h2>
         <Select value={selectedYear} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="연도 선택" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}년</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{selectedYear}년 평가 결과</CardTitle>
          <CardDescription>
            선택한 연도의 월별 성과 평가 및 보상 요약입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredResults.length > 0 ? (
          <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">평가월</TableHead>
                <TableHead className="whitespace-nowrap">고유사번</TableHead>
                <TableHead className="whitespace-nowrap">회사</TableHead>
                <TableHead className="whitespace-nowrap">이름</TableHead>
                <TableHead className="whitespace-nowrap">소속부서</TableHead>
                <TableHead className="whitespace-nowrap">근무율</TableHead>
                <TableHead className="whitespace-nowrap">평가자</TableHead>
                <TableHead className="whitespace-nowrap">등급</TableHead>
                <TableHead className="whitespace-nowrap">점수</TableHead>
                <TableHead className="whitespace-nowrap">기준금액</TableHead>
                <TableHead className="whitespace-nowrap">등급금액</TableHead>
                <TableHead className="whitespace-nowrap">최종금액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.sort((a, b) => b.month - a.month).map((result) => (
                <TableRow key={`${result.year}-${result.month}`}>
                  <TableCell className="whitespace-nowrap">{result.year}년 {result.month}월</TableCell>
                  <TableCell className="whitespace-nowrap">{result.uniqueId}</TableCell>
                  <TableCell className="whitespace-nowrap">{result.company}</TableCell>
                  <TableCell className="whitespace-nowrap">{result.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{result.department}</TableCell>
                  <TableCell className="whitespace-nowrap">{(result.workRate * 100).toFixed(1)}%</TableCell>
                  <TableCell className="whitespace-nowrap">{result.evaluatorName}</TableCell>
                  <TableCell className="whitespace-nowrap">{result.grade}</TableCell>
                  <TableCell className="whitespace-nowrap">{result.score}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">{formatCurrency(result.baseAmount)} 원</TableCell>
                  <TableCell className="whitespace-nowrap text-right">{formatCurrency(result.gradeAmount)} 원</TableCell>
                  <TableCell className="font-bold whitespace-nowrap text-right">{formatCurrency(result.finalAmount)} 원</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          ) : (
             <p className="text-center text-muted-foreground py-8">선택한 연도에 해당하는 평가 결과가 없습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
