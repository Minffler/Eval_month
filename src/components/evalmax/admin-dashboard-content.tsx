'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileCheck, Bot, Upload, LayoutDashboard, Settings, Download, Bell, ArrowUpDown, ArrowUp, ArrowDown, Eye, ClipboardX, ChevronUp, ChevronDown, CheckCircle2, ChevronsUpDown, Save, X, ThumbsUp, ThumbsDown, Inbox, FileText, AlertTriangle, UserCog, Settings2, Lock, Unlock, TrendingUp, BarChart3, CheckCircle } from 'lucide-react';
import { GradeHistogram } from './grade-histogram';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConsistencyValidator } from './consistency-validator';
import ManageData from './manage-data';
import type { EvaluationResult, Grade, Employee, GradeInfo, EvaluationGroupCategory, User, EvaluationUploadData, WorkRateInputs, AttendanceType, Holiday, Approval, AppNotification, ApprovalStatus, ShortenedWorkType, Role, Evaluation } from '@/lib/types';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { calculateFinalAmount, getPositionSortValue } from '@/lib/data';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Progress } from '../ui/progress';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertDialogContent2,
  AlertDialogDescription as AlertDialogDescription2,
  AlertDialogFooter as AlertDialogFooter2,
  AlertDialogHeader as AlertDialogHeader2,
  AlertDialogTitle as AlertDialogTitle2,
} from '@/components/ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import EvaluatorDashboard from './evaluator-dashboard';
import UserRoleManagement from './user-role-management';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { AmountDistributionChart } from './amount-distribution-chart';
import WorkRateManagement from './work-rate-management';
import WorkRateDetails from './work-rate-details';
import { cn, formatDateTime } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Separator } from '../ui/separator';
import AdminNotifications from './admin-dashboard-notifications';
import { Label } from '../ui/label';
import GradeManagement from './grade-management';
import EvaluatorManagement from './evaluator-management';
import { useEvaluation } from '@/contexts/evaluation-context';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '../ui/badge';

interface AdminDashboardContentProps {
  activeView: string;
  selectedDate: { year: number; month: number };
  setSelectedDate: (date: { year: number; month: number }) => void;
  userMap: Map<string, User>;
  evaluationStatus: 'open' | 'closed';
  onEvaluationStatusChange: (year: number, month: number, status: 'open' | 'closed') => void;
  results: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  setGradingScale: React.Dispatch<React.SetStateAction<Record<NonNullable<Grade>, GradeInfo>>>;
  attendanceTypes: AttendanceType[];
  setAttendanceTypes: React.Dispatch<React.SetStateAction<AttendanceType[]>>;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  workRateInputs: Record<string, WorkRateInputs>;
  onApprovalAction: (approval: Approval) => void;
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'isRead'>) => void;
  deleteNotification: (notificationId: string) => void;
  approvals: Approval[];
}

type SortConfig = {
  key: keyof EvaluationResult;
  direction: 'ascending' | 'descending';
} | null;

type EvaluatorStat = {
  evaluatorUniqueId: string;
  evaluatorName: string;
  total: number;
  completed: number;
  pending: number;
  rate: number;
};
type EvaluatorStatsSortConfig = {
  key: keyof EvaluatorStat;
  direction: 'ascending' | 'descending';
} | null;

const NOTIFICATION_TEMPLATES_STORAGE_KEY = 'pl_eval_notification_templates';


