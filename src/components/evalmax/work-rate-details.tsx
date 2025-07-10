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
import { Search } from 'lucide-react';
import type { ShortenedWorkDetail, DailyAttendanceDetail } from '@/lib/work-rate-calculator';

interface WorkRateDetailsProps {
  type: 'shortenedWork' | 'dailyAttendance';
  data: any[];
  selectedDate: { year: number, month: number };
}

export default function WorkRateDetails({ type, data, selectedDate }: WorkRateDetailsProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.uniqueId.includes(searchTerm)
    );
  }, [data, searchTerm]);

  const totalDeductionHours = React.useMemo(() => {
    if (type !== 'dailyAttendance' || !searchTerm) return 0;
    return filteredData.reduce((acc, curr) => acc + curr.totalDeductionHours, 0);
  }, [filteredData, searchTerm, type]);
  
  const renderShortenedWorkTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>사번</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>시작일</TableHead>
          <TableHead>종료일</TableHead>
          <TableHead>출근시각</TableHead>
          <TableHead>퇴근시각</TableHead>
          <TableHead>실근로시간</TableHead>
          <TableHead>사용일수</TableHead>
          <TableHead>총 차감시간</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredData.map((item: ShortenedWorkDetail, index) => (
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
          <TableHead>사번</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>일자</TableHead>
          <TableHead>근태 종류</TableHead>
          <TableHead>단축사용</TableHead>
          <TableHead>실근로시간</TableHead>
          <TableHead>차감일수</TableHead>
          <TableHead>총 차감시간</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredData.map((item: DailyAttendanceDetail, index) => (
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
