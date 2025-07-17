'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2, UploadCloud, CheckCircle2, AlertCircle, Save, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Employee, EvaluationResult, Grade, EvaluationUploadData, WorkRateInputs, ShortenedWorkHourRecord, DailyAttendanceRecord, ShortenedWorkType, HeaderMapping } from '@/lib/types';
import { excelHeaderMapping, excelHeaderTargetScreens } from '@/lib/data';
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
import {
  Dialog,
  DialogContent as DialogContent2,
  DialogDescription as DialogDescription2,
  DialogFooter as DialogFooter2,
  DialogHeader as DialogHeader2,
  DialogTitle as DialogTitle2,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { backupData, type BackupDataInput } from '@/ai/flows/backup-data-flow';
import { restoreData } from '@/ai/flows/restore-data-flow';
import { Loader2 } from 'lucide-react';

interface ManageDataProps {
  results: EvaluationResult[];
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

const parseExcelFile = <T extends {}>(file: File, mapping: HeaderMapping, parser: (rows: any[]) => T[]): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<any>(worksheet);

                const reverseMapping: {[key: string]: string} = {};
                for (const excelHeader in mapping) {
                    const systemField = mapping[excelHeader].field;
                    if(systemField) {
                       reverseMapping[systemField] = excelHeader;
                    }
                }

                const mappedJson = json.map(row => {
                    const newRow: any = {};
                    for(const systemField in reverseMapping) {
                        const excelHeader = reverseMapping[systemField];
                        if (row[excelHeader] !== undefined) {
                            newRow[systemField] = row[excelHeader];
                        }
                    }
                    return newRow;
                });
                
                resolve(parser(mappedJson));
            } catch (error: any) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

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
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-4">
            <div>
                <h4 className="font-semibold">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                 <Button
                    variant="outline"
                    className="w-full flex-grow justify-start text-left font-normal text-muted-foreground cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <UploadCloud className="mr-2" />
                    엑셀 파일 선택...
                </Button>
                <Input 
                    ref={fileInputRef}
                    id={id} 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={onUpload}
                    onClick={(e) => (e.currentTarget.value = '')}
                    className="hidden"
                />
                <div className="flex items-center gap-2 self-end sm:self-center">
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
  selectedDate, 
  onClearEmployeeData, 
  onClearEvaluationData,
  onWorkRateDataUpload,
  onClearWorkRateData,
  workRateInputs
}: ManageDataProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = React.useState<{ type: 'deleteEmployees' | 'resetEvaluations' | 'resetWorkData' | 'backupData' | 'restoreData', workDataType?: keyof WorkRateInputs | ShortenedWorkType } | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // State for header mapping dialog
  const [isMappingDialogOpen, setIsMappingDialogOpen] = React.useState(false);
  const [excelHeaders, setExcelHeaders] = React.useState<string[]>([]);
  const [currentMapping, setCurrentMapping] = React.useState<HeaderMapping>({});
  const [fileToProcess, setFileToProcess] = React.useState<File | null>(null);
  const [uploadType, setUploadType] = React.useState<'employees' | 'evaluations' | null>(null);

  const systemFieldsByScreen: Record<string, string[]> = React.useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const field in excelHeaderTargetScreens) {
        const screen = excelHeaderTargetScreens[field];
        if (!result[screen]) {
            result[screen] = [];
        }
        if (!result[screen].includes(field)) {
            result[screen].push(field);
        }
    }
    return result;
  }, []);

  const requiredFields: string[] = ['uniqueId'];

  const isMappingValid = React.useMemo(() => {
    const mappedSystemFields = Object.values(currentMapping).map(m => m.field);
    return requiredFields.every(field => mappedSystemFields.includes(field));
  }, [currentMapping]);
  
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
    toast({ title: '초기화 완료', description: '선택한 근무 데이터가 초기화되었습니다.' });
    setDialogOpen(null);
  }

  const handleBackupData = async () => {
    setIsProcessing(true);
    try {
        const backupPayload: BackupDataInput = {
            users: localStorage.getItem('users') || '[]',
            employees: localStorage.getItem('employees') || '{}',
            evaluations: localStorage.getItem('evaluations') || '{}',
            gradingScale: localStorage.getItem('gradingScale') || '{}',
            attendanceTypes: localStorage.getItem('attendanceTypes') || '[]',
            holidays: localStorage.getItem('holidays') || '[]',
        };
        await backupData(backupPayload);
        toast({ title: '저장 완료', description: '현재 데이터를 초기 데이터로 저장했습니다. 다른 브라우저에서 [초기 데이터로 덮어쓰기]를 실행하여 동기화하세요.' });
    } catch (error) {
        toast({ variant: 'destructive', title: '저장 실패', description: '데이터 저장 중 오류가 발생했습니다.' });
        console.error("Backup failed", error);
    } finally {
        setIsProcessing(false);
        setDialogOpen(null);
    }
  };

  const handleRestoreData = async () => {
    setIsProcessing(true);
    try {
        const restoredData = await restoreData();
        for (const key in restoredData) {
            localStorage.setItem(key, restoredData[key as keyof typeof restoredData]);
        }
        toast({ title: '동기화 완료', description: '최신 초기 데이터로 덮어썼습니다. 페이지를 새로고침합니다.' });
        
        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error) {
        toast({ variant: 'destructive', title: '복원 실패', description: '초기 데이터를 불러오는 중 오류가 발생했습니다.' });
        console.error("Restore failed", error);
    } finally {
        setIsProcessing(false);
        setDialogOpen(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'employees' | 'evaluations' | 'shortenedWork' | 'dailyAttendance', shortenedWorkType?: ShortenedWorkType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'shortenedWork' || type === 'dailyAttendance') {
        processSimpleUpload(file, type, shortenedWorkType);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const headers: string[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
            
            setExcelHeaders(headers);
            setFileToProcess(file);
            setUploadType(type);

            const autoMapping: HeaderMapping = {};
            headers.forEach(header => {
              for (const excelHeaderVariant in excelHeaderMapping) {
                  if (header === excelHeaderVariant) {
                      const systemField = excelHeaderMapping[excelHeaderVariant];
                      const screen = excelHeaderTargetScreens[systemField];
                      if (screen && !Object.values(autoMapping).some(m => m.field === systemField)) {
                          autoMapping[header] = { screen, field: systemField };
                          break;
                      }
                  }
              }
            });
            
            setCurrentMapping(autoMapping);
            setIsMappingDialogOpen(true);
        } catch (error) {
            toast({ variant: 'destructive', title: '파일 오류', description: '엑셀 파일 헤더를 읽는 중 오류가 발생했습니다.' });
        }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleProcessMappedFile = async () => {
    if (!fileToProcess || !uploadType) return;
    
    try {
      const parsedData = await parseExcelFile(fileToProcess, currentMapping, (rows) => rows);

      let uploadCount = 0;
      if (uploadType === 'employees') {
          const newEmployees = parsedData.map((row, index) => {
            const uniqueId = String(row['uniqueId'] || '');
            if (!uniqueId) throw new Error(`${index + 2}번째 행에 ID가 없습니다.`);
            return {
              id: `E${uniqueId}`, uniqueId, name: String(row['name'] || ''),
              company: String(row['company'] || ''), department: String(row['department'] || ''),
              title: String(row['title'] || '팀원'), position: String(row['title'] || '팀원'),
              growthLevel: String(row['growthLevel'] || ''), workRate: parseFloat(String(row['workRate'] || '1')),
              evaluatorId: String(row['evaluatorId'] || ''), baseAmount: Number(String(row['baseAmount'] || '0').replace(/,/g, '')),
              memo: String(row['memo'] || ''),
            };
          });
          uploadCount = newEmployees.length;
          onEmployeeUpload(selectedDate.year, selectedDate.month, newEmployees);
      } else if (uploadType === 'evaluations') {
            const newEvals = parsedData.map((row, index) => {
            const uniqueId = String(row['uniqueId'] || '');
            if (!uniqueId) throw new Error(`${index + 2}번째 행에 ID가 없습니다.`);
            
            return {
                employeeId: `E${uniqueId}`,
                name: row['name'] ? String(row['name']) : undefined, company: row['company'] ? String(row['company']) : undefined,
                department: row['department'] ? String(row['department']) : undefined, title: row['title'] ? String(row['title']) : undefined,
                growthLevel: row['growthLevel'] ? String(row['growthLevel']) : undefined,
                workRate: row['workRate'] !== undefined ? parseFloat(String(row['workRate'])) : undefined,
                evaluatorId: row['evaluatorId'] ? String(row['evaluatorId']) : undefined, 
                evaluatorName: row['evaluatorName'] ? String(row['evaluatorName']) : undefined,
                baseAmount: row['baseAmount'] !== undefined ? Number(String(row['baseAmount']).replace(/,/g, '')) : undefined,
                grade: (String(row['grade'] || '') || null) as Grade, memo: row['memo'] !== undefined ? String(row['memo']) : undefined,
            };
          });
          uploadCount = newEvals.length;
          onEvaluationUpload(selectedDate.year, selectedDate.month, newEvals);
      }

      toast({ title: '업로드 성공', description: `${uploadCount}명의 데이터가 처리되었습니다.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: '파일 처리 오류', description: error.message || '파일 처리 중 오류가 발생했습니다.' });
    } finally {
        setIsMappingDialogOpen(false);
        setFileToProcess(null);
        setUploadType(null);
    }
  }

  const processSimpleUpload = async (file: File, uploadType: 'shortenedWork' | 'dailyAttendance', shortenedWorkType?: ShortenedWorkType) => {
    try {
        const now = new Date().toISOString();
        let uploadCount = 0;
        
        if (uploadType === 'shortenedWork') {
            if (!shortenedWorkType) throw new Error('Shortened work type is required.');
            const newShortenedWork = await parseExcelFileSimple<ShortenedWorkHourRecord>(file, json => json.map((row, index) => {
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
        } else if (uploadType === 'dailyAttendance') {
            const newDailyAttendance = await parseExcelFileSimple<DailyAttendanceRecord>(file, json => json.map((row, index) => {
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
        }
        
        toast({ title: '업로드 성공', description: `${uploadCount}명의 데이터가 처리되었습니다.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: '파일 처리 오류', description: error.message || '파일 처리 중 오류가 발생했습니다.' });
    }
  }
  
  const parseExcelFileSimple = <T extends {}>(file: File, parser: (rows: any[]) => T[]): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<any>(worksheet);
                
                // A very simplified mapping based on common names
                const simplifiedMapping: Record<string, string> = {
                    "고유사번": "uniqueId", "사번": "uniqueId", "ID": "uniqueId",
                    "성명": "name", "이름": "name",
                    "시작일": "startDate", "종료일": "endDate",
                    "출근시각": "startTime", "퇴근시각": "endTime",
                    "근태사용일": "date", "일자": "date",
                    "근태종류": "type", "근태": "type",
                }

                const mappedJson = json.map(row => {
                    const newRow: any = {};
                    for (const excelHeader in row) {
                        const systemField = simplifiedMapping[excelHeader];
                        if(systemField) {
                            newRow[systemField] = row[excelHeader];
                        }
                    }
                    return newRow;
                });
                
                resolve(parser(mappedJson));
            } catch (error: any) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
  }

  const handleDownloadTemplate = (type: 'employees' | 'evaluations' | 'shortenedWork' | 'dailyAttendance') => {
    let headers: string[];
    let fileName: string;
    
    switch (type) {
        case 'employees':
            headers = ['ID', '이름', '회사', '소속부서', '직책', '성장레벨', '실근무율', '평가자 ID', '기준금액', '비고'];
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

    const worksheet = XLSX.utils.json_to_sheet([{}], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, fileName);
  };

  const handleMappingChange = (excelHeader: string, type: 'screen' | 'field', value: string) => {
      setCurrentMapping(prev => {
          const newMapping = { ...prev };
          const current = newMapping[excelHeader] || { screen: '', field: '' };

          if (type === 'screen') {
              // If screen changes, reset the field
              newMapping[excelHeader] = { screen: value, field: '' };
          } else {
              newMapping[excelHeader] = { ...current, field: value };
          }
          return newMapping;
      });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>월별 대상자 관리</CardTitle>
          <CardDescription>
            월별 대상자 및 평가자를 업로드합니다.
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
              isResetDisabled={results.length === 0}
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
           <Separator />
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold">초기 데이터 동기화</h4>
                    <p className="text-sm text-muted-foreground">현재 시스템의 모든 데이터를 초기 목업 데이터로 덮어쓰거나, 최신 초기 데이터로 동기화합니다.</p>
                </div>
                <div className="flex gap-4">
                  <Button variant="secondary" className="w-full" onClick={() => setDialogOpen({ type: 'backupData'})}>
                      <Save className="mr-2 h-4 w-4"/>
                      현재 데이터를 초기 데이터로 저장
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setDialogOpen({ type: 'restoreData'})}>
                      <RefreshCw className="mr-2 h-4 w-4"/>
                      초기 데이터로 덮어쓰기
                  </Button>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>근무 데이터 관리</CardTitle>
            <CardDescription>
                근무율 계산에 사용되는 데이터를 관리합니다.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <UploadSection
                id="shortenedWorkPregnancy"
                title="임신기 단축근로"
                description=""
                onUpload={(e) => handleFileUpload(e, 'shortenedWork', '임신')}
                onDownload={() => handleDownloadTemplate('shortenedWork')}
                onReset={() => setDialogOpen({type: 'resetWorkData', workDataType: '임신'})}
                isResetDisabled={!workRateInputs.shortenedWorkHours?.some(r => r.type === '임신')}
            />
            <Separator />
            <UploadSection
                id="shortenedWorkCare"
                title="육아/돌봄 단축근로"
                description=""
                onUpload={(e) => handleFileUpload(e, 'shortenedWork', '육아/돌봄')}
                onDownload={() => handleDownloadTemplate('shortenedWork')}
                onReset={() => setDialogOpen({type: 'resetWorkData', workDataType: '육아/돌봄'})}
                isResetDisabled={!workRateInputs.shortenedWorkHours?.some(r => r.type === '육아/돌봄')}
            />
            <Separator />
            <UploadSection
                id="dailyAttendance"
                title="일근태"
                description=""
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
                      {dialogOpen?.type === 'backupData' && `현재 브라우저에 저장된 모든 데이터를 시스템의 초기 데이터로 덮어씁니다. 이 작업은 되돌릴 수 없습니다.`}
                      {dialogOpen?.type === 'restoreData' && `현재 브라우저의 모든 데이터를 서버의 최신 초기 데이터로 덮어씁니다. 저장하지 않은 변경사항은 사라지며, 이 작업은 되돌릴 수 없습니다.`}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDialogOpen(null)}>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                        if (dialogOpen?.type === 'deleteEmployees') handleClearEmployees();
                        else if (dialogOpen?.type === 'resetEvaluations') handleResetEvaluations();
                        else if (dialogOpen?.type === 'resetWorkData') handleResetWorkData();
                        else if (dialogOpen?.type === 'backupData') handleBackupData();
                        else if (dialogOpen?.type === 'restoreData') handleRestoreData();
                    }}
                    disabled={isProcessing}
                  >
                      {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      확인
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isMappingDialogOpen} onOpenChange={setIsMappingDialogOpen}>
        <DialogContent2 className="max-w-4xl">
          <DialogHeader2>
            <DialogTitle2>엑셀 헤더 매핑 설정</DialogTitle2>
            <DialogDescription2>
              업로드한 엑셀 파일의 각 열(헤더)이 시스템의 어떤 데이터에 해당하는지 설정해주세요.
              <br />
              <span className="text-destructive">*</span> 표시된 필드는 업로드를 위해 필수적으로 매핑되어야 합니다.
            </DialogDescription2>
          </DialogHeader2>
          <ScrollArea className="h-[60vh] p-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">엑셀 헤더</TableHead>
                  <TableHead>데이터 종류</TableHead>
                  <TableHead>세부 항목</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {excelHeaders.map(header => {
                  const mapping = currentMapping[header] || { screen: '', field: '' };
                  const availableFields = mapping.screen ? systemFieldsByScreen[mapping.screen] : [];

                  return (
                    <TableRow key={header}>
                      <TableCell className="font-medium">{header}</TableCell>
                      <TableCell>
                        <Select
                          value={mapping.screen || 'ignore'}
                          onValueChange={(value) => handleMappingChange(header, 'screen', value === 'ignore' ? '' : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="종류 선택..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">매핑 안함</SelectItem>
                            <Separator />
                            {Object.keys(systemFieldsByScreen).map(screen => (
                              <SelectItem key={screen} value={screen}>
                                {screen}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.field || 'ignore'}
                          onValueChange={(value) => handleMappingChange(header, 'field', value === 'ignore' ? '' : value)}
                          disabled={!mapping.screen}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="항목 선택..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">매핑 안함</SelectItem>
                            <Separator />
                            {availableFields.map(field => {
                                const selectedByOtherHeader = Object.values(currentMapping).some(m => m.field === field && m.screen === mapping.screen) && mapping.field !== field;
                                return (
                                    <SelectItem key={field} value={field} disabled={selectedByOtherHeader}>
                                    {requiredFields.includes(field) && <span className="text-destructive">* </span>}
                                    {field}
                                    </SelectItem>
                                )
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
           <div className="flex justify-between items-center pt-2">
            <Label className="text-xs text-muted-foreground">
                {requiredFields.map(f => {
                    const fieldName = Object.keys(excelHeaderTargetScreens).find(key => key === f) || f;
                    return fieldName;
                }).join(', ')} 필드는 반드시 매핑되어야 합니다.
            </Label>
            {isMappingValid ? 
                <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle2/> 모든 필수 항목이 매핑되었습니다.</p> :
                <p className="text-sm text-destructive flex items-center gap-2"><AlertCircle/> 필수 항목을 매핑해주세요.</p>
            }
          </div>
          <DialogFooter2>
            <Button variant="outline" onClick={() => setIsMappingDialogOpen(false)}>취소</Button>
            <Button onClick={handleProcessMappedFile} disabled={!isMappingValid}>업로드 진행</Button>
          </DialogFooter2>
        </DialogContent2>
      </Dialog>
    </div>
  );
}
