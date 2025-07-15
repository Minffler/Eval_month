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
import { Separator } from '../ui/separator';

interface ManageDataProps {
  results: EvaluationResult[];
  allEmployees: Record<string, Employee[]>;
  onEmployeeUpload: (year: number, month: number, employees: Employee[]) => void;
  onEvaluationUpload: (year: number, month: number, evaluations: EvaluationUploadData[]) => void;
  selectedDate: { year: number, month: number };
  setSelectedDate: (date: { year: number, month: number }) => void;
  onClearEmployeeData: (year: number, month: number) => void;
  onClearEvaluationData: (year: number, month: number) => void;
  onWorkRateDataUpload: (year: number, month: number, type: keyof WorkRateInputs, data: any[], isApproved: boolean) => void;
  onClearWorkRateData: (year: number, month: number, type: keyof WorkRateInputs | ShortenedWorkType) => void;
  workRateInputs: WorkRateInputs;
}

const headerMapping: Record<string, string> = {
    '고유사번': 'uniqueId', '사번': 'uniqueId', 'ID': 'uniqueId',
    '성명': 'name', '이름': 'name', '피평가자': 'name',
    '부서': 'department', '소속부서': 'department',
    '시작일': 'startDate', '시작일자': 'startDate',
    '종료일': 'endDate', '종료일자': 'endDate',
    '출근시각': 'startTime', '퇴근시각': 'endTime',
    '일자': 'date', '근태사용일': 'date',
    '근태': 'type', '근태종류': 'type',
    '평가자 ID': 'evaluatorId', '평가자사번': 'evaluatorId',
};

const mapRowToSchema = <T extends {}>(row: any): T => {
    const newRow: any = {};
    for (const key in row) {
        const mappedKey = headerMapping[key.trim()] || key.trim();
        newRow[mappedKey] = row[key];
    }
    return newRow as T;
}

interface UploadSectionProps {
    id: string;
    title: string;
    description: string;
    onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onDownload: () => void;
    onReset: () => void;
    isResetDisabled: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ title, description, id, onUpload, onDownload, onReset, isResetDisabled }) => {
    return (
        <div className="space-y-4">
            <div>
                <h4 className="font-semibold">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <Input 
                    id={id} 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={onUpload}
                    onClick={(e) => (e.currentTarget.value = '')}
                    className="flex-grow text-sm file:text-sm"
                />
                <div className="flex items-center gap-2">
                    <Button onClick={onDownload} variant="ghost" className="text-muted-foreground">
                        <Download className="mr-2 h-4 w-4" /> 양식
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onReset}
                        disabled={isResetDisabled}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> 초기화
                    </Button>
                </div>
            </div>
        </div>
    );
};


