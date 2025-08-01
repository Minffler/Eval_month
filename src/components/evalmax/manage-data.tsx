'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2, UploadCloud, CheckCircle2, AlertCircle, Save, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Employee, EvaluationResult, Grade, EvaluationUploadData, WorkRateInputs, ShortenedWorkHourRecord, DailyAttendanceRecord, ShortenedWorkType, HeaderMapping } from '@/lib/types';
import { excelHeaderMapping } from '@/lib/data';
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

import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { backupData, type BackupDataInput } from '@/ai/flows/backup-data-flow';
import { restoreData } from '@/ai/flows/restore-data-flow';
import { Loader2 } from 'lucide-react';
import { useEvaluation } from '@/contexts/evaluation-context';

interface ManageDataProps {
  results: EvaluationResult[];
  selectedDate: { year: number, month: number };
}

// 최종 파싱된 데이터의 각 행이 어떤 타입인지 명시
type ParsedRow = Partial<EvaluationUploadData & { evaluatorId: string, evaluatorName: string }>;

const parseExcelFile = (file: File, mapping: Record<string, string>): Promise<ParsedRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<any>(worksheet);

                const mappedJson = json.map(row => {
                    const newRow: ParsedRow = {};
                    for(const excelHeader in row) {
                        const systemField = mapping[excelHeader];
                        if (systemField) {
                            (newRow as any)[systemField] = row[excelHeader];
                        }
                    }
                    return newRow;
                });
                
                resolve(mappedJson);
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
  results,
  selectedDate, 
}: ManageDataProps) {
  const { 
    handleEmployeeUpload,
    handleEvaluationUpload,
    handleClearEmployeeData,
    handleClearEvaluationData,
    handleWorkRateDataUpload,
    handleClearWorkRateData,
    workRateInputs
  } = useEvaluation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = React.useState<{ type: 'deleteEmployees' | 'resetEvaluations' | 'resetWorkData' | 'backupData' | 'restoreData' | 'resetToMockData', workDataType?: keyof WorkRateInputs | ShortenedWorkType } | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const [isMappingDialogOpen, setIsMappingDialogOpen] = React.useState(false);
  const [excelHeaders, setExcelHeaders] = React.useState<string[]>([]);
  const [currentMapping, setCurrentMapping] = React.useState<Record<string, string>>({});
  const [fileToProcess, setFileToProcess] = React.useState<File | null>(null);
  const [uploadType, setUploadType] = React.useState<'employees' | 'evaluations' | null>(null);

  // 현재 선택된 월의 workRateInputs 데이터
  const currentMonthWorkRateInputs = React.useMemo(() => {
    const key = `${selectedDate.year}-${selectedDate.month}`;
    return workRateInputs[key] || { shortenedWorkHours: [], dailyAttendance: [] };
  }, [workRateInputs, selectedDate.year, selectedDate.month]);

  const systemFields = React.useMemo(() => {
    return Array.from(new Set(Object.values(excelHeaderMapping)));
  }, []);

  const requiredFields: string[] = ['uniqueId'];

  const isMappingValid = React.useMemo(() => {
    const mappedSystemFields = Object.values(currentMapping);
    return requiredFields.every(field => mappedSystemFields.includes(field));
  }, [currentMapping, requiredFields]);
  
  const handleClearEmployees = () => {
    handleClearEmployeeData(selectedDate.year, selectedDate.month);
    toast({ title: '삭제 완료', description: '해당 월의 모든 대상자 데이터가 삭제되었습니다.' });
    setDialogOpen(null);
  };
  
  const handleResetEvaluations = () => {
    handleClearEvaluationData(selectedDate.year, selectedDate.month);
    toast({ title: '초기화 완료', description: '해당 월의 모든 평가 데이터가 초기화되었습니다.' });
    setDialogOpen(null);
  };
  
  const handleResetWorkData = () => {
    if (!dialogOpen?.workDataType) return;
    handleClearWorkRateData(selectedDate.year, selectedDate.month, dialogOpen.workDataType);
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
        toast({ title: '저장 완료', description: '현재 데이터를 임시 데이터로 저장했습니다. 다른 브라우저에서 [임시 데이터로 덮어쓰기]를 실행하여 동기화하세요.' });
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

  const handleResetToMockData = () => {
    setIsProcessing(true);
    try {
        // localStorage 완전 초기화
        localStorage.clear();
        
        // 목업 데이터로 다시 설정
        localStorage.setItem('users', JSON.stringify([
          {
            "id": "user-admin",
            "employeeId": "Eadmin",
            "uniqueId": "admin",
            "name": "관리자",
            "roles": ["admin", "evaluator", "employee"],
            "avatar": "https://placehold.co/100x100.png?text=A",
            "title": "팀원",
            "department": "인사부",
            "company": "-",
            "evaluatorId": "admin"
          },
          {
            "id": "user-0000247",
            "employeeId": "E0000247",
            "uniqueId": "0000247",
            "name": "강O화",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=강",
            "title": "팀원",
            "department": "일산PL팀",
            "company": "OK",
            "evaluatorId": "0000011"
          },
          {
            "id": "user-0000195",
            "employeeId": "E0000195",
            "uniqueId": "0000195",
            "name": "김O균",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=김",
            "title": "팀장",
            "department": "대전PL팀",
            "company": "OK",
            "evaluatorId": "0000011"
          },
          {
            "id": "user-0000584",
            "employeeId": "E0000584",
            "uniqueId": "0000584",
            "name": "김O미",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=김",
            "title": "팀원",
            "department": "경영관리팀",
            "company": "OCI",
            "evaluatorId": "admin"
          },
          {
            "id": "user-0000198",
            "employeeId": "E0000198",
            "uniqueId": "0000198",
            "name": "김O섭",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=김",
            "title": "팀장",
            "department": "일산PL팀",
            "company": "OK",
            "evaluatorId": "0000011"
          },
          {
            "id": "user-0000246",
            "employeeId": "E0000246",
            "uniqueId": "0000246",
            "name": "김O정",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=김",
            "title": "팀원",
            "department": "일산PL팀",
            "company": "OK",
            "evaluatorId": "0000011"
          },
          {
            "id": "user-0000232",
            "employeeId": "E0000232",
            "uniqueId": "0000232",
            "name": "김O주b",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=김",
            "title": "팀원",
            "department": "대전PL팀",
            "company": "OK",
            "evaluatorId": "0000011"
          },
          {
            "id": "user-0000281",
            "employeeId": "E0000281",
            "uniqueId": "0000281",
            "name": "김O진b",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=김",
            "title": "팀원",
            "department": "대전PL팀",
            "company": "OK",
            "evaluatorId": "0000011"
          },
          {
            "id": "user-0000298",
            "employeeId": "E0000298",
            "uniqueId": "0000298",
            "name": "김O철c",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=김",
            "title": "팀원",
            "department": "일산PL팀",
            "company": "OK",
            "evaluatorId": "0000011"
          },
          {
            "id": "user-0000610",
            "employeeId": "E0000610",
            "uniqueId": "0000610",
            "name": "김O희",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=김",
            "title": "팀원",
            "department": "경영관리팀",
            "company": "OC",
            "evaluatorId": "admin"
          },
          {
            "id": "user-0000231",
            "employeeId": "E0000231",
            "uniqueId": "0000231",
            "name": "노O호",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=노",
            "title": "팀원",
            "department": "대전PL팀",
            "company": "OK",
            "evaluatorId": "0000011"
          },
          {
            "id": "user-0000287",
            "employeeId": "E0000287",
            "uniqueId": "0000287",
            "name": "송O훈",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=송",
            "title": "팀원",
            "department": "대전PL팀",
            "company": "OK",
            "evaluatorId": "0000011"
          },
          {
            "id": "user-0000282",
            "employeeId": "E0000282",
            "uniqueId": "0000282",
            "name": "신O섭",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=신",
            "title": "팀원",
            "department": "대전PL팀",
            "company": "OK",
            "evaluatorId": "0000011"
          },
          {
            "id": "user-0000245",
            "employeeId": "E0000245",
            "uniqueId": "0000245",
            "name": "신O원",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=신",
            "title": "팀원",
            "department": "일산PL팀",
            "company": "OK",
            "evaluatorId": "0000011"
          },
          {
            "id": "user-0000299",
            "employeeId": "E0000299",
            "uniqueId": "0000299",
            "name": "엄O호",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=엄",
            "title": "팀원",
            "department": "일산PL팀",
            "company": "OK",
            "evaluatorId": "0000011"
          },
          {
            "id": "user-0000011",
            "employeeId": "E0000011",
            "uniqueId": "0000011",
            "name": "이O권",
            "roles": ["employee", "evaluator"],
            "avatar": "https://placehold.co/100x100.png?text=이",
            "title": "센터장",
            "department": "콜렉션센터",
            "company": "OK",
            "evaluatorId": "admin"
          },
          {
            "id": "user-0000609",
            "employeeId": "E0000609",
            "uniqueId": "0000609",
            "name": "정O석b",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=정",
            "title": "팀원",
            "department": "경영관리팀",
            "company": "OC",
            "evaluatorId": "admin"
          },
          {
            "id": "user-0000586",
            "employeeId": "E0000586",
            "uniqueId": "0000586",
            "name": "조O진",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=조",
            "title": "팀원",
            "department": "경영관리팀",
            "company": "OFI",
            "evaluatorId": "admin"
          },
          {
            "id": "user-0000300",
            "employeeId": "E0000300",
            "uniqueId": "0000300",
            "name": "홍O환",
            "roles": ["employee"],
            "avatar": "https://placehold.co/100x100.png?text=홍",
            "title": "팀원",
            "department": "일산PL팀",
            "company": "OK",
            "evaluatorId": "0000011"
          }
        ]));
        
        localStorage.setItem('employees', JSON.stringify({
          "2025-1": [
            {
              "id": "Eadmin-2025-1",
              "uniqueId": "admin",
              "name": "관리자",
              "company": "OKH",
              "department": "인사부",
              "title": "팀원",
              "position": "팀원",
              "growthLevel": "Lv.5",
              "workRate": 0.95,
              "evaluatorId": "admin",
              "baseAmount": 570000,
              "memo": ""
            }
          ],
          "2025-2": [
            {
              "id": "Eadmin-2025-2",
              "uniqueId": "admin",
              "name": "관리자",
              "company": "OKH",
              "department": "인사부",
              "title": "팀원",
              "position": "팀원",
              "growthLevel": "Lv.5",
              "workRate": 0.95,
              "evaluatorId": "admin",
              "baseAmount": 570000,
              "memo": ""
            }
          ],
          "2025-3": [
            {
              "id": "Eadmin-2025-3",
              "uniqueId": "admin",
              "name": "관리자",
              "company": "OKH",
              "department": "인사부",
              "title": "팀원",
              "position": "팀원",
              "growthLevel": "Lv.5",
              "workRate": 0.95,
              "evaluatorId": "admin",
              "baseAmount": 570000,
              "memo": ""
            }
          ],
          "2025-4": [
            {
              "id": "Eadmin-2025-4",
              "uniqueId": "admin",
              "name": "관리자",
              "company": "OKH",
              "department": "인사부",
              "title": "팀원",
              "position": "팀원",
              "growthLevel": "Lv.5",
              "workRate": 0.95,
              "evaluatorId": "admin",
              "baseAmount": 570000,
              "memo": ""
            }
          ],
          "2025-5": [
            {
              "id": "Eadmin-2025-5",
              "uniqueId": "admin",
              "name": "관리자",
              "company": "OKH",
              "department": "인사부",
              "title": "팀원",
              "position": "팀원",
              "growthLevel": "Lv.5",
              "workRate": 0.95,
              "evaluatorId": "admin",
              "baseAmount": 570000,
              "memo": ""
            }
          ],
          "2025-6": [
            {
              "id": "Eadmin-2025-6",
              "uniqueId": "admin",
              "name": "관리자",
              "company": "OKH",
              "department": "인사부",
              "title": "팀원",
              "position": "팀원",
              "growthLevel": "Lv.5",
              "workRate": 0.95,
              "evaluatorId": "admin",
              "baseAmount": 570000,
              "memo": ""
            }
          ]
        }));
        
        localStorage.setItem('evaluations', JSON.stringify({
          "2025-1": [
            {
              "id": "eval-user-admin-2025-1",
              "employeeId": "admin",
              "year": 2025,
              "month": 1,
              "grade": "A",
              "memo": "admin",
              "detailedGroup2": "기타",
              "score": 115
            }
          ],
          "2025-2": [
            {
              "id": "eval-user-admin-2025-2",
              "employeeId": "admin",
              "year": 2025,
              "month": 2,
              "grade": "B+",
              "memo": "admin",
              "detailedGroup2": "기타",
              "score": 105
            }
          ],
          "2025-3": [
            {
              "id": "eval-user-admin-2025-3",
              "employeeId": "admin",
              "year": 2025,
              "month": 3,
              "grade": "C",
              "memo": "admin",
              "detailedGroup2": "기타",
              "score": 85
            }
          ],
          "2025-4": [
            {
              "id": "eval-user-admin-2025-4",
              "employeeId": "admin",
              "year": 2025,
              "month": 4,
              "grade": "B",
              "memo": "admin",
              "detailedGroup2": "기타",
              "score": 100
            }
          ],
          "2025-5": [
            {
              "id": "eval-user-admin-2025-5",
              "employeeId": "admin",
              "year": 2025,
              "month": 5,
              "grade": "A+",
              "memo": "admin",
              "detailedGroup2": "기타",
              "score": 130
            }
          ],
          "2025-6": [
            {
              "id": "eval-user-admin-2025-6",
              "employeeId": "admin",
              "year": 2025,
              "month": 6,
              "grade": "S",
              "memo": "admin",
              "detailedGroup2": "기타",
              "score": 150
            }
          ],
          "2025-7": [
            {
              "id": "eval-user-admin-2025-7",
              "employeeId": "admin",
              "year": 2025,
              "month": 7,
              "grade": "A",
              "memo": "admin",
              "detailedGroup2": "기타",
              "score": 115
            }
          ]
        }));
        
        localStorage.setItem('gradingScale', JSON.stringify({
          'S': { score: 150, payoutRate: 150, amount: 0, description: '최우수' },
          'A+': { score: 130, payoutRate: 130, amount: 0, description: '우수+' },
          'A': { score: 115, payoutRate: 115, amount: 0, description: '우수' },
          'B+': { score: 105, payoutRate: 105, amount: 0, description: '양호+' },
          'B': { score: 100, payoutRate: 100, amount: 0, description: '양호' },
          'B-': { score: 95, payoutRate: 95, amount: 0, description: '양호-' },
          'C': { score: 85, payoutRate: 85, amount: 0, description: '보통' },
          'C-': { score: 70, payoutRate: 70, amount: 0, description: '보통-' },
          'D': { score: 0, payoutRate: 0, amount: 0, description: '미흡' }
        }));
        
        toast({ title: '초기화 완료', description: '목업 데이터로 초기화되었습니다. 페이지를 새로고침합니다.' });
        
        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error) {
        toast({ variant: 'destructive', title: '초기화 실패', description: '목업 데이터 초기화 중 오류가 발생했습니다.' });
        console.error("Reset to mock data failed", error);
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

            const autoMapping: Record<string, string> = {};
            headers.forEach(header => {
              const systemField = excelHeaderMapping[header];
              if (systemField && !Object.values(autoMapping).includes(systemField)) {
                  autoMapping[header] = systemField;
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
      const parsedData = await parseExcelFile(fileToProcess, currentMapping);

      if (uploadType === 'employees') {
        const newEmployees = parsedData.map((row, index) => {
          const uniqueId = String(row['uniqueId'] || '');
          if (!uniqueId) throw new Error(`${index + 2}번째 행에 ID가 없습니다.`);
          return {
            uniqueId, name: String(row['name'] || ''),
            company: String(row['company'] || ''), department: String(row['department'] || ''),
            title: String(row['title'] || '팀원'), position: String(row['title'] || '팀원'),
            growthLevel: String(row['growthLevel'] || ''), workRate: Number(row['workRate'] || 1),
            evaluatorId: String(row['evaluatorId'] || ''), baseAmount: Number(row['baseAmount'] || 0),
          };
        });
        handleEmployeeUpload(selectedDate.year, selectedDate.month, newEmployees);
        toast({ title: '업로드 성공', description: `${newEmployees.length}명의 데이터가 처리되었습니다.` });

      } else if (uploadType === 'evaluations') {
          // 평가 데이터에서 evaluatorName이 제대로 포함되었는지 확인
          const processedData = parsedData.map(row => {
              const processedRow = { ...row };
              // evaluatorName이 없거나 빈 값인 경우 evaluatorId를 기반으로 생성
              if (!processedRow.evaluatorName && processedRow.evaluatorId) {
                  processedRow.evaluatorName = `평가자(${processedRow.evaluatorId})`;
              }
              return processedRow;
          });
          
          handleEvaluationUpload(selectedDate.year, selectedDate.month, processedData as EvaluationUploadData[]);
          toast({ title: '업로드 성공', description: `${processedData.length}명의 데이터가 처리되었습니다.` });
      }

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
              
              // 날짜 형식 표준화: 점(.)을 하이픈(-)으로 변환
              const startDate = String(row['startDate'] || '').replace(/\./g, '-');
              const endDate = String(row['endDate'] || '').replace(/\./g, '-');
              
              return {
                uniqueId, name: String(row['name'] || ''),
                startDate, endDate,
                startTime: String(row['startTime'] || ''), endTime: String(row['endTime'] || ''),
                type: shortenedWorkType,
                lastModified: now,
              }
            }));
            uploadCount = newShortenedWork.length;
            handleWorkRateDataUpload(selectedDate.year, selectedDate.month, 'shortenedWorkHours', newShortenedWork, true);
        } else if (uploadType === 'dailyAttendance') {
            const newDailyAttendance = await parseExcelFileSimple<DailyAttendanceRecord>(file, json => json.map((row, index) => {
              const uniqueId = String(row['uniqueId'] || '');
              if (!uniqueId) throw new Error(`${index + 2}번째 행에 사번이 없습니다.`);
              
              // 날짜 형식 표준화: 점(.)을 하이픈(-)으로 변환
              const date = String(row['date'] || '').replace(/\./g, '-');
              
              return {
                uniqueId, name: String(row['name'] || ''),
                date, type: String(row['type'] || ''),
                lastModified: now,
              }
            }));
            uploadCount = newDailyAttendance.length;
            handleWorkRateDataUpload(selectedDate.year, selectedDate.month, 'dailyAttendance', newDailyAttendance, true);
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
                
                const simplifiedMapping: Record<string, string> = {
                    "고유사번": "uniqueId", "사번": "uniqueId", "ID": "uniqueId", "사원번호": "uniqueId",
                    "성명": "name", "이름": "name",
                    "시작일": "startDate", "시작일자": "startDate", "시작": "startDate", "시작일시": "startDate",
                    "종료일": "endDate", "종료일자": "endDate", "종료": "endDate", "종료일시": "endDate",
                    "출근시각": "startTime", "출근시간": "startTime", "시작시간": "startTime",
                    "퇴근시각": "endTime", "퇴근시간": "endTime", "종료시간": "endTime",
                    "근태사용일": "date", "일자": "date", "날짜": "date", "사용일": "date",
                    "근태종류": "type", "근태": "type", "종류": "type", "근태유형": "type",
                }

                console.log('엑셀 파일 헤더:', Object.keys(json[0] || {}));

                const mappedJson = json.map(row => {
                    const newRow: any = {};
                    for (const excelHeader in row) {
                        const systemField = simplifiedMapping[excelHeader];
                        if(systemField) {
                            newRow[systemField] = row[excelHeader];
                            console.log(`헤더 매핑: "${excelHeader}" → "${systemField}"`);
                        } else {
                            console.log(`매핑되지 않은 헤더: "${excelHeader}"`);
                        }
                    }
                    return newRow;
                });
                
                console.log('매핑된 데이터 샘플:', mappedJson.slice(0, 2));
                
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
            headers = ['ID', '이름', '회사', '소속부서', '직책', '성장레벨', '평가자 ID', '기준금액', '비고'];
            fileName = `${selectedDate.year}.${String(selectedDate.month).padStart(2,'0')}_월성과대상자_양식.xlsx`;
            break;
        case 'evaluations':
            headers = ['ID', '이름', '등급', '비고', '평가자 ID', '평가자'];
            fileName = `${selectedDate.year}.${String(selectedDate.month).padStart(2, '0')}_월성과데이터_양식.xlsx`;
            break;
        case 'shortenedWork':
            headers = ['고유사번', '성명', '시작일자', '종료일자', '출근시각', '퇴근시각'];
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

  const handleMappingChange = (excelHeader: string, value: string) => {
      setCurrentMapping(prev => {
          const newMapping = { ...prev };
          if (value === 'ignore') {
            delete newMapping[excelHeader];
          } else {
            newMapping[excelHeader] = value;
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
                      현재 데이터를 임시 데이터로 저장
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setDialogOpen({ type: 'restoreData'})}>
                      <RefreshCw className="mr-2 h-4 w-4"/>
                      임시 데이터로 덮어쓰기
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setDialogOpen({ type: 'resetToMockData'})}>
                      <RefreshCw className="mr-2 h-4 w-4"/>
                      목업 데이터로 초기화
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
                isResetDisabled={!currentMonthWorkRateInputs.shortenedWorkHours.some(r => r.type === '임신')}
            />
            <Separator />
            <UploadSection
                id="shortenedWorkCare"
                title="육아/돌봄 단축근로"
                description=""
                onUpload={(e) => handleFileUpload(e, 'shortenedWork', '육아/돌봄')}
                onDownload={() => handleDownloadTemplate('shortenedWork')}
                onReset={() => setDialogOpen({type: 'resetWorkData', workDataType: '육아/돌봄'})}
                isResetDisabled={!currentMonthWorkRateInputs.shortenedWorkHours.some(r => r.type === '육아/돌봄')}
            />
            <Separator />
            <UploadSection
                id="dailyAttendance"
                title="일근태"
                description=""
                onUpload={(e) => handleFileUpload(e, 'dailyAttendance')}
                onDownload={() => handleDownloadTemplate('dailyAttendance')}
                onReset={() => setDialogOpen({type: 'resetWorkData', workDataType: 'dailyAttendance'})}
                isResetDisabled={!currentMonthWorkRateInputs.dailyAttendance.length}
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
                      {dialogOpen?.type === 'resetToMockData' && `현재 브라우저의 모든 데이터를 목업 데이터로 초기화합니다. 저장하지 않은 변경사항은 사라지며, 이 작업은 되돌릴 수 없습니다.`}
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
                        else if (dialogOpen?.type === 'resetToMockData') handleResetToMockData();
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
        <DialogContent2 className="max-w-2xl">
          <DialogHeader2>
            <DialogTitle2>엑셀 헤더 매핑 설정</DialogTitle2>
            <DialogDescription2>
              업로드한 엑셀 파일의 각 열(헤더)이 시스템의 어떤 데이터에 해당하는지 설정해주세요.
              <br />
              <span className="text-destructive">*</span> 표시된 필드는 업로드를 위해 필수적으로 매핑되어야 합니다.
            </DialogDescription2>
          </DialogHeader2>
          <div className="h-[60vh] p-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">엑셀 헤더</TableHead>
                  <TableHead>시스템 필드</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {excelHeaders.map(header => {
                  const mapping = currentMapping[header] || '';
                  return (
                    <TableRow key={header}>
                      <TableCell className="font-medium">{header}</TableCell>
                      <TableCell>
                        <Select
                          value={mapping || 'ignore'}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="항목 선택..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">매핑 안함</SelectItem>
                            <Separator />
                            {systemFields.map(field => {
                                const selectedByOtherHeader = Object.values(currentMapping).some(m => m === field) && mapping !== field;
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
            </div>
           <div className="flex justify-between items-center pt-2">
            <Label className="text-xs text-muted-foreground">
                <span className="text-destructive">*</span> {requiredFields.join(', ')} 필드는 반드시 매핑되어야 합니다.
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
