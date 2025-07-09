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
import type { AttendanceType } from '@/lib/types';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ATTENDANCE_TYPES_STORAGE_KEY = 'pl_eval_attendance_types';

const initialAttendanceTypes: AttendanceType[] = [
    { id: 'att-1', name: '연차', deductionHours: 8 },
    { id: 'att-2', name: '오전반차', deductionHours: 4 },
    { id: 'att-3', name: '오후반차', deductionHours: 4 },
    { id: 'att-4', name: '병가', deductionHours: 8 },
    { id: 'att-5', name: '공가', deductionHours: 8 },
];

export default function AttendanceTypeManagement() {
  const [attendanceTypes, setAttendanceTypes] = React.useState<AttendanceType[]>([]);
  const { toast } = useToast();
  
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(ATTENDANCE_TYPES_STORAGE_KEY);
      setAttendanceTypes(stored ? JSON.parse(stored) : initialAttendanceTypes);
    } catch (error) {
      console.error('Error reading attendance types from localStorage', error);
      setAttendanceTypes(initialAttendanceTypes);
    }
  }, []);

  const handleInputChange = (index: number, field: keyof AttendanceType, value: string) => {
    const newTypes = [...attendanceTypes];
    if (field === 'name') {
      newTypes[index].name = value;
    } else if (field === 'deductionHours') {
      newTypes[index].deductionHours = Number(value);
    }
    setAttendanceTypes(newTypes);
  };

  const handleAddNewType = () => {
    setAttendanceTypes([
      ...attendanceTypes,
      { id: `att-${Date.now()}`, name: '', deductionHours: 0 },
    ]);
  };

  const handleRemoveType = (index: number) => {
    const newTypes = attendanceTypes.filter((_, i) => i !== index);
    setAttendanceTypes(newTypes);
  };

  const handleSaveChanges = () => {
    // Validate that there are no duplicate names
    const names = attendanceTypes.map(t => t.name.trim());
    if (new Set(names).size !== names.length) {
        toast({
            variant: "destructive",
            title: "오류",
            description: "근태명은 고유해야 합니다. 중복된 이름이 있는지 확인해주세요.",
        });
        return;
    }
    // Validate names are not empty
    if (names.some(name => name === '')) {
         toast({
            variant: "destructive",
            title: "오류",
            description: "근태명을 입력해주세요.",
        });
        return;
    }

    try {
        localStorage.setItem(ATTENDANCE_TYPES_STORAGE_KEY, JSON.stringify(attendanceTypes));
        toast({
          title: '저장 완료',
          description: '근태 수치 변경사항이 성공적으로 저장되었습니다.',
        });
    } catch(error) {
        console.error('Error saving attendance types to localStorage', error);
        toast({
            variant: "destructive",
            title: "저장 실패",
            description: "변경사항을 저장하는 중 오류가 발생했습니다.",
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>근태 수치 관리</CardTitle>
        <CardDescription>
          근태 종류와 그에 따른 차감 시간을 직접 정의하고 관리합니다. 이 설정은 근무율 계산에 사용됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap py-2 px-3">근태명</TableHead>
                <TableHead className="whitespace-nowrap py-2 px-3">차감 시간 (단위: 시간)</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceTypes.map((type, index) => (
                <TableRow key={type.id}>
                  <TableCell className="py-1 px-2">
                    <Input
                      value={type.name}
                      onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                      className="w-40 h-8"
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <Input
                      type="number"
                      value={type.deductionHours}
                      onChange={(e) => handleInputChange(index, 'deductionHours', e.target.value)}
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
          <Button onClick={handleSaveChanges}>
            변경사항 저장
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
