'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Employee, EvaluationResult, Grade, EvaluationUploadData, WorkRateInputs, ShortenedWorkHourRecord, DailyAttendanceRecord, ShortenedWorkType } from '@/lib/types';
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
  onWorkRateDataUpload: (year: number, month: number, type: keyof WorkRateInputs, data: any[]) => void;
  onClearWorkRateData: (year: number, month: number, type: keyof WorkRateInputs) => void;
  workRateInputs: WorkRateInputs;
}

const headerMapping: Record<string, string> = {
    '고유사번': 'uniqueId_primary', '사번': 'uniqueId_secondary', 'ID': 'uniqueId_tertiary',
    '성명': 'name', '이름': 'name', '피평가자': 'name',
    '부서': 'department', '소속부서': 'department',
    '시작일': 'startDate', '시작일자': 'startDate',
    '종료일': 'endDate', '종료일자': 'endDate',
    '출근시각': 'startTime', '퇴근시각': 'endTime',
    '일자': 'date', '근태사용일': 'date',
    '근태': 'type', '근태종류': 'type'
};

const mapRowToSchema = <T extends {}>(row: any): T => {
    const newRow: any = {};
    const tempRow: any = {};

    for (const key in row) {
        const mappedKey = headerMapping[key.trim()] || key.trim();
        tempRow[mappedKey] = row[key];
    }
    
    // Apply priority for uniqueId
    const uniqueId = String(tempRow['uniqueId_primary'] ?? tempRow['uniqueId_secondary'] ?? tempRow['uniqueId_tertiary'] ?? '');
    
    // Construct the final row, excluding temporary keys
    for(const key in tempRow) {
        if (!key.startsWith('uniqueId_')) {
            newRow[key] = tempRow[key];
        }
    }
    newRow['uniqueId'] = uniqueId;
    
    return newRow as T;
}

