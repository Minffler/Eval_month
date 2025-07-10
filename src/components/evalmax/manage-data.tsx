'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Download, Info, Trash2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Employee, EvaluationResult, Grade, EvaluationUploadData, WorkRateInputs, ShortenedWorkHourRecord, DailyAttendanceRecord } from '@/lib/types';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

const headerMapping: Record<string, keyof any> = {
    '고유사번': 'uniqueId', '사번': 'uniqueId', 'ID': 'uniqueId',
    '성명': 'name', '이름': 'name', '피평가자': 'name',
    '부서': 'department', '소속부서': 'department',
    '시작일': 'startDate', '시작일자': 'startDate',
    '종료일': 'endDate', '종료일자': 'endDate',
    '출근시각': 'startTime', '퇴근시각': 'endTime',
    '일자': 'date', '근태': 'type'
};

const mapRowToSchema = <T extends {}>(row: any): T => {
    const newRow: any = {};
    for (const key in row) {
        const mappedKey = headerMapping[key.trim()] || key.trim();
        newRow[mappedKey] = row[key];
    }
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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
  
  const handleResetWorkData = (type: keyof WorkRateInputs) => {
    onClearWorkRateData(selectedDate.year, selectedDate.month, type);
    const typeName = type === 'shortenedWorkHours' ? '단축근로' : '일근태';
    toast({ title: '초기화 완료', description: `해당 월의 ${typeName} 데이터가 초기화되었습니다.` });
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, uploadType: 'employees' | 'evaluations' | 'shortenedWork' | 'dailyAttendance') => {
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
            const newShortenedWork = await parseExcelFile<ShortenedWorkHourRecord>(file, json => json.map((row, index) => {
              const uniqueId = String(row['uniqueId'] || '');
              if (!uniqueId) throw new Error(`${index + 2}번째 행에 사번이 없습니다.`);
              return {
                uniqueId, name: String(row['name'] || ''),
                startDate: String(row['startDate'] || ''), endDate: String(row['endDate'] || ''),
                startTime: String(row['startTime'] || ''), endTime: String(row['endTime'] || '')
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

  const UploadCard = ({ title, description, onFileUpload, onTemplateDownload, onDataClear, fileType, infoTooltip, dataCount = 0 }: {
    title: string;
    description: string;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTemplateDownload?: () => void;
    onDataClear?: () => void;
    fileType: string;
    infoTooltip?: string;
    dataCount?: number;
  }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{title}</CardTitle>
            {infoTooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <pre className="text-xs bg-muted text-muted-foreground p-2 rounded-md font-mono whitespace-pre-wrap max-w-xs">{infoTooltip}</pre>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {onDataClear && <Button variant="destructive" size="sm" onClick={onDataClear} disabled={dataCount === 0}><Trash2 className="mr-2 h-4 w-4" />초기화</Button>}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Input id={fileType} type="file" accept=".xlsx, .xls" onChange={onFileUpload} onClick={(e) => (e.currentTarget.value = '')} />
          {dataCount > 0 && <p className="text-xs text-muted-foreground">{dataCount}개 데이터가 업로드되었습니다.</p>}
        </div>
        {onTemplateDownload && <Button onClick={onTemplateDownload} variant="outline" className="w-full sm:w-auto"><Download className="mr-2 h-4 w-4" />양식 다운로드</Button>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold">1. 대상자 업로드</h2>
        <UploadCard
            title="평가 대상자"
            description="월별 평가 대상자 정보를 엑셀 파일로 업로드합니다. 기존 데이터는 덮어쓰기 됩니다."
            onFileUpload={(e) => handleFileUpload(e, 'employees')}
            onTemplateDownload={() => handleDownloadTemplate('employees')}
            onDataClear={() => setDialogOpen({ type: 'deleteEmployees' })}
            fileType="employees"
            dataCount={results.length}
            infoTooltip={`[필수] 고유사번: '고유사번', '사번', 'ID'\n[선택] 이름: '이름', '성명', '피평가자'\n...외 회사, 부서, 직책 등`}
        />

        <h2 className="text-2xl font-bold mt-8">2. 근무 데이터 업로드</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UploadCard
                title="단축근로"
                description="임신기, 육아기, 가족돌봄 등 단축근로 내역이 담긴 파일을 업로드합니다."
                onFileUpload={(e) => handleFileUpload(e, 'shortenedWork')}
                fileType="shortenedWork"
                onDataClear={() => setDialogOpen({ type: 'resetWorkData', workDataType: 'shortenedWorkHours' })}
                dataCount={workRateInputs.shortenedWorkHours?.length || 0}
                infoTooltip={`[필수] 고유사번: '고유사번', '사번', 'ID'\n[필수] 시작일: '시작일', '시작일자'\n[필수] 종료일: '종료일', '종료일자'\n[필수] 출근시각/퇴근시각`}
            />
            <UploadCard
                title="일근태"
                description="연차, 반차, 병가 등 일별 근태 사용 내역 파일을 업로드합니다."
                onFileUpload={(e) => handleFileUpload(e, 'dailyAttendance')}
                fileType="dailyAttendance"
                onDataClear={() => setDialogOpen({ type: 'resetWorkData', workDataType: 'dailyAttendance' })}
                dataCount={workRateInputs.dailyAttendance?.length || 0}
                infoTooltip={`[필수] 고유사번: '고유사번', '사번', 'ID'\n[필수] 사용일: '일자'\n[필수] 근태종류: '근태'`}
            />
        </div>

        <h2 className="text-2xl font-bold mt-8">3. 평가 데이터 업로드</h2>
        <UploadCard
            title="평가 데이터"
            description="등급, 비고 등 평가 결과가 포함된 엑셀 파일을 업로드하여 기존 데이터를 업데이트합니다."
            onFileUpload={(e) => handleFileUpload(e, 'evaluations')}
            onTemplateDownload={() => handleDownloadTemplate('evaluations')}
            onDataClear={() => setDialogOpen({ type: 'resetEvaluations' })}
            fileType="evaluations"
            dataCount={results.filter(r => r.grade).length}
        />

        <AlertDialog open={dialogOpen !== null} onOpenChange={(open) => !open && setDialogOpen(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>정말 진행하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {dialogOpen?.type === 'deleteEmployees' && `기존 대상자 ${results.length}명의 이력을 모두 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
                        {dialogOpen?.type === 'resetEvaluations' && `기존 대상자 ${results.filter(r => r.grade).length}명의 평가 데이터를 모두 초기화합니다. 이 작업은 되돌릴 수 없습니다.`}
                        {dialogOpen?.type === 'resetWorkData' && `해당 근무 데이터를 초기화합니다. 이 작업은 되돌릴 수 없습니다.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDialogOpen(null)}>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        if (dialogOpen?.type === 'deleteEmployees') handleClearEmployees();
                        else if (dialogOpen?.type === 'resetEvaluations') handleResetEvaluations();
                        else if (dialogOpen?.type === 'resetWorkData' && dialogOpen.workDataType) handleResetWorkData(dialogOpen.workDataType);
                    }}>
                        확인
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
