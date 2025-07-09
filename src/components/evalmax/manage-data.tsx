'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Employee, Evaluation, EvaluationResult, Grade, EvaluationUploadData } from '@/lib/types';
import { MonthSelector } from './month-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


interface ManageDataProps {
  results: EvaluationResult[];
  onEmployeeUpload: (year: number, month: number, employees: Employee[]) => void;
  onEvaluationUpload: (year: number, month: number, evaluations: EvaluationUploadData[]) => void;
  selectedDate: { year: number, month: number };
  setSelectedDate: (date: { year: number, month: number }) => void;
  onClearEmployeeData: (year: number, month: number) => void;
  onClearEvaluationData: (year: number, month: number) => void;
}

export default function ManageData({ onEmployeeUpload, onEvaluationUpload, results, selectedDate, setSelectedDate, onClearEmployeeData, onClearEvaluationData }: ManageDataProps) {
  const { toast } = useToast();
  const employeeFileInputRef = React.useRef<HTMLInputElement>(null);
  const evaluationFileInputRef = React.useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = React.useState<'deleteEmployees' | 'resetEvaluations' | null>(null);

  const handleClearEmployees = () => {
    onClearEmployeeData(selectedDate.year, selectedDate.month);
    toast({ title: '삭제 완료', description: '해당 월의 모든 대상자 데이터가 삭제되었습니다.' });
    setDialogOpen(null);
  };
  
  const handleResetEvaluations = () => {
    onClearEvaluationData(selectedDate.year, selectedDate.month);
    toast({ title: '초기화 완료', description: '해당 월의 모든 평가 데이터가 초기화되었습니다.' });
    setDialogOpen(null);
  };

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
            const uniqueId = String(row['ID'] || '');
            if (!uniqueId) {
                throw new Error(`${index + 2}번째 행에 ID가 없습니다.`);
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
              evaluatorId: String(row['평가자 ID'] || ''),
              baseAmount: Number(String(row['개인별 기준금액'] || '0').replace(/,/g, '')) || 0,
              memo: String(row['비고'] || ''),
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

                const newEvaluations: EvaluationUploadData[] = json.map((row, index) => {
                    const uniqueId = String(row['ID'] || '');
                    if (!uniqueId) {
                        throw new Error(`${index + 2}번째 행에 ID가 없습니다.`);
                    }

                    const workRateValue = row['실근무율'];
                    const baseAmountValue = row['기준금액'];
                    
                    return {
                        employeeId: `E${uniqueId}`,
                        name: row['이름'] ? String(row['이름']) : undefined,
                        company: row['회사'] ? String(row['회사']) : undefined,
                        department: row['소속부서'] ? String(row['소속부서']) : undefined,
                        title: row['직책'] ? String(row['직책']) : undefined,
                        position: row['직책'] ? String(row['직책']) : undefined,
                        growthLevel: row['성장레벨'] ? String(row['성장레벨']) : undefined,
                        workRate: workRateValue !== undefined && workRateValue !== null ? parseFloat(String(workRateValue)) : undefined,
                        evaluatorId: row['평가자 ID'] ? String(row['평가자 ID']) : undefined,
                        evaluatorName: row['평가자'] ? String(row['평가자']) : undefined,
                        baseAmount: baseAmountValue !== undefined && baseAmountValue !== null ? Number(String(baseAmountValue).replace(/,/g, '')) : undefined,
                        grade: (String(row['등급'] || '') || null) as Grade,
                        memo: row['비고'] !== undefined ? String(row['비고']) : undefined,
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
        'ID': r.uniqueId,
        '이름': r.name,
        '회사': r.company,
        '소속부서': r.department,
        '직책': r.title,
        '성장레벨': r.growthLevel,
        '실근무율': r.workRate,
        '평가자 ID': r.evaluatorId,
        '개인별 기준금액': r.baseAmount,
        '비고': r.memo,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet.length > 0 ? dataForSheet : [{}], {
        header: [
            'ID', '이름', '회사', '소속부서', '직책', '성장레벨', 
            '실근무율', '평가자 ID', '개인별 기준금액', '비고'
        ]
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '대상자 양식');
    const fileName = `${selectedDate.year}.${String(selectedDate.month).padStart(2,'0')}_월성과대상자.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleDownloadEvalTemplate = () => {
    const dataForSheet = results.map(r => ({
        'ID': r.uniqueId,
        '이름': r.name,
        '회사': r.company,
        '소속부서': r.department,
        '직책': r.title,
        '성장레벨': r.growthLevel,
        '근무율': r.workRate,
        '평가그룹': r.evaluationGroup,
        '세부구분1': r.detailedGroup1,
        '세부구분2': r.detailedGroup2,
        '평가자 ID': r.evaluatorId,
        '평가자': r.evaluatorName,
        '점수': r.score,
        '등급': r.grade,
        '기준금액': r.baseAmount,
        '최종금액': r.finalAmount,
        '비고': r.memo,
    }));

    const headers = [
        'ID', '이름', '회사', '소속부서', '직책', '성장레벨', 
        '근무율', '평가그룹', '세부구분1', '세부구분2', '평가자 ID', '평가자', 
        '점수', '등급', '기준금액', '최종금액', '비고'
    ];

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet.length > 0 ? dataForSheet : [{}], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '평가데이터 양식');
    const fileName = `${selectedDate.year}.${String(selectedDate.month).padStart(2, '0')}_월성과데이터.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleGenericFileUpload = (file: File | undefined) => {
    if (!file) return;
    toast({
      title: '파일 업로드 완료',
      description: `${file.name} 파일이 업로드되었습니다. 추후 처리 로직이 구현될 예정입니다.`,
    });
  }

  return (
    <div className="space-y-6">
        <Tabs defaultValue="base-data">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="base-data">평가 대상자/데이터 업로드</TabsTrigger>
                <TabsTrigger value="work-rate-data">근무율 산출 데이터 업로드</TabsTrigger>
            </TabsList>
            <TabsContent value="base-data">
                <Card>
                    <CardHeader>
                        <CardTitle>평가 대상자 및 데이터</CardTitle>
                        <CardDescription>
                            엑셀 파일을 업로드하여 특정 월의 평가 대상자 정보 또는 평가 데이터를 업데이트하세요.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>평가 대상자 업로드</Label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Input id="employee-data" type="file" accept=".xlsx, .xls" onChange={handleEmployeeFileUpload} ref={employeeFileInputRef} />
                                </div>
                                <Button onClick={handleDownloadBaseTemplate} variant="outline" className="w-full sm:w-auto mt-auto">
                                <Download className="mr-2 h-4 w-4" /> 양식 다운로드
                                </Button>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>평가 데이터 업로드</Label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Input id="evaluation-data" type="file" accept=".xlsx, .xls" onChange={handleEvaluationFileUpload} ref={evaluationFileInputRef} />
                                </div>
                                <Button onClick={handleDownloadEvalTemplate} variant="outline" className="w-full sm:w-auto mt-auto">
                                    <Download className="mr-2 h-4 w-4" /> 양식 다운로드
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="work-rate-data">
                 <Card>
                    <CardHeader>
                        <CardTitle>근무율 산출 데이터 업데이트</CardTitle>
                        <CardDescription>
                            근무율 산출에 필요한 파일들을 각각 업로드합니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 border rounded-lg space-y-2 flex flex-col items-center">
                                <Label htmlFor="pregnancy-work-hours" className="text-center">임신기간 단축근로</Label>
                                <Input id="pregnancy-work-hours" type="file" accept=".xlsx, .xls" onChange={(e) => handleGenericFileUpload(e.target.files?.[0])} />
                            </div>
                            <div className="p-4 border rounded-lg space-y-2 flex flex-col items-center">
                                <Label htmlFor="childcare-work-hours" className="text-center">육아기, 가족돌봄 단축근로</Label>
                                <Input id="childcare-work-hours" type="file" accept=".xlsx, .xls" onChange={(e) => handleGenericFileUpload(e.target.files?.[0])} />
                            </div>
                            <div className="p-4 border rounded-lg space-y-2 flex flex-col items-center">
                                <Label htmlFor="attendance-management" className="text-center">일근태관리</Label>
                                <Input id="attendance-management" type="file" accept=".xlsx, .xls" onChange={(e) => handleGenericFileUpload(e.target.files?.[0])} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        <Card>
            <CardHeader>
                <CardTitle>데이터 초기화</CardTitle>
                <CardDescription>
                    현재 선택된 월({selectedDate.year}년 {selectedDate.month}월)의 데이터를 삭제하거나 초기화합니다. 이 작업은 되돌릴 수 없습니다.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button variant="destructive" onClick={() => setDialogOpen('deleteEmployees')} disabled={results.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    대상자 삭제
                </Button>
                <Button variant="destructive" onClick={() => setDialogOpen('resetEvaluations')} disabled={results.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    평가이력 초기화
                </Button>
            </CardContent>
        </Card>

        <AlertDialog open={dialogOpen !== null} onOpenChange={(open) => !open && setDialogOpen(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>정말 진행하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {dialogOpen === 'deleteEmployees' && `기존 대상자 ${results.length}명의 이력을 모두 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
                        {dialogOpen === 'resetEvaluations' && `기존 대상자 ${results.length}명의 평가데이터를 모두 초기화합니다. 이 작업은 되돌릴 수 없습니다.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDialogOpen(null)}>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={dialogOpen === 'deleteEmployees' ? handleClearEmployees : handleResetEvaluations}>
                        확인
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