export default function ManageData({ 
  onEmployeeUpload, 
  onEvaluationUpload, 
  results,
  allEmployees,
  selectedDate, 
  onClearEmployeeData, 
  onClearEvaluationData,
  onWorkRateDataUpload,
  onClearWorkRateData,
  workRateInputs
}: ManageDataProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = React.useState<{ type: 'deleteEmployees' | 'resetEvaluations' | 'resetWorkData', workDataType?: keyof WorkRateInputs | ShortenedWorkType } | null>(null);

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
    onClearWorkRateData(selectedDate.year, selectedDate.month, dialogOpen.workDataType);
    toast({ title: '초기화 완료', description: `선택한 근무 데이터가 초기화되었습니다.` });
    setDialogOpen(null);
  }

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
        const now = new Date().toISOString();
        let uploadCount = 0;

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
                evaluatorId: String(row['evaluatorId'] || ''), baseAmount: Number(String(row['개인별 기준금액'] || '0').replace(/,/g, '')) || 0,
                memo: String(row['비고'] || ''),
              };
            }));
            uploadCount = newEmployees.length;
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
                  evaluatorId: row['evaluatorId'] ? String(row['evaluatorId']) : undefined, evaluatorName: row['평가자'] ? String(row['평가자']) : undefined,
                  baseAmount: baseAmountValue !== undefined && baseAmountValue !== null ? Number(String(baseAmountValue).replace(/,/g, '')) : undefined,
                  grade: (String(row['등급'] || '') || null) as Grade, memo: row['비고'] !== undefined ? String(row['비고']) : undefined,
              };
            }));
            uploadCount = newEvals.length;
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
                lastModified: now,
              }
            }));
            uploadCount = newShortenedWork.length;
            onWorkRateDataUpload(selectedDate.year, selectedDate.month, 'shortenedWorkHours', newShortenedWork, true);
            break;
          case 'dailyAttendance':
            const newDailyAttendance = await parseExcelFile<DailyAttendanceRecord>(file, json => json.map((row, index) => {
              const uniqueId = String(row['uniqueId'] || '');
              if (!uniqueId) throw new Error(`${index + 2}번째 행에 사번이 없습니다.`);
              return {
                uniqueId, name: String(row['name'] || ''),
                date: String(row['date'] || ''), type: String(row['type'] || ''),
                lastModified: now,
              }
            }));
            uploadCount = newDailyAttendance.length;
            onWorkRateDataUpload(selectedDate.year, selectedDate.month, 'dailyAttendance', newDailyAttendance, true);
            break;
        }
        toast({ title: '업로드 성공', description: `${uploadCount}명의 데이터가 처리되었습니다.` });
      } catch (error: any) {
        toast({ variant: 'destructive', title: '파일 처리 오류', description: error.message || '파일 처리 중 오류가 발생했습니다.' });
      } finally {
        if(event.target) event.target.value = "";
      }
    }
  };

  const handleDownloadTemplate = (type: 'employees' | 'evaluations' | 'shortenedWork' | 'dailyAttendance') => {
    let dataToExport: any[] = [{}];
    let headers: string[];
    let fileName: string;
    
    switch (type) {
        case 'employees':
            headers = ['ID', '이름', '회사', '소속부서', '직책', '성장레벨', '실근무율', '평가자 ID', '개인별 기준금액', '비고'];
            fileName = `${selectedDate.year}.${String(selectedDate.month).padStart(2,'0')}_월성과대상자_양식.xlsx`;
            break;
        case 'evaluations':
            headers = ['ID', '이름', '회사', '소속부서', '직책', '성장레벨', '근무율', '평가그룹', '세부구분1', '세부구분2', '평가자 ID', '평가자', '점수', '등급', '기준금액', '최종금액', '비고'];
            fileName = `${selectedDate.year}.${String(selectedDate.month).padStart(2, '0')}_월성과데이터_양식.xlsx`;
            break;
        case 'shortenedWork':
            headers = ['고유사번', '성명', '시작일', '종료일', '출근시각', '퇴근시각'];
            fileName = '단축근로_양식.xlsx';
            break;
        case 'dailyAttendance':
            headers = ['고유사번', '성명', '근태사용일', '근태종류'];
            fileName = '일근태_양식.xlsx';
            break;
        default:
            return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>평가 데이터 관리</CardTitle>
          <CardDescription>
            핵심 평가 데이터인 대상자 및 평가 결과를 업로드합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <UploadSection 
              id="employees"
              title="평가 대상자"
              description="월별 평가 대상자 정보를 업로드합니다. 기존 데이터는 덮어쓰기 됩니다."
              onUpload={(e) => handleFileUpload(e, 'employees')}
              onDownload={() => handleDownloadTemplate('employees')}
              onReset={() => setDialogOpen({type: 'deleteEmployees'})}
              isResetDisabled={Object.keys(allEmployees).length === 0}
           />
           <Separator />
           <UploadSection 
              id="evaluations"
              title="평가 결과"
              description="등급, 비고 등 평가 결과가 포함된 엑셀 파일을 업로드하여 기존 데이터를 업데이트합니다."
              onUpload={(e) => handleFileUpload(e, 'evaluations')}
              onDownload={() => handleDownloadTemplate('evaluations')}
              onReset={() => setDialogOpen({type: 'resetEvaluations'})}
              isResetDisabled={results.filter(r => r.grade).length === 0}
           />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>근무 데이터 관리</CardTitle>
            <CardDescription>
                근무율 계산에 사용되는 데이터를 업로드합니다.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <UploadSection
                id="shortenedWorkPregnancy"
                title="임신기 단축근로"
                description="임신기 단축근로 내역이 담긴 파일을 업로드합니다."
                onUpload={(e) => handleFileUpload(e, 'shortenedWork', '임신')}
                onDownload={() => handleDownloadTemplate('shortenedWork')}
                onReset={() => setDialogOpen({type: 'resetWorkData', workDataType: '임신'})}
                isResetDisabled={!workRateInputs.shortenedWorkHours?.some(r => r.type === '임신')}
            />
            <Separator />
            <UploadSection
                id="shortenedWorkCare"
                title="육아/돌봄 단축근로"
                description="육아기, 가족돌봄 등 단축근로 내역이 담긴 파일을 업로드합니다."
                onUpload={(e) => handleFileUpload(e, 'shortenedWork', '육아/돌봄')}
                onDownload={() => handleDownloadTemplate('shortenedWork')}
                onReset={() => setDialogOpen({type: 'resetWorkData', workDataType: '육아/돌봄'})}
                isResetDisabled={!workRateInputs.shortenedWorkHours?.some(r => r.type === '육아/돌봄')}
            />
            <Separator />
            <UploadSection
                id="dailyAttendance"
                title="일근태"
                description="연차, 반차, 병가 등 일별 근태 사용 내역 파일을 업로드합니다."
                onUpload={(e) => handleFileUpload(e, 'dailyAttendance')}
                onDownload={() => handleDownloadTemplate('dailyAttendance')}
                onReset={() => setDialogOpen({type: 'resetWorkData', workDataType: 'dailyAttendance'})}
                isResetDisabled={!workRateInputs.dailyAttendance?.length}
            />
        </CardContent>
      </Card>
      
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
