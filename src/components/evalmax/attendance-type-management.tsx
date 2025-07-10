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
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';


interface AttendanceTypeManagementProps {
  attendanceTypes: AttendanceType[];
  setAttendanceTypes: React.Dispatch<React.SetStateAction<AttendanceType[]>>;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
}

export default function AttendanceTypeManagement({ attendanceTypes, setAttendanceTypes, holidays, setHolidays }: AttendanceTypeManagementProps) {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [isTypesOpen, setIsTypesOpen] = React.useState(false);
  const [localTypes, setLocalTypes] = React.useState<AttendanceType[]>([]);
  const [localHolidays, setLocalHolidays] = React.useState<Holiday[]>([]);
  
  React.useEffect(() => {
    setLocalTypes([...attendanceTypes].sort((a,b) => {
        if (a.deductionDays !== b.deductionDays) return b.deductionDays - a.deductionDays;
        return a.name.localeCompare(b.name);
    }));
  }, [attendanceTypes]);
  
  React.useEffect(() => {
    setLocalHolidays([...holidays]);
  }, [holidays]);

  const handleTypeInputChange = (index: number, field: keyof AttendanceType, value: string) => {
    const newTypes = [...localTypes];
    if (field === 'name') {
      newTypes[index].name = value;
    } else if (field === 'deductionDays') {
      newTypes[index].deductionDays = Number(value);
    }
    setLocalTypes(newTypes);
  };

  const handleAddNewType = () => {
    setLocalTypes([
      ...localTypes,
      { id: `att-${Date.now()}`, name: '', deductionDays: 0 },
    ]);
  };

  const handleRemoveType = (index: number) => {
    const newTypes = localTypes.filter((_, i) => i !== index);
    setLocalTypes(newTypes);
  };
  
  const handleHolidayDateChange = (index: number, value: string) => {
    const newHolidays = [...localHolidays];
    let formattedValue = value.replace(/[^0-9]/g, '');
    if (formattedValue.length > 4) {
      formattedValue = `${formattedValue.slice(0, 4)}-${formattedValue.slice(4)}`;
    }
    if (formattedValue.length > 7) {
      formattedValue = `${formattedValue.slice(0, 7)}-${formattedValue.slice(7)}`;
    }
    newHolidays[index].date = formattedValue.slice(0, 10);
    setLocalHolidays(newHolidays);
  };

  const handleHolidayNameChange = (index: number, value: string) => {
    const newHolidays = [...localHolidays];
    newHolidays[index].name = value;
    setLocalHolidays(newHolidays);
  }

  const handleAddNewHoliday = () => {
    setLocalHolidays([
      ...localHolidays,
      { id: `hol-${Date.now()}`, date: `${selectedYear}-`, name: '' },
    ]);
  };

  const handleRemoveHoliday = (index: number) => {
    const newHolidays = localHolidays.filter((_, i) => i !== index);
    setLocalHolidays(newHolidays);
  };
  
  const handleSaveTypes = () => {
    const typeNames = localTypes.map(t => t.name.trim());
    if (new Set(typeNames).size !== typeNames.length) {
        toast({ variant: "destructive", title: "오류", description: "근태명은 고유해야 합니다." });
        return;
    }
    if (typeNames.some(name => name === '')) {
         toast({ variant: "destructive", title: "오류", description: "근태명을 입력해주세요." });
        return;
    }
    setAttendanceTypes(localTypes);
    toast({ title: '저장 완료', description: '근태 수치 변경사항이 성공적으로 저장되었습니다.' });
  }

  const handleSaveHolidays = () => {
    for(const holiday of localHolidays) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(holiday.date)) {
        toast({ variant: "destructive", title: "오류", description: `날짜 형식이 올바르지 않습니다 (YYYY-MM-DD): ${holiday.date}` });
        return;
      }
       if (holiday.name.trim() === '') {
        toast({ variant: "destructive", title: "오류", description: `공휴일명을 입력해주세요.` });
        return;
      }
    }
    setHolidays([...localHolidays].sort((a, b) => a.date.localeCompare(b.date)));
    toast({ title: '저장 완료', description: '공휴일 변경사항이 성공적으로 저장되었습니다.' });
  }
  
  const currentClientYear = new Date().getFullYear();
  const availableYears = Array.from({ length: Math.max(0, currentClientYear - 2022 + 1) }, (_, i) => 2023 + i).reverse();

  const filteredHolidays = localHolidays.filter(h => h.date.startsWith(String(selectedYear)));

  return (
    <div className="space-y-6">
      <Card>
        <Collapsible open={isTypesOpen} onOpenChange={setIsTypesOpen}>
          <div className="flex items-center justify-between p-4">
              <div>
                <CardTitle>근태 수치 관리</CardTitle>
                <CardDescription>
                    근태 종류와 그에 따른 차감 일수를 직접 정의하고 관리합니다. 이 설정은 근무율 계산에 사용됩니다.
                </CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                      {isTypesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
              </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
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
                    {localTypes.map((type, index) => (
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
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={handleAddNewType}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  새 근태 종류 추가
                </Button>
                 <Button onClick={handleSaveTypes}>
                  <Save className="mr-2 h-4 w-4" />
                  근태 수치 저장
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
      
      <Card>
        <CardHeader>
           <div className="flex items-center justify-between">
              <div>
                <CardTitle>공휴일 관리</CardTitle>
                <CardDescription>
                  영업일 계산 시 제외될 공휴일을 관리합니다.
                </CardDescription>
              </div>
               <Select value={String(selectedYear)} onValueChange={(yearStr) => setSelectedYear(parseInt(yearStr, 10))}>
                  <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="연도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                      {availableYears.map(year => (
                      <SelectItem key={year} value={String(year)}>
                          {year}년
                      </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
           </div>
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
                {filteredHolidays.map((holiday, idx) => {
                  const index = localHolidays.findIndex(h => h.id === holiday.id);
                  return (
                    <TableRow key={holiday.id}>
                      <TableCell className="py-1 px-2">
                        <Input
                          value={holiday.date}
                          onChange={(e) => handleHolidayDateChange(index, e.target.value)}
                          className="w-40 h-8"
                          placeholder="YYYY-MM-DD"
                        />
                      </TableCell>
                      <TableCell className="py-1 px-2">
                        <Input
                          value={holiday.name}
                          onChange={(e) => handleHolidayNameChange(index, e.target.value)}
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={handleAddNewHoliday}>
              <PlusCircle className="mr-2 h-4 w-4" />
              새 공휴일 추가
            </Button>
            <Button onClick={handleSaveHolidays}>
              <Save className="mr-2 h-4 w-4" />
              공휴일 저장
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
