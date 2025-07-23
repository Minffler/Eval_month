'use client';

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { EvaluationResult, Grade, GradeInfo } from '@/lib/types';
import { calculateFinalAmount } from '@/lib/data';
import { useSortedData, useFilteredData } from '@/hooks/use-performance-optimization';

interface EvaluationManagementProps {
  results: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  onResultsChange: (results: EvaluationResult[]) => void;
}

type SortConfig = {
  key: keyof EvaluationResult;
  direction: 'ascending' | 'descending';
} | null;

export default function EvaluationManagement({ 
  results, 
  gradingScale, 
  onResultsChange 
}: EvaluationManagementProps) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  // 성능 최적화된 정렬 및 필터링
  const filteredData = useFilteredData(results, searchTerm, ['name', 'uniqueId', 'department']);
  const sortedData = useSortedData(filteredData, sortConfig);

  const requestSort = React.useCallback((key: keyof EvaluationResult) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const getSortIcon = React.useCallback((key: keyof EvaluationResult) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' 
      ? <ArrowUp className="ml-2 h-4 w-4 text-primary" /> 
      : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  }, [sortConfig]);

  const handleBaseAmountChange = React.useCallback((employeeId: string, newAmountStr: string) => {
    const newAmount = Number(newAmountStr.replace(/,/g, ''));
    if (isNaN(newAmount)) return;

    const updatedResults = results.map(r => {
      if (r.id === employeeId) {
        const gradeInfo = r.grade ? gradingScale[r.grade] : { payoutRate: 0 };
        const payoutRate = (gradeInfo?.payoutRate || 0) / 100;
        const gradeAmount = newAmount * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, r.workRate);
        return { ...r, baseAmount: newAmount, gradeAmount, finalAmount };
      }
      return r;
    });
    onResultsChange(updatedResults);
  }, [results, gradingScale, onResultsChange]);

  const handleMemoChange = React.useCallback((employeeId: string, newMemo: string) => {
    const updatedResults = results.map(r => {
      if (r.id === employeeId) {
        return { ...r, memo: newMemo };
      }
      return r;
    });
    onResultsChange(updatedResults);
  }, [results, onResultsChange]);

  const handleGradeChange = React.useCallback((employeeId: string, newGradeStr: string | null) => {
    const newGrade = newGradeStr as Grade;
    const updatedResults = results.map(r => {
      if (r.id === employeeId) {
        const gradeInfo = newGrade ? gradingScale[newGrade] : null;
        const score = gradeInfo?.score || 0;
        const payoutRate = gradeInfo ? gradeInfo.payoutRate / 100 : 0;
        const gradeAmount = (r.baseAmount || 0) * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, r.workRate);
        return { ...r, grade: newGrade, score, payoutRate, gradeAmount, finalAmount };
      }
      return r;
    });
    onResultsChange(updatedResults);
  }, [results, gradingScale, onResultsChange]);

  const formatCurrency = React.useCallback((value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="직원 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('name')}>
                  이름 {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('department')}>
                  부서 {getSortIcon('department')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('title')}>
                  직책 {getSortIcon('title')}
                </Button>
              </TableHead>
              <TableHead>기준금액</TableHead>
              <TableHead>등급</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('finalAmount')}>
                  최종금액 {getSortIcon('finalAmount')}
                </Button>
              </TableHead>
              <TableHead>메모</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((result) => (
              <TableRow key={result.id}>
                <TableCell>{result.name}</TableCell>
                <TableCell>{result.department}</TableCell>
                <TableCell>{result.title}</TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={formatCurrency(result.baseAmount || 0)}
                    onChange={(e) => handleBaseAmountChange(result.id, e.target.value)}
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={result.grade || 'none'}
                    onValueChange={(value) => handleGradeChange(result.id, value === 'none' ? null : value)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      {Object.keys(gradingScale).map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{formatCurrency(result.finalAmount)}</TableCell>
                <TableCell>
                  <Input
                    value={result.memo || ''}
                    onChange={(e) => handleMemoChange(result.id, e.target.value)}
                    placeholder="메모 입력..."
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 