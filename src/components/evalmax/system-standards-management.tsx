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
import type { Grade, GradeInfo, AttendanceType, Holiday } from '@/lib/types';
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
import { cn } from '@/lib/utils';


interface SystemStandardsManagementProps {
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  setGradingScale: React.Dispatch<React.SetStateAction<Record<NonNullable<Grade>, GradeInfo>>>;
  attendanceTypes: AttendanceType[];
  setAttendanceTypes: React.Dispatch<React.SetStateAction<AttendanceType[]>>;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
}

export default function SystemStandardsManagement({
    gradingScale, setGradingScale, 
    attendanceTypes, setAttendanceTypes, 
    holidays, setHolidays 
}: SystemStandardsManagementProps) {
  const { toast } = useToast();
  
  // Grade Management State
  const [localGrades, setLocalGrades] = React.useState(
    Object.entries(gradingScale).map(([grade, info]) => ({ ...info, grade: grade as Grade, isNew: false }))
  );
  
  // Attendance Type Management State
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [isAttendanceOpen, setIsAttendanceOpen] = React.useState(false);
  const [isHolidayOpen, setIsHolidayOpen] = React.useState(false);
  const [isGradeOpen, setIsGradeOpen] = React.useState(false);

  const [localTypes, setLocalTypes] = React.useState<AttendanceType[]>([]);
  const [localHolidays, setLocalHolidays] = React.useState<Holiday[]>([]);
  const [holidayErrors, setHolidayErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setLocalGrades(Object.entries(gradingScale).map(([grade, info]) => ({ ...info, grade: grade as Grade, isNew: false })));
  }, [gradingScale]);

  React.useEffect(() => {
    setLocalTypes([...attendanceTypes].sort((a,b) => {
        if (a.deductionDays !== b.deductionDays) return b.deductionDays - a.deductionDays;
        return a.name.localeCompare(b.name);
    }));
  }, [attendanceTypes]);
  
  React.useEffect(() => {
    setLocalHolidays([...holidays]);
  }, [holidays]);

  // Grade Management Handlers
  const handleGradeInputChange = (index: number, field: keyof GradeInfo, value: string) => {
    const newGrades = [...localGrades];
    (newGrades[index] as any)[field] = Number(value);
    setLocalGrades(newGrades);
  };
  const handleGradeNameChange = (index: number, value: string) => {
    const newGrades = [...localGrades];
    newGrades[index].grade = value as Grade;
    setLocalGrades(newGrades);
  };
  const handleAddNewGrade = () => {
    setLocalGrades([
      ...localGrades,
      { grade: '' as any, score: 0, payoutRate: 0, description: '', isNew: true },
    ]);
  };
  const handleRemoveGrade = (index: number) => {
    const newGrades = localGrades.filter((_, i) => i !== index);
    setLocalGrades(newGrades);
  };
  const handleSaveChanges = () => {
    const gradeNames = localGrades.map(g => g.grade);
    if (new Set(gradeNames).size !== gradeNames.length) {
        toast({ variant: "destructive", title: "오류", description: "등급명은 고유해야 합니다." });
        return;
    }
    const newGradingScale = localGrades.reduce((acc, current) => {
        if(current.grade && current.grade.trim() !== '') {
            acc[current.grade.trim() as NonNullable<Grade>] = {
                score: current.score, payoutRate: current.payoutRate, description: current.description,
            };
        }
      return acc;
    }, {} as Record<NonNullable<Grade>, GradeInfo>);
    setGradingScale(newGradingScale);
    toast({ title: '저장 완료', description: '등급 및 점수 변경사항이 성공적으로 저장되었습니다.' });
  };
  
  // Attendance Type Management Handlers
  const handleTypeInputChange = (index: number, field: keyof AttendanceType, value: string) => {
    const newTypes = [...localTypes];
    if (field === 'name') newTypes[index].name = value;
    else if (field === 'deductionDays') newTypes[index].deductionDays = Number(value);
    setLocalTypes(newTypes);
  };
  const handleAddNewType = () => {
    setLocalTypes([{ id: `att-${Date.now()}`, name: '', deductionDays: 0 }, ...localTypes]);
  };
  const handleRemoveType = (index: number) => {
    setLocalTypes(localTypes.filter((_, i) => i !== index));
  };
  const handleHolidayDateChange = (index: number, value: string) => {
    const newHolidays = [...localHolidays];
    let formattedValue = value.replace(/[^0-9]/g, '');
    if (formattedValue.length > 4) formattedValue = `${formattedValue.slice(0, 4)}-${formattedValue.slice(4)}`;
    if (formattedValue.length > 7) formattedValue = `${formattedValue.slice(0, 7)}-${formattedValue.slice(7)}`;
    newHolidays[index].date = formattedValue.slice(0, 10);
    setLocalHolidays(newHolidays);
  };
  const validateHolidayDate = (dateStr: string, id: string) => {
    const newErrors = { ...holidayErrors };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      newErrors[id] = '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)';
    } else {
      delete newErrors[id];
    }
    setHolidayErrors(newErrors);
  };
  const handleHolidayNameChange = (index: number, value: string) => {
    const newHolidays = [...localHolidays];
    newHolidays[index].name = value;
    setLocalHolidays(newHolidays);
  };
  const handleAddNewHoliday = () => {
    setLocalHolidays([{ id: `hol-${Date.now()}`, date: `${selectedYear}-`, name: '' }, ...localHolidays]);
  };
  const handleRemoveHoliday = (idToRemove: string) => {
    setLocalHolidays(localHolidays.filter((h) => h.id !== idToRemove));
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
    toast({ title: '저장 완료', description: '근무기준 변경사항이 성공적으로 저장되었습니다.' });
  };
  const handleSaveHolidays = () => {
    const errors: Record<string, string> = {};
    const holidaysForYear = localHolidays.filter(h => h.date.startsWith(String(selectedYear)));
    for(const holiday of holidaysForYear) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(holiday.date)) errors[holiday.id] = `날짜 형식이 올바르지 않습니다 (YYYY-MM-DD): ${holiday.date}`;
      else if (holiday.name.trim() === '') errors[holiday.id] = `공휴일명을 입력해주세요.`;
    }
    setHolidayErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast({ variant: "destructive", title: "오류", description: "입력 값을 확인해주세요." });
      return;
    }
    const otherYearsHolidays = holidays.filter(h => !h.date.startsWith(String(selectedYear)));
    const updatedHolidays = [...otherYearsHolidays, ...holidaysForYear].sort((a, b) => a.date.localeCompare(b.date));
    setHolidays(updatedHolidays);
    toast({ title: '저장 완료', description: `${selectedYear}년 공휴일 변경사항이 성공적으로 저장되었습니다.` });
  };
  
  const currentClientYear = new Date().getFullYear();
  const availableYears = Array.from({ length: Math.max(0, currentClientYear - 2022 + 1) }, (_, i) => 2023 + i).reverse();
  const filteredHolidays = localHolidays.filter(h => h.date.startsWith(String(selectedYear))).sort((a,b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <Collapsible open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <div className="flex w-full cursor-pointer items-center justify-between p-4 rounded-lg hover:bg-muted/50 data-[state=open]:rounded-b-none">
              <div>
                <CardTitle>근무기준 설정</CardTitle>
                <CardDescription>근태 종류와 그에 따른 차감 일수를 정의합니다. 이 설정은 근무율 계산에 사용됩니다.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="sr-only">보기/숨기기</span>
                {isAttendanceOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader><TableRow>
                      <TableHead className="py-2 px-3 text-center">근태명</TableHead>
                      <TableHead className="py-2 px-3 text-center">차감 일수 (단위: 일)</TableHead><TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {localTypes.map((type, index) => (
                      <TableRow key={type.id}>
                        <TableCell className="py-1 px-2 text-center"><Input value={type.name} onChange={(e) => handleTypeInputChange(index, 'name', e.target.value)} className="w-40 h-8 mx-auto"/></TableCell>
                        <TableCell className="py-1 px-2 text-center"><Input type="number" step="0.01" value={type.deductionDays} onChange={(e) => handleTypeInputChange(index, 'deductionDays', e.target.value)} className="w-40 h-8 mx-auto"/></TableCell>
                        <TableCell className="py-1 px-2 text-center"><Button variant="ghost" size="icon" onClick={() => handleRemoveType(index)} className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={handleAddNewType}><PlusCircle className="mr-2 h-4 w-4" />새 근태 종류 추가</Button>
                <Button onClick={handleSaveTypes}><Save className="mr-2 h-4 w-4" />근무기준 저장</Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      <Collapsible open={isHolidayOpen} onOpenChange={setIsHolidayOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <div className="flex w-full cursor-pointer items-center justify-between p-4 rounded-lg hover:bg-muted/50 data-[state=open]:rounded-b-none">
              <div>
                <CardTitle>공휴일 관리</CardTitle>
                <CardDescription>{selectedYear}년 영업일 계산 시 제외될 공휴일을 관리합니다.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="sr-only">보기/숨기기</span>
                {isHolidayOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CollapsibleTrigger>
           <CollapsibleContent>
            <CardHeader className="pt-0">
              <div className="flex justify-end">
                <Select value={String(selectedYear)} onValueChange={(yearStr) => setSelectedYear(parseInt(yearStr, 10))}>
                    <SelectTrigger className="w-[120px]"><SelectValue placeholder="연도 선택" /></SelectTrigger>
                    <SelectContent>{availableYears.map(year => <SelectItem key={year} value={String(year)}>{year}년</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader><TableRow>
                      <TableHead className="py-2 px-3 text-center">날짜 (YYYY-MM-DD)</TableHead>
                      <TableHead className="py-2 px-3 text-center">공휴일명</TableHead><TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredHolidays.map((holiday) => {
                      const index = localHolidays.findIndex(h => h.id === holiday.id);
                      return (
                        <TableRow key={holiday.id}>
                          <TableCell className="py-1 px-2 text-center">
                            <Input value={holiday.date} onChange={(e) => handleHolidayDateChange(index, e.target.value)} onBlur={(e) => validateHolidayDate(e.target.value, holiday.id)} className={cn("w-40 h-8 mx-auto", holidayErrors[holiday.id] && "border-destructive")} placeholder="YYYY-MM-DD"/>
                            {holidayErrors[holiday.id] && <p className="text-xs text-destructive mt-1">{holidayErrors[holiday.id]}</p>}
                          </TableCell>
                          <TableCell className="py-1 px-2 text-center"><Input value={holiday.name} onChange={(e) => handleHolidayNameChange(index, e.target.value)} className="w-40 h-8 mx-auto"/></TableCell>
                          <TableCell className="py-1 px-2 text-right"><Button variant="ghost" size="icon" onClick={() => handleRemoveHoliday(holiday.id)} className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={handleAddNewHoliday}><PlusCircle className="mr-2 h-4 w-4" />새 공휴일 추가</Button>
                <Button onClick={handleSaveHolidays}><Save className="mr-2 h-4 w-4" />공휴일 저장</Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={isGradeOpen} onOpenChange={setIsGradeOpen}>
        <Card>
            <CollapsibleTrigger asChild>
                <div className="flex w-full cursor-pointer items-center justify-between p-4 rounded-lg hover:bg-muted/50 data-[state=open]:rounded-b-none">
                    <div>
                        <CardTitle>등급/점수 관리</CardTitle>
                        <CardDescription>평가 등급, 점수, 지급률을 관리합니다.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <span className="sr-only">보기/숨기기</span>
                        {isGradeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <CardContent>
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                    <TableHeader><TableRow>
                        <TableHead className="py-2 px-3 text-center">등급</TableHead><TableHead className="py-2 px-3 text-center">점수</TableHead>
                        <TableHead className="py-2 px-3 text-center">지급률 (%)</TableHead><TableHead className="py-2 px-3 text-center">설명</TableHead><TableHead></TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                        {localGrades.map((gradeItem, index) => (
                        <TableRow key={index}>
                            <TableCell className="py-1 px-2 text-center"><Input value={gradeItem.grade || ''} onChange={(e) => handleGradeNameChange(index, e.target.value)} className="w-20 h-8 mx-auto"/></TableCell>
                            <TableCell className="py-1 px-2 text-center"><Input type="number" value={gradeItem.score} onChange={(e) => handleGradeInputChange(index, 'score', e.target.value)} className="w-20 h-8 mx-auto"/></TableCell>
                            <TableCell className="py-1 px-2 text-center"><Input type="number" value={gradeItem.payoutRate} onChange={(e) => handleGradeInputChange(index, 'payoutRate', e.target.value)} className="w-24 h-8 mx-auto"/></TableCell>
                            <TableCell className="py-1 px-2 text-center"><Input value={gradeItem.description} onChange={(e) => { const newGrades = [...localGrades]; newGrades[index].description = e.target.value; setLocalGrades(newGrades); }} className="w-full h-8 mx-auto"/></TableCell>
                            <TableCell className="py-1 px-2 text-center"><Button variant="ghost" size="icon" onClick={() => handleRemoveGrade(index)} className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={handleAddNewGrade}><PlusCircle className="mr-2 h-4 w-4" />새 등급 추가</Button>
                    <Button onClick={handleSaveChanges}>변경사항 저장</Button>
                </div>
                </CardContent>
            </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