export default function AdminDashboardContent({ 
  activeView,
  selectedDate,
  setSelectedDate,
  userMap,
  evaluationStatus,
  onEvaluationStatusChange,
  results: initialResults, 
  gradingScale, 
  setGradingScale,
  attendanceTypes,
  setAttendanceTypes,
  holidays,
  setHolidays,
  workRateInputs,
  onApprovalAction,
  notifications,
  addNotification,
  deleteNotification,
  approvals,
}: AdminDashboardContentProps) {
  const { setEvaluations, handleEmployeeUpload } = useEvaluation();
  const [results, setResults] = React.useState<EvaluationResult[]>(initialResults);
  const [activeResultsTab, setActiveResultsTab] = React.useState<EvaluationGroupCategory>('전체');
  const [selectedEvaluators, setSelectedEvaluators] = React.useState<Set<string>>(new Set());
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = React.useState(false);
  const [notificationMessage, setNotificationMessage] = React.useState('');
  const [isImportantNotification, setIsImportantNotification] = React.useState(false);
  const [notificationTemplates, setNotificationTemplates] = React.useState<string[]>([]);
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);
  const [evaluatorStatsSortConfig, setEvaluatorStatsSortConfig] = React.useState<EvaluatorStatsSortConfig>({ key: 'rate', direction: 'ascending' });
  const [selectedEvaluatorId, setSelectedEvaluatorId] = React.useState<string>('');
  const [isDistributionChartOpen, setIsDistributionChartOpen] = React.useState(true);
  const [isPayoutChartOpen, setIsPayoutChartOpen] = React.useState(false);
  const [dashboardFilter, setDashboardFilter] = React.useState('전체');
  const [evaluatorViewPopoverOpen, setEvaluatorViewPopoverOpen] = React.useState(false);
  const [approvalDetailModalOpen, setApprovalDetailModalOpen] = React.useState(false);
  const [selectedApproval, setSelectedApproval] = React.useState<Approval | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [isGradeDialogOpen, setIsGradeDialogOpen] = React.useState(false);

  const { toast } = useToast();

  const evaluatorsForView = React.useMemo(() => {
    return Array.from(userMap.values()).filter(u => u.roles.includes('evaluator'));
  }, [userMap]);


  React.useEffect(() => {
    try {
      const storedTemplates = localStorage.getItem(NOTIFICATION_TEMPLATES_STORAGE_KEY);
      if (storedTemplates) {
        setNotificationTemplates(JSON.parse(storedTemplates));
      }
    } catch (error) {
      console.error('Error reading notification templates from localStorage', error);
    }
  }, []);

  const saveNotificationTemplates = (templates: string[]) => {
    try {
      localStorage.setItem(NOTIFICATION_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
      setNotificationTemplates(templates);
    } catch (error) {
      console.error('Error saving notification templates to localStorage', error);
    }
  };

  const handleSaveTemplate = () => {
    if (!notificationMessage.trim() || notificationTemplates.includes(notificationMessage)) {
        toast({
            variant: 'destructive',
            title: '오류',
            description: '템플릿이 비어있거나 이미 존재합니다.'
        });
        return;
    }
    const newTemplates = [notificationMessage, ...notificationTemplates].slice(0, 5);
    saveNotificationTemplates(newTemplates);
    toast({ title: '템플릿 저장 완료', description: '알림 메시지 템플릿이 저장되었습니다.' });
  };

  const handleDeleteTemplate = (templateToDelete: string) => {
    const newTemplates = notificationTemplates.filter(t => t !== templateToDelete);
    saveNotificationTemplates(newTemplates);
  };

  React.useEffect(() => {
    setResults(initialResults);
    setSelectedEvaluators(new Set());
  }, [initialResults]);

  const categorizedResults = React.useMemo(() => {
    const categories: Record<EvaluationGroupCategory, EvaluationResult[]> = {
      '전체': initialResults,
      'A. 정규평가': initialResults.filter(r => r.evaluationGroup === 'A. 정규평가'),
      'B. 별도평가': initialResults.filter(r => r.evaluationGroup === 'B. 별도평가'),
      'C. 미평가': initialResults.filter(r => r.evaluationGroup === 'C. 미평가'),
    };
    return categories;
  }, [initialResults]);

  const visibleResults = categorizedResults[activeResultsTab];
  
  const filteredDashboardData = React.useMemo(() => {
    const isLeader = (r: EvaluationResult) => ['팀장', '지점장', '지부장', '센터장'].includes(r.position);
    switch(dashboardFilter) {
      case 'A. 정규평가': return initialResults.filter(r => r.evaluationGroup === 'A. 정규평가');
      case 'B. 별도평가': return initialResults.filter(r => r.evaluationGroup === 'B. 별도평가');
      case '직책자': return initialResults.filter(isLeader);
      case '비직책자': return initialResults.filter(r => !isLeader(r));
      case '전체':
      default:
        return initialResults;
    }
  }, [initialResults, dashboardFilter]);

  const overallGradeDistribution = React.useMemo(() => Object.keys(gradingScale || {}).map(grade => ({
    name: grade,
    value: filteredDashboardData.filter(r => r.grade === grade).length,
  })), [filteredDashboardData, gradingScale]);

  const evaluatorStats = React.useMemo(() => {
    const statsByUniqueId: Record<string, { total: number; completed: number; evaluatorName: string; }> = {};
    const monthlyEvaluatorIds = Array.from(new Set(initialResults.map(r => r.evaluatorId).filter(Boolean)));
    
    monthlyEvaluatorIds.forEach(evaluatorId => {
        if (evaluatorId) {
            const evaluatorInfo = userMap.get(evaluatorId);
            statsByUniqueId[evaluatorId] = { 
                total: 0, 
                completed: 0, 
                evaluatorName: evaluatorInfo?.name || `미지정 (${evaluatorId})` 
            };
        }
    });

    initialResults.forEach(r => {
      if (!r.evaluatorId || !statsByUniqueId[r.evaluatorId]) return;
      statsByUniqueId[r.evaluatorId].total++;
      if (r.grade) {
        statsByUniqueId[r.evaluatorId].completed++;
      }
    });

    return Object.entries(statsByUniqueId).map(([id, data]) => ({
      evaluatorUniqueId: id,
      evaluatorName: data.evaluatorName,
      total: data.total,
      completed: data.completed,
      pending: data.total - data.completed,
      rate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
    }));
  }, [initialResults, userMap]);

  const sortedEvaluatorStats = React.useMemo(() => {
    let sortableItems: EvaluatorStat[] = [...evaluatorStats];
    if (evaluatorStatsSortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[evaluatorStatsSortConfig.key];
        const bValue = b[evaluatorStatsSortConfig.key];
        
        if (aValue < bValue) {
          return evaluatorStatsSortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return evaluatorStatsSortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [evaluatorStats, evaluatorStatsSortConfig]);
  
  const isAllEvaluatorsSelected = evaluatorStats.length > 0 && selectedEvaluators.size === evaluatorStats.length;
  const isIndeterminateEvaluatorSelection = selectedEvaluators.size > 0 && !isAllEvaluatorsSelected;

  const selectedEvaluator = React.useMemo(() => {
    if (!selectedEvaluatorId) return null;
    return userMap.get(selectedEvaluatorId) || null;
  }, [selectedEvaluatorId, userMap]);

  const sortedVisibleResults = React.useMemo(() => {
    let sortableItems = [...visibleResults];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === 'title') {
            const orderA = getPositionSortValue(a.title);
            const orderB = getPositionSortValue(b.title);
            if (orderA !== orderB) {
                return sortConfig.direction === 'ascending' ? orderA - orderB : orderB - orderA;
            }
        }

        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [visibleResults, sortConfig]);

  const requestSort = (key: keyof EvaluationResult) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof EvaluationResult) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <ArrowUp className="ml-2 h-4 w-4 text-primary" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const requestEvaluatorStatsSort = (key: keyof EvaluatorStat) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (evaluatorStatsSortConfig && evaluatorStatsSortConfig.key === key && evaluatorStatsSortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setEvaluatorStatsSortConfig({ key, direction });
  };
  
  const getEvaluatorStatsSortIcon = (key: keyof EvaluatorStat) => {
    if (!evaluatorStatsSortConfig || evaluatorStatsSortConfig.key !== key) {
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    if (evaluatorStatsSortConfig.direction === 'ascending') {
        return <ArrowUp className="ml-2 h-4 w-4 text-primary" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const handleSelectAllEvaluators = (checked: boolean) => {
    if (checked) {
      const allEvaluatorIds = new Set(evaluatorStats.map(s => s.evaluatorUniqueId));
      setSelectedEvaluators(allEvaluatorIds);
    } else {
      setSelectedEvaluators(new Set());
    }
  };

  const handleSelectEvaluator = (evaluatorId: string, checked: boolean) => {
    const newSelection = new Set(selectedEvaluators);
    if (checked) {
      newSelection.add(evaluatorId);
    } else {
      newSelection.delete(evaluatorId);
    }
    setSelectedEvaluators(newSelection);
  };
  
  const handleSelectIncompleteEvaluators = () => {
    const incompleteEvaluatorIds = evaluatorStats
      .filter(stat => stat.rate < 100)
      .map(stat => stat.evaluatorUniqueId);
    setSelectedEvaluators(new Set(incompleteEvaluatorIds));
    if (incompleteEvaluatorIds.length > 0) {
      toast({
          title: "선택 완료",
          description: `완료율이 100%가 아닌 ${incompleteEvaluatorIds.length}명의 평가자가 선택되었습니다.`,
      });
    } else {
      toast({
          title: "모두 완료",
          description: `모든 평가자가 평가를 완료했습니다.`,
      });
    }
  };

  const handleOpenNotificationDialog = () => {
    setNotificationMessage(`_평가년월_ 평가 마감 3일 전입니다. (현재 진행률: _%_)`);
    setIsImportantNotification(false);
    setIsNotificationDialogOpen(true);
  };
  
  const handleSendNotifications = () => {
    const monthYearString = `${selectedDate.year}년 ${selectedDate.month}월`;
    selectedEvaluators.forEach(evaluatorId => {
      const stat = evaluatorStats.find(s => s.evaluatorUniqueId === evaluatorId);
      if (stat) {
        const message = notificationMessage
          .replace(/_평가자이름_/g, stat.evaluatorName)
          .replace(/_평가년월_/g, monthYearString)
          .replace(/_%_/g, `${stat.rate.toFixed(1)}%`);
        
        addNotification({ 
          recipientId: stat.evaluatorUniqueId, 
          message,
          isImportant: isImportantNotification,
        });
      }
    });

    toast({
        title: "알림 발송 완료",
        description: `${selectedEvaluators.size}명의 평가자에게 알림이 발송되었습니다.`,
    });
    
    setIsNotificationDialogOpen(false);
    setSelectedEvaluators(new Set());
  };

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  const updateAndSaveChanges = (updatedResults: EvaluationResult[]) => {
    console.log('=== updateAndSaveChanges 호출됨 ===');
    console.log('updatedResults:', updatedResults);
    
    setResults(updatedResults);
    const key = `${selectedDate.year}-${selectedDate.month}`;
    
    // 근무율이 업데이트된 경우 employees 데이터도 업데이트
    const hasWorkRateUpdate = updatedResults.some(result => {
      const originalResult = initialResults.find(r => r.id === result.id);
      return originalResult && Math.abs(result.workRate - originalResult.workRate) > 0.001;
    });
    
    console.log('=== 근무율 변경 감지 디버깅 (관리자) ===');
    console.log('hasWorkRateUpdate:', hasWorkRateUpdate);
    console.log('initialResults.length:', initialResults.length);
    console.log('updatedResults.length:', updatedResults.length);
    
    if (hasWorkRateUpdate) {
      console.log('=== 근무율 업데이트 감지됨 (관리자) ===');
      
      // 업데이트된 평가 결과에서 employees 데이터 생성 (중복 제거)
      const currentEmployees = updatedResults
        .filter((result, index, self) => 
          index === self.findIndex(r => r.uniqueId === result.uniqueId)
        )
        .map(result => ({
          id: result.id,
          uniqueId: result.uniqueId,
          name: result.name,
          company: result.company,
          department: result.department,
          title: result.title,
          position: result.position,
          growthLevel: result.growthLevel,
          workRate: result.workRate, // 업데이트된 근무율 (엑셀 데이터 무시)
          evaluatorId: result.evaluatorId,
          baseAmount: result.baseAmount,
          memo: result.memo,
        }));
      
      console.log('=== employees 업데이트 전 (관리자) ===');
      console.log('중복 제거 후 currentEmployees 길이:', currentEmployees.length);
      console.log('currentEmployees:', currentEmployees);
      
      // handleEmployeeUpload를 사용하여 업데이트 (기존 데이터 완전 교체)
      handleEmployeeUpload(selectedDate.year, selectedDate.month, currentEmployees);
      console.log('=== handleEmployeeUpload 호출 완료 (관리자) ===');
    } else {
      console.log('=== 근무율 업데이트 감지되지 않음 (관리자) ===');
    }
    
    setEvaluations(prev => {
        const newEvals = { ...prev };
        const updatedEvalsForMonth = (newEvals[key] || []).map(ev => {
            const result = updatedResults.find(r => r.id === ev.employeeId);
            if (result) {
                return { ...ev, grade: result.grade, memo: result.memo };
            }
            return ev;
        });
        newEvals[key] = updatedEvalsForMonth;
        return newEvals;
    });
  };
  
  const handleBaseAmountChange = (employeeId: string, newAmountStr: string) => {
    const newAmount = Number(newAmountStr.replace(/,/g, ''));
    if (isNaN(newAmount)) return;

    const updatedResults = results.map(r => {
      if (r.id === employeeId) {
        const gradeInfo = r.grade ? gradingScale[r.grade] : { payoutRate: 0 };
        const payoutRate = (gradeInfo?.payoutRate || 0) / 100;
        const gradeAmount = newAmount * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, r.workRate);
        return { ...r, baseAmount: newAmount, gradeAmount, finalAmount };
      }
      return r;
    });
    updateAndSaveChanges(updatedResults);
  };
  
  const handleMemoChange = (employeeId: string, newMemo: string) => {
    const updatedResults = results.map(r => {
      if (r.id === employeeId) {
        return { ...r, memo: newMemo };
      }
      return r;
    });
    updateAndSaveChanges(updatedResults);
  };

  const handleGradeChange = (employeeId: string, newGradeStr: string | null) => {
    const newGrade = newGradeStr as Grade;
    const updatedResults = results.map(r => {
      if (r.id === employeeId) {
        const gradeInfo = newGrade ? gradingScale[newGrade] : { score: 0, payoutRate: 0 };
        const payoutRate = (gradeInfo?.payoutRate || 0) / 100;
        const gradeAmount = (r.baseAmount || 0) * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, r.workRate);
        return { 
          ...r, 
          grade: newGrade,
          score: gradeInfo?.score || 0,
          payoutRate: payoutRate,
          gradeAmount,
          finalAmount
        };
      }
      return r;
    });
    updateAndSaveChanges(updatedResults);
  };

  const handleDownloadExcel = () => {
    const dataToExport = visibleResults.map(r => ({
      'ID': r.uniqueId,
      '회사': r.company,
      '소속부서': r.department,
      '이름': r.name,
      '직책': r.title,
      '성장레벨': r.growthLevel,
      '평가그룹': r.evaluationGroup,
      '세부구분1': r.detailedGroup1,
      '근무율': `${(r.workRate * 100).toFixed(1)}%`,
      '점수': r.score,
      '등급': r.grade,
      '기준금액': r.baseAmount,
      '최종금액': r.finalAmount,
      '평가자 ID': r.evaluatorId,
      '평가자': r.evaluatorName,
      '비고': r.memo,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '평가결과');
    const fileName = `${selectedDate.year}.${String(selectedDate.month).padStart(2, '0')}_월성과데이터.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const EvaluationGroupIcon = ({ group }: { group: string }) => {
    const groupChar = group.charAt(0);
    switch (groupChar) {
      case 'A':
        return <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-stone-700" style={{ backgroundColor: 'hsl(25, 15%, 68%)' }}>{groupChar}</div>;
      case 'B':
        return <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-stone-700" style={{ backgroundColor: 'hsl(25, 15%, 82%)' }}>{groupChar}</div>;
      case 'C':
        return <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-stone-500" style={{ backgroundColor: 'hsl(25, 15%, 92%)' }}>{groupChar}</div>;
      default:
        return <span>{group}</span>;
    }
  };

    const handleApprovalModal = (approval: Approval) => {
        setSelectedApproval(approval);
        setRejectionReason('');
        setApprovalDetailModalOpen(true);
    };

    const handleApprovalDecision = (decision: 'approved' | 'rejected') => {
        if (!selectedApproval) return;

        if (decision === 'rejected' && !rejectionReason.trim()) {
            toast({ variant: 'destructive', title: '오류', description: '반려 사유를 입력해주세요.' });
            return;
        }

        let newStatusHR = selectedApproval.statusHR;
        if (decision === 'approved') {
            newStatusHR = '최종승인';
        } else { // rejected
            newStatusHR = '반려';
        }
        
        onApprovalAction({ 
            ...selectedApproval,
            rejectionReason,
            status: selectedApproval.status, // 현업 상태는 변경하지 않음
            statusHR: newStatusHR,
        });
        
        toast({ title: '처리 완료', description: `결재 요청이 ${decision === 'approved' ? '승인' : '반려'}되었습니다.` });
        setApprovalDetailModalOpen(false);
        setSelectedApproval(null);
    };
    
    const StatusBadge = ({ status }: { status: ApprovalStatus }) => {
        const styles: Record<ApprovalStatus, {bgColor: string, textColor: string}> = {
          '결재중': { bgColor: 'hsl(30, 20%, 98%)', textColor: 'hsl(var(--muted-foreground))' }, 
          '현업승인': { bgColor: 'hsl(25, 20%, 92%)', textColor: 'hsl(var(--secondary-foreground))' },
          '최종승인': { bgColor: 'hsl(140, 60%, 92%)', textColor: 'hsl(140, 80%, 30%)' }, 
          '반려': { bgColor: 'hsl(39, 94%, 94%)', textColor: 'hsl(24, 95%, 53%)'},
        }

        return (
          <div className="flex items-center justify-center">
            <div className={cn("flex items-center justify-center rounded-full text-xs font-semibold w-20 h-6")} style={{ backgroundColor: styles[status].bgColor, color: styles[status].textColor }}>
                {status}
            </div>
          </div>
        );
    };
    
    const formatTimestamp = (isoString: string | null) => {
        return formatDateTime(isoString || undefined);
    };
    
    const formatTimestampShort = (isoString: string | null) => {
        return formatDateTime(isoString || undefined);
    };

    const renderApprovalData = (approval: Approval) => {
        const { payload } = approval;
        const data = payload.data;

        const commonFields = [
            { label: '대상자', value: `${data.name} (${data.uniqueId})` },
        ];

        const typeSpecificFields = payload.dataType === 'shortenedWorkHours' ? [
            { label: '유형', value: `단축근로 (${data.type})` },
            { label: '사용기간', value: `${data.startDate} ~ ${data.endDate}` },
            { label: '근무시간', value: `${data.startTime} ~ ${data.endTime}` },
        ] : [
            { label: '유형', value: `일근태 (${data.type})` },
            { label: '사용일자', value: data.date },
        ];

        return (
            <div className="text-sm space-y-4">
                {[...commonFields, ...typeSpecificFields].map(field => (
                     <div key={field.label} className="grid grid-cols-4 items-center">
                        <span className="font-semibold col-span-1">{field.label}</span>
                        <span className="col-span-3">{field.value}</span>
                    </div>
                ))}
            </div>
        );
    }

    const teamApproverInfo = React.useMemo(() => {
        if (!selectedApproval) return null;
        
        const approver = userMap.get(selectedApproval.approverTeamId);
        return approver ? `${approver.name} (${approver.uniqueId})` : `미지정 (${selectedApproval.approverTeamId})`;
    }, [selectedApproval, userMap]);
  
  const renderContent = () => {
    switch(activeView) {
        case 'dashboard':
            return (
                <div className="space-y-4">
                  <Card className="shadow-sm border-gray-200">
                    <Collapsible open={isDistributionChartOpen} onOpenChange={setIsDistributionChartOpen}>
                      <CardHeader className="flex flex-row items-center justify-between p-4">
                          <CardTitle>등급 분포</CardTitle>
                           <Tabs defaultValue="전체" onValueChange={(val) => setDashboardFilter(val)}>
                                <TabsList>
                                    <TabsTrigger value="전체">전체</TabsTrigger>
                                    <TabsTrigger value="A. 정규평가">A.정규</TabsTrigger>
                                    <TabsTrigger value="B. 별도평가">B.별도</TabsTrigger>
                                    <TabsTrigger value="직책자">직책자</TabsTrigger>
                                    <TabsTrigger value="비직책자">비직책자</TabsTrigger>
                                </TabsList>
                            </Tabs>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="pt-0 p-4">
                          <GradeHistogram data={overallGradeDistribution} gradingScale={gradingScale} highlightGrade={null} />
                        </CardContent>
                      </CollapsibleContent>
                      <CollapsibleTrigger asChild>
                        <div className="border-t border-gray-100 w-full text-center p-2 text-sm text-gray-500 cursor-pointer hover:bg-gray-50 rounded-b-lg transition-colors">
                            <div className="flex items-center justify-center">
                                {isDistributionChartOpen ? "숨기기" : "보기"}
                                {isDistributionChartOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                            </div>
                        </div>
                      </CollapsibleTrigger>
                    </Collapsible>
                  </Card>

                  <Card className="shadow-sm border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between p-4">
                      <CardTitle>평가 입력</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleSelectIncompleteEvaluators}
                          size="sm"
                        >
                          <ClipboardX className="mr-2 h-4 w-4" />
                          미완료 평가자 선택
                        </Button>
                        <Button
                          disabled={selectedEvaluators.size === 0}
                          onClick={handleOpenNotificationDialog}
                          size="sm"
                        >
                          <Bell className="mr-2 h-4 w-4" />
                          선택된 평가자에게 알림 발송
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="border border-gray-200 rounded-lg overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px] text-center">
                                <Checkbox
                                  checked={isIndeterminateEvaluatorSelection ? 'indeterminate' : isAllEvaluatorsSelected}
                                  onCheckedChange={(checked) => handleSelectAllEvaluators(Boolean(checked))}
                                  aria-label="모든 평가자 선택"
                                />
                              </TableHead>
                              <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestEvaluatorStatsSort('evaluatorUniqueId')}>
                                <div className="flex items-center justify-center">평가자 ID{getEvaluatorStatsSortIcon('evaluatorUniqueId')}</div>
                              </TableHead>
                              <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestEvaluatorStatsSort('evaluatorName')}>
                                <div className="flex items-center justify-center">평가자{getEvaluatorStatsSortIcon('evaluatorName')}</div>
                              </TableHead>
                              <TableHead className="whitespace-nowrap text-center cursor-pointer" onClick={() => requestEvaluatorStatsSort('total')}>
                                <div className="flex items-center justify-center">대상 인원{getEvaluatorStatsSortIcon('total')}</div>
                              </TableHead>
                              <TableHead className="whitespace-nowrap text-center cursor-pointer" onClick={() => requestEvaluatorStatsSort('completed')}>
                                <div className="flex items-center justify-center">완료{getEvaluatorStatsSortIcon('completed')}</div>
                              </TableHead>
                              <TableHead className="whitespace-nowrap text-center cursor-pointer" onClick={() => requestEvaluatorStatsSort('pending')}>
                                <div className="flex items-center justify-center">미입력{getEvaluatorStatsSortIcon('pending')}</div>
                              </TableHead>
                              <TableHead className="whitespace-nowrap text-center w-[200px] cursor-pointer" onClick={() => requestEvaluatorStatsSort('rate')}>
                                <div className="flex items-center justify-center">완료율{getEvaluatorStatsSortIcon('rate')}</div>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedEvaluatorStats.map(stat => (
                              <TableRow key={stat.evaluatorUniqueId} className="border-b border-gray-100">
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={selectedEvaluators.has(stat.evaluatorUniqueId)}
                                    onCheckedChange={(checked) => handleSelectEvaluator(stat.evaluatorUniqueId, Boolean(checked))}
                                    aria-label={`${stat.evaluatorName} 선택`}
                                  />
                                </TableCell>
                                <TableCell className="whitespace-nowrap font-mono text-xs text-center">{stat.evaluatorUniqueId}</TableCell>
                                <TableCell className="font-medium whitespace-nowrap text-center">{stat.evaluatorName}</TableCell>
                                <TableCell className="text-center whitespace-nowrap">{stat.total || '-'}</TableCell>
                                <TableCell className="text-center whitespace-nowrap">{stat.completed || '-'}</TableCell>
                                <TableCell className={cn("text-center whitespace-nowrap", stat.pending > 0 && "text-orange-600")}>{stat.pending || '-'}</TableCell>
                                <TableCell className="text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-2">
                                    <Progress
                                      value={stat.rate}
                                      indicatorClassName={cn(stat.rate < 100 ? "bg-orange-500" : "bg-orange-200")}
                                      className="w-full h-2"
                                    />
                                    <span className={cn("text-xs w-16 text-right", stat.rate < 100 ? "text-orange-600" : "text-gray-500")}>{stat.rate.toFixed(1)}%</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                    <CardFooter className="justify-end gap-2 p-4">
                        {evaluationStatus === 'open' ? (
                            <Button onClick={() => onEvaluationStatusChange(selectedDate.year, selectedDate.month, 'closed')} className="bg-orange-600 hover:bg-orange-700">
                                <Lock className="mr-2 h-4 w-4" />
                                평가 마감
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => onEvaluationStatusChange(selectedDate.year, selectedDate.month, 'open')} className="border-gray-300 hover:bg-orange-50">
                                <Unlock className="mr-2 h-4 w-4" />
                                평가 마감 취소
                            </Button>
                        )}
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>평가 통계</CardTitle>
                      <CardDescription>전체 평가 현황 및 통계 정보입니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex flex-col space-y-2">
                          <div className="text-2xl font-bold">{initialResults.length}</div>
                          <div className="text-sm text-muted-foreground">전체 대상자</div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <div className="text-2xl font-bold">{initialResults.filter(r => r.grade).length}</div>
                          <div className="text-sm text-muted-foreground">평가 완료</div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <div className="text-2xl font-bold">{initialResults.filter(r => !r.grade).length}</div>
                          <div className="text-sm text-muted-foreground">평가 미완료</div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <div className="text-2xl font-bold">
                            {initialResults.length > 0 ? ((initialResults.filter(r => r.grade).length / initialResults.length) * 100).toFixed(1) : 0}%
                          </div>
                          <div className="text-sm text-muted-foreground">평가 완료율</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>평가자별 상세 현황</CardTitle>
                      <CardDescription>각 평가자별 평가 진행 상황을 확인할 수 있습니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {evaluatorsForView.map(evaluator => {
                          const evaluatorResults = initialResults.filter(r => r.evaluatorId === evaluator.uniqueId);
                          const completedCount = evaluatorResults.filter(r => r.grade).length;
                          const totalCount = evaluatorResults.length;
                          const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                          
                          return (
                            <div key={evaluator.uniqueId} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="flex flex-col">
                                  <div className="font-medium">{evaluator.name}</div>
                                  <div className="text-sm text-muted-foreground">{evaluator.uniqueId}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-sm font-medium">{completedCount}/{totalCount}</div>
                                  <div className="text-xs text-muted-foreground">완료/전체</div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Progress value={completionRate} className="w-20" />
                                  <span className="text-sm">{completionRate.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
            );
        case 'all-results':
             return (
                 <div className="space-y-4">
                    <Card>
                      <Collapsible open={isPayoutChartOpen} onOpenChange={setIsPayoutChartOpen}>
                        <CardHeader>
                            <CardTitle>성과급 분포</CardTitle>
                            <CardDescription>평가그룹별 성과급 금액대 분포입니다.</CardDescription>
                        </CardHeader>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                              <AmountDistributionChart data={visibleResults} />
                          </CardContent>
                        </CollapsibleContent>
                         <CollapsibleTrigger asChild>
                            <div className="border-t w-full text-center p-2 text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded-b-lg">
                                <div className="flex items-center justify-center">
                                    {isPayoutChartOpen ? "숨기기" : "보기"}
                                    {isPayoutChartOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                                </div>
                            </div>
                        </CollapsibleTrigger>
                      </Collapsible>
                    </Card>
                     <Tabs defaultValue="전체" onValueChange={(val) => setActiveResultsTab(val as EvaluationGroupCategory)}>
                        <TabsList className="grid w-full grid-cols-4 mb-4">
                            {Object.keys(categorizedResults).map(category => (
                                <TabsTrigger key={category} value={category}>{category} ({categorizedResults[category as EvaluationGroupCategory].length})</TabsTrigger>
                            ))}
                        </TabsList>
                        
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex gap-2">
                                <Button onClick={() => setIsGradeDialogOpen(true)} variant="outline">
                                    <Settings2 className="mr-2 h-4 w-4" />
                                    평가등급 관리
                                </Button>
                                <Button onClick={handleDownloadExcel} variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    엑셀 다운로드
                                </Button>
                            </div>
                            <Button onClick={() => {
                                updateAndSaveChanges(results);
                                toast({ title: '저장 완료', description: '등급 및 기준금액이 성공적으로 저장되었습니다.' });
                            }} variant="default">
                                <Save className="mr-2 h-4 w-4" />
                                저장
                            </Button>
                        </div>
                        <div className="border rounded-lg overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('uniqueId')}>
                                <div className="flex items-center justify-center">ID{getSortIcon('uniqueId')}</div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('company')}>
                                <div className="flex items-center justify-center">회사{getSortIcon('company')}</div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('department')}>
                                <div className="flex items-center justify-center">소속부서{getSortIcon('department')}</div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('name')}>
                                <div className="flex items-center justify-center">이름{getSortIcon('name')}</div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('title')}>
                                <div className="flex items-center justify-center">직책{getSortIcon('title')}</div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('evaluationGroup')}>
                                <div className="flex items-center justify-center">구분{getSortIcon('evaluationGroup')}</div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('workRate')}>
                                <div className="flex items-center justify-center">근무율{getSortIcon('workRate')}</div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('score')}>
                                <div className="flex items-center justify-center">점수{getSortIcon('score')}</div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('grade')}>
                                <div className="flex items-center justify-center">등급{getSortIcon('grade')}</div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('baseAmount')}>
                                <div className="flex items-center justify-center">기준금액{getSortIcon('baseAmount')}</div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('finalAmount')}>
                                <div className="flex items-center justify-center">최종금액{getSortIcon('finalAmount')}</div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('evaluatorName')}>
                                <div className="flex items-center justify-center">평가자{getSortIcon('evaluatorName')}</div>
                            </TableHead>
                            <TableHead className="whitespace-nowrap min-w-[200px] text-center">비고</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedVisibleResults.map(r => (
                                <TableRow key={r.uniqueId}>
                                <TableCell className="py-1 px-2 whitespace-nowrap text-center">{r.uniqueId}</TableCell>
                                <TableCell className="py-1 px-2 whitespace-nowrap text-center">{r.company}</TableCell>
                                <TableCell className="py-1 px-2 whitespace-nowrap text-center">{r.department}</TableCell>
                                <TableCell className="py-1 px-2 font-medium whitespace-nowrap text-center">{r.name}</TableCell>
                                <TableCell className="py-1 px-2 whitespace-nowrap text-center">{r.title}</TableCell>
                                <TableCell className="py-1 px-2 whitespace-nowrap text-center">
                                  <EvaluationGroupIcon group={r.evaluationGroup} />
                                </TableCell>
                                <TableCell className="py-1 px-2 whitespace-nowrap text-center">{(r.workRate * 100).toFixed(1)}%</TableCell>
                                <TableCell className="py-1 px-2 whitespace-nowrap text-center">{r.score}</TableCell>
                                <TableCell className="py-1 px-2 whitespace-nowrap text-center">
                                    {r.grade || '-'}
                                </TableCell>
                                <TableCell className="py-1 px-2 whitespace-nowrap text-center">
                                    {formatCurrency(r.baseAmount)}
                                </TableCell>
                                <TableCell className="py-1 px-2 whitespace-nowrap text-right">{formatCurrency(r.finalAmount)}</TableCell>
                                <TableCell className="py-1 px-2 whitespace-nowrap text-center">{r.evaluatorName}</TableCell>
                                <TableCell className="py-1 px-2 whitespace-nowrap text-center">
                                    <Input
                                    defaultValue={r.memo || ''}
                                    onBlur={(e) => handleMemoChange(r.id, e.target.value)}
                                    className="w-full h-8"
                                    placeholder=''
                                    />
                                </TableCell>
                                </TableRow>
                            )
                            )}
                        </TableBody>
                        </Table>
                        </div>
                    </Tabs>
                </div>
             );
        case 'evaluator-view': {
            const selectedEvaluatorName = selectedEvaluatorId ? evaluatorsForView.find(s => s.uniqueId === selectedEvaluatorId)?.name : '';
            const triggerText = selectedEvaluatorId ? `${selectedEvaluatorName} (${selectedEvaluatorId})` : "평가자를 선택하세요";
            
            return (
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-center justify-between p-4">
                            <div>
                                <CardTitle>평가자별 조회</CardTitle>
                                <CardDescription>특정 평가자의 대시보드를 확인합니다.</CardDescription>
                            </div>
                            <Popover open={evaluatorViewPopoverOpen} onOpenChange={setEvaluatorViewPopoverOpen}>
                                <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={evaluatorViewPopoverOpen}
                                    className="w-full sm:w-[320px] justify-between mt-2 sm:mt-0"
                                >
                                    <span className="truncate">{triggerText}</span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[320px] p-0">
                                <Command>
                                    <CommandInput placeholder="평가자 검색..." />
                                    <CommandList>
                                    <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                                    <CommandGroup>
                                        {evaluatorsForView.map(stat => (
                                        <CommandItem
                                            key={stat.uniqueId}
                                            value={`${stat.name} ${stat.uniqueId}`}
                                            onSelect={() => {
                                                setSelectedEvaluatorId(stat.uniqueId);
                                                setEvaluatorViewPopoverOpen(false);
                                            }}
                                        >
                                            {stat.name} ({stat.uniqueId})
                                        </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                        </CardHeader>
                    </Card>

                    {selectedEvaluator ? (
                        <EvaluatorDashboard
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate} 
                            evaluatorUser={selectedEvaluator}
                            activeView='evaluation-input'
                            userMap={userMap}
                        />
                    ) : (
                        <Card className="flex items-center justify-center h-64">
                          <p className="text-center text-muted-foreground">
                            평가자를 선택하면 해당 평가자의 대시보드가 여기에 표시됩니다.
                          </p>
                        </Card>
                    )}
                </div>
            );
        }
        case 'file-upload':
            return <ManageData results={initialResults} selectedDate={selectedDate} />;
        case 'evaluator-management':
            return <EvaluatorManagement />;
        case 'user-role-management':
            return <UserRoleManagement />;
        case 'consistency-check':
            return <ConsistencyValidator results={initialResults} gradingScale={gradingScale} selectedDate={selectedDate} />;
        case 'work-rate-view': {
            const usersForWorkRate = Array.from(userMap.values()).filter(u => u.uniqueId !== 'admin');
            return <WorkRateManagement 
              results={usersForWorkRate} 
              workRateInputs={workRateInputs} 
              selectedDate={selectedDate} 
              holidays={holidays} 
              setHolidays={setHolidays} 
              attendanceTypes={attendanceTypes} 
              setAttendanceTypes={setAttendanceTypes}
              gradingScale={gradingScale}
              handleResultsUpdate={updateAndSaveChanges}
              addNotification={addNotification}
            />;
        }
        case 'shortened-work-details':
            return <WorkRateDetails 
              type="shortenedWork" 
              data={Array.from(userMap.values())} 
              selectedDate={selectedDate} 
              attendanceTypes={attendanceTypes} 
              workRateInputs={workRateInputs}
              allEmployees={initialResults}
              onDataChange={() => {}} // Admin view에서는 데이터 변경 불가
            />;
        case 'daily-attendance-details':
            return <WorkRateDetails 
              type="dailyAttendance" 
              data={Array.from(userMap.values())} 
              selectedDate={selectedDate} 
              attendanceTypes={attendanceTypes} 
              workRateInputs={workRateInputs}
              allEmployees={initialResults}
              onDataChange={() => {}} // Admin view에서는 데이터 변경 불가
            />;
        case 'approvals': {
            const sortedApprovals = [...approvals].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return (
              <Card>
                <CardHeader>
                  <CardTitle>결재함</CardTitle>
                  <CardDescription>최근 결재 내역입니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedApprovals.length > 0 ? (
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead className="text-center">요청일</TableHead>
                          <TableHead className="text-center">대상자 (ID)</TableHead>
                          <TableHead className="text-center">현업 결재자</TableHead>
                          <TableHead className="text-center">요청내용</TableHead>
                          <TableHead className="text-center">현업 결재</TableHead>
                          <TableHead className="text-center">인사부 결재</TableHead>
                          <TableHead className="text-center">현업 승인일</TableHead>
                          <TableHead className="text-center">최종 승인일</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {sortedApprovals.map(approval => {
                            const teamApprover = userMap.get(approval.approverTeamId);
                            return (
                            <TableRow key={approval.id}>
                              <TableCell className="text-center text-muted-foreground">{formatTimestamp(approval.date)}</TableCell>
                              <TableCell className="text-center">{`${approval.payload.data.name} (${approval.payload.data.uniqueId})`}</TableCell>
                              <TableCell className="text-center">{teamApprover ? `${teamApprover.name} (${teamApprover.uniqueId})` : '미지정'}</TableCell>
                              <TableCell className="text-center">
                                 <Button variant="link" className="underline text-foreground" onClick={() => handleApprovalModal(approval)}>
                                  {approval.payload.dataType === 'shortenedWorkHours' ? '단축근로' : '일근태'} 데이터 {approval.payload.action === 'add' ? '추가' : '변경'}
                                 </Button>
                              </TableCell>
                              <TableCell className="text-center"><StatusBadge status={approval.status} /></TableCell>
                              <TableCell className="text-center"><StatusBadge status={approval.statusHR} /></TableCell>
                              <TableCell className="text-center text-muted-foreground">{formatTimestampShort(approval.approvedAtTeam)}</TableCell>
                              <TableCell className="text-center text-muted-foreground">{formatTimestampShort(approval.approvedAtHR)}</TableCell>
                            </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center h-40 text-center">
                        <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">새로운 결재내역이 없습니다.</p>
                   </div>
                  )}
                </CardContent>
              </Card>
            )
        }
        case 'notifications':
             return (
                <AdminNotifications notifications={notifications} deleteNotification={deleteNotification} />
            )
        default:
            return <div>선택된 뷰가 없습니다.</div>
    }
  }

  return (
    <div className="space-y-4">
      {renderContent()}
       <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>알림 상세</DialogTitle>
          </DialogHeader>
          {/* The original code had a DialogContent for notification details, but the new_code removed it.
              Assuming the intent was to remove the notification detail dialog as it's not directly related
              to the admin dashboard content. */}
        </DialogContent>
      </Dialog>
      <Dialog open={approvalDetailModalOpen} onOpenChange={setApprovalDetailModalOpen}>
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>결재 상세 정보</DialogTitle>
            </DialogHeader>
            {selectedApproval && (
                <div className="space-y-4">
                    <div className='space-y-1 text-sm text-left'>
                        <p><strong>요청자:</strong> {selectedApproval.requesterName} ({selectedApproval.requesterId})</p>
                        <p><strong>요청일시:</strong> {formatTimestamp(selectedApproval.date)}</p>
                        <p><strong>요청내용:</strong> {selectedApproval.payload.dataType === 'shortenedWorkHours' ? '단축근로' : '일근태'} 데이터 {selectedApproval.payload.action === 'add' ? '추가' : '변경'}</p>
                    </div>
                    <Separator/>
                    <div className="rounded-md border bg-muted p-4">
                        {renderApprovalData(selectedApproval)}
                    </div>
                    {selectedApproval.statusHR === '반려' && selectedApproval.rejectionReason && (
                        <div>
                            <Label htmlFor="rejectionReason" className="text-destructive mb-1 block">인사부 반려 사유</Label>
                            <p className="text-sm text-destructive p-2 border border-destructive rounded-md">{selectedApproval.rejectionReason}</p>
                        </div>
                    )}
                    {selectedApproval.status === '반려' && selectedApproval.rejectionReason && (
                        <div>
                            <Label htmlFor="rejectionReason" className="text-destructive mb-1 block">현업 반려 사유</Label>
                            <p className="text-sm text-destructive p-2 border border-destructive rounded-md">{selectedApproval.rejectionReason}</p>
                        </div>
                    )}
                    {(selectedApproval.statusHR === '결재중') && (
                         <div>
                            <Label htmlFor="rejectionReason" className="mb-1 block">반려 사유 (반려 시 필수)</Label>
                            <Textarea id="rejectionReason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                        </div>
                    )}
                </div>
            )}
            <DialogFooter className="sm:justify-between items-center pt-2">
                 <div className="text-sm text-muted-foreground">
                    {teamApproverInfo && <p>현업 결재자: <span className="font-semibold text-foreground">{teamApproverInfo}</span></p>}
                </div>
                {selectedApproval && selectedApproval.statusHR === '결재중' ? (
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={() => handleApprovalDecision('rejected')}>반려</Button>
                    <Button onClick={() => handleApprovalDecision('approved')}>승인</Button>
                  </div>
                ) : (
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => setApprovalDetailModalOpen(false)}>닫기</Button>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>평가등급 관리</DialogTitle>
            <DialogDescription>평가 등급, 점수, 지급률을 관리합니다.</DialogDescription>
          </DialogHeader>
          <GradeManagement gradingScale={gradingScale} setGradingScale={setGradingScale} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
