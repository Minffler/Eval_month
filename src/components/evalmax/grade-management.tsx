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
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';

interface GradeManagementProps {
  gradingScale?: Record<NonNullable<Grade>, GradeInfo>;
  setGradingScale?: React.Dispatch<React.SetStateAction<Record<NonNullable<Grade>, GradeInfo>>>;
  attendanceTypes?: AttendanceType[];
  setAttendanceTypes?: React.Dispatch<React.SetStateAction<AttendanceType[]>>;
  holidays?: Holiday[];
  setHolidays?: React.Dispatch<React.SetStateAction<Holiday[]>>;
  isGradeCard?: boolean;
}

export default function GradeManagement({
    gradingScale, setGradingScale, 
    attendanceTypes, setAttendanceTypes, 
    holidays, setHolidays,
    isGradeCard = true,
}: GradeManagementProps) {
  const { toast } = useToast();
  
  // Grade Management State
  const [localGrades, setLocalGrades] = React.useState<Array<{
    grade: Grade;
    score: number;
    payoutRate: number;
    description: string;
    isNew: boolean;
  }>>([
    { grade: 'S' as Grade, score: 150, payoutRate: 150, description: '최고 성과', isNew: false },
    { grade: 'A+' as Grade, score: 130, payoutRate: 130, description: '우수 성과', isNew: false },
    { grade: 'A' as Grade, score: 115, payoutRate: 115, description: '좋은 성과', isNew: false },
    { grade: 'B+' as Grade, score: 105, payoutRate: 105, description: '기대 이상', isNew: false },
    { grade: 'B' as Grade, score: 100, payoutRate: 100, description: '기대치 충족 (기준)', isNew: false },
    { grade: 'B-' as Grade, score: 95, payoutRate: 95, description: '기대 이하', isNew: false },
    { grade: 'C' as Grade, score: 85, payoutRate: 85, description: '개선 필요', isNew: false },
    { grade: 'C-' as Grade, score: 70, payoutRate: 70, description: '상당한 개선 필요', isNew: false },
    { grade: 'D' as Grade, score: 0, payoutRate: 0, description: '미흡', isNew: false },
  ]);
  
  // Attendance Type Management State
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [localTypes, setLocalTypes] = React.useState<AttendanceType[]>([]);
  const [localHolidays, setLocalHolidays] = React.useState<Holiday[]>([]);
  const [holidayErrors, setHolidayErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    // gradingScale이 있고 비어있지 않을 때만 업데이트
    if (gradingScale && Object.keys(gradingScale).length > 0) {
        console.log('=== GradeManagement Load Debug ===');
        console.log('gradingScale prop:', gradingScale);
        console.log('gradingScale keys:', Object.keys(gradingScale));
        console.log('gradingScale length:', Object.keys(gradingScale).length);
        console.log('==================================');
        
        const uniqueGrades = Object.entries(gradingScale).map(([grade, info]) => ({ 
          ...info, 
          grade: grade as Grade, 
          description: info.description || '', // description이 없으면 빈 문자열로 설정
          isNew: false 
        }));
        // 중복된 등급 제거
        const seen = new Set();
        const filteredGrades = uniqueGrades.filter(item => {
            if (seen.has(item.grade)) {
                return false;
            }
            seen.add(item.grade);
            return true;
        });
        setLocalGrades(filteredGrades);
    } else {
        console.log('=== GradeManagement Load Debug ===');
        console.log('gradingScale is empty or undefined');
        console.log('gradingScale:', gradingScale);
        console.log('==================================');
    }
    // gradingScale이 비어있거나 undefined면 기본값 유지
  }, [gradingScale]);

  React.useEffect(() => {
    if(attendanceTypes) {
        setLocalTypes([...attendanceTypes].sort((a,b) => {
            if (a.deductionDays !== b.deductionDays) return b.deductionDays - a.deductionDays;
            return a.name.localeCompare(b.name);
        }));
    }
  }, [attendanceTypes]);
  
  React.useEffect(() => {
    if (holidays) {
        setLocalHolidays([...holidays]);
    }
  }, [holidays]);

  // Grade Management Handlers
  const handleGradeInputChange = (index: number, field: keyof GradeInfo | 'grade', value: string) => {
    const newGrades = [...localGrades];
    if (field === 'grade') {
      // 중복된 등급이 있는지 확인
      const isDuplicate = newGrades.some((grade, i) => i !== index && grade.grade === value);
      if (isDuplicate) {
        toast({
          title: "중복된 등급",
          description: "이미 존재하는 등급입니다.",
          variant: "destructive"
        });
        return;
      }
      newGrades[index].grade = value as Grade;
    } else if (field === 'description') {
      // description은 문자열로 처리
      (newGrades[index] as any)[field] = value;
    } else {
      // score, payoutRate는 숫자로 처리
      (newGrades[index] as any)[field] = Number(value);
    }
    setLocalGrades(newGrades);
  };

  const handleAddNewGrade = () => {
    // 사용되지 않는 등급 찾기
    const usedGrades = new Set(localGrades.map(g => g.grade));
    const availableGrades: Grade[] = ['S', 'A+', 'A', 'B+', 'B', 'B-', 'C', 'C-', 'D'];
    const unusedGrade = availableGrades.find(grade => !usedGrades.has(grade)) || 'A';
    
    const newGrade = { 
      grade: unusedGrade as Grade, 
      score: 0, 
      payoutRate: 0,
      description: '',
      isNew: true 
    };
    setLocalGrades([...localGrades, newGrade]);
  };

  const handleRemoveGrade = (index: number) => {
    const newGrades = localGrades.filter((_, i) => i !== index);
    setLocalGrades(newGrades);
  };

  const handleSaveGrades = () => {
    if (setGradingScale) {
      const newGradingScale = localGrades.reduce((acc, grade) => {
        if (grade.grade) {
          acc[grade.grade] = { 
            score: grade.score, 
            amount: 0, // 기본값으로 설정
            payoutRate: grade.payoutRate,
            description: grade.description
          };
        }
        return acc;
      }, {} as Record<NonNullable<Grade>, GradeInfo>);
      
      console.log('=== GradeManagement Save Debug ===');
      console.log('localGrades:', localGrades);
      console.log('newGradingScale:', newGradingScale);
      console.log('newGradingScale keys:', Object.keys(newGradingScale));
      console.log('newGradingScale length:', Object.keys(newGradingScale).length);
      console.log('==================================');
      
      setGradingScale(newGradingScale);
      toast({
        title: "저장 완료",
        description: "등급 기준이 저장되었습니다."
      });
    }
  };

  // Attendance Type Management Handlers
  const handleTypeInputChange = (index: number, field: keyof AttendanceType, value: string) => {
    const newTypes = [...localTypes];
    if (field === 'deductionDays') {
      newTypes[index][field] = parseFloat(value) || 0;
    } else {
      newTypes[index][field] = value;
    }
    setLocalTypes(newTypes);
  };

  const handleAddNewType = () => {
    const newType: AttendanceType = {
      id: `type-${Date.now()}`,
      name: '',
      deductionDays: 0,
      description: ''
    };
    setLocalTypes([...localTypes, newType]);
  };

  const handleRemoveType = (index: number) => {
    const newTypes = localTypes.filter((_, i) => i !== index);
    setLocalTypes(newTypes);
  };

  const handleSaveTypes = () => {
    if (setAttendanceTypes) {
      setAttendanceTypes(localTypes);
      toast({
        title: "저장 완료",
        description: "근태 기준이 저장되었습니다."
      });
    }
  };

  // Holiday Management Handlers
  const handleHolidayDateChange = (index: number, value: string) => {
    const newHolidays = [...localHolidays];
    newHolidays[index].date = value;
    setLocalHolidays(newHolidays);
    
    // 에러 상태 초기화
    const newErrors = { ...holidayErrors };
    delete newErrors[newHolidays[index].id];
    setHolidayErrors(newErrors);
  };

  const validateHolidayDate = (dateStr: string, id: string) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      setHolidayErrors(prev => ({ ...prev, [id]: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' }));
      return false;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      setHolidayErrors(prev => ({ ...prev, [id]: '유효한 날짜를 입력하세요' }));
      return false;
    }
    return true;
  };

  const handleHolidayNameChange = (index: number, value: string) => {
    const newHolidays = [...localHolidays];
    newHolidays[index].name = value;
    setLocalHolidays(newHolidays);
  };

  const handleAddNewHoliday = () => {
    const newHoliday: Holiday = {
      id: `holiday-${Date.now()}`,
      date: `${selectedYear}-01-01`,
      name: '',
      type: '공휴일'
    };
    setLocalHolidays([...localHolidays, newHoliday]);
  };

  const handleRemoveHoliday = (idToRemove: string) => {
    setLocalHolidays(localHolidays.filter(h => h.id !== idToRemove));
  };

  const handleSaveHolidays = () => {
    if (setHolidays) {
      setHolidays(localHolidays);
      toast({
        title: "저장 완료",
        description: "공휴일이 저장되었습니다."
      });
    }
  };

  // 연도별 공휴일 필터링
  const filteredHolidays = React.useMemo(() => {
    return localHolidays.filter(holiday => {
      const holidayYear = parseInt(holiday.date.split('-')[0], 10);
      return holidayYear === selectedYear;
    });
  }, [localHolidays, selectedYear]);

  // 사용 가능한 연도 목록
  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    localHolidays.forEach(holiday => {
      const year = parseInt(holiday.date.split('-')[0], 10);
      if (!isNaN(year)) years.add(year);
    });
    years.add(selectedYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [localHolidays, selectedYear]);

  // Grade Card 렌더링 (기존 기능 유지)
  const renderGradeCard = () => (
    <Card>
      <CardHeader>
        <CardTitle>등급/점수 관리</CardTitle>
        <CardDescription>
          등급별 점수와 지급률을 관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-2 px-3 text-center">등급</TableHead>
                <TableHead className="py-2 px-3 text-center">점수</TableHead>
                <TableHead className="py-2 px-3 text-center">지급률 (%)</TableHead>
                <TableHead className="py-2 px-3 text-center">설명</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(localGrades || []).map((grade, index) => (
                <TableRow key={`grade-${index}-${grade.grade}`}>
                  <TableCell className="py-1 px-2 text-center">
                    <Input 
                      value={grade.grade || ''} 
                      onChange={(e) => handleGradeInputChange(index, 'grade', e.target.value)} 
                      className="w-full h-8 mx-auto"
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2 text-center">
                    <Input 
                      type="number" 
                      value={grade.score} 
                      onChange={(e) => handleGradeInputChange(index, 'score', e.target.value)} 
                      className="w-full h-8 mx-auto"
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2 text-center">
                    <Input 
                      type="number" 
                      value={grade.payoutRate} 
                      onChange={(e) => handleGradeInputChange(index, 'payoutRate', e.target.value)} 
                      className="w-full h-8 mx-auto"
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2 text-center">
                    <Input 
                      value={grade.description || ''} 
                      onChange={(e) => handleGradeInputChange(index, 'description', e.target.value)} 
                      className="w-full h-8 mx-auto"
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2 text-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveGrade(index)} 
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
          <Button variant="outline" onClick={handleAddNewGrade}>
            <PlusCircle className="mr-2 h-4 w-4" />새 등급 추가
          </Button>
          <Button onClick={handleSaveGrades}>
            <Save className="mr-2 h-4 w-4" />등급/점수 저장
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // 근태 관리 탭 렌더링
  const renderAttendanceTabs = () => (
    <Tabs defaultValue="types">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="types">근태 종류별 차감</TabsTrigger>
        <TabsTrigger value="holidays">공휴일</TabsTrigger>
      </TabsList>
      <ScrollArea className="h-[450px] p-1">
        <TabsContent value="types" className="pt-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-2 px-3 text-center">근태명</TableHead>
                  <TableHead className="py-2 px-3 text-center w-1/3">차감 일수</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localTypes.map((type, index) => (
                  <TableRow key={type.id}>
                    <TableCell className="py-1 px-2 text-center">
                      <Input 
                        value={type.name} 
                        onChange={(e) => handleTypeInputChange(index, 'name', e.target.value)} 
                        className="w-full h-8 mx-auto"
                      />
                    </TableCell>
                    <TableCell className="py-1 px-2 text-center">
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={type.deductionDays} 
                        onChange={(e) => handleTypeInputChange(index, 'deductionDays', e.target.value)} 
                        className="w-full h-8 mx-auto"
                      />
                    </TableCell>
                    <TableCell className="py-1 px-2 text-center">
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
              <PlusCircle className="mr-2 h-4 w-4" />추가
            </Button>
            <Button onClick={handleSaveTypes}>
              <Save className="mr-2 h-4 w-4" />근무기준 저장
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="holidays" className="pt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">공휴일 관리</h4>
            <Select value={String(selectedYear)} onValueChange={(yearStr) => setSelectedYear(parseInt(yearStr, 10))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="연도 선택" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}년</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-2 px-3 text-center">날짜</TableHead>
                  <TableHead className="py-2 px-3 text-center">공휴일명</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHolidays.map((holiday) => {
                  const index = localHolidays.findIndex(h => h.id === holiday.id);
                  return (
                    <TableRow key={holiday.id}>
                      <TableCell className="py-1 px-2 text-center">
                        <Input 
                          value={holiday.date} 
                          onChange={(e) => handleHolidayDateChange(index, e.target.value)} 
                          onBlur={(e) => validateHolidayDate(e.target.value, holiday.id)} 
                          className={cn("w-full h-8 mx-auto", holidayErrors[holiday.id] && "border-destructive")} 
                          placeholder="YYYY-MM-DD"
                        />
                        {holidayErrors[holiday.id] && (
                          <p className="text-xs text-destructive mt-1">{holidayErrors[holiday.id]}</p>
                        )}
                      </TableCell>
                      <TableCell className="py-1 px-2 text-center">
                        <Input 
                          value={holiday.name} 
                          onChange={(e) => handleHolidayNameChange(index, e.target.value)} 
                          className="w-full h-8 mx-auto"
                        />
                      </TableCell>
                      <TableCell className="py-1 px-2 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveHoliday(holiday.id)} 
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
              <PlusCircle className="mr-2 h-4 w-4" />추가
            </Button>
            <Button onClick={handleSaveHolidays}>
              <Save className="mr-2 h-4 w-4" />공휴일 저장
            </Button>
          </div>
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );

  // 조건부 렌더링
  if (isGradeCard) {
    return renderGradeCard();
  } else {
    return renderAttendanceTabs();
  }
}
