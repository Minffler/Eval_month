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
import type { Grade, GradeInfo } from '@/lib/types';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GradeManagementProps {
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  setGradingScale: React.Dispatch<React.SetStateAction<Record<NonNullable<Grade>, GradeInfo>>>;
}

export default function GradeManagement({ gradingScale, setGradingScale }: GradeManagementProps) {
  const [localGrades, setLocalGrades] = React.useState(
    Object.entries(gradingScale).map(([grade, info]) => ({ ...info, grade: grade as Grade, isNew: false }))
  );
  const { toast } = useToast();

  React.useEffect(() => {
    setLocalGrades(Object.entries(gradingScale).map(([grade, info]) => ({ ...info, grade: grade as Grade, isNew: false })));
  }, [gradingScale]);

  const handleInputChange = (index: number, field: keyof GradeInfo, value: string) => {
    const newGrades = [...localGrades];
    (newGrades[index] as any)[field] = Number(value);
    setLocalGrades(newGrades);
  };
  
  const handleGradeChange = (index: number, value: string) => {
    const newGrades = [...localGrades];
    newGrades[index].grade = value as Grade;
    setLocalGrades(newGrades);
  }

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
    // Validate that there are no duplicate grade names
    const gradeNames = localGrades.map(g => g.grade);
    if (new Set(gradeNames).size !== gradeNames.length) {
        toast({
            variant: "destructive",
            title: "오류",
            description: "등급명은 고유해야 합니다. 중복된 등급명이 있는지 확인해주세요.",
        });
        return;
    }

    const newGradingScale = localGrades.reduce((acc, current) => {
        if(current.grade && current.grade.trim() !== '') {
            acc[current.grade.trim() as NonNullable<Grade>] = {
                score: current.score,
                payoutRate: current.payoutRate,
                description: current.description,
            };
        }
      return acc;
    }, {} as Record<NonNullable<Grade>, GradeInfo>);
    
    setGradingScale(newGradingScale);
    toast({
      title: '저장 완료',
      description: '등급 및 점수 변경사항이 성공적으로 저장되었습니다.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>등급/점수 관리</CardTitle>
        <CardDescription>
          평가 등급, 점수, 지급률을 관리합니다. 변경사항은 '저장' 버튼을 눌러야 적용됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap py-2 px-3">등급</TableHead>
                <TableHead className="whitespace-nowrap py-2 px-3">점수</TableHead>
                <TableHead className="whitespace-nowrap py-2 px-3">지급률 (%)</TableHead>
                <TableHead className="whitespace-nowrap py-2 px-3">설명</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localGrades.map((gradeItem, index) => (
                <TableRow key={index}>
                  <TableCell className="py-1 px-2">
                    <Input
                      value={gradeItem.grade || ''}
                      onChange={(e) => handleGradeChange(index, e.target.value)}
                      className="w-20 h-8"
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <Input
                      type="number"
                      value={gradeItem.score}
                      onChange={(e) => handleInputChange(index, 'score', e.target.value)}
                      className="w-20 h-8"
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <Input
                      type="number"
                      value={gradeItem.payoutRate}
                      onChange={(e) => handleInputChange(index, 'payoutRate', e.target.value)}
                      className="w-24 h-8"
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <Input
                      value={gradeItem.description}
                      onChange={(e) => {
                        const newGrades = [...localGrades];
                        newGrades[index].description = e.target.value;
                        setLocalGrades(newGrades);
                      }}
                      className="w-full h-8"
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2">
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
            <PlusCircle className="mr-2 h-4 w-4" />
            새 등급 추가
          </Button>
          <Button onClick={handleSaveChanges}>
            변경사항 저장
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
