'use client';

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { WorkRateSummary, DeductionType } from './work-rate-types';
import { useSortedData, useFilteredData } from '@/hooks/use-performance-optimization';

interface WorkRateSummaryTableProps {
  workRateSummaries: WorkRateSummary[];
  visibleColumns: Set<DeductionType>;
  onOpenDetails: (employeeId: string, employeeName: string, type: 'attendance' | 'pregnancy' | 'care') => void;
  onToggleColumn: (columnId: DeductionType) => void;
}

type SortConfig = {
  key: keyof WorkRateSummary;
  direction: 'ascending' | 'descending';
} | null;

export default function WorkRateSummaryTable({
  workRateSummaries,
  visibleColumns,
  onOpenDetails,
  onToggleColumn,
}: WorkRateSummaryTableProps) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'monthlyWorkRate', direction: 'ascending' });
  const [searchTerm, setSearchTerm] = React.useState('');

  // 성능 최적화된 정렬 및 필터링
  const filteredData = useFilteredData(workRateSummaries, searchTerm, ['name', 'uniqueId']);
  const sortedData = useSortedData(filteredData, sortConfig);

  const requestSort = React.useCallback((key: keyof WorkRateSummary) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const getSortIcon = React.useCallback((key: keyof WorkRateSummary) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' 
      ? <ArrowUp className="ml-2 h-4 w-4 text-primary" /> 
      : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  }, [sortConfig]);

  const getWorkRateStyle = React.useCallback((rate: number): string => {
    if (rate < 0.25) {
      return 'text-orange-600 font-semibold';
    } else {
      return 'text-foreground font-semibold';
    }
  }, []);

  const ClickableCell = React.useCallback(({ value, onClick }: { value: number; onClick: () => void }) => (
    <TableCell 
      className="cursor-pointer hover:bg-muted/50 transition-colors text-center" 
      onClick={onClick}
    >
      {value === 0 ? '-' : value.toFixed(2)}
    </TableCell>
  ), []);

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-gray-200">
                    <Table className="bg-[hsl(30,30%,98%)]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] cursor-pointer text-center" onClick={() => requestSort('uniqueId')}>
                <div className="flex items-center justify-center">고유사번{getSortIcon('uniqueId')}</div>
              </TableHead>
              <TableHead className="w-[200px] cursor-pointer text-center" onClick={() => requestSort('name')}>
                <div className="flex items-center justify-center">이름{getSortIcon('name')}</div>
              </TableHead>
              {visibleColumns.has('attendance') && (
                <TableHead className="w-[120px] cursor-pointer text-center" onClick={() => requestSort('deductionHoursAttendance')}>
                  <div className="flex items-center justify-center">근태(H){getSortIcon('deductionHoursAttendance')}</div>
                </TableHead>
              )}
              {visibleColumns.has('pregnancy') && (
                <TableHead className="w-[120px] cursor-pointer text-center" onClick={() => requestSort('deductionHoursPregnancy')}>
                  <div className="flex items-center justify-center">임신(H){getSortIcon('deductionHoursPregnancy')}</div>
                </TableHead>
              )}
              {visibleColumns.has('care') && (
                <TableHead className="w-[120px] cursor-pointer text-center" onClick={() => requestSort('deductionHoursCare')}>
                  <div className="flex items-center justify-center">육아/돌봄(H){getSortIcon('deductionHoursCare')}</div>
                </TableHead>
              )}
              <TableHead className="w-[120px] cursor-pointer text-center" onClick={() => requestSort('totalDeductionHours')}>
                <div className="flex items-center justify-center">총 미근로시간{getSortIcon('totalDeductionHours')}</div>
              </TableHead>
              <TableHead className="w-[200px] cursor-pointer text-center" onClick={() => requestSort('totalWorkHours')}>
                <div className="flex items-center justify-center">근로/미근로 시간{getSortIcon('totalWorkHours')}</div>
              </TableHead>
              <TableHead className="w-[100px] cursor-pointer text-center" onClick={() => requestSort('monthlyWorkRate')}>
                <div className="flex items-center justify-center">근무율{getSortIcon('monthlyWorkRate')}</div>
              </TableHead>
              <TableHead className="w-[120px] cursor-pointer text-center">
                <div className="flex items-center justify-center">수정일시</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((summary) => (
              <TableRow key={summary.uniqueId}>
                <TableCell className="font-mono text-sm text-center">{summary.uniqueId}</TableCell>
                <TableCell className="font-medium text-center">{summary.name}</TableCell>
                {visibleColumns.has('attendance') && (
                  <ClickableCell
                    value={summary.deductionHoursAttendance}
                    onClick={() => onOpenDetails(summary.uniqueId, summary.name, 'attendance')}
                  />
                )}
                {visibleColumns.has('pregnancy') && (
                  <ClickableCell
                    value={summary.deductionHoursPregnancy}
                    onClick={() => onOpenDetails(summary.uniqueId, summary.name, 'pregnancy')}
                  />
                )}
                {visibleColumns.has('care') && (
                  <ClickableCell
                    value={summary.deductionHoursCare}
                    onClick={() => onOpenDetails(summary.uniqueId, summary.name, 'care')}
                  />
                )}
                <TableCell className="text-center">{summary.totalDeductionHours === 0 ? '-' : summary.totalDeductionHours.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                      <div 
                        className="bg-gray-500 h-2 rounded-full" 
                        style={{ width: `${(summary.totalWorkHours / (summary.totalWorkHours + summary.totalDeductionHours)) * 100}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-gray-600 font-medium">
                          {summary.totalWorkHours.toFixed(0)} / {summary.totalDeductionHours.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={getWorkRateStyle(summary.monthlyWorkRate)}>
                    {(summary.monthlyWorkRate * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {summary.lastModified ? new Date(summary.lastModified).toLocaleDateString('ko-KR', { 
                    month: '2-digit', 
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }).replace('.', '').replace('.', ' ') : '07.22 15:17'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 