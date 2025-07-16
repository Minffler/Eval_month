'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import Header from '@/components/evalmax/header';
import AdminDashboard from '@/components/evalmax/admin-dashboard';
import EvaluatorDashboard from '@/components/evalmax/evaluator-dashboard';
import EmployeeDashboard from '@/components/evalmax/employee-dashboard';
import PersonalSettings from '@/components/evalmax/personal-settings';
import type { Employee, Evaluation, EvaluationResult, Grade, GradeInfo, User, EvaluatorView, EvaluationUploadData, WorkRateInputs, AttendanceType, Holiday, ShortenedWorkHourRecord, DailyAttendanceRecord, EmployeeView, Approval, AppNotification, ShortenedWorkType, Role } from '@/lib/types';
import { mockEmployees as initialMockEmployees, gradingScale as initialGradingScale, calculateFinalAmount, mockEvaluations as initialMockEvaluations, getDetailedGroup1, initialAttendanceTypes, mockUsers as initialMockUsers } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar, type NavItem } from '@/components/evalmax/sidebar';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileCheck,
  Eye,
  Database,
  Upload,
  Users,
  Settings,
  Bot,
  Edit2,
  ListChecks,
  Hourglass,
  Gauge,
  ListTodo,
  CalendarDays,
  CalendarClock,
  Settings2,
  Inbox,
  UserCog,
  Medal,
  BarChart3
} from 'lucide-react';
import { calculateWorkRateDetails } from '@/lib/work-rate-calculator';
import { useNotifications } from '@/contexts/notification-context';
import { useToast } from '@/hooks/use-toast';

const adminNavItems: NavItem[] = [
  {
    id: 'evaluation-management',
    label: '평가 관리',
    icon: FileCheck,
    children: [
      { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
      { id: 'all-results', label: '등급/금액 상세', icon: ListChecks },
      { id: 'evaluator-view', label: '평가자별 조회', icon: Eye },
      { id: 'consistency-check', label: '편향 검토 (AI)', icon: Bot },
      { id: 'evaluator-management', label: '평가자 배정', icon: Users },
    ],
  },
  {
    id: 'work-rate-management',
    label: '근무율 관리',
    icon: Hourglass,
    children: [
      { id: 'work-rate-view', label: '근무율 조회/반영', icon: Gauge },
      { id: 'shortened-work-details', label: '단축근로 상세', icon: CalendarClock },
      { id: 'daily-attendance-details', label: '일근태 상세', icon: CalendarDays },
    ]
  },
  {
    id: 'system-management',
    label: '시스템 관리',
    icon: Settings,
    children: [
      { id: 'file-upload', label: '파일 업로드', icon: Upload },
      { id: 'user-role-management', label: '사용자 및 권한 관리', icon: UserCog },
    ],
  },
];

const evaluatorNavItems: NavItem[] = [
  {
    id: 'evaluation',
    label: '평가입력/조회',
    icon: FileCheck,
    children: [
      { id: 'evaluation-input', label: '평가 입력', icon: Edit2 },
      { id: 'all-results', label: '결과 상세', icon: ListChecks },
    ],
  },
  {
    id: 'management',
    label: '평가관리',
    icon: Settings,
    children: [
      { id: 'assignment-management', label: '담당 소속 관리', icon: Users },
    ],
  },
  {
    id: 'work-rate-management',
    label: '근무율 관리',
    icon: Hourglass,
    children: [
      { id: 'work-rate-view', label: '근무율 조회', icon: Gauge },
      { id: 'shortened-work-details', label: '단축근로 상세', icon: CalendarClock },
      { id: 'daily-attendance-details', label: '일근태 상세', icon: CalendarDays },
    ]
  },
];

const employeeNavItems: NavItem[] = [
  {
    id: 'evaluation-management',
    label: '평가 관리',
    icon: FileCheck,
    children: [
        { id: 'my-review', label: '내 성과 리뷰', icon: Medal },
        { id: 'evaluation-details', label: '평가 상세 조회', icon: BarChart3 },
    ],
  },
  {
    id: 'work-rate-management',
    label: '근무율 관리',
    icon: Hourglass,
    children: [
      { id: 'my-work-rate', label: '근무율 조회', icon: Gauge },
      { id: 'my-shortened-work', label: '단축근로 상세', icon: CalendarClock },
      { id: 'my-daily-attendance', label: '일근태 상세', icon: CalendarDays },
    ],
  },
];


const getInitialDate = () => {
    const today = new Date();
    // A month is available only after it has completely passed.
    // e.g., July's evaluation data is available from August 1st.
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    const year = lastMonthDate.getFullYear();
    const month = lastMonthDate.getMonth() + 1;

    return { year, month };
};

const getFromLocalStorage = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    localStorage.removeItem(key);
  }
  return defaultValue;
}

