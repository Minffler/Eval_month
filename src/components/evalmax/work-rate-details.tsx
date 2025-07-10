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
} from '@/components/ui/table';
import { ShortenedWorkHourRecord, DailyAttendanceRecord } from '@/lib/types';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search } from 'lucide-react';

interface WorkRateDetailsProps {
  type: 'shortenedWork' | 'dailyAttendance';
  data: any[];
}

export default function WorkRateDetails({ type, data }: WorkRateDetailsProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.uniqueId.includes(searchTerm)
    );
  }, [data, searchTerm]);
  
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredData.map((item: ShortenedWorkHourRecord, index) => (
          <TableRow key={`${item.uniqueId}-${index}`}>
            <TableCell>{item.uniqueId}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.startDate}</TableCell>
            <TableCell>{item.endDate}</TableCell>
            <TableCell>{item.startTime}</TableCell>
            <TableCell>{item.endTime}</TableCell>
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredData.map((item: DailyAttendanceRecord, index) => (
          <TableRow key={`${item.uniqueId}-${index}`}>
            <TableCell>{item.uniqueId}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.date}</TableCell>
            <TableCell>{item.type}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const title = type === 'shortenedWork' ? '단축근로 상세' : '일근태 상세';
  const description = type === 'shortenedWork' 
    ? '업로드된 단축근로 데이터의 상세 내역입니다.' 
    : '업로드된 일근태 데이터의 상세 내역입니다.';

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
