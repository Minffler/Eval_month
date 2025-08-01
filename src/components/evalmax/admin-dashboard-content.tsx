'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileCheck, Bot, Upload, LayoutDashboard, Settings, Download, Bell, ArrowUpDown, ArrowUp, ArrowDown, Eye, ClipboardX, ChevronUp, ChevronDown, CheckCircle2, ChevronsUpDown, Save, X, ThumbsUp, ThumbsDown, Inbox, FileText, AlertTriangle, UserCog, Settings2, Lock, Unlock, TrendingUp, BarChart3, CheckCircle, CheckSquare, AlertTriangle as AlertTriangleIcon, CheckCircle2 as CheckCircle2Icon, Percent } from 'lucide-react';
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
import MyPerformanceReview from './my-performance-review';
import { useEvaluation } from '@/contexts/evaluation-context';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';
import { Badge } from '../ui/badge';
import { ApprovalList } from './approval-list';
import { ApprovalDetailDialog } from './approval-detail-dialog';
import { StatusBadge } from './status-badge';

// 슬롯머신 애니메이션 컴포넌트
const SlotMachineNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 2000 }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    setIsAnimating(true);
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 이징 함수 (부드러운 감속)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOut);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  return (
    <span className={isAnimating ? 'animate-pulse' : ''}>
      {value > 0 ? `${formatCurrency(displayValue)}원` : '- 원'}
    </span>
  );
};

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
  totalAssigned: number;
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
  const { user } = useAuth();
  const { deleteApproval, resubmitApproval, handleApprovalAction } = useNotifications();
  const { setEvaluations, handleEmployeeUpload, handleApplyApproval } = useEvaluation();
  const [results, setResults] = React.useState<EvaluationResult[]>(initialResults);
  const [activeResultsTab, setActiveResultsTab] = React.useState<EvaluationGroupCategory>('전체');
  const [selectedEvaluators, setSelectedEvaluators] = React.useState<Set<string>>(new Set());
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = React.useState(false);
  const [notificationMessage, setNotificationMessage] = React.useState('');
  const [isImportantNotification, setIsImportantNotification] = React.useState(false);
  const [notificationTemplates, setNotificationTemplates] = React.useState<string[]>([]);
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);
  const [approvalDetailModalOpen, setApprovalDetailModalOpen] = React.useState(false);
  const [selectedApproval, setSelectedApproval] = React.useState<Approval | null>(null);
  const [evaluatorStatsSortConfig, setEvaluatorStatsSortConfig] = React.useState<EvaluatorStatsSortConfig>({ key: 'rate', direction: 'ascending' });
  const [selectedEvaluatorId, setSelectedEvaluatorId] = React.useState<string>('');
  const [isDistributionChartOpen, setIsDistributionChartOpen] = React.useState(true);
  const [isPayoutChartOpen, setIsPayoutChartOpen] = React.useState(false);
  const [dashboardFilter, setDashboardFilter] = React.useState('전체');
  const [evaluatorViewPopoverOpen, setEvaluatorViewPopoverOpen] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [isGradeDialogOpen, setIsGradeDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'evaluator' | 'employee'>('evaluator');
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>('');
  const [employeeViewPopoverOpen, setEmployeeViewPopoverOpen] = React.useState(false);

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
    // selectedEvaluators 초기화 제거 - 사용자가 선택한 상태를 유지
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
    const statsByUniqueId: Record<string, { total: number; completed: number; evaluatorName: string; totalAssigned: number; }> = {};
    const monthlyEvaluatorIds = Array.from(new Set(initialResults.map(r => r.evaluatorId).filter(Boolean)));
    
    // 실제 존재하는 평가자만 필터링
    const validEvaluatorIds = monthlyEvaluatorIds.filter(evaluatorId => {
      const evaluatorInfo = userMap.get(evaluatorId);
      const isValid = evaluatorInfo && evaluatorInfo.roles && evaluatorInfo.roles.includes('evaluator');
      return isValid;
    });
    
    validEvaluatorIds.forEach(evaluatorId => {
        if (evaluatorId) {
            const evaluatorInfo = userMap.get(evaluatorId);
            statsByUniqueId[evaluatorId] = { 
                total: 0, 
                completed: 0, 
                evaluatorName: evaluatorInfo?.name || `미지정 (${evaluatorId})`,
                totalAssigned: 0
            };
        }
    });

    initialResults.forEach(r => {
      if (!r.evaluatorId || !statsByUniqueId[r.evaluatorId]) return;
      
      // 담당인원 계산 (A, B, C 모두 포함)
      statsByUniqueId[r.evaluatorId].totalAssigned++;
      
      // 평가 대상 계산 (A, B만 포함, C는 제외)
      if (r.evaluationGroup !== 'C. 미평가') {
      statsByUniqueId[r.evaluatorId].total++;
      if (r.grade) {
        statsByUniqueId[r.evaluatorId].completed++;
        }
      }
    });

    return Object.entries(statsByUniqueId).map(([id, data]) => ({
      evaluatorUniqueId: id,
      evaluatorName: data.evaluatorName,
      total: data.total,
      completed: data.completed,
      pending: data.total - data.completed,
      rate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
      totalAssigned: data.totalAssigned,
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
          title: '평가 진행률 알림',
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
    setResults(updatedResults);
    const key = `${selectedDate.year}-${selectedDate.month}`;
    
    // 근무율이 업데이트된 경우 employees 데이터도 업데이트
    const hasWorkRateUpdate = updatedResults.some(result => {
      const originalResult = initialResults.find(r => r.id === result.id);
      return originalResult && Math.abs(result.workRate - originalResult.workRate) > 0.001;
    });
    
    if (hasWorkRateUpdate) {
      
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
      
      handleEmployeeUpload(selectedDate.year, selectedDate.month, currentEmployees);
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

    // handleApprovalDecision 함수 제거 - useApproval 훅에서 처리
    

    
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
                {[...commonFields, ...typeSpecificFields].map((field, index) => (
                     <div key={`${field.label}-${index}`} className="grid grid-cols-4 items-center">
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
                  <Card>
                    <Collapsible open={isDistributionChartOpen} onOpenChange={setIsDistributionChartOpen}>
                      <CardHeader>
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
                        <CardContent className="pt-0">
                          <GradeHistogram data={overallGradeDistribution} gradingScale={gradingScale} highlightAll={true} />
                        </CardContent>
                      </CollapsibleContent>
                       <CollapsibleTrigger asChild>
                            <div className="border-t w-full text-center p-2 text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded-b-lg">
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
                      <CardTitle>평가 진행 현황</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleSelectIncompleteEvaluators}
                          size="sm"
                        >
                          <CheckSquare className="mr-2 h-4 w-4" />
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
                      {/* 평가 진행 현황 (위) */}
                      <div className="mb-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center justify-center gap-3 p-4 bg-[hsl(30,30%,96%)] rounded-lg">
                            <AlertTriangleIcon className="h-6 w-6 text-[#6a625d]" />
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground">{initialResults.filter(r => !r.grade && r.evaluationGroup !== 'C. 미평가').length}</div>
                              <div className="text-sm text-[#6a625d]">미완료</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-3 p-4 bg-[hsl(30,30%,96%)] rounded-lg">
                            <CheckCircle2Icon className="h-6 w-6 text-[#6a625d]" />
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground">{initialResults.filter(r => r.grade && r.evaluationGroup !== 'C. 미평가').length}/{initialResults.filter(r => r.evaluationGroup !== 'C. 미평가').length}</div>
                              <div className="text-sm text-[#6a625d]">완료/전체</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-3 p-4 bg-[hsl(30,30%,96%)] rounded-lg">
                            <Percent className="h-6 w-6 text-[#6a625d]" />
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground">
                                {(() => {
                                  const evaluationTargets = initialResults.filter(r => r.evaluationGroup !== 'C. 미평가');
                                  const completed = evaluationTargets.filter(r => r.grade).length;
                                  return evaluationTargets.length > 0 ? ((completed / evaluationTargets.length) * 100).toFixed(1) : 0;
                                })()}%
                              </div>
                              <div className="text-sm text-[#6a625d]">평가 완료율</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 평가자별 현황 (아래) */}
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
                              <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestEvaluatorStatsSort('evaluatorName')}>
                                <div className="flex items-center justify-center">평가자 (ID){getEvaluatorStatsSortIcon('evaluatorName')}</div>
                              </TableHead>
                              <TableHead className="whitespace-nowrap text-center cursor-pointer" onClick={() => requestEvaluatorStatsSort('totalAssigned')}>
                                <div className="flex items-center justify-center">담당인원{getEvaluatorStatsSortIcon('totalAssigned')}</div>
                              </TableHead>
                              <TableHead className="whitespace-nowrap text-center cursor-pointer" onClick={() => requestEvaluatorStatsSort('pending')}>
                                <div className="flex items-center justify-center">미입력{getEvaluatorStatsSortIcon('pending')}</div>
                              </TableHead>
                              <TableHead className="whitespace-nowrap text-center cursor-pointer min-w-[200px] sm:min-w-[250px] md:min-w-[300px]" onClick={() => requestEvaluatorStatsSort('completed')}>
                                <div className="flex items-center justify-center">평가현황{getEvaluatorStatsSortIcon('completed')}</div>
                              </TableHead>
                              <TableHead className="whitespace-nowrap text-center">A. 정규평가</TableHead>
                              <TableHead className="whitespace-nowrap text-center">B. 별도평가</TableHead>
                              <TableHead className="whitespace-nowrap text-center">C. 미평가</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedEvaluatorStats.map(stat => {
                              // 평가 그룹별 통계 계산
                              const evaluatorResults = initialResults.filter(r => r.evaluatorId === stat.evaluatorUniqueId);
                              const regularEvaluation = evaluatorResults.filter(r => r.evaluationGroup === 'A. 정규평가');
                              const separateEvaluation = evaluatorResults.filter(r => r.evaluationGroup === 'B. 별도평가');
                              const noEvaluation = evaluatorResults.filter(r => r.evaluationGroup === 'C. 미평가');
                              
                              // 평가현황 계산 (C.미평가는 항상 완료된 것으로 카운트)
                              const totalForProgress = stat.total + noEvaluation.length;
                              const completedForProgress = stat.completed + noEvaluation.length;
                              const rateForProgress = totalForProgress > 0 ? (completedForProgress / totalForProgress) * 100 : 0;
                              
                              return (
                              <TableRow key={stat.evaluatorUniqueId} className="border-b border-gray-100">
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={selectedEvaluators.has(stat.evaluatorUniqueId)}
                                    onCheckedChange={(checked) => handleSelectEvaluator(stat.evaluatorUniqueId, Boolean(checked))}
                                    aria-label={`${stat.evaluatorName} 선택`}
                                  />
                                </TableCell>
                                                                  <TableCell className="font-medium whitespace-nowrap text-center">{stat.evaluatorName} ({stat.evaluatorUniqueId})</TableCell>
                                <TableCell className="text-center whitespace-nowrap">{stat.totalAssigned}</TableCell>
                                <TableCell className={cn("text-center whitespace-nowrap", stat.pending > 0 && "text-orange-600")}>{stat.pending || '-'}</TableCell>
                                <TableCell className="text-center whitespace-nowrap min-w-[200px] sm:min-w-[250px] md:min-w-[300px]">
                                    <div className="flex items-center justify-end gap-2 w-full">
                                    <span className="text-xs text-gray-500 min-w-[50px] text-right">{completedForProgress}/{totalForProgress}</span>
                                      <div className="flex-1 flex justify-center">
                                        <Progress
                                        value={rateForProgress}
                                        indicatorClassName={cn(rateForProgress < 100 ? "bg-orange-500" : "bg-orange-200")}
                                        className="w-full max-w-[180px] sm:max-w-[220px] md:max-w-[260px] h-2"
                                        />
                                      </div>
                                    <span className={cn("text-xs font-bold min-w-[45px] text-left", rateForProgress < 100 ? "text-orange-600" : "text-gray-500")}>{rateForProgress.toFixed(1)}%</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center whitespace-nowrap">{regularEvaluation.filter(r => r.grade).length}/{regularEvaluation.length}</TableCell>
                                  <TableCell className="text-center whitespace-nowrap">{separateEvaluation.filter(r => r.grade).length}/{separateEvaluation.length}</TableCell>
                                  <TableCell className="text-center whitespace-nowrap">{noEvaluation.length}</TableCell>
                              </TableRow>
                              );
                            })}
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




                </div>
            );
        case 'all-results':
             return (
                 <div className="space-y-4">
                    <Card>
                      <Collapsible open={isPayoutChartOpen} onOpenChange={setIsPayoutChartOpen}>
                        <CardHeader>
                            <CardTitle>{selectedDate.year}년 {selectedDate.month}월 성과급 분포</CardTitle>
                            <CardDescription>평가그룹별 성과급 금액대 분포입니다.</CardDescription>
                        </CardHeader>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            {/* 성과급 요약 정보와 차트를 좌우로 배치 */}
                            {(() => {
                              const validResults = visibleResults.filter(r => r.finalAmount > 0);
                              const averageAmount = validResults.length > 0 
                                ? validResults.reduce((acc, curr) => acc + curr.finalAmount, 0) / validResults.length 
                                : 0;
                              const totalAmount = visibleResults.reduce((acc, curr) => acc + curr.finalAmount, 0);
                              
                              return (
                                <div className="flex items-center gap-2">
                                  {/* 좌측: 성과급 요약 정보 (음영 적용) */}
                                  <div className="relative p-4 rounded-lg bg-muted/50 overflow-hidden min-w-[200px]">
                                    <div className="text-center">
                                      <div className="mb-3">
                                        <p className="text-sm text-muted-foreground">평균 성과급 금액</p>
                                        <p className="font-semibold text-[135%]">
                                          {validResults.length > 0 ? `${formatCurrency(Math.round(averageAmount))}원` : '- 원'}
                                        </p>
                                      </div>
                                                                              <div>
                                          <p className="text-sm text-muted-foreground">총 성과급 지급액</p>
                                          <p className="font-semibold text-primary text-[135%]">
                                            <SlotMachineNumber value={totalAmount} duration={2500} />
                                          </p>
                                        </div>
                                    </div>
                                  </div>
                                  
                                  {/* 우측: 성과급 분포 차트 (음영 없음) */}
                                  <div className="flex-1">
                                    <AmountDistributionChart data={visibleResults} />
                                  </div>
                                </div>
                              );
                            })()}
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

                        </div>
                        <div className="border rounded-lg overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow style={{ backgroundColor: 'hsl(30, 30%, 96%)' }}>
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
                            {sortedVisibleResults.map((r, index) => (
                                <TableRow key={`${r.id}-${index}`}>
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
                                    <div className="w-full h-8 px-3 py-1 text-sm text-muted-foreground">
                                        {r.memo || '-'}
                                    </div>
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
        case 'individual-inquiry': {
            // 모든 직원 목록 (관리자 제외)
            const allEmployees = Array.from(userMap.values()).filter(u => u.uniqueId !== 'admin');
            
            const selectedEmployee = selectedEmployeeId ? allEmployees.find(e => e.uniqueId === selectedEmployeeId) : null;
            const selectedEvaluatorName = selectedEvaluatorId ? evaluatorsForView.find(s => s.uniqueId === selectedEvaluatorId)?.name : '';
            const selectedEmployeeName = selectedEmployeeId ? allEmployees.find(e => e.uniqueId === selectedEmployeeId)?.name : '';
            
            const evaluatorTriggerText = selectedEvaluatorId ? `${selectedEvaluatorName} (${selectedEvaluatorId})` : "평가자를 선택하세요";
            const employeeTriggerText = selectedEmployeeId ? `${selectedEmployeeName} (${selectedEmployeeId})` : "피평가자를 선택하세요";
            
            return (
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-center justify-between p-4">
                            <div>
                                <CardTitle>개인별 조회</CardTitle>
                                <CardDescription>평가자 또는 피평가자를 선택하여 대시보드 및 상세 데이터를 조회합니다.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'evaluator' | 'employee')} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="evaluator">평가자별 조회</TabsTrigger>
                                    <TabsTrigger value="employee">피평가자별 조회</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="evaluator" className="space-y-4">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <Label className="text-sm font-medium">평가자별 조회</Label>
                                            <Popover open={evaluatorViewPopoverOpen} onOpenChange={setEvaluatorViewPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={evaluatorViewPopoverOpen}
                                                    className="w-full justify-between mt-2"
                                                >
                                                    <span className="truncate">{evaluatorTriggerText}</span>
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
                                        </div>
                                    </div>
                                    
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
                                </TabsContent>
                                
                                <TabsContent value="employee" className="space-y-4">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <Label className="text-sm font-medium">피평가자별 조회</Label>
                                            <Popover open={employeeViewPopoverOpen} onOpenChange={setEmployeeViewPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={employeeViewPopoverOpen}
                                                    className="w-full justify-between mt-2"
                                                >
                                                    <span className="truncate">{employeeTriggerText}</span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[320px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="피평가자 검색..." />
                                                    <CommandList>
                                                    <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                                                    <CommandGroup>
                                                        {allEmployees.map(employee => (
                                                        <CommandItem
                                                            key={employee.uniqueId}
                                                            value={`${employee.name} ${employee.uniqueId}`}
                                                            onSelect={() => {
                                                                setSelectedEmployeeId(employee.uniqueId);
                                                                setEmployeeViewPopoverOpen(false);
                                                            }}
                                                        >
                                                            {employee.name} ({employee.uniqueId})
                                                        </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                    
                                    {selectedEmployee ? (
                                        <div className="space-y-6">
                                            <MyPerformanceReview
                                                allResultsForYear={initialResults}
                                                allResultsForMonth={initialResults}
                                                selectedDate={selectedDate}
                                                gradingScale={gradingScale}
                                                selectedUserId={selectedEmployeeId}
                                            />
                                        </div>
                                    ) : (
                                        <Card className="flex items-center justify-center h-64">
                                          <p className="text-center text-muted-foreground">
                                            피평가자를 선택하면 성과 리뷰 및 상세 결과가 여기에 표시됩니다.
                                          </p>
                                        </Card>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
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
                          <TableHead className="text-center">요청내용</TableHead>
                          <TableHead className="text-center">현업 결재자</TableHead>
                          <TableHead className="text-center">현업 결재</TableHead>
                          <TableHead className="text-center">인사부 결재</TableHead>
                          <TableHead className="text-center">현업 승인일</TableHead>
                          <TableHead className="text-center">최종 승인일</TableHead>
                          <TableHead className="text-center">반영</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {sortedApprovals.map(approval => {
                            const teamApprover = userMap.get(approval.approverTeamId);
                            return (
                            <TableRow key={approval.id}>
                              <TableCell className="text-center text-muted-foreground">{formatTimestamp(approval.date)}</TableCell>
                              <TableCell className="text-center">{`${approval.payload.data.name} (${approval.payload.data.uniqueId})`}</TableCell>
                              <TableCell className="text-center">
                                 <Button variant="link" className="underline text-foreground" onClick={() => handleApprovalModal(approval)}>
                                  {approval.payload.dataType === 'shortenedWorkHours' ? '단축근로' : '일근태'} 데이터 {approval.payload.action === 'add' ? '추가' : '변경'}
                                 </Button>
                              </TableCell>
                              <TableCell className="text-center">{teamApprover ? `${teamApprover.name} (${teamApprover.uniqueId})` : '미지정'}</TableCell>
                              <TableCell className="text-center"><StatusBadge status={approval.status} className="scale-90" /></TableCell>
                              <TableCell className="text-center"><StatusBadge status={approval.statusHR} className="scale-90" /></TableCell>
                              <TableCell className="text-center text-muted-foreground">{formatTimestampShort(approval.approvedAtTeam || null)}</TableCell>
                              <TableCell className="text-center text-muted-foreground">{formatTimestampShort(approval.approvedAtHR || null)}</TableCell>
                              <TableCell className="text-center">
                                {approval.statusHR === '최종승인' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApplyApproval(approval)}
                                    className="flex items-center gap-1 text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                    반영
                                  </Button>
                                )}
                              </TableCell>
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
      <ApprovalDetailDialog
        approval={selectedApproval}
        isOpen={approvalDetailModalOpen}
        onClose={() => {
          setApprovalDetailModalOpen(false);
          setSelectedApproval(null);
        }}
        onApprovalAction={handleApprovalAction}
        onDeleteApproval={deleteApproval}
        onResubmitApproval={resubmitApproval}
        userRole="admin"
        currentUserId={user?.uniqueId || ''}
        userMap={userMap}
      />
       <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>알림 메시지 설정</DialogTitle>
            <DialogDescription>
              평가자에게 보낼 메시지를 입력하세요. 아래 플레이스홀더를 사용하면 해당 정보로 자동 변경됩니다.
            </DialogDescription>
          </DialogHeader>
          
          {/* 플레이스홀더 설명 */}
          <div className="space-y-2">
            <p className="text-sm font-medium">사용 가능한 플레이스홀더:</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground/80 space-y-1">
              <li><code className="bg-muted px-1 rounded-sm">_평가자이름_</code> - 평가자 이름</li>
              <li><code className="bg-muted px-1 rounded-sm">_평가년월_</code> - 현재 평가 년월</li>
              <li><code className="bg-muted px-1 rounded-sm">_%_</code> - 현재 진행률</li>
            </ul>
          </div>
          
          {/* 메시지 입력창 */}
          <div className="space-y-2">
            <Label htmlFor="notification-message">알림 메시지</Label>
            <Textarea
              id="notification-message"
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              className="h-32"
              placeholder="예: _평가자이름_님, _평가년월_ 평가 마감 3일 전입니다. (현재 진행률: _%_)"
            />
          </div>
          
          {/* 중요 알림 체크박스 */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="is-important" 
              checked={isImportantNotification} 
              onCheckedChange={(c) => setIsImportantNotification(Boolean(c))} 
            />
            <Label htmlFor="is-important" className="text-sm">
              [중요] 이 알림은 삭제할 수 없으며, 항상 상단에 고정됩니다.
            </Label>
          </div>
          
          {/* 템플릿 관리 */}
          {notificationTemplates.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">저장된 템플릿:</p>
              <div className="space-y-2">
                {notificationTemplates.map((template, index) => (
                  <div key={`${template}-${index}`} className="flex items-center justify-between p-2 border rounded-md">
                    <span className="text-sm flex-1">{template}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNotificationMessage(template)}
                      >
                        사용
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 템플릿 저장 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveTemplate}
              disabled={!notificationMessage.trim() || notificationTemplates.includes(notificationMessage)}
            >
              템플릿 저장
            </Button>
            <span className="text-xs text-muted-foreground">
              현재 메시지를 템플릿으로 저장합니다 (최대 5개)
            </span>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotificationDialogOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleSendNotifications}
              disabled={!notificationMessage.trim() || selectedEvaluators.size === 0}
            >
              발송 ({selectedEvaluators.size}명)
            </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>평가등급 관리</DialogTitle>
            <DialogDescription>평가 등급, 점수, 지급률을 관리합니다.</DialogDescription>
          </DialogHeader>
          <GradeManagement 
            gradingScale={gradingScale} 
            setGradingScale={setGradingScale}
            attendanceTypes={attendanceTypes}
            setAttendanceTypes={setAttendanceTypes}
            holidays={holidays}
            setHolidays={setHolidays}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