export default function Home() {
  const { user, users: allUsers, loading, logout, setUsers } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const {
      notifications,
      unreadNotificationCount,
      addNotification,
      deleteNotification,
      markNotificationsAsRead,
      approvals,
      unreadApprovalCount,
      addApproval,
      handleApprovalAction,
      markApprovalsAsRead
  } = useNotifications();
  
  const [employees, setEmployees] = React.useState<Record<string, Partial<Employee>[]>>(() => getFromLocalStorage('employees', { '2025-7': initialMockEmployees }));
  const [evaluations, setEvaluations] = React.useState<Record<string, Evaluation[]>>(() => getFromLocalStorage('evaluations', { '2025-7': initialMockEvaluations }));
  const [gradingScale, setGradingScale] = React.useState<Record<NonNullable<Grade>, GradeInfo>>(() => getFromLocalStorage('gradingScale', initialGradingScale));
  const [workRateInputs, setWorkRateInputs] = React.useState<Record<string, WorkRateInputs>>(() => getFromLocalStorage('workRateInputs', {}));
  const [attendanceTypes, setAttendanceTypes] = React.useState<AttendanceType[]>(() => getFromLocalStorage('attendanceTypes', initialAttendanceTypes));
  const [holidays, setHolidays] = React.useState<Holiday[]>(() => getFromLocalStorage('holidays', []));
  const [evaluationStatus, setEvaluationStatus] = React.useState<Record<string, 'open' | 'closed'>>(() => getFromLocalStorage('evaluationStatus', {}));

  React.useEffect(() => { localStorage.setItem('employees', JSON.stringify(employees)); }, [employees]);
  React.useEffect(() => { localStorage.setItem('evaluations', JSON.stringify(evaluations)); }, [evaluations]);
  React.useEffect(() => { localStorage.setItem('gradingScale', JSON.stringify(gradingScale)); }, [gradingScale]);
  React.useEffect(() => { localStorage.setItem('workRateInputs', JSON.stringify(workRateInputs)); }, [workRateInputs]);
  React.useEffect(() => { localStorage.setItem('attendanceTypes', JSON.stringify(attendanceTypes)); }, [attendanceTypes]);
  React.useEffect(() => { localStorage.setItem('holidays', JSON.stringify(holidays)); }, [holidays]);
  React.useEffect(() => { localStorage.setItem('evaluationStatus', JSON.stringify(evaluationStatus)); }, [evaluationStatus]);


  const [results, setResults] = React.useState<EvaluationResult[]>([]);
  const [selectedDate, setSelectedDate] = React.useState(getInitialDate);
  const [monthlyEvaluationTargets, setMonthlyEvaluationTargets] = React.useState<EvaluationResult[]>([]);

  const workRateDetails = React.useMemo(() => {
      return calculateWorkRateDetails(
          workRateInputs,
          attendanceTypes,
          holidays,
          selectedDate.year,
          selectedDate.month
      );
  }, [workRateInputs, attendanceTypes, holidays, selectedDate]);

  // State for admin view
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = React.useState(true);
  const [adminActiveView, setAdminActiveView] = React.useState('dashboard');

  // State for evaluator view
  const [isEvaluatorSidebarOpen, setIsEvaluatorSidebarOpen] = React.useState(true);
  const [evaluatorActiveView, setEvaluatorActiveView] = React.useState<EvaluatorView>('evaluation-input');

  // State for employee view
  const [isEmployeeSidebarOpen, setIsEmployeeSidebarOpen] = React.useState(true);
  const [employeeActiveView, setEmployeeActiveView] = React.useState<EmployeeView>('my-review');


  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const role = user ? allUsers.find(u => u.id === user.id)?.roles.find(r => r === (localStorage.getItem('role') || 'employee')) : 'employee';
  
  const handleUserAdd = (newEmployeeData: Partial<Employee>, roles: Role[]) => {
      if (!newEmployeeData.uniqueId) {
        toast({ variant: 'destructive', title: '오류', description: 'ID가 없습니다.' });
        return;
      }
      if (allUsers.some(u => u.uniqueId === newEmployeeData.uniqueId)) {
        toast({ variant: 'destructive', title: '오류', description: '이미 존재하는 ID입니다.' });
        return;
      }

      const newUser: User = {
        id: `user-${newEmployeeData.uniqueId}`,
        employeeId: `E${newEmployeeData.uniqueId}`,
        uniqueId: newEmployeeData.uniqueId,
        name: newEmployeeData.name || `사용자(${newEmployeeData.uniqueId})`,
        department: newEmployeeData.department || '미지정',
        title: newEmployeeData.title || '팀원',
        roles,
        avatar: `https://placehold.co/100x100.png?text=${(newEmployeeData.name || 'U').charAt(0)}`,
        password: '1',
        evaluatorId: newEmployeeData.evaluatorId || '',
      };
      setUsers(prev => [...prev, newUser]);
  };
  
  const handleUserUpdate = (userId: string, updatedData: Partial<User & { newUniqueId?: string }>) => {
    setUsers(prevUsers => {
        return prevUsers.map(u => {
            if (u.id === userId) {
                const finalUpdatedData = { ...updatedData };
                if (finalUpdatedData.newUniqueId) {
                    finalUpdatedData.uniqueId = finalUpdatedData.newUniqueId;
                    delete finalUpdatedData.newUniqueId;
                }
                return { ...u, ...finalUpdatedData };
            }
            return u;
        });
    });
  };

  const handleEmployeeUpload = (year: number, month: number, newEmployees: Employee[]) => {
    const key = `${year}-${month}`;

    newEmployees.forEach(emp => {
      const existingUser = allUsers.find(u => u.uniqueId === emp.uniqueId);
      const employeeDataForUser: Partial<User> = { name: emp.name, department: emp.department, title: emp.title, evaluatorId: emp.evaluatorId };

      if (!existingUser) {
        handleUserAdd({ ...emp, company: emp.company || 'N/A', position: emp.position || emp.title || '팀원', }, ['employee']);
      } else {
        handleUserUpdate(existingUser.id, employeeDataForUser);
      }

      if (emp.evaluatorId) {
        const evaluatorUser = allUsers.find(u => u.uniqueId === emp.evaluatorId);
        if(!evaluatorUser) {
            handleUserAdd({
                id: `user-${emp.evaluatorId}`,
                uniqueId: emp.evaluatorId,
                name: `평가자(${emp.evaluatorId})`,
                department: '미지정', title: '평가자', position: '평가자', company: 'N/A',
                growthLevel: '', workRate: 1.0, evaluatorId: '', baseAmount: 0,
            }, ['evaluator', 'employee']);
        }
      }
    });

    setEmployees(prev => ({...prev, [key]: newEmployees}));

    setEvaluations(prev => {
        const currentEvalsForMonth = prev[key] || [];
        const finalEvals = newEmployees.map(emp => {
            const existingEval = currentEvalsForMonth.find(e => e.employeeId === emp.id);
            return {
              id: `eval-${emp.id}-${year}-${month}`,
              employeeId: emp.id, year, month,
              grade: existingEval?.grade || null,
              memo: existingEval?.memo || emp.memo || '',
            };
        });
        return {...prev, [key]: finalEvals};
    });
  };

  const handleEvaluationUpload = (year: number, month: number, uploadedData: EvaluationUploadData[]) => {
    const key = `${year}-${month}`;
    
    uploadedData.forEach(uploadItem => {
        const { employeeId, evaluatorId, evaluatorName, ...empData } = uploadItem;
        const uniqueId = employeeId.replace('E','');

        const existingUser = allUsers.find(u => u.uniqueId === uniqueId);
        const userDataToUpdate: Partial<User> = {
            name: empData.name, department: empData.department, title: empData.title,
            evaluatorId: evaluatorId || (existingUser ? existingUser.evaluatorId : '')
        };

        if (!existingUser) {
            handleUserAdd({
                uniqueId: uniqueId, name: empData.name || `사용자(${uniqueId})`,
                department: empData.department || '미지정', title: empData.title || '팀원',
                position: empData.position || empData.title || '팀원', company: empData.company || 'N/A',
                growthLevel: empData.growthLevel || '', workRate: empData.workRate || 1.0,
                evaluatorId: evaluatorId || '', baseAmount: empData.baseAmount || 0,
            }, ['employee']);
        } else {
            handleUserUpdate(existingUser.id, userDataToUpdate);
        }

        if (evaluatorId) {
            const evaluatorUser = allUsers.find(u => u.uniqueId === evaluatorId);
            if (!evaluatorUser) {
                handleUserAdd({
                    uniqueId: evaluatorId, name: evaluatorName || `평가자(${evaluatorId})`,
                    department: '미지정', title: '평가자', position: '평가자', company: 'N/A',
                    growthLevel: '', workRate: 1.0, evaluatorId: '', baseAmount: 0,
                }, ['evaluator', 'employee']);
            } else if (evaluatorName && evaluatorUser.name !== evaluatorName) {
                handleUserUpdate(evaluatorUser.id, { name: evaluatorName });
            }
        }
    });

    setEmployees(prevEmps => {
        const newState = JSON.parse(JSON.stringify(prevEmps));
        const newEmpsForMonth = newState[key] ? [...newState[key]] : [];
        
        uploadedData.forEach(uploadItem => {
            const empIndex = newEmpsForMonth.findIndex((e: Employee) => e.id === uploadItem.employeeId);
            const dataToUpdate = {
                baseAmount: uploadItem.baseAmount, workRate: uploadItem.workRate,
            };
            if (empIndex > -1) Object.assign(newEmpsForMonth[empIndex], dataToUpdate);
            else newEmpsForMonth.push({ uniqueId: uploadItem.employeeId.replace('E',''), id: uploadItem.employeeId, ...dataToUpdate });
        });
        newState[key] = newEmpsForMonth;
        return newState;
    });

    setEvaluations(prevEvals => {
        const newState = JSON.parse(JSON.stringify(prevEvals));
        const newEvalsForMonth = newState[key] ? [...newState[key]] : [];
        
        uploadedData.forEach(uploadItem => {
            const evalIndex = newEvalsForMonth.findIndex((e: Evaluation) => e.employeeId === uploadItem.employeeId);
            const evalData = { grade: uploadItem.grade, memo: uploadItem.memo || '', };
            if (evalIndex > -1) Object.assign(newEvalsForMonth[evalIndex], evalData);
            else newEvalsForMonth.push({ id: `eval-${uploadItem.employeeId}-${year}-${month}`, employeeId: uploadItem.employeeId, year, month, ...evalData });
        });
        newState[key] = newEvalsForMonth;
        return newState;
    });
  };
  
  const handleWorkRateDataUpload = (year: number, month: number, type: keyof WorkRateInputs, newData: any[], isApproved: boolean) => {
      if (!isApproved) return;
      const key = `${year}-${month}`;
      setWorkRateInputs(prev => {
          const currentMonthInputs = prev[key] || { shortenedWorkHours: [], dailyAttendance: [], };
  
          let combinedData;
          if (type === 'shortenedWorkHours') {
              const existingKeys = new Set(currentMonthInputs.shortenedWorkHours.map((r: ShortenedWorkHourRecord) => `${r.uniqueId}|${r.startDate}|${r.endDate}`));
              const uniqueNewData = (newData as ShortenedWorkHourRecord[]).filter(r => !existingKeys.has(`${r.uniqueId}|${r.startDate}|${r.endDate}`));
              combinedData = [...currentMonthInputs.shortenedWorkHours, ...uniqueNewData];
          } else {
              const existingKeys = new Set(currentMonthInputs.dailyAttendance.map((r: DailyAttendanceRecord) => `${r.uniqueId}|${r.date}`));
              const uniqueNewData = (newData as DailyAttendanceRecord[]).filter(r => !existingKeys.has(`${r.uniqueId}|${r.date}`));
              combinedData = [...currentMonthInputs.dailyAttendance, ...uniqueNewData];
          }
  
          return { ...prev, [key]: { ...currentMonthInputs, [type]: combinedData, } };
      });
  
      if (type === 'dailyAttendance') {
          setAttendanceTypes(prevTypes => {
              const existingTypeNames = new Set(prevTypes.map(t => t.name));
              const newTypesFromData = new Set((newData as DailyAttendanceRecord[]).map(d => d.type).filter(t => !existingTypeNames.has(t)));
              if (newTypesFromData.size === 0) return prevTypes;
              
              const newTypesToAdd: AttendanceType[] = Array.from(newTypesFromData).map(typeName => ({
                  id: `att-${Date.now()}-${Math.random()}`, name: typeName as string, deductionDays: 0,
              }));
  
              return [...prevTypes, ...newTypesToAdd];
          });
      }
  };

  const handleClearWorkRateData = (year: number, month: number, type: keyof WorkRateInputs | ShortenedWorkType) => {
    const key = `${year}-${month}`;
    setWorkRateInputs(prev => {
        const currentMonthInputs = prev[key];
        if (!currentMonthInputs) return prev;
        const updatedMonthInputs = { ...currentMonthInputs };

        if (type === '임신' || type === '육아/돌봄') {
            updatedMonthInputs.shortenedWorkHours = (currentMonthInputs.shortenedWorkHours || []).filter(d => d.type !== type);
        } else if (type === 'dailyAttendance') {
            updatedMonthInputs.dailyAttendance = [];
        } else if (type === 'shortenedWorkHours') {
            updatedMonthInputs.shortenedWorkHours = [];
        }
        
        if (updatedMonthInputs.shortenedWorkHours.length === 0 && updatedMonthInputs.dailyAttendance.length === 0) {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        }

        return { ...prev, [key]: updatedMonthInputs };
    });
  };

  const handleEvaluatorAssignmentChange = (updatedUserId: string, newEvaluatorId: string) => {
     setUsers(prevUsers => {
          const newUsers = prevUsers.map(u => {
              if (u.id === updatedUserId) {
                  return { ...u, evaluatorId: newEvaluatorId };
              }
              return u;
          });
          return newUsers;
      });
  };

  const handleUserDelete = (userId: string) => {
    const userToDelete = allUsers.find(u => u.id === userId);
    if (!userToDelete) return;
    setUsers(prev => prev.filter(u => u.id !== userId));
    setEmployees(prev => {
        const newState = { ...prev };
        for (const key in newState) newState[key] = newState[key].filter(e => e.uniqueId !== userToDelete.uniqueId);
        return newState;
    });
  };

  const handleUsersDelete = (userIds: string[]) => {
    const usersToDelete = new Set(allUsers.filter(u => userIds.includes(u.id)).map(u => u.uniqueId));
    if (usersToDelete.size === 0) return;
    setUsers(prev => prev.filter(u => !userIds.includes(u.id)));
    setEmployees(prev => {
        const newState = { ...prev };
        for (const key in newState) newState[key] = newState[key].filter(e => e.uniqueId && !usersToDelete.has(e.uniqueId));
        return newState;
    });
  };

  const handleRolesChange = (userId: string, newRoles: Role[]) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: newRoles } : u));
  };

  const handleClearEmployeeData = (year: number, month: number) => {
    const key = `${year}-${month}`;
    setEmployees(prev => { const newState = { ...prev }; delete newState[key]; return newState; });
    setEvaluations(prev => { const newState = { ...prev }; delete newState[key]; return newState; });
  };

  const handleClearEvaluationData = (year: number, month: number) => {
    const key = `${year}-${month}`;
    setEvaluations(prev => {
        const currentEvalsForMonth = prev[key] || [];
        const resetEvals = currentEvalsForMonth.map(ev => ({ ...ev, grade: null, memo: '', }));
        return {...prev, [key]: resetEvals };
    });
  };

  const handleClearMyEvaluations = (year: number, month: number, evaluatorId: string) => {
    const key = `${year}-${month}`;
    if (!evaluatorId) return;

    const myEmployeeUniqueIds = new Set(allUsers.filter(u => u.evaluatorId === evaluatorId).map(u => u.uniqueId));

    setEvaluations(prev => {
        const updatedEvalsForMonth = (prev[key] || []).map(ev => {
            const empUniqueId = ev.employeeId.replace('E', '');
            if (myEmployeeUniqueIds.has(empUniqueId)) return { ...ev, grade: null, memo: '' };
            return ev;
        });
        return { ...prev, [key]: updatedEvalsForMonth };
    });
  };
  
  const onApprovalAction = (approval: Approval) => {
    if (approval.status === 'approved' && approval.type === 'workDataChange') {
      const { dataType, action, data } = approval.payload;
      const key = `${selectedDate.year}-${selectedDate.month}`;
      setWorkRateInputs(prev => {
        const updatedInputs = JSON.parse(JSON.stringify(prev));
        if (!updatedInputs[key]) updatedInputs[key] = { shortenedWorkHours: [], dailyAttendance: [] };
        let targetArray = updatedInputs[key][dataType];
        if (action === 'add') targetArray.push(data);
        else if (action === 'edit') {
            const index = targetArray.findIndex((item: any) => item.rowId === data.rowId);
            if (index > -1) targetArray[index] = data;
            else targetArray.push(data);
        }
        return updatedInputs;
      });
    }
    handleApprovalAction(approval);
  };

  const handleEvaluationStatusChange = (year: number, month: number, status: 'open' | 'closed') => {
    const key = `${year}-${month}`;
    setEvaluationStatus(prev => ({ ...prev, [key]: status }));

    if (status === 'closed') {
        const monthEmployees = results;
        const evaluatorIds = new Set(monthEmployees.map(e => e.evaluatorId).filter(Boolean));
        const employeeIds = new Set(monthEmployees.map(e => e.uniqueId));
        const message = `${year}년 ${month}월 평가가 최종 마감되었습니다.`;
        evaluatorIds.forEach(id => addNotification({ recipientId: id, message }));
        employeeIds.forEach(id => addNotification({ recipientId: id, message }));
    }
  };

  React.useEffect(() => {
    const getFullEvaluationResults = (): EvaluationResult[] => {
        const year = selectedDate.year;
        const month = selectedDate.month;
        const monthKey = `${year}-${month}`;
        
        const monthlyEmployees = employees[monthKey] || [];
        const monthlyEvaluations = evaluations[monthKey] || [];
        
        // Use a Map to ensure unique users based on uniqueId, preventing duplicates.
        const combinedUserMap = new Map<string, Partial<User & Employee>>();
        
        // Prioritize data from the main `allUsers` list
        allUsers.forEach(u => {
            if (u.uniqueId) {
                combinedUserMap.set(u.uniqueId, { ...u });
            }
        });
        
        // Override or add data from the monthly `employees` list
        monthlyEmployees.forEach(e => {
            if (e.uniqueId) {
                const existing = combinedUserMap.get(e.uniqueId) || {};
                combinedUserMap.set(e.uniqueId, { ...existing, ...e });
            }
        });
        
        const uniqueUsers = Array.from(combinedUserMap.values());

        return uniqueUsers.map(user => {
            // Find corresponding data from original sources if needed
            const employeeData = monthlyEmployees.find(e => e.uniqueId === user.uniqueId);
            const evaluation = monthlyEvaluations.find(e => e.employeeId === user.employeeId);

            const base: Employee = {
                id: user.employeeId || `E${user.uniqueId}`,
                uniqueId: user.uniqueId!,
                name: user.name || 'N/A',
                department: user.department || '미지정',
                title: user.title || '팀원',
                position: user.position || user.title || '팀원',
                company: employeeData?.company || user.company || 'N/A',
                growthLevel: employeeData?.growthLevel || '',
                workRate: employeeData?.workRate ?? 1.0,
                baseAmount: employeeData?.baseAmount ?? 0,
                evaluatorId: user.evaluatorId || '',
            };
            
            const grade = evaluation?.grade || null;
            const gradeInfo = grade ? gradingScale[grade] : null;
            const score = gradeInfo?.score || 0;
            const payoutRate = gradeInfo ? gradeInfo.payoutRate / 100 : 0;
            const gradeAmount = (base.baseAmount || 0) * payoutRate;
            const finalAmount = calculateFinalAmount(gradeAmount, base.workRate);
            
            const evaluator = allUsers.find(u => u.uniqueId === base.evaluatorId);
            
            const getEvaluationGroup = (workRate: number): string => {
                if (workRate >= 0.7) return 'A. 정규평가';
                if (workRate >= 0.25) return 'B. 별도평가';
                return 'C. 미평가';
            };

            const getDetailedGroup2 = (employee: Employee): string => {
                const { position, growthLevel } = employee;
                if (position === '팀장' || position === '지점장') return '팀장/지점장';
                if (position === '지부장' || position === '센터장') return '지부장/센터장';
                if (growthLevel === 'Lv.1') return 'Lv.1';
                if (growthLevel === 'Lv.2' || growthLevel === 'Lv.3') return 'Lv.2~3';
                return '기타';
            }
            
            return {
                ...base, year, month, grade, score, payoutRate, gradeAmount, finalAmount,
                evaluatorName: evaluator?.name || (base.evaluatorId ? `미지정 (${base.evaluatorId})` : '미지정'),
                evaluationGroup: getEvaluationGroup(base.workRate),
                detailedGroup1: getDetailedGroup1(base.workRate),
                detailedGroup2: getDetailedGroup2(base),
                memo: evaluation?.memo || base.memo || ''
            };
        });
    };
    
    const allResultsForMonth = getFullEvaluationResults();
    setResults(allResultsForMonth);

    const monthKey = `${selectedDate.year}-${selectedDate.month}`;
    const monthlyEmployeeIds = new Set((employees[monthKey] || []).map(e => e.uniqueId));
    setMonthlyEvaluationTargets(allResultsForMonth.filter(r => monthlyEmployeeIds.has(r.uniqueId)));

  }, [employees, evaluations, gradingScale, selectedDate, allUsers]);

  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        if (adminActiveView === 'personal-settings' && user) {
            return <PersonalSettings user={user} onUserUpdate={handleUserUpdate} />;
        }
        const currentMonthStatus = evaluationStatus[`${selectedDate.year}-${selectedDate.month}`] || 'open';
        return <AdminDashboard 
                  results={monthlyEvaluationTargets}
                  allUsers={allUsers}
                  onEmployeeUpload={handleEmployeeUpload}
                  onEvaluationUpload={handleEvaluationUpload}
                  gradingScale={gradingScale}
                  setGradingScale={setGradingScale}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  onEvaluatorAssignmentChange={handleEvaluatorAssignmentChange}
                  onUserAdd={handleUserAdd}
                  onRolesChange={handleRolesChange}
                  onUserUpdate={handleUserUpdate}
                  onUserDelete={handleUserDelete}
                  onUsersDelete={handleUsersDelete}
                  activeView={adminActiveView}
                  onClearEmployeeData={handleClearEmployeeData}
                  onClearEvaluationData={handleClearEvaluationData}
                  onWorkRateDataUpload={handleWorkRateDataUpload}
                  onClearWorkRateData={handleClearWorkRateData}
                  workRateInputs={workRateInputs}
                  attendanceTypes={attendanceTypes}
                  setAttendanceTypes={setAttendanceTypes}
                  holidays={holidays}
                  setHolidays={setHolidays}
                  workRateDetails={workRateDetails}
                  onApprovalAction={onApprovalAction}
                  notifications={notifications}
                  addNotification={addNotification}
                  deleteNotification={deleteNotification}
                  approvals={approvals}
                  evaluationStatus={currentMonthStatus}
                  onEvaluationStatusChange={handleEvaluationStatusChange}
                />;
      case 'evaluator':
        if (evaluatorActiveView === 'personal-settings' && user) {
            return <PersonalSettings user={user} onUserUpdate={handleUserUpdate} />;
        }
        const myManagedEmployees = monthlyEvaluationTargets.filter(e => e.evaluatorId === user?.uniqueId);
        
        return <EvaluatorDashboard 
                  allResults={monthlyEvaluationTargets}
                  currentMonthResults={myManagedEmployees}
                  gradingScale={gradingScale}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate} 
                  handleEvaluatorAssignmentChange={handleEvaluatorAssignmentChange}
                  activeView={evaluatorActiveView}
                  onClearMyEvaluations={handleClearMyEvaluations}
                  workRateDetails={workRateDetails}
                  holidays={holidays}
                  allUsers={allUsers}
                  attendanceTypes={attendanceTypes}
                  onApprovalAction={onApprovalAction}
                  notifications={notifications}
                  addNotification={addNotification}
                  deleteNotification={deleteNotification}
                  approvals={approvals}
                />;
      case 'employee':
        if (employeeActiveView === 'personal-settings' && user) {
            return <PersonalSettings user={user} onUserUpdate={handleUserUpdate} />;
        }
        const myEmployeeInfo = monthlyEvaluationTargets.find(e => e.uniqueId === user?.uniqueId);
        const myApprovals = approvals.filter(a => a.requesterId === user.uniqueId);
        return <EmployeeDashboard 
                  employeeResults={myEmployeeInfo ? [myEmployeeInfo] : []}
                  allResultsForYear={results.filter(e => e.uniqueId === user?.uniqueId && e.year === selectedDate.year)}
                  gradingScale={gradingScale} 
                  activeView={employeeActiveView}
                  workRateDetails={workRateDetails}
                  selectedDate={selectedDate}
                  allEmployees={allUsers}
                  attendanceTypes={attendanceTypes}
                  onApprovalAction={onApprovalAction}
                  notifications={notifications}
                  deleteNotification={deleteNotification}
                  approvals={myApprovals}
                />;
      default:
        return null;
    }
  };

  const headerContent = (
    <Header
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      notifications={notifications}
      unreadNotificationCount={unreadNotificationCount}
      markNotificationsAsRead={markNotificationsAsRead}
      approvals={approvals}
      unreadApprovalCount={unreadApprovalCount}
      markApprovalsAsRead={markApprovalsAsRead}
      setActiveView={role === 'admin' ? setAdminActiveView : (role === 'evaluator' ? setEvaluatorActiveView : setEmployeeActiveView)}
    />
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">로딩중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  const commonLayout = (navItems: NavItem[], activeView: string, setActiveView: (v: any) => void, isOpen: boolean, setIsOpen: (v: boolean) => void) => (
    <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar
            navItems={navItems}
            activeView={activeView}
            setActiveView={setActiveView}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            user={user}
            logout={logout}
            unreadNotificationCount={unreadNotificationCount}
            unreadApprovalCount={unreadApprovalCount}
        />
        <div className={cn("flex flex-col flex-1 transition-all duration-300 ease-in-out", isOpen ? "ml-64" : "ml-16")}>
            <div className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
                {headerContent}
            </div>
            <main className="flex-1 overflow-y-auto">
                {renderDashboard()}
            </main>
        </div>
    </div>
  )

  if (role === 'admin') {
      return commonLayout(
        adminNavItems,
        adminActiveView,
        setAdminActiveView,
        isAdminSidebarOpen,
        setIsAdminSidebarOpen
      );
  }

  if (role === 'evaluator') {
      return commonLayout(
        evaluatorNavItems,
        evaluatorActiveView,
        setEvaluatorActiveView,
        isEvaluatorSidebarOpen,
        setIsEvaluatorSidebarOpen
      );
  }
  
  if (role === 'employee') {
      return commonLayout(
        employeeNavItems,
        employeeActiveView,
        setEmployeeActiveView,
        isEmployeeSidebarOpen,
        setIsEmployeeSidebarOpen
      );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          {headerContent}
      </div>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {renderDashboard()}
      </main>
    </div>
  );
}
