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
  UserCog
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
      { id: 'evaluation-input', label: '평가입력', icon: Edit2 },
      { id: 'all-results', label: '전체 결과', icon: ListChecks },
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
  { id: 'my-review', label: '내 성과 리뷰', icon: FileCheck },
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
  const { user, users: allUsers, loading, logout, setUsers, setUser, login } = useAuth();
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
  
  const [employees, setEmployees] = React.useState<Record<string, Employee[]>>(() => getFromLocalStorage('employees', { '2025-7': initialMockEmployees }));
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
  
  const allEmployeesFromState = React.useMemo(() => {
    const employeeMap = new Map<string, Employee>();
    Object.values(employees).flat().forEach(employee => {
        if (!employeeMap.has(employee.uniqueId)) {
            employeeMap.set(employee.uniqueId, employee);
        }
    });
    return Array.from(employeeMap.values());
  }, [employees]);

  const handleEmployeeUpload = (year: number, month: number, newEmployees: Employee[]) => {
    const key = `${year}-${month}`;
    setEmployees(prev => ({...prev, [key]: newEmployees}));

    setEvaluations(prev => {
        const currentEvalsForMonth = prev[key] || [];
        const finalEvals = newEmployees.map(emp => {
            const existingEval = currentEvalsForMonth.find(e => e.employeeId === emp.id);
            if (existingEval) {
                // Preserve existing grade, but update memo if provided.
                return {
                    ...existingEval,
                    memo: emp.memo || existingEval.memo,
                };
            } else {
                // Create new evaluation for new employee.
                return {
                    id: `eval-${emp.id}-${year}-${month}`,
                    employeeId: emp.id,
                    year,
                    month,
                    grade: null,
                    memo: emp.memo || '',
                };
            }
        });
        return {...prev, [key]: finalEvals};
    });
  };

  const handleEvaluationUpload = (year: number, month: number, uploadedData: EvaluationUploadData[]) => {
    const key = `${year}-${month}`;

    setEmployees(prevEmps => {
        const newState = JSON.parse(JSON.stringify(prevEmps));
        
        const evaluatorsInUpload = new Map<string, string>();
        uploadedData.forEach(item => {
            if (item.evaluatorId && item.evaluatorName) {
                evaluatorsInUpload.set(item.evaluatorId, item.evaluatorName);
            }
        });

        // Ensure all evaluators from the upload exist as employees. If not, create a stub record.
        evaluatorsInUpload.forEach((name, id) => {
            const evaluatorExists = Object.values(newState).flat().some((emp: Employee) => emp.uniqueId === id);
            if (!evaluatorExists) {
                const newEvaluatorStub: Employee = {
                    id: `E${id}`,
                    uniqueId: id,
                    name: name,
                    company: '', department: '', title: '평가자', position: '평가자',
                    growthLevel: '', workRate: 1.0, evaluatorId: '', baseAmount: 0, memo: ''
                };
                if (!newState[key]) newState[key] = [];
                newState[key].push(newEvaluatorStub);
            }
        });

        // Part A: Update evaluator names globally.
        if (evaluatorsInUpload.size > 0) {
            for (const monthKey in newState) {
                newState[monthKey] = newState[monthKey].map((emp: Employee) => {
                    if (evaluatorsInUpload.has(emp.uniqueId)) {
                        return { ...emp, name: evaluatorsInUpload.get(emp.uniqueId)! };
                    }
                    return emp;
                });
            }
        }

        // Part B: Update data for the employees evaluated in this month's upload.
        const newEmpsForMonth = newState[key] ? [...newState[key]] : [];
        uploadedData.forEach(uploadItem => {
            const empIndex = newEmpsForMonth.findIndex(e => e.id === uploadItem.employeeId);
            if (empIndex > -1) {
                const existingEmp = newEmpsForMonth[empIndex];
                newEmpsForMonth[empIndex] = {
                    ...existingEmp,
                    name: uploadItem.name ?? existingEmp.name,
                    company: uploadItem.company ?? existingEmp.company,
                    department: uploadItem.department ?? existingEmp.department,
                    title: uploadItem.title ?? existingEmp.title,
                    position: uploadItem.position ?? existingEmp.position,
                    growthLevel: uploadItem.growthLevel ?? existingEmp.growthLevel,
                    workRate: uploadItem.workRate ?? existingEmp.workRate,
                    evaluatorId: uploadItem.evaluatorId ?? existingEmp.evaluatorId,
                    baseAmount: uploadItem.baseAmount ?? existingEmp.baseAmount,
                    memo: uploadItem.memo ?? existingEmp.memo,
                };
            }
        });
        newState[key] = newEmpsForMonth;

        return newState;
    });

    setEvaluations(prevEvals => {
        const newState = JSON.parse(JSON.stringify(prevEvals));
        const newEvalsForMonth = newState[key] ? [...newState[key]] : [];
        
        uploadedData.forEach(uploadItem => {
            const evalIndex = newEvalsForMonth.findIndex(e => e.employeeId === uploadItem.employeeId);
            if (evalIndex > -1) {
                const existingEval = newEvalsForMonth[evalIndex];
                newEvalsForMonth[evalIndex] = {
                    ...existingEval,
                    grade: uploadItem.grade !== undefined ? uploadItem.grade : existingEval.grade,
                    memo: uploadItem.memo !== undefined ? uploadItem.memo : existingEval.memo,
                };
            } else {
                newEvalsForMonth.push({
                    id: `eval-${uploadItem.employeeId}-${year}-${month}`,
                    employeeId: uploadItem.employeeId,
                    year,
                    month,
                    grade: uploadItem.grade,
                    memo: uploadItem.memo || '',
                });
            }
        });
        
        newState[key] = newEvalsForMonth;
        return newState;
    });
  };
  
  const handleWorkRateDataUpload = (year: number, month: number, type: keyof WorkRateInputs, newData: any[], isApproved: boolean) => {
      if (!isApproved) {
        // Just send notifications, don't update state
        return;
      }
      const key = `${year}-${month}`;
      setWorkRateInputs(prev => {
          const currentMonthInputs = prev[key] || {
              shortenedWorkHours: [],
              dailyAttendance: [],
          };
  
          let combinedData;
          if (type === 'shortenedWorkHours') {
              const existingKeys = new Set(currentMonthInputs.shortenedWorkHours.map((r: ShortenedWorkHourRecord) => `${r.uniqueId}|${r.startDate}|${r.endDate}`));
              const uniqueNewData = (newData as ShortenedWorkHourRecord[]).filter(r => !existingKeys.has(`${r.uniqueId}|${r.startDate}|${r.endDate}`));
              combinedData = [...currentMonthInputs.shortenedWorkHours, ...uniqueNewData];
          } else { // dailyAttendance
              const existingKeys = new Set(currentMonthInputs.dailyAttendance.map((r: DailyAttendanceRecord) => `${r.uniqueId}|${r.date}`));
              const uniqueNewData = (newData as DailyAttendanceRecord[]).filter(r => !existingKeys.has(`${r.uniqueId}|${r.date}`));
              combinedData = [...currentMonthInputs.dailyAttendance, ...uniqueNewData];
          }
  
          return {
              ...prev,
              [key]: {
                  ...currentMonthInputs,
                  [type]: combinedData,
              }
          };
      });
  
      if (type === 'dailyAttendance') {
          setAttendanceTypes(prevTypes => {
              const existingTypeNames = new Set(prevTypes.map(t => t.name));
              const newTypesFromData = new Set((newData as DailyAttendanceRecord[]).map(d => d.type).filter(t => !existingTypeNames.has(t)));
              if (newTypesFromData.size === 0) return prevTypes;
              
              const newTypesToAdd: AttendanceType[] = Array.from(newTypesFromData).map(typeName => ({
                  id: `att-${Date.now()}-${Math.random()}`,
                  name: typeName as string,
                  deductionDays: 0, // Default to 0, user needs to set it
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
        } else if (type === 'shortenedWorkHours') { // For backward compatibility if needed
            updatedMonthInputs.shortenedWorkHours = [];
        }
        
        // If all work rate data for the month is empty, remove the key
        if (updatedMonthInputs.shortenedWorkHours.length === 0 && updatedMonthInputs.dailyAttendance.length === 0) {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        }

        return { ...prev, [key]: updatedMonthInputs };
    });
  };

  const handleResultsUpdate = (updatedResults: EvaluationResult[]) => {
      // This is a comprehensive update function that trusts the incoming `updatedResults`
      // and reverse-engineers the `employees` and `evaluations` state from it.
      
      const newEmployees: Record<string, Employee[]> = {};
      const newEvaluations: Record<string, Evaluation[]> = {};
      
      updatedResults.forEach(res => {
          const { year, month, grade, score, payoutRate, gradeAmount, finalAmount, evaluatorName, evaluationGroup, detailedGroup1, detailedGroup2, ...employeeData } = res;
          const key = `${year}-${month}`;

          if (!newEmployees[key]) newEmployees[key] = [];
          if (!newEvaluations[key]) newEvaluations[key] = [];

          // Add employee data if not already present for that month
          if (!newEmployees[key].some(e => e.id === employeeData.id)) {
              newEmployees[key].push(employeeData);
          }
          
          // Add evaluation data
          const newEval: Evaluation = {
              id: `eval-${employeeData.id}-${year}-${month}`,
              employeeId: employeeData.id,
              year,
              month,
              grade,
              memo: res.memo || employeeData.memo || '',
          };
          
          const evalIndex = newEvaluations[key].findIndex(e => e.employeeId === employeeData.id);
          if (evalIndex > -1) {
              newEvaluations[key][evalIndex] = newEval;
          } else {
              newEvaluations[key].push(newEval);
          }
      });

      setEmployees(newEmployees);
      setEvaluations(newEvaluations);
  };
  
  const handleUserAdd = (newEmployee: Employee, roles: Role[]) => {
    // Add to allEmployees state
    setEmployees(prev => {
        const newState = { ...prev };
        const currentMonthKey = `${selectedDate.year}-${selectedDate.month}`;
        if (!newState[currentMonthKey]) newState[currentMonthKey] = [];

        if (!newState[currentMonthKey].some(e => e.uniqueId === newEmployee.uniqueId)) {
           newState[currentMonthKey].push(newEmployee);
        }
        return newState;
    });

    // Add to users state
    setUsers(prev => {
      if (prev.some(u => u.uniqueId === newEmployee.uniqueId)) {
        return prev;
      }
      const newUser: User = {
        id: `user-${newEmployee.uniqueId}`,
        employeeId: newEmployee.id,
        uniqueId: newEmployee.uniqueId,
        name: newEmployee.name,
        roles,
        avatar: `https://placehold.co/100x100.png?text=${newEmployee.name.charAt(0)}`,
        title: newEmployee.title,
        department: newEmployee.department,
        password: '1'
      };
      return [...prev, newUser];
    });
  };

  const handleUserUpdate = (userId: string, updatedData: Partial<User>) => {
    let employeeUpdated = false;
    let oldUniqueId = '';
    
    setUsers(prevUsers => {
        return prevUsers.map(u => {
            if (u.id === userId) {
                oldUniqueId = u.uniqueId;
                if (u.uniqueId !== updatedData.uniqueId || u.name !== updatedData.name || u.department !== updatedData.department || u.title !== updatedData.title) {
                    employeeUpdated = true;
                }
                const newPass = updatedData.password;
                if(newPass && newPass.trim() !== '') {
                    login(u.uniqueId, '1'); //This is a hack to make sure the user object is updated
                }

                return { ...u, ...updatedData };
            }
            return u;
        });
    });

    if (employeeUpdated) {
        setEmployees(prevEmployees => {
            const newEmployees = { ...prevEmployees };
            const userToUpdate = allUsers.find(u => u.id === userId);
            if (!userToUpdate) return prevEmployees;

            for (const monthKey in newEmployees) {
                newEmployees[monthKey] = newEmployees[monthKey].map(emp => {
                    if (emp.uniqueId === oldUniqueId) {
                        return { 
                            ...emp, 
                            uniqueId: updatedData.uniqueId ?? emp.uniqueId,
                            id: updatedData.uniqueId ? `E${updatedData.uniqueId}` : emp.id,
                            name: updatedData.name ?? emp.name,
                            department: updatedData.department ?? emp.department,
                            title: updatedData.title ?? emp.title,
                            position: updatedData.title ?? emp.position,
                        };
                    }
                    if(emp.evaluatorId === oldUniqueId) {
                        return { ...emp, evaluatorId: updatedData.uniqueId ?? emp.evaluatorId };
                    }
                    return emp;
                });
            }
            return newEmployees;
        });
    }
  };

  const handleUserDelete = (userId: string) => {
    const userToDelete = allUsers.find(u => u.id === userId);
    if (!userToDelete) return;

    setUsers(prev => prev.filter(u => u.id !== userId));
    setEmployees(prev => {
        const newState = { ...prev };
        for (const key in newState) {
            newState[key] = newState[key].filter(e => e.uniqueId !== userToDelete.uniqueId);
        }
        return newState;
    });
  };

  const handleRolesChange = (userId: string, newRoles: Role[]) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: newRoles } : u));
  };

  const handleClearEmployeeData = (year: number, month: number) => {
    const key = `${year}-${month}`;
    setEmployees(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
    });
    setEvaluations(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
    });
  };

  const handleClearEvaluationData = (year: number, month: number) => {
    const key = `${year}-${month}`;
    setEvaluations(prev => {
        const currentEvalsForMonth = prev[key] || [];
        const resetEvals = currentEvalsForMonth.map(ev => ({
            ...ev,
            grade: null,
            memo: '', 
        }));
        return {...prev, [key]: resetEvals };
    });
  };

  const handleClearMyEvaluations = (year: number, month: number, evaluatorId: string) => {
    const key = `${year}-${month}`;
    if (!evaluatorId) return;

    const myEmployeeIds = new Set((employees[key] || []).filter(e => e.evaluatorId === evaluatorId).map(e => e.id));

    setEvaluations(prev => {
        const updatedEvalsForMonth = (prev[key] || []).map(ev => {
            if (myEmployeeIds.has(ev.employeeId)) {
                return { ...ev, grade: null, memo: '' };
            }
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
        if (!updatedInputs[key]) {
          updatedInputs[key] = { shortenedWorkHours: [], dailyAttendance: [] };
        }
        
        let targetArray = updatedInputs[key][dataType];

        if (action === 'add') {
            targetArray.push(data);
        } else if (action === 'edit') {
            const index = targetArray.findIndex((item: any) => item.rowId === data.rowId);
            if (index > -1) {
                targetArray[index] = data;
            } else { // Fallback if rowId not found
                targetArray.push(data);
            }
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
    type MonthlyEmployee = Employee & { year: number; month: number };
    
    const getFullEvaluationResults = (
        monthlyEmployees: MonthlyEmployee[],
        allEvaluations: Record<string, Evaluation[]>,
        currentGradingScale: Record<NonNullable<Grade>, GradeInfo>,
        allTimeEmployees: Employee[]
    ): EvaluationResult[] => {
      if (!monthlyEmployees) return [];
      
      return monthlyEmployees.map(employee => {
        const monthEvaluations = allEvaluations[`${employee.year}-${employee.month}`] || [];
        const evaluation = monthEvaluations.find(e => e.employeeId === employee.id);
        
        const grade = evaluation?.grade || null;
        const gradeInfo = grade ? currentGradingScale[grade] : null;
        const score = gradeInfo ? gradeInfo.score : 0;
        const payoutRate = gradeInfo ? gradeInfo.payoutRate / 100 : 0;
        
        const gradeAmount = (employee.baseAmount || 0) * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, employee.workRate);
        const evaluator = allTimeEmployees.find(e => e.uniqueId === employee.evaluatorId);

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
          ...employee,
          year: employee.year,
          month: employee.month,
          grade,
          score,
          payoutRate,
          gradeAmount,
          finalAmount,
          evaluatorName: evaluator?.name || (employee.evaluatorId ? `미지정 (${employee.evaluatorId})` : '미지정'),
          evaluationGroup: getEvaluationGroup(employee.workRate),
          detailedGroup1: getDetailedGroup1(employee.workRate),
          detailedGroup2: getDetailedGroup2(employee),
          memo: evaluation?.memo || employee.memo || ''
        };
      });
    };

    const year = selectedDate.year;
    const month = selectedDate.month;
    let monthlyEmployees: MonthlyEmployee[] = [];

    if (month === 0) { // All months selected
        monthlyEmployees = Object.entries(employees)
            .filter(([key]) => key.startsWith(`${year}-`))
            .flatMap(([key, emps]) => {
                const [, monthStr] = key.split('-');
                const monthNum = parseInt(monthStr, 10);
                return emps.map(e => ({ ...e, year, month: monthNum }));
            });
    } else { // Single month selected
        const dateKey = `${year}-${month}`;
        monthlyEmployees = (employees[dateKey] || []).map(e => ({ ...e, year, month }));
    }
    
    setResults(getFullEvaluationResults(monthlyEmployees, evaluations, gradingScale, allEmployeesFromState));
  }, [employees, evaluations, gradingScale, selectedDate, allEmployeesFromState]);

  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        if (adminActiveView === 'personal-settings' && user) {
            return <PersonalSettings user={user} onUserUpdate={handleUserUpdate} />;
        }
        const currentMonthStatus = evaluationStatus[`${selectedDate.year}-${selectedDate.month}`] || 'open';
        return <AdminDashboard 
                  results={results}
                  allEmployees={allEmployeesFromState}
                  allUsers={allUsers}
                  employeesData={employees}
                  onEmployeeUpload={handleEmployeeUpload}
                  onEvaluationUpload={handleEvaluationUpload}
                  gradingScale={gradingScale}
                  setGradingScale={setGradingScale}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  handleResultsUpdate={handleResultsUpdate}
                  onUserAdd={handleUserAdd}
                  onRolesChange={handleRolesChange}
                  onUserUpdate={handleUserUpdate}
                  onUserDelete={handleUserDelete}
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
        const myManagedEmployees = results.filter(e => e.evaluatorId === user?.uniqueId);
        const myManagedEmployeeIds = new Set(myManagedEmployees.map(e => e.id));
        const myResults = results.filter(r => myManagedEmployeeIds.has(r.id));
        
        return <EvaluatorDashboard 
                  allResults={results}
                  currentMonthResults={myResults}
                  gradingScale={gradingScale}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate} 
                  handleResultsUpdate={handleResultsUpdate}
                  activeView={evaluatorActiveView}
                  onClearMyEvaluations={handleClearMyEvaluations}
                  workRateDetails={workRateDetails}
                  holidays={holidays}
                  allUsers={allUsers}
                  allEmployees={allEmployeesFromState}
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
        const myEmployeeInfo = results.find(e => e.uniqueId === user?.uniqueId);
        const myApprovals = approvals.filter(a => a.requesterId === user.uniqueId);
        return <EmployeeDashboard 
                  employeeResults={myEmployeeInfo ? [myEmployeeInfo] : []}
                  allResults={results.filter(e => e.uniqueId === user?.uniqueId)}
                  gradingScale={gradingScale} 
                  activeView={employeeActiveView}
                  workRateDetails={workRateDetails}
                  selectedDate={selectedDate}
                  allEmployees={allEmployeesFromState}
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
      const extendedNavItems = [
          ...adminNavItems,
      ];
      return commonLayout(
        extendedNavItems,
        adminActiveView,
        setAdminActiveView,
        isAdminSidebarOpen,
        setIsAdminSidebarOpen
      );
  }

  if (role === 'evaluator') {
      const extendedNavItems = [
          ...evaluatorNavItems,
      ];
      return commonLayout(
        extendedNavItems,
        evaluatorActiveView,
        setEvaluatorActiveView,
        isEvaluatorSidebarOpen,
        setIsEvaluatorSidebarOpen
      );
  }
  
  if (role === 'employee') {
      const extendedNavItems = [
          ...employeeNavItems,
      ];
      return commonLayout(
        extendedNavItems,
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
