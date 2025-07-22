'use client';

import * as React from 'react';
import type { EvaluationResult, Grade, GradeInfo } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { getPositionSortValue } from '@/lib/data';

interface AllResultsViewProps {
  currentMonthResults: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
}

type SortConfig = {
  key: keyof EvaluationResult;
  direction: 'ascending' | 'descending';
} | null;

export default function AllResultsView({ currentMonthResults, gradingScale }: AllResultsViewProps) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);

  const sortedResults = React.useMemo(() => {
    let sortableItems = [...currentMonthResults];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === 'title') {
            const orderA = getPositionSortValue(a.title);
            const orderB = getPositionSortValue(b.title);
            if (orderA !== orderB) {
                return sortConfig.direction === 'ascending' ? orderA - orderB : orderB - orderA;
            }
        }

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
  }, [currentMonthResults, sortConfig]);

  const requestSort = (key: keyof EvaluationResult) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof EvaluationResult) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4 text-primary" /> : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>평가 결과 상세</CardTitle>
        <CardDescription>
          현재 월의 모든 직원에 대한 평가 결과입니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('uniqueId')}><div className="flex items-center justify-center">ID{getSortIcon('uniqueId')}</div></TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('name')}><div className="flex items-center justify-center">이름{getSortIcon('name')}</div></TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('department')}><div className="flex items-center justify-center">소속부서{getSortIcon('department')}</div></TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('title')}><div className="flex items-center justify-center">직책{getSortIcon('title')}</div></TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('workRate')}><div className="flex items-center justify-center">근무율{getSortIcon('workRate')}</div></TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('grade')}><div className="flex items-center justify-center">등급{getSortIcon('grade')}</div></TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('score')}><div className="flex items-center justify-center">점수{getSortIcon('score')}</div></TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('finalAmount')}><div className="flex items-center justify-center">최종금액{getSortIcon('finalAmount')}</div></TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('evaluatorName')}><div className="flex items-center justify-center">평가자{getSortIcon('evaluatorName')}</div></TableHead>
                <TableHead>비고</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="text-center">{result.uniqueId}</TableCell>
                  <TableCell className="text-center">{result.name}</TableCell>
                  <TableCell className="text-center">{result.department}</TableCell>
                  <TableCell className="text-center">{result.title}</TableCell>
                  <TableCell className="text-center">{(result.workRate * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-center">{result.grade}</TableCell>
                  <TableCell className="text-center">{result.score}</TableCell>
                  <TableCell className="text-center">{formatCurrency(result.finalAmount)}</TableCell>
                  <TableCell className="text-center">{result.evaluatorName}</TableCell>
                  <TableCell>{result.memo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
