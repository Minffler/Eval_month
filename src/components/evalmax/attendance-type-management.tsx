'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AttendanceType, Holiday } from '@/lib/types';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { initialAttendanceTypes } from '@/lib/data';

interface AttendanceTypeManagementProps {
  attendanceTypes: AttendanceType[];
  setAttendanceTypes: React.Dispatch<React.SetStateAction<AttendanceType[]>>;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
}

export default function AttendanceTypeManagement({ attendanceTypes, setAttendanceTypes, holidays, setHolidays }: AttendanceTypeManagementProps) {
  const { toast } = useToast();

  // For attendance types
  const handleTypeInputChange = (index: number, field: keyof AttendanceType, value: string) => {
    const newTypes = [...attendanceTypes];
    if (field === 'name') {
      newTypes[index].name = value;
    } else if (field === 'deductionDays') {
      newTypes[index].deductionDays = Number(value);
    }
    setAttendanceTypes(newTypes);
  };

  const handleAddNewType = () => {
    setAttendanceTypes([
      ...attendanceTypes,
      { id: `att-${Date.now()}`, name: '', deductionDays: 0 },
    ]);
  };

  const handleRemoveType = (index: number) => {
    const newTypes = attendanceTypes.filter((_, i) => i !== index);
    setAttendanceTypes(newTypes);
  };
  
  // For holidays
  const handleHolidayInputChange = (index: number, field: keyof Holiday, value: string) => {
    const newHolidays = [...holidays];
    (newHolidays[index] as any)[field] = value;
    setHolidays(newHolidays);
  };

  const handleAddNewHoliday = () => {
    setHolidays([
      ...holidays,
      { id: `hol-${Date.now()}`, date: '', name: '' },
    ]);
  };

  const handleRemoveHoliday = (index: number) => {
    const newHolidays = holidays.filter((_, i) => i !== index);
    setHolidays(newHolidays);
  };

  const handleSaveChanges = () => {
    // Validate attendance types
    const typeNames = attendanceTypes.map(t => t.name.trim());
    if (new Set(typeNames).size !== typeNames.length) {
        toast({ variant: "destructive", title: "오류", description: "근태명은 고유해야 합니다." });
        return;
    }
    if (typeNames.some(name => name === '')) {
         toast({ variant: "destructive", title: "오류", description: "근태명을 입력해주세요." });
        return;
    }
    
    // Validate holidays
    for(const holiday of holidays) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(holiday.date)) {
        toast({ variant: "destructive", title: "오류", description: `날짜 형식이 올바르지 않습니다 (YYYY-MM-DD): ${holiday.date}` });
        return;
      }
       if (holiday.name.trim() === '') {
        toast({ variant: "destructive", title: "오류", description: `공휴일명을 입력해주세요.` });
        return;
      }
    }
    
    // Save to localStorage (will be handled by useEffect in page.tsx)
    setAttendanceTypes([...attendanceTypes]);
    setHolidays([...holidays].sort((a, b) => a.date.localeCompare(b.date)));

    toast({
      title: '저장 완료',
      description: '변경사항이 성공적으로 저장되었습니다.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>근태 수치 관리</CardTitle>
          <CardDescription>
            근태 종류와 그에 따른 차감 일수를 직접 정의하고 관리합니다. 이 설정은 근무율 계산에 사용됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap py-2 px-3">근태명</TableHead>
                  <TableHead className="whitespace-nowrap py-2 px-3">차감 일수 (단위: 일)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceTypes.map((type, index) => (
                  <TableRow key={type.id}>
                    <TableCell className="py-1 px-2">
                      <Input
                        value={type.name}
                        onChange={(e) => handleTypeInputChange(index, 'name', e.target.value)}
                        className="w-40 h-8"
                      />
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={type.deductionDays}
                        onChange={(e) => handleTypeInputChange(index, 'deductionDays', e.target.value)}
                        className="w-40 h-8"
                      />
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveType(index)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={handleAddNewType}>
              <PlusCircle className="mr-2 h-4 w-4" />
              새 근태 종류 추가
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>공휴일 관리</CardTitle>
          <CardDescription>
            영업일 계산 시 제외될 공휴일을 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap py-2 px-3">날짜 (YYYY-MM-DD)</TableHead>
                  <TableHead className="whitespace-nowrap py-2 px-3">공휴일명</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday, index) => (
                  <TableRow key={holiday.id}>
                    <TableCell className="py-1 px-2">
                      <Input
                        value={holiday.date}
                        onChange={(e) => handleHolidayInputChange(index, 'date', e.target.value)}
                        className="w-40 h-8"
                        placeholder="YYYY-MM-DD"
                      />
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <Input
                        value={holiday.name}
                        onChange={(e) => handleHolidayInputChange(index, 'name', e.target.value)}
                        className="w-40 h-8"
                      />
                    </TableCell>
                    <TableCell className="py-1 px-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveHoliday(index)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={handleAddNewHoliday}>
              <PlusCircle className="mr-2 h-4 w-4" />
              새 공휴일 추가
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-6">
          <Button onClick={handleSaveChanges} size="lg">
            모든 변경사항 저장
          </Button>
      </div>
    </div>
  );
}
