'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import Header from '@/components/evalmax/header';
import AdminDashboard from '@/components/evalmax/admin-dashboard';
import EvaluatorDashboard from '@/components/evalmax/evaluator-dashboard';
import EmployeeDashboard from '@/components/evalmax/employee-dashboard';
import type { Employee, Evaluation, EvaluationResult, Grade, GradeInfo, User, EvaluatorView, EvaluationUploadData, WorkRateInputs, AttendanceType, Holiday, ShortenedWorkHourRecord, DailyAttendanceRecord } from '@/lib/types';
import { mockEmployees, gradingScale as initialGradingScale, calculateFinalAmount, mockEvaluations as initialMockEvaluations, getDetailedGroup1, initialAttendanceTypes } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { Loader2, Bell } from 'lucide-react';
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
  FileText,
  CalendarDays,
} from 'lucide-react';
import { calculateWorkRateDetails } from '@/lib/work-rate-calculator';

const adminNavItems: NavItem[] = [
  {
    id: 'results',
    label: '평가결과',
    icon: FileCheck,
    children: [
      { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
      { id: 'all-results', label: '개인별 등급/금액', icon: FileCheck },
      { id: 'evaluator-view', label: '평가자별 조회', icon: Eye },
      { id: 'consistency-check', label: '편향 검토 (AI)', icon: Bot },
    ],
  },
  {
    id: 'work-rate-management',
    label: '근무율 관리',
    icon: Hourglass,
    children: [
      { id: 'work-rate-view', label: '근무율 조회', icon: Gauge },
      { id: 'shortened-work-details', label: '단축근로 상세', icon: FileText },
      { id: 'daily-attendance-details', label: '일근태 상세', icon: CalendarDays },
      { id: 'attendance-type-management', label: '근태 수치 관리', icon: ListTodo },
    ]
  },
  {
    id: 'data-management',
    label: '데이터 관리',
    icon: Database,
    children: [
      { id: 'file-upload', label: '파일 업로드', icon: Upload },
      { id: 'evaluator-management', label: '평가자 관리', icon: Users },
      { id: 'grade-management', label: '등급/점수 관리', icon: Settings },
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
];

const EMPLOYEES_STORAGE_KEY = 'pl_eval_employees';
const EVALUATIONS_STORAGE_KEY = 'pl_eval_evaluations';
const GRADING_SCALE_STORAGE_KEY = 'pl_eval_grading_scale';
const WORK_RATE_INPUTS_STORAGE_KEY = 'pl_eval_work_rate_inputs';
const ATTENDANCE_TYPES_STORAGE_KEY = 'pl_eval_attendance_types';
const HOLIDAYS_STORAGE_KEY = 'pl_eval_holidays';

const getInitialDate = () => {
    const today = new Date();
    // A month is available only after it has completely passed.
    // e.g., July's evaluation data is available from August 1st.
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    const year = lastMonthDate.getFullYear();
    const month = lastMonthDate.getMonth() + 1;

    return { year, month };
};

export default function Home() {
  const { user, role, loading, logout } = useAuth();
  const router = useRouter();
  
  const [employees, setEmployees] = React.useState<Record<string, Employee[]>>(() => {
    if (typeof window === 'undefined') {
        return { '2025-7': mockEmployees };
    }

    let dataFromStorage: Record<string, Employee[]> | null = null;
    try {
        const stored = window.localStorage.getItem(EMPLOYEES_STORAGE_KEY);
        if (stored) {
            dataFromStorage = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error reading employees from localStorage', error);
        dataFromStorage = null;
    }

    let dataToProcess = dataFromStorage || { '2025-7': mockEmployees };

    let wasUpdated = false;
    const adminEmployeeData = mockEmployees.find(e => e.uniqueId === '1911042');

    if (adminEmployeeData) {
        Object.keys(dataToProcess).forEach(key => {
            let adminFound = false;
            dataToProcess[key] = dataToProcess[key].map(emp => {
                if (emp.uniqueId === '1911042') {
                    adminFound = true;
                    if (emp.department !== adminEmployeeData.department || emp.title !== adminEmployeeData.title) {
                        wasUpdated = true;
                        return { ...emp, department: adminEmployeeData.department, title: adminEmployeeData.title, position: adminEmployeeData.position };
                    }
                }
                return emp;
            });
        });
    }

    if (wasUpdated) {
        try {
            window.localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(dataToProcess));
        } catch (error) {
            console.error('Error saving updated employees to localStorage', error);
        }
    }

    return dataToProcess;
  });

  const [evaluations, setEvaluations] = React.useState<Record<string, Evaluation[]>>(() => {
    if (typeof window === 'undefined') {
      return { '2025-7': initialMockEvaluations };
    }
    try {
      const stored = window.localStorage.getItem(EVALUATIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : { '2025-7': initialMockEvaluations };
    } catch (error) {
      console.error('Error reading evaluations from localStorage', error);
      return { '2025-7': initialMockEvaluations };
    }
  });

  const [gradingScale, setGradingScale] = React.useState<Record<NonNullable<Grade>, GradeInfo>>(() => {
    if (typeof window === 'undefined') {
      return initialGradingScale;
    }
    try {
      const stored = window.localStorage.getItem(GRADING_SCALE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : initialGradingScale;
    } catch (error) {
      console.error('Error reading grading scale from localStorage', error);
      return initialGradingScale;
    }
  });
  
  const [results, setResults] = React.useState<EvaluationResult[]>([]);
  const [selectedDate, setSelectedDate] = React.useState(getInitialDate);
  
  const [workRateInputs, setWorkRateInputs] = React.useState<Record<string, WorkRateInputs>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = window.localStorage.getItem(WORK_RATE_INPUTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading work rate inputs from localStorage', error);
      return {};
    }
  });

  const [attendanceTypes, setAttendanceTypes] = React.useState<AttendanceType[]>(() => {
    if (typeof window === 'undefined') return initialAttendanceTypes;
    try {
      const stored = localStorage.getItem(ATTENDANCE_TYPES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : initialAttendanceTypes;
    } catch (error) {
      console.error('Error reading attendance types from localStorage', error);
      return initialAttendanceTypes;
    }
  });

  const [holidays, setHolidays] = React.useState<Holiday[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(HOLIDAYS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading holidays from localStorage', error);
      return [];
    }
  });

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


  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
    } catch (error) {
      console.error('Error saving employees to localStorage', error);
    }
  }, [employees]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(EVALUATIONS_STORAGE_KEY, JSON.stringify(evaluations));
    } catch (error) {
      console.error('Error saving evaluations to localStorage', error);
    }
  }, [evaluations]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(GRADING_SCALE_STORAGE_KEY, JSON.stringify(gradingScale));
    } catch (error) {
      console.error('Error saving grading scale from localStorage', error);
    }
  }, [gradingScale]);
  
  React.useEffect(() => {
    try {
        window.localStorage.setItem(WORK_RATE_INPUTS_STORAGE_KEY, JSON.stringify(workRateInputs));
    } catch (error) {
        console.error('Error saving work rate inputs to localStorage', error);
    }
  }, [workRateInputs]);
  
  React.useEffect(() => {
    try {
        window.localStorage.setItem(ATTENDANCE_TYPES_STORAGE_KEY, JSON.stringify(attendanceTypes));
    } catch (error) {
        console.error('Error saving attendance types to localStorage', error);
    }
  }, [attendanceTypes]);
  
  React.useEffect(() => {
    try {
        window.localStorage.setItem(HOLIDAYS_STORAGE_KEY, JSON.stringify(holidays));
    } catch (error) {
        console.error('Error saving holidays to localStorage', error);
    }
  }, [holidays]);


  const allEmployees = React.useMemo(() => {
    return Object.values(employees).flat();
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
  
  const handleWorkRateDataUpload = (year: number, month: number, type: keyof WorkRateInputs, newData: any[]) => {
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

  const handleClearWorkRateData = (year: number, month: number, type: keyof WorkRateInputs) => {
    const key = `${year}-${month}`;
    setWorkRateInputs(prev => {
        const currentMonthInputs = prev[key];
        if (!currentMonthInputs) return prev;

        const updatedMonthInputs = {
            ...currentMonthInputs,
            [type]: [],
        };
        
        // If all work rate data for the month is empty, remove the key
        if (updatedMonthInputs.shortenedWorkHours.length === 0 && updatedMonthInputs.dailyAttendance.length === 0) {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        }

        return { ...prev, [key]: updatedMonthInputs };
    });
  };

  const handleResultsUpdate = (updatedResultsForMonth: EvaluationResult[]) => {
    const allEmployeeIdsInUpdate = new Set(updatedResultsForMonth.map(r => r.id));
    const currentMonthKey = `${selectedDate.year}-${selectedDate.month}`;

    const updatedEmployeesByMonth = updatedResultsForMonth.reduce((acc, r) => {
        const key = `${r.year}-${r.month}`;
        if (!acc[key]) acc[key] = [];

        const { year, month, grade, score, payoutRate, gradeAmount, finalAmount, evaluatorName, evaluationGroup, detailedGroup1, detailedGroup2, memo, ...employeeData } = r;
        acc[key].push(employeeData);
        return acc;
    }, {} as Record<string, Employee[]>);

    const updatedEvaluationsByMonth = updatedResultsForMonth.reduce((acc, r) => {
        const key = `${r.year}-${r.month}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push({
            id: `eval-${r.id}-${r.year}-${r.month}`,
            employeeId: r.id,
            year: r.year,
            month: r.month,
            grade: r.grade,
            memo: r.memo
        });
        return acc;
    }, {} as Record<string, Evaluation[]>);


    setEmployees(prev => {
        const newState = { ...prev };
        for(const key in updatedEmployeesByMonth) {
            newState[key] = updatedEmployeesByMonth[key];
        }
        return newState;
    });

    setEvaluations(prev => {
        const newState = { ...prev };
        for(const key in updatedEvaluationsByMonth) {
            newState[key] = updatedEvaluationsByMonth[key];
        }
        return newState;
    });
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
    
    setResults(getFullEvaluationResults(monthlyEmployees, evaluations, gradingScale, allEmployees));
  }, [employees, evaluations, gradingScale, selectedDate, allEmployees]);

  const renderDashboard = () => {
    const allTimeResults = Object.keys(employees).flatMap(dateKey => {
      const [year, month] = dateKey.split('-').map(Number);
      const monthEmployees = employees[dateKey] || [];
      const monthEvaluations = evaluations[dateKey] || [];
      if (!monthEmployees) return [];
      return monthEmployees.map(employee => {
        const evaluation = monthEvaluations.find(e => e.employeeId === employee.id);
        const grade = evaluation?.grade || null;
        const gradeInfo = grade ? gradingScale[grade] : null;
        const score = gradeInfo ? gradeInfo.score : 0;
        const payoutRate = gradeInfo ? gradeInfo.payoutRate / 100 : 0;
        const gradeAmount = (employee.baseAmount || 0) * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, employee.workRate);
        const evaluator = allEmployees.find(e => e.uniqueId === employee.evaluatorId);
        const detailedGroup1 = getDetailedGroup1(employee.workRate);
        const detailedGroup2 = '기타'; // Simplified for all-time view; specific grouping logic might be complex here.
        return {
          ...employee,
          year,
          month,
          grade,
          score,
          payoutRate,
          gradeAmount,
          finalAmount,
          evaluatorName: evaluator?.name || (employee.evaluatorId ? `미지정 (${employee.evaluatorId})` : '미지정'),
          evaluationGroup: '', 
          detailedGroup1,
          detailedGroup2,
          memo: evaluation?.memo || employee.memo || '',
        };
      });
    });

    switch (role) {
      case 'admin':
        return <AdminDashboard 
                  results={results}
                  allEmployees={allEmployees}
                  onEmployeeUpload={handleEmployeeUpload}
                  onEvaluationUpload={handleEvaluationUpload}
                  gradingScale={gradingScale}
                  setGradingScale={setGradingScale}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  handleResultsUpdate={handleResultsUpdate}
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
                />;
      case 'evaluator':
        return <EvaluatorDashboard 
                  allResults={allTimeResults}
                  currentMonthResults={results}
                  gradingScale={gradingScale}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate} 
                  handleResultsUpdate={handleResultsUpdate}
                  activeView={evaluatorActiveView}
                  onClearMyEvaluations={handleClearMyEvaluations}
                />;
      case 'employee':
        return <EmployeeDashboard allResults={allTimeResults} gradingScale={gradingScale} />;
      default:
        return null;
    }
  };

  const headerContent = (
    <Header selectedDate={selectedDate} onDateChange={setSelectedDate} />
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
      const notificationItem: NavItem = { id: 'notifications', label: '알림함', icon: Bell };
      return commonLayout(
        adminNavItems,
        adminActiveView,
        setAdminActiveView,
        isAdminSidebarOpen,
        setIsAdminSidebarOpen
      );
  }

  if (role === 'evaluator') {
      const notificationItem: NavItem = { id: 'notifications', label: '알림함', icon: Bell };
      return commonLayout(
        evaluatorNavItems,
        evaluatorActiveView,
        setEvaluatorActiveView,
        isEvaluatorSidebarOpen,
        setIsEvaluatorSidebarOpen
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
