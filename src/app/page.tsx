'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import Header from '@/components/evalmax/header';
import AdminDashboard from '@/components/evalmax/admin-dashboard';
import EvaluatorDashboard from '@/components/evalmax/evaluator-dashboard';
import EmployeeDashboard from '@/components/evalmax/employee-dashboard';
import type { Employee, Evaluation, EvaluationResult, Grade, GradeInfo, User, EvaluatorView, EvaluationUploadData } from '@/lib/types';
import { mockEmployees, gradingScale as initialGradingScale, calculateFinalAmount, mockEvaluations as initialMockEvaluations, getDetailedGroup1 } from '@/lib/data';
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
} from 'lucide-react';

const adminNavItems: NavItem[] = [
  {
    id: 'results',
    label: '평가결과',
    icon: FileCheck,
    children: [
      { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
      { id: 'all-results', label: '전체 결과', icon: FileCheck },
      { id: 'evaluator-view', label: '평가자별 결과', icon: Eye },
      { id: 'consistency-check', label: '편향 검토 (AI)', icon: Bot },
    ],
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
  {
    id: 'notifications',
    label: '알림함',
    icon: Bell,
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
    id: 'notifications',
    label: '알림함',
    icon: Bell,
  },
];

const EMPLOYEES_STORAGE_KEY = 'pl_eval_employees';
const EVALUATIONS_STORAGE_KEY = 'pl_eval_evaluations';
const GRADING_SCALE_STORAGE_KEY = 'pl_eval_grading_scale';


export default function Home() {
  const { user, role, loading, logout } = useAuth();
  const router = useRouter();
  
  const [employees, setEmployees] = React.useState<Record<string, Employee[]>>(() => {
    if (typeof window === 'undefined') {
      return { '2025-7': mockEmployees };
    }
    try {
      const stored = window.localStorage.getItem(EMPLOYEES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : { '2025-7': mockEmployees };
    } catch (error) {
      console.error('Error reading employees from localStorage', error);
      return { '2025-7': mockEmployees };
    }
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
  const [selectedDate, setSelectedDate] = React.useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

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
      console.error('Error saving grading scale to localStorage', error);
    }
  }, [gradingScale]);


  const dateKey = `${selectedDate.year}-${selectedDate.month}`;
  const currentMonthEmployees = React.useMemo(() => employees[dateKey] || [], [employees, dateKey]);
  const currentMonthEvaluations = React.useMemo(() => evaluations[dateKey] || [], [evaluations, dateKey]);
  
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
      
      // Step 1: Create a map of evaluator name updates from the uploaded file.
      // This map will be the source of truth for evaluator names.
      const evaluatorNameUpdates = new Map<string, string>();
      uploadedData.forEach(item => {
          if (item.evaluatorId && item.evaluatorName) {
              evaluatorNameUpdates.set(item.evaluatorId, item.evaluatorName);
          }
      });

      // Step 2: Update the employees state.
      setEmployees(prevEmps => {
          let allEmpsState = JSON.parse(JSON.stringify(prevEmps));
          
          // Part A: Update evaluator names globally across all months.
          // This ensures that if an evaluator's name changes, it's reflected everywhere.
          if (evaluatorNameUpdates.size > 0) {
              for (const monthKey in allEmpsState) {
                  allEmpsState[monthKey] = allEmpsState[monthKey].map((emp: Employee) => {
                      if (evaluatorNameUpdates.has(emp.uniqueId)) {
                          return { ...emp, name: evaluatorNameUpdates.get(emp.uniqueId)! };
                      }
                      return emp;
                  });
              }
          }
            
          // Part B: Update the data for the employees evaluated in the current month's upload.
          const newEmpsForMonth = [...(allEmpsState[key] || [])];
          uploadedData.forEach(uploadItem => {
              const empIndex = newEmpsForMonth.findIndex(e => e.id === uploadItem.employeeId);
              if (empIndex > -1) {
                  const updatedEmployee = { ...newEmpsForMonth[empIndex] };
                  
                  // Merge properties from the upload file.
                  if (uploadItem.name !== undefined) updatedEmployee.name = uploadItem.name;
                  if (uploadItem.company !== undefined) updatedEmployee.company = uploadItem.company;
                  if (uploadItem.department !== undefined) updatedEmployee.department = uploadItem.department;
                  if (uploadItem.title !== undefined) updatedEmployee.title = uploadItem.title;
                  if (uploadItem.position !== undefined) updatedEmployee.position = uploadItem.position;
                  if (uploadItem.growthLevel !== undefined) updatedEmployee.growthLevel = uploadItem.growthLevel;
                  if (uploadItem.workRate !== undefined) updatedEmployee.workRate = uploadItem.workRate;
                  if (uploadItem.evaluatorId !== undefined) updatedEmployee.evaluatorId = uploadItem.evaluatorId;
                  if (uploadItem.baseAmount !== undefined) updatedEmployee.baseAmount = uploadItem.baseAmount;
                  if (uploadItem.memo !== undefined) updatedEmployee.memo = uploadItem.memo;
                  
                  newEmpsForMonth[empIndex] = updatedEmployee;
              }
              // Note: We don't add new employees here, that's handled by '대상자 업로드'.
              // This function only updates existing employees and their evaluations.
          });
          allEmpsState[key] = newEmpsForMonth;
          return allEmpsState;
      });

      // Step 3: Update the evaluations state.
      setEvaluations(prevEvals => {
          const newEvalsState = JSON.parse(JSON.stringify(prevEvals));
          const newEvalsForMonth = [...(newEvalsState[key] || [])];
          
          uploadedData.forEach(uploadItem => {
              const evalIndex = newEvalsForMonth.findIndex(e => e.employeeId === uploadItem.employeeId);
              
              if (evalIndex > -1) {
                  // If an evaluation record exists, update it.
                  const updatedEval = { ...newEvalsForMonth[evalIndex] };

                  // Always allow overwriting grade and memo from the file.
                  if (uploadItem.grade !== undefined) {
                      updatedEval.grade = uploadItem.grade;
                  }
                  if (uploadItem.memo !== undefined) {
                      updatedEval.memo = uploadItem.memo;
                  }
                  newEvalsForMonth[evalIndex] = updatedEval;

              } else {
                 // If no evaluation exists, create a new one.
                 const newEval = {
                    id: `eval-${uploadItem.employeeId}-${year}-${month}`,
                    employeeId: uploadItem.employeeId,
                    year,
                    month,
                    grade: uploadItem.grade || null,
                    memo: uploadItem.memo || '',
                 }
                 newEvalsForMonth.push(newEval);
              }
          });
          newEvalsState[key] = newEvalsForMonth;
          return newEvalsState;
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
    const getEvaluationGroup = (workRate: number): string => {
        if (workRate >= 0.7) return 'A. 정규평가';
        if (workRate >= 0.25) return 'B. 별도평가';
        return 'C. 미평가';
    };

    const getDetailedGroup2 = (employee: Employee): string => {
        const { position, growthLevel } = employee;

        if (position === '팀장' || position === '지점장') {
            return '팀장/지점장';
        }
        if (position === '지부장' || position === '센터장') {
            return '지부장/센터장';
        }
    
        if (growthLevel === 'Lv.1') {
            return 'Lv.1';
        }
        if (growthLevel === 'Lv.2' || growthLevel === 'Lv.3') {
            return 'Lv.2~3';
        }

        return '기타';
    }

    const getFullEvaluationResults = (
        currentEmployees: Employee[],
        currentEvaluations: Evaluation[],
        currentGradingScale: Record<NonNullable<Grade>, GradeInfo>
    ): EvaluationResult[] => {
      if (!currentEmployees) return [];
      return currentEmployees.map(employee => {
        const evaluation = currentEvaluations.find(e => e.employeeId === employee.id);
        
        const grade = evaluation?.grade || null;
        
        const gradeInfo = grade ? currentGradingScale[grade] : null;
        const score = gradeInfo ? gradeInfo.score : 0;
        const payoutRate = gradeInfo ? gradeInfo.payoutRate / 100 : 0;
        
        const gradeAmount = (employee.baseAmount || 0) * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, employee.workRate);
        const evaluator = allEmployees.find(e => e.uniqueId === employee.evaluatorId);

        const evaluationGroup = getEvaluationGroup(employee.workRate);
        const detailedGroup1 = getDetailedGroup1(employee.workRate);
        const detailedGroup2 = getDetailedGroup2(employee);

        return {
          ...employee,
          year: selectedDate.year,
          month: selectedDate.month,
          grade,
          score,
          payoutRate,
          gradeAmount,
          finalAmount,
          evaluatorName: evaluator?.name || (employee.evaluatorId ? `ID: ${employee.evaluatorId}` : '미지정'),
          evaluationGroup,
          detailedGroup1,
          detailedGroup2,
          memo: evaluation?.memo || employee.memo || ''
        };
      });
    };
    
    setResults(getFullEvaluationResults(currentMonthEmployees, currentMonthEvaluations, gradingScale));
  }, [employees, evaluations, gradingScale, selectedDate, dateKey, currentMonthEmployees, currentMonthEvaluations, allEmployees]);

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
          evaluatorName: evaluator?.name || (employee.evaluatorId ? `ID: ${employee.evaluatorId}` : '미지정'),
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
  
  const commonLayout = (sidebarNavItems: NavItem[], activeView: string, setActiveView: (v: any) => void, isOpen: boolean, setIsOpen: (v: boolean) => void) => (
    <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar
            navItems={sidebarNavItems}
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
      return commonLayout(adminNavItems, adminActiveView, setAdminActiveView, isAdminSidebarOpen, setIsAdminSidebarOpen)
  }

  if (role === 'evaluator') {
      return commonLayout(evaluatorNavItems, evaluatorActiveView, setEvaluatorActiveView, isEvaluatorSidebarOpen, setIsEvaluatorSidebarOpen)
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
