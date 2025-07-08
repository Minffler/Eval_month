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
      // In a real app, you would use the logged-in user's ID.
      // For this demo, we find the mock user with the 'employee' role.
      const employeeUser = allResults.filter(r => r.id === 'E003');
      setEmployeeResults(employeeUser);
    }
  }, [user, allResults]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    // Here you would typically fetch data for the selected year.
    // For this demo, we'll just filter the existing mock data.
    if (user) {
      const filteredResults = allResults.filter(r => 
        r.id === 'E003' && new Date(r.year, r.month -1).getFullYear().toString() === year
      );
      setEmployeeResults(filteredResults);
    }
  };
  
  const availableYears = React.useMemo(() => {
      const years = new Set(allResults.map(r => new Date(r.year, r.month -1).getFullYear()));
      return Array.from(years).sort((a,b) => b - a);
  }, [allResults]);

  if (!user || !employeeResults) {
    return <div>결과를 불러오는 중입니다...</div>;
  }
  
  const currentResult = employeeResults[0]; // Assuming one result per month for simplicity

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
          {employeeResults.length > 0 ? (
          <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>평가월</TableHead>
                <TableHead>사번</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>소속부서</TableHead>
                <TableHead>근무율</TableHead>
                <TableHead>평가자</TableHead>
                <TableHead>등급</TableHead>
                <TableHead>점수</TableHead>
                <TableHead>기준금액</TableHead>
                <TableHead>등급금액</TableHead>
                <TableHead>최종금액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeResults.map((result) => (
                <TableRow key={`${result.year}-${result.month}`}>
                  <TableCell>{result.year}년 {result.month}월</TableCell>
                  <TableCell>{result.id}</TableCell>
                  <TableCell>{result.name}</TableCell>
                  <TableCell>{result.department}</TableCell>
                  <TableCell>{(result.workRate * 100).toFixed(1)}%</TableCell>
                  <TableCell>{result.evaluatorName}</TableCell>
                  <TableCell>{result.grade}</TableCell>
                  <TableCell>{result.score}</TableCell>
                  <TableCell>{formatCurrency(result.baseAmount)} 원</TableCell>
                  <TableCell>{formatCurrency(result.gradeAmount)} 원</TableCell>
                  <TableCell className="font-bold">{formatCurrency(result.finalAmount)} 원</TableCell>
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
