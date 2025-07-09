'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import Header from '@/components/evalmax/header';
import AdminDashboard from '@/components/evalmax/admin-dashboard';
import EvaluatorDashboard from '@/components/evalmax/evaluator-dashboard';
import EmployeeDashboard from '@/components/evalmax/employee-dashboard';
import type { Employee, Evaluation, EvaluationResult, Grade, GradeInfo, User, EvaluatorView } from '@/lib/types';
import { mockEmployees, gradingScale as initialGradingScale, calculateFinalAmount, mockEvaluations as initialMockEvaluations } from '@/lib/data';
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


export default function Home() {
  const { user, role, loading } = useAuth();
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
  const [selectedDate, setSelectedDate] = React.useState({ year: 2025, month: 7 });

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
  const currentMonthEmployees = employees[dateKey] || [];
  const currentMonthEvaluations = evaluations[dateKey] || [];
  
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
                    grade: 'B' as Grade,
                    memo: emp.memo || '',
                };
            }
        });
        return {...prev, [key]: finalEvals};
    });
  };

  const handleEvaluationUpload = (year: number, month: number, uploadedEvals: (Pick<Evaluation, 'employeeId' | 'grade' | 'memo'> & { baseAmount?: number })[]) => {
      const key = `${year}-${month}`;
      
      setEvaluations(prev => {
          const newEvalsForMonth = [...(prev[key] || [])];
          uploadedEvals.forEach(uploadedEval => {
              const evalIndex = newEvalsForMonth.findIndex(e => e.employeeId === uploadedEval.employeeId);
              if (evalIndex > -1) {
                  newEvalsForMonth[evalIndex] = {
                      ...newEvalsForMonth[evalIndex],
                      grade: uploadedEval.grade,
                      memo: uploadedEval.memo,
                  };
              }
          });
          return {...prev, [key]: newEvalsForMonth};
      });

      setEmployees(prev => {
        const newEmpsForMonth = [...(prev[key] || [])];
        uploadedEvals.forEach(uploadedData => {
            if (uploadedData.baseAmount !== undefined && !isNaN(uploadedData.baseAmount)) {
                const empIndex = newEmpsForMonth.findIndex(e => e.id === uploadedData.employeeId);
                if (empIndex > -1) {
                    newEmpsForMonth[empIndex] = {
                        ...newEmpsForMonth[empIndex],
                        baseAmount: uploadedData.baseAmount,
                    };
                }
            }
        });
        return {...prev, [key]: newEmpsForMonth};
      });
  };

  const handleResultsUpdate = (updatedResultsForMonth: EvaluationResult[]) => {
    const allEmployeeIdsInUpdate = new Set(updatedResultsForMonth.map(r => r.id));
    const currentMonthKey = `${selectedDate.year}-${selectedDate.month}`;

    const updatedEmployeesByMonth = updatedResultsForMonth.reduce((acc, r) => {
        const key = `${r.year}-${r.month}`;
        if (!acc[key]) acc[key] = [];

        const { year, month, grade, score, payoutRate, gradeAmount, finalAmount, evaluatorName, detailedGroup1, detailedGroup2, memo, ...employeeData } = r;
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


  React.useEffect(() => {
    const getDetailedGroup1 = (workRate: number): string => {
        if (workRate >= 0.7) return 'A. 70% 이상';
        if (workRate < 0.25) return 'C. 25% 미만';
        const ratePercent = Math.floor(workRate * 100);
        const lowerBound = Math.floor(ratePercent / 5) * 5;
        const upperBound = lowerBound + 4;
        if (lowerBound === 65) return 'B. 69~65%';
        if (lowerBound < 65 && lowerBound >= 25) return `B. ${upperBound}~${lowerBound}%`;
        return `B. ${ratePercent}%`;
    }

    const getDetailedGroup2 = (employee: Employee): string => {
        return employee.group || '기타';
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
          evaluatorName: evaluator?.name || '미지정',
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
      return monthEmployees.map(employee => {
        const evaluation = monthEvaluations.find(e => e.employeeId === employee.id);
        const grade = evaluation?.grade || null;
        const gradeInfo = grade ? gradingScale[grade] : null;
        const score = gradeInfo ? gradeInfo.score : 0;
        const payoutRate = gradeInfo ? gradeInfo.payoutRate / 100 : 0;
        const gradeAmount = (employee.baseAmount || 0) * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, employee.workRate);
        const evaluator = allEmployees.find(e => e.uniqueId === employee.evaluatorId);
        return {
          ...employee,
          year,
          month,
          grade,
          score,
          payoutRate,
          gradeAmount,
          finalAmount,
          evaluatorName: evaluator?.name || '미지정',
          detailedGroup1: '', 
          detailedGroup2: '',
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
                />;
      case 'employee':
        return <EmployeeDashboard allResults={allTimeResults} gradingScale={gradingScale} />;
      default:
        return null;
    }
  };

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
  
  if (role === 'admin') {
      return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar
                navItems={adminNavItems}
                activeView={adminActiveView}
                setActiveView={setAdminActiveView}
                isOpen={isAdminSidebarOpen}
                setIsOpen={setIsAdminSidebarOpen}
            />
            <div className={cn("flex flex-col flex-1 transition-all duration-300 ease-in-out", isAdminSidebarOpen ? "ml-64" : "ml-16")}>
                <Header />
                <main className="flex-1 overflow-y-auto">
                    {renderDashboard()}
                </main>
            </div>
        </div>
      )
  }

  if (role === 'evaluator') {
      return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar
                navItems={evaluatorNavItems}
                activeView={evaluatorActiveView}
                setActiveView={setEvaluatorActiveView}
                isOpen={isEvaluatorSidebarOpen}
                setIsOpen={setIsEvaluatorSidebarOpen}
            />
            <div className={cn("flex flex-col flex-1 transition-all duration-300 ease-in-out", isEvaluatorSidebarOpen ? "ml-64" : "ml-16")}>
                <Header />
                 <main className="flex-1 overflow-y-auto">
                    {renderDashboard()}
                </main>
            </div>
        </div>
      )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {renderDashboard()}
      </main>
    </div>
  );
}
