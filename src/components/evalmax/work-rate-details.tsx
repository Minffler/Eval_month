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
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { ShortenedWorkDetail, DailyAttendanceDetail } from '@/lib/work-rate-calculator';

type SortConfig<T> = {
  key: keyof T;
  direction: 'ascending' | 'descending';
} | null;

interface WorkRateDetailsProps {
  type: 'shortenedWork' | 'dailyAttendance';
  data: any[];
  selectedDate: { year: number, month: number };
}

export default function WorkRateDetails({ type, data, selectedDate }: WorkRateDetailsProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<SortConfig<any>>(null);
  
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
    if (type !== 'dailyAttendance' || !searchTerm) return 0;
    return filteredData.reduce((acc, curr) => acc + curr.totalDeductionHours, 0);
  }, [filteredData, searchTerm, type]);
  
  const renderShortenedWorkTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer" onClick={() => requestSort('uniqueId')}><div className="flex items-center">고유사번{getSortIcon('uniqueId')}</div></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('name')}><div className="flex items-center">이름{getSortIcon('name')}</div></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('startDate')}><div className="flex items-center">시작일{getSortIcon('startDate')}</div></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('endDate')}><div className="flex items-center">종료일{getSortIcon('endDate')}</div></TableHead>
          <TableHead>출근시각</TableHead>
          <TableHead>퇴근시각</TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('actualWorkHours')}><div className="flex items-center">실근로시간{getSortIcon('actualWorkHours')}</div></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('businessDays')}><div className="flex items-center">사용일수{getSortIcon('businessDays')}</div></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('totalDeductionHours')}><div className="flex items-center">총 차감시간{getSortIcon('totalDeductionHours')}</div></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((item: ShortenedWorkDetail, index) => (
          <TableRow key={`${item.uniqueId}-${index}`}>
            <TableCell>{item.uniqueId}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.startDate}</TableCell>
            <TableCell>{item.endDate}</TableCell>
            <TableCell>{item.startTime}</TableCell>
            <TableCell>{item.endTime}</TableCell>
            <TableCell>{item.actualWorkHours.toFixed(2)}</TableCell>
            <TableCell>{item.businessDays}</TableCell>
            <TableCell>{item.totalDeductionHours.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderDailyAttendanceTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer" onClick={() => requestSort('uniqueId')}><div className="flex items-center">고유사번{getSortIcon('uniqueId')}</div></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('name')}><div className="flex items-center">이름{getSortIcon('name')}</div></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('date')}><div className="flex items-center">일자{getSortIcon('date')}</div></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('type')}><div className="flex items-center">근태 종류{getSortIcon('type')}</div></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('isShortenedDay')}><div className="flex items-center">단축사용{getSortIcon('isShortenedDay')}</div></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('actualWorkHours')}><div className="flex items-center">실근로시간{getSortIcon('actualWorkHours')}</div></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('deductionDays')}><div className="flex items-center">차감일수{getSortIcon('deductionDays')}</div></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('totalDeductionHours')}><div className="flex items-center">총 차감시간{getSortIcon('totalDeductionHours')}</div></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((item: DailyAttendanceDetail, index) => (
          <TableRow key={`${item.uniqueId}-${index}`}>
            <TableCell>{item.uniqueId}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.date}</TableCell>
            <TableCell>{item.type}</TableCell>
            <TableCell>{item.isShortenedDay ? 'Y' : 'N'}</TableCell>
            <TableCell>{item.actualWorkHours.toFixed(2)}</TableCell>
            <TableCell>{item.deductionDays.toFixed(2)}</TableCell>
            <TableCell>{item.totalDeductionHours.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
       {searchTerm && (
          <TableFooter>
              <TableRow>
                  <TableCell colSpan={7} className="text-right font-bold">총 차감시간 소계</TableCell>
                  <TableCell className="font-bold">{totalDeductionHours.toFixed(2)}</TableCell>
              </TableRow>
          </TableFooter>
       )}
    </Table>
  );

  const title = type === 'shortenedWork' ? '단축근로 상세' : '일근태 상세';
  const description = `${selectedDate.year}년 ${selectedDate.month}월 ${type === 'shortenedWork' ? '단축근로' : '일근태'} 상세 내역입니다.`;

  return (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            <div className="relative mt-4 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="이름 또는 사번으로 검색..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
  );
}
