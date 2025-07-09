'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Employee, Evaluation, EvaluationResult, Grade } from '@/lib/types';
import { MonthSelector } from './month-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface ManageDataProps {
  results: EvaluationResult[];
  onEmployeeUpload: (year: number, month: number, employees: Employee[]) => void;
  onEvaluationUpload: (year: number, month: number, evaluations: (Pick<Evaluation, 'employeeId' | 'grade' | 'memo'> & { baseAmount?: number })[]) => void;
}

export default function ManageData({ onEmployeeUpload, onEvaluationUpload, results }: ManageDataProps) {
  const { toast } = useToast();
  const employeeFileInputRef = React.useRef<HTMLInputElement>(null);
  const evaluationFileInputRef = React.useRef<HTMLInputElement>(null);

  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  });

  const handleEmployeeFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<any>(worksheet);

          const newEmployees: Employee[] = json.map((row, index) => {
            const uniqueId = String(row['고유사번'] || '');
            if (!uniqueId) {
                throw new Error(`${index + 2}번째 행에 고유사번이 없습니다.`);
            }

            return {
              id: `E${uniqueId}`,
              uniqueId: uniqueId,
              name: String(row['이름'] || ''),
              company: String(row['회사'] || ''),
              department: String(row['소속부서'] || ''),
              title: String(row['직책'] || '팀원'),
              position: String(row['직책'] || '팀원'),
              growthLevel: String(row['성장레벨'] || ''),
              workRate: parseFloat(String(row['실근무율'] || '0')) || 0,
              evaluatorId: String(row['평가자사번'] || ''),
              baseAmount: Number(String(row['개인별 기준금액'] || '0').replace(/,/g, '')) || 0,
              group: String(row['평가그룹'] || ''),
            };
          });

          onEmployeeUpload(selectedDate.year, selectedDate.month, newEmployees);
          toast({
            title: '파일 업로드 성공',
            description: `${selectedDate.year}년 ${selectedDate.month}월 대상자 데이터가 ${file.name} 파일에서 성공적으로 반영되었습니다.`,
          });
        } catch (error: any) {
          console.error("Error parsing employee Excel file:", error);
          toast({
            variant: "destructive",
            title: '파일 처리 오류',
            description: error.message || '엑셀 파일을 처리하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.',
          });
        }
      };
      reader.readAsArrayBuffer(file);
    }
    if(employeeFileInputRef.current) {
        employeeFileInputRef.current.value = "";
    }
  };

  const handleEvaluationFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<any>(worksheet);

                const newEvaluations = json.map((row, index) => {
                    const uniqueId = String(row['고유사번'] || '');
                    if (!uniqueId) {
                        throw new Error(`${index + 2}번째 행에 고유사번이 없습니다.`);
                    }
                    return {
                        employeeId: `E${uniqueId}`,
                        grade: (String(row['등급'] || '') || null) as Grade,
                        memo: String(row['비고'] || ''),
                        baseAmount: Number(String(row['기준금액'] || '0').replace(/,/g, '')),
                    };
                });

                onEvaluationUpload(selectedDate.year, selectedDate.month, newEvaluations);

                toast({
                    title: '평가 데이터 업로드 성공',
                    description: `${selectedDate.year}년 ${selectedDate.month}월 평가 데이터가 ${file.name} 파일에서 성공적으로 반영되었습니다.`,
                });
            } catch (error: any) {
                console.error("Error parsing evaluation Excel file:", error);
                toast({
                    variant: "destructive",
                    title: '파일 처리 오류',
                    description: error.message || '평가 데이터 엑셀 파일을 처리하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.',
                });
            }
        };
        reader.readAsArrayBuffer(file);
    }
    if (evaluationFileInputRef.current) {
        evaluationFileInputRef.current.value = "";
    }
  };

  const handleDownloadBaseTemplate = () => {
    const dataForSheet = results.map(r => ({
        '고유사번': r.uniqueId,
        '이름': r.name,
        '회사': r.company,
        '소속부서': r.department,
        '직책': r.title,
        '성장레벨': r.growthLevel,
        '실근무율': r.workRate,
        '평가그룹': r.group,
        '평가자사번': r.evaluatorId,
        '평가자이름': r.evaluatorName,
        '개인별 기준금액': r.baseAmount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet.length > 0 ? dataForSheet : [{}], {
        header: [
            '고유사번', '이름', '회사', '소속부서', '직책', '성장레벨', 
            '실근무율', '평가그룹', '평가자사번', '평가자이름', '개인별 기준금액'
        ]
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '대상자 양식');
    const fileName = `${selectedDate.year}.${String(selectedDate.month).padStart(2,'0')}_월성과대상자.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleDownloadEvalTemplate = () => {
    const dataForSheet = results.map(r => ({
        '고유사번': r.uniqueId,
        '이름': r.name,
        '회사': r.company,
        '소속부서': r.department,
        '직책': r.title,
        '성장레벨': r.growthLevel,
        '실근무율': r.workRate,
        '평가그룹': r.group,
        '세부구분1': r.detailedGroup1,
        '세부구분2': r.detailedGroup2,
        '평가자사번': r.evaluatorId,
        '평가자이름': r.evaluatorName,
        '점수': r.score,
        '등급': r.grade,
        '기준금액': r.baseAmount,
        '최종금액': r.finalAmount,
        '비고': r.memo,
    }));

    const headers = [
        '고유사번', '이름', '회사', '소속부서', '직책', '성장레벨', 
        '실근무율', '평가그룹', '세부구분1', '세부구분2', '평가자사번', '평가자이름', 
        '점수', '등급', '기준금액', '최종금액', '비고'
    ];

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet.length > 0 ? dataForSheet : [{}], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '평가데이터 양식');
    const fileName = `${selectedDate.year}.${String(selectedDate.month).padStart(2, '0')}_월성과데이터.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>데이터 관리</CardTitle>
                <CardDescription>
                    업로드할 데이터의 기준 월을 선택하세요. 선택한 월의 기존 데이터는 덮어쓰여집니다.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Label>데이터 적용 월 선택</Label>
                <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </CardContent>
        </Card>

        <Tabs defaultValue="base-data">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="base-data">평가 대상자 업로드</TabsTrigger>
                <TabsTrigger value="eval-data">평가 데이터 업로드</TabsTrigger>
            </TabsList>
            <TabsContent value="base-data">
                <Card>
                    <CardHeader>
                        <CardTitle>평가 대상자 데이터</CardTitle>
                        <CardDescription>
                            엑셀 파일을 업로드하여 특정 월의 평가 대상자 정보를 업데이트하세요.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="employee-data">엑셀 파일 업로드</Label>
                            <Input id="employee-data" type="file" accept=".xlsx, .xls" onChange={handleEmployeeFileUpload} ref={employeeFileInputRef} />
                            </div>
                            <Button onClick={handleDownloadBaseTemplate} variant="outline" className="w-full sm:w-auto mt-auto">
                            <Download className="mr-2 h-4 w-4" /> 양식 다운로드
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="eval-data">
                 <Card>
                    <CardHeader>
                        <CardTitle>평가 데이터</CardTitle>
                        <CardDescription>
                            등급, 비고 등 평가 결과가 포함된 엑셀 파일을 업로드합니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="evaluation-data">엑셀 파일 업로드</Label>
                                <Input id="evaluation-data" type="file" accept=".xlsx, .xls" onChange={handleEvaluationFileUpload} ref={evaluationFileInputRef} />
                            </div>
                            <Button onClick={handleDownloadEvalTemplate} variant="outline" className="w-full sm:w-auto mt-auto">
                                <Download className="mr-2 h-4 w-4" /> 양식 다운로드
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