export default function ManageData({ 
  onEmployeeUpload, 
  onEvaluationUpload, 
  results, 
  selectedDate, 
  onClearEmployeeData, 
  onClearEvaluationData,
  onWorkRateDataUpload,
  onClearWorkRateData,
  workRateInputs
}: ManageDataProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = React.useState<{ type: 'deleteEmployees' | 'resetEvaluations' | 'resetWorkData', workDataType?: keyof WorkRateInputs } | null>(null);

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
  
  const handleResetWorkData = () => {
    if (!dialogOpen?.workDataType) return;

    let typeName = '';
    switch(dialogOpen.workDataType) {
        case 'shortenedWorkHours': typeName = '단축근로'; break;
        case 'dailyAttendance': typeName = '일근태'; break;
    }
    onClearWorkRateData(selectedDate.year, selectedDate.month, dialogOpen.workDataType);
    toast({ title: '초기화 완료', description: `해당 월의 ${typeName} 데이터가 초기화되었습니다.` });
    setDialogOpen(null);
  }
  
  const handleResetSpecificWorkData = (typeToClear: '임신' | '육아/돌봄') => {
      onClearWorkRateData(selectedDate.year, selectedDate.month, 'shortenedWorkHours');
      toast({ title: '초기화 완료', description: `해당 월의 ${typeToClear} 데이터가 초기화되었습니다.` });
      setDialogOpen(null);
  };


  const parseExcelFile = <T extends {}>(file: File, parser: (rows: any[]) => T[]): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<any>(worksheet);
                const mappedJson = json.map(row => mapRowToSchema(row));
                resolve(parser(mappedJson));
            } catch (error: any) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, uploadType: 'employees' | 'evaluations' | 'shortenedWork' | 'dailyAttendance', shortenedWorkType?: ShortenedWorkType) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        switch(uploadType) {
          case 'employees':
            const newEmployees = await parseExcelFile<Employee>(file, json => json.map((row, index) => {
              const uniqueId = String(row['uniqueId'] || '');
              if (!uniqueId) throw new Error(`${index + 2}번째 행에 ID가 없습니다.`);
              return {
                id: `E${uniqueId}`, uniqueId, name: String(row['name'] || ''),
                company: String(row['회사'] || ''), department: String(row['department'] || ''),
                title: String(row['직책'] || '팀원'), position: String(row['직책'] || '팀원'),
                growthLevel: String(row['성장레벨'] || ''), workRate: parseFloat(String(row['실근무율'] || '0')) || 0,
                evaluatorId: String(row['평가자 ID'] || ''), baseAmount: Number(String(row['개인별 기준금액'] || '0').replace(/,/g, '')) || 0,
                memo: String(row['비고'] || ''),
              };
            }));
            onEmployeeUpload(selectedDate.year, selectedDate.month, newEmployees);
            break;
          case 'evaluations':
            const newEvals = await parseExcelFile<EvaluationUploadData>(file, json => json.map((row, index) => {
              const uniqueId = String(row['uniqueId'] || '');
              if (!uniqueId) throw new Error(`${index + 2}번째 행에 ID가 없습니다.`);
              const workRateValue = row['실근무율']; const baseAmountValue = row['기준금액'];
              return {
                  employeeId: `E${uniqueId}`,
                  name: row['name'] ? String(row['name']) : undefined, company: row['회사'] ? String(row['회사']) : undefined,
                  department: row['department'] ? String(row['department']) : undefined, title: row['직책'] ? String(row['직책']) : undefined,
                  position: row['직책'] ? String(row['직책']) : undefined, growthLevel: row['성장레벨'] ? String(row['성장레벨']) : undefined,
                  workRate: workRateValue !== undefined && workRateValue !== null ? parseFloat(String(workRateValue)) : undefined,
                  evaluatorId: row['평가자 ID'] ? String(row['평가자 ID']) : undefined, evaluatorName: row['평가자'] ? String(row['평가자']) : undefined,
                  baseAmount: baseAmountValue !== undefined && baseAmountValue !== null ? Number(String(baseAmountValue).replace(/,/g, '')) : undefined,
                  grade: (String(row['등급'] || '') || null) as Grade, memo: row['비고'] !== undefined ? String(row['비고']) : undefined,
              };
            }));
            onEvaluationUpload(selectedDate.year, selectedDate.month, newEvals);
            break;
          case 'shortenedWork':
            if (!shortenedWorkType) throw new Error('Shortened work type is required.');
            const newShortenedWork = await parseExcelFile<ShortenedWorkHourRecord>(file, json => json.map((row, index) => {
              const uniqueId = String(row['uniqueId'] || '');
              if (!uniqueId) throw new Error(`${index + 2}번째 행에 사번이 없습니다.`);
              return {
                uniqueId, name: String(row['name'] || ''),
                startDate: String(row['startDate'] || ''), endDate: String(row['endDate'] || ''),
                startTime: String(row['startTime'] || ''), endTime: String(row['endTime'] || ''),
                type: shortenedWorkType,
              }
            }));
            onWorkRateDataUpload(selectedDate.year, selectedDate.month, 'shortenedWorkHours', newShortenedWork);
            break;
          case 'dailyAttendance':
            const newDailyAttendance = await parseExcelFile<DailyAttendanceRecord>(file, json => json.map((row, index) => {
              const uniqueId = String(row['uniqueId'] || '');
              if (!uniqueId) throw new Error(`${index + 2}번째 행에 사번이 없습니다.`);
              return {
                uniqueId, name: String(row['name'] || ''),
                date: String(row['date'] || ''), type: String(row['type'] || '')
              }
            }));
            onWorkRateDataUpload(selectedDate.year, selectedDate.month, 'dailyAttendance', newDailyAttendance);
            break;
        }
        toast({ title: '업로드 성공', description: `${file.name} 파일이 성공적으로 처리되었습니다.` });
      } catch (error: any) {
        toast({ variant: 'destructive', title: '파일 처리 오류', description: error.message || '파일 처리 중 오류가 발생했습니다.' });
      } finally {
        if(event.target) event.target.value = "";
      }
    }
  };

  const handleDownloadTemplate = (type: 'employees' | 'evaluations') => {
    let dataForSheet, headers, fileName;
    if (type === 'employees') {
        dataForSheet = results.map(r => ({'ID': r.uniqueId, '이름': r.name, '회사': r.company, '소속부서': r.department, '직책': r.title, '성장레벨': r.growthLevel, '실근무율': r.workRate, '평가자 ID': r.evaluatorId, '개인별 기준금액': r.baseAmount, '비고': r.memo,}));
        headers = ['ID', '이름', '회사', '소속부서', '직책', '성장레벨', '실근무율', '평가자 ID', '개인별 기준금액', '비고'];
        fileName = `${selectedDate.year}.${String(selectedDate.month).padStart(2,'0')}_월성과대상자.xlsx`;
    } else {
        dataForSheet = results.map(r => ({'ID': r.uniqueId, '이름': r.name, '회사': r.company, '소속부서': r.department, '직책': r.title, '성장레벨': r.growthLevel, '근무율': r.workRate, '평가그룹': r.evaluationGroup, '세부구분1': r.detailedGroup1, '세부구분2': r.detailedGroup2, '평가자 ID': r.evaluatorId, '평가자': r.evaluatorName, '점수': r.score, '등급': r.grade, '기준금액': r.baseAmount, '최종금액': r.finalAmount, '비고': r.memo}));
        headers = ['ID', '이름', '회사', '소속부서', '직책', '성장레벨', '근무율', '평가그룹', '세부구분1', '세부구분2', '평가자 ID', '평가자', '점수', '등급', '기준금액', '최종금액', '비고'];
        fileName = `${selectedDate.year}.${String(selectedDate.month).padStart(2, '0')}_월성과데이터.xlsx`;
    }
    const worksheet = XLSX.utils.json_to_sheet(dataForSheet.length > 0 ? dataForSheet : [{}], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, fileName);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle>평가 대상자 업로드</CardTitle>
              <CardDescription>월별 평가 대상자 정보를 엑셀 파일로 업로드합니다. 기존 데이터는 덮어쓰기 됩니다.</CardDescription>
            </div>
            <Button variant="ghost" className="text-destructive hover:text-destructive" size="sm" onClick={() => setDialogOpen({type: 'deleteEmployees'})} disabled={results.length === 0}><Trash2 className="mr-2 h-4 w-4" />초기화</Button>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
            <div className="grid w-full items-center gap-1.5 flex-1">
                <Input id="employees" type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, 'employees')} onClick={(e) => (e.currentTarget.value = '')} />
            </div>
            <Button onClick={() => handleDownloadTemplate('employees')} variant="outline" className="self-stretch"><Download className="mr-2 h-4 w-4" />양식 다운로드</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
            <div>
              <CardTitle>평가 결과 업로드</CardTitle>
              <CardDescription>등급, 비고 등 평가 결과가 포함된 엑셀 파일을 업로드하여 기존 데이터를 업데이트합니다.</CardDescription>
            </div>
            <Button variant="ghost" className="text-destructive hover:text-destructive" size="sm" onClick={() => setDialogOpen({type: 'resetEvaluations'})} disabled={results.filter(r => r.grade).length === 0}><Trash2 className="mr-2 h-4 w-4" />초기화</Button>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
            <div className="grid w-full items-center gap-1.5 flex-1">
                <Input id="evaluations" type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, 'evaluations')} onClick={(e) => (e.currentTarget.value = '')} />
            </div>
            <Button onClick={() => handleDownloadTemplate('evaluations')} variant="outline" className="self-stretch"><Download className="mr-2 h-4 w-4" />양식 다운로드</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
          <h3 className="text-xl font-bold">근무 데이터 업로드</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle>임신기 단축근로</CardTitle>
                    <CardDescription>임신기 단축근로 내역이 담긴 파일을 업로드합니다.</CardDescription>
                </div>
                <Button variant="ghost" className="text-destructive hover:text-destructive" size="sm" onClick={() => handleResetSpecificWorkData('임신')} disabled={!workRateInputs.shortenedWorkHours?.some(r => r.type === '임신')}><Trash2 className="mr-2 h-4 w-4" />초기화</Button>
              </CardHeader>
              <CardContent>
                <Input id="shortenedWorkPregnancy" type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, 'shortenedWork', '임신')} onClick={(e) => (e.currentTarget.value = '')} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle>육아/돌봄 단축근로</CardTitle>
                  <CardDescription>육아기, 가족돌봄 등 단축근로 내역이 담긴 파일을 업로드합니다.</CardDescription>
                </div>
                <Button variant="ghost" className="text-destructive hover:text-destructive" size="sm" onClick={() => handleResetSpecificWorkData('육아/돌봄')} disabled={!workRateInputs.shortenedWorkHours?.some(r => r.type === '육아/돌봄')}><Trash2 className="mr-2 h-4 w-4" />초기화</Button>
              </CardHeader>
              <CardContent>
                <Input id="shortenedWorkCare" type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, 'shortenedWork', '육아/돌봄')} onClick={(e) => (e.currentTarget.value = '')} />
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle>일근태</CardTitle>
                  <CardDescription>연차, 반차, 병가 등 일별 근태 사용 내역 파일을 업로드합니다.</CardDescription>
                </div>
                <Button variant="ghost" className="text-destructive hover:text-destructive" size="sm" onClick={() => setDialogOpen({type: 'resetWorkData', workDataType: 'dailyAttendance'})} disabled={!workRateInputs.dailyAttendance?.length}><Trash2 className="mr-2 h-4 w-4" />초기화</Button>
              </CardHeader>
              <CardContent>
                <Input id="dailyAttendance" type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, 'dailyAttendance')} onClick={(e) => (e.currentTarget.value = '')} />
              </CardContent>
            </Card>
          </div>
      </div>

        <AlertDialog open={dialogOpen !== null} onOpenChange={(open) => !open && setDialogOpen(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>정말 진행하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {dialogOpen?.type === 'deleteEmployees' && `기존 대상자 ${results.length}명의 이력을 모두 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
                        {dialogOpen?.type === 'resetEvaluations' && `기존 대상자 ${results.filter(r => r.grade).length}명의 평가 데이터를 모두 초기화합니다. 이 작업은 되돌릴 수 없습니다.`}
                        {dialogOpen?.type === 'resetWorkData' && `선택한 근무 데이터를 초기화합니다. 이 작업은 되돌릴 수 없습니다.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDialogOpen(null)}>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        if (dialogOpen?.type === 'deleteEmployees') handleClearEmployees();
                        else if (dialogOpen?.type === 'resetEvaluations') handleResetEvaluations();
                        else if (dialogOpen?.type === 'resetWorkData') handleResetWorkData();
                    }}>
                        확인
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
