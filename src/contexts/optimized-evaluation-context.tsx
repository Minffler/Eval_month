'use client';

import * as React from 'react';
import type { 
  User, Employee, Grade, Evaluation, GradeInfo, WorkRateInputs, 
  AttendanceType, Holiday, EvaluationResult, EvaluationUploadData, 
  ShortenedWorkType, ShortenedWorkHourRecord, DailyAttendanceRecord, Role 
} from '@/lib/types';
import { 
  mockEmployees, defaultGradingScale as initialGradingScale, mockEvaluations, 
  initialAttendanceTypes, initialHolidays, calculateFinalAmount, getDetailedGroup1 
} from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './auth-context';
import { useDebouncedEffect } from '@/hooks/use-debounced-effect';

const getFromLocalStorage = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    localStorage.removeItem(key);
  }
  return defaultValue;
};

interface OptimizedEvaluationContextType {
  // 상태
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  evaluations: Record<string, Evaluation[]>;
  workRateInputs: Record<string, WorkRateInputs>;
  attendanceTypes: AttendanceType[];
  holidays: Holiday[];
  evaluationStatus: Record<string, 'open' | 'closed'>;
  
  // 액션
  setGradingScale: React.Dispatch<React.SetStateAction<Record<NonNullable<Grade>, GradeInfo>>>;
  setEvaluations: React.Dispatch<React.SetStateAction<Record<string, Evaluation[]>>>;
  setWorkRateInputs: React.Dispatch<React.SetStateAction<Record<string, WorkRateInputs>>>;
  setAttendanceTypes: React.Dispatch<React.SetStateAction<AttendanceType[]>>;
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  setEvaluationStatus: React.Dispatch<React.SetStateAction<Record<string, 'open' | 'closed'>>>;
  
  // 데이터 처리 함수
  handleEmployeeUpload: (year: number, month: number, data: Employee[]) => void;
  handleEvaluationUpload: (year: number, month: number, data: EvaluationUploadData[]) => void;
  handleClearEmployeeData: (year: number, month: number) => void;
  handleClearEvaluationData: (year: number, month: number) => void;
  handleClearWorkRateData: (year: number, month: number, type: keyof WorkRateInputs | ShortenedWorkType) => void;
  handleWorkRateDataUpload: (year: number, month: number, type: keyof WorkRateInputs, data: any[], isApproved: boolean) => void;
  handleClearMyEvaluations: (year: number, month: number, evaluatorId: string) => void;

  // 계산된 값들 (메모이제이션)
  allEvaluationResults: EvaluationResult[];
  monthlyEvaluationTargets: (selectedDate: {year: number, month: number}) => EvaluationResult[];
  
  // 성능 최적화된 쿼리 함수들
  getEvaluationResultsByMonth: (year: number, month: number) => EvaluationResult[];
  getEvaluationResultsByEvaluator: (evaluatorId: string, year?: number, month?: number) => EvaluationResult[];
  getEvaluationResultsByDepartment: (department: string, year?: number, month?: number) => EvaluationResult[];
}

const OptimizedEvaluationContext = React.createContext<OptimizedEvaluationContextType | undefined>(undefined);

export function OptimizedEvaluationProvider({ children }: { children: React.ReactNode }) {
  const { userMap, upsertUsers } = useAuth();
  
  // 상태 관리
  const [employees, setEmployees] = React.useState<Record<string, Employee[]>>(() => 
    getFromLocalStorage('employees', mockEmployees)
  );
  const [evaluations, setEvaluations] = React.useState<Record<string, Evaluation[]>>(() => 
    getFromLocalStorage('evaluations', mockEvaluations)
  );
  const [gradingScale, setGradingScale] = React.useState<Record<NonNullable<Grade>, GradeInfo>>(() => 
    getFromLocalStorage('gradingScale', initialGradingScale)
  );
  const [workRateInputs, setWorkRateInputs] = React.useState<Record<string, WorkRateInputs>>(() => 
    getFromLocalStorage('workRateInputs', {})
  );
  const [attendanceTypes, setAttendanceTypes] = React.useState<AttendanceType[]>(() => 
    getFromLocalStorage('attendanceTypes', initialAttendanceTypes)
  );
  const [holidays, setHolidays] = React.useState<Holiday[]>(() => 
    getFromLocalStorage('holidays', initialHolidays)
  );
  const [evaluationStatus, setEvaluationStatus] = React.useState<Record<string, 'open' | 'closed'>>(() => 
    getFromLocalStorage('evaluationStatus', {})
  );

  // 성능 최적화: 배치 localStorage 저장
  const saveToLocalStorage = React.useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage`, error);
    }
  }, []);

  useDebouncedEffect(() => {
    saveToLocalStorage('employees', employees);
  }, [employees, saveToLocalStorage], 1000);

  useDebouncedEffect(() => {
    saveToLocalStorage('evaluations', evaluations);
  }, [evaluations, saveToLocalStorage], 1000);

  useDebouncedEffect(() => {
    saveToLocalStorage('gradingScale', gradingScale);
  }, [gradingScale, saveToLocalStorage], 1000);

  useDebouncedEffect(() => {
    saveToLocalStorage('workRateInputs', workRateInputs);
  }, [workRateInputs, saveToLocalStorage], 1000);

  useDebouncedEffect(() => {
    saveToLocalStorage('attendanceTypes', attendanceTypes);
  }, [attendanceTypes, saveToLocalStorage], 1000);

  useDebouncedEffect(() => {
    saveToLocalStorage('holidays', holidays);
  }, [holidays, saveToLocalStorage], 1000);

  useDebouncedEffect(() => {
    saveToLocalStorage('evaluationStatus', evaluationStatus);
  }, [evaluationStatus, saveToLocalStorage], 1000);

  // 성능 최적화: 평가 결과 계산을 메모이제이션
  const allEvaluationResults = React.useMemo(() => {
    return Object.entries(employees).flatMap(([key, monthlyEmployees]) => {
      const [year, month] = key.split('-').map(Number);
      const monthlyEvaluations = evaluations[key] || [];
      const evalMap = new Map(monthlyEvaluations.map(e => [e.employeeId, e]));

      return (monthlyEmployees as Employee[]).map(employee => {
        const user = userMap.get(employee.uniqueId) || {};
        const base: Employee = { ...employee, ...user };
        
        const evaluation = evalMap.get(base.id);
        const grade = evaluation?.grade || null;
        const gradeInfo = grade ? gradingScale[grade] : null;
        const score = gradeInfo?.score || 0;
        const payoutRate = gradeInfo ? gradeInfo.payoutRate / 100 : 0;
        const gradeAmount = (base.baseAmount || 0) * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, base.workRate);
        
        const evaluator = userMap.get(base.evaluatorId || '');
        
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
    });
  }, [employees, evaluations, gradingScale, userMap]);

  // 성능 최적화: 월별 평가 대상 조회
  const monthlyEvaluationTargets = React.useCallback((selectedDate: {year: number, month: number}) => {
    const monthKey = `${selectedDate.year}-${selectedDate.month}`;
    const monthlyEmployeeList = employees[monthKey] || [];
    
    if (!Array.isArray(monthlyEmployeeList)) return [];

    const monthlyEmployeeIds = new Set(monthlyEmployeeList.map(e => e.uniqueId));
    return allEvaluationResults.filter(r => 
      r.year === selectedDate.year && 
      r.month === selectedDate.month && 
      monthlyEmployeeIds.has(r.uniqueId)
    );
  }, [allEvaluationResults, employees]);

  // 성능 최적화: 추가 쿼리 함수들
  const getEvaluationResultsByMonth = React.useCallback((year: number, month: number) => {
    return allEvaluationResults.filter(r => r.year === year && r.month === month);
  }, [allEvaluationResults]);

  const getEvaluationResultsByEvaluator = React.useCallback((evaluatorId: string, year?: number, month?: number) => {
    return allEvaluationResults.filter(r => {
      if (r.evaluatorId !== evaluatorId) return false;
      if (year !== undefined && r.year !== year) return false;
      if (month !== undefined && r.month !== month) return false;
      return true;
    });
  }, [allEvaluationResults]);

  const getEvaluationResultsByDepartment = React.useCallback((department: string, year?: number, month?: number) => {
    return allEvaluationResults.filter(r => {
      if (r.department !== department) return false;
      if (year !== undefined && r.year !== year) return false;
      if (month !== undefined && r.month !== month) return false;
      return true;
    });
  }, [allEvaluationResults]);

  // 데이터 처리 함수들 (기존 로직 유지)
  const handleEmployeeUpload = React.useCallback((year: number, month: number, newEmployees: Employee[]) => {
    const key = `${year}-${month}`;

    const usersToUpsert = newEmployees.map(emp => ({
      uniqueId: emp.uniqueId,
      name: emp.name,
      department: emp.department,
      title: emp.title,
      company: emp.company,
      evaluatorId: emp.evaluatorId,
      roles: ['employee'] as Role[]
    }));

    newEmployees.forEach(emp => {
      if (emp.evaluatorId) {
        const evaluatorInList = usersToUpsert.find(u => u.uniqueId === emp.evaluatorId);
        if (!evaluatorInList) {
          // 기존 사용자 정보에서 평가자 이름을 찾아서 우선 사용
          const existingUser = userMap.get(emp.evaluatorId);
          const evaluatorName = existingUser?.name || `평가자(${emp.evaluatorId})`;
          
          usersToUpsert.push({ 
            uniqueId: emp.evaluatorId, 
            name: evaluatorName, 
            roles: ['evaluator'], 
            department: existingUser?.department || 'N/A', 
            title: existingUser?.title || '평가자', 
            company: existingUser?.company || 'N/A', 
            evaluatorId: '' 
          });
        }
      }
    });

    upsertUsers(usersToUpsert);
    setEmployees(prev => ({...prev, [key]: newEmployees}));

    setEvaluations(prev => {
      const currentEvalsForMonth = prev[key] || [];
      const finalEvals = newEmployees.map(emp => {
        const existingEval = currentEvalsForMonth.find(e => e.employeeId === emp.id);
        return {
          id: existingEval?.id || `eval-${emp.id}-${year}-${month}`,
          employeeId: emp.id, year, month,
          grade: existingEval?.grade || null,
          memo: existingEval?.memo || emp.memo || '',
        };
      });
      return {...prev, [key]: finalEvals};
    });
  }, [upsertUsers]);

  // 나머지 핸들러 함수들도 useCallback으로 최적화
  const handleEvaluationUpload = React.useCallback((year: number, month: number, uploadedData: EvaluationUploadData[]) => {
    const key = `${year}-${month}`;
    
    const usersToUpsert: Partial<User>[] = [];
    const employeeData: Employee[] = [];
    const evaluationData: Evaluation[] = [];

    uploadedData.forEach(item => {
      const uniqueId = String(item.uniqueId || '');
      if (!uniqueId) return;

      usersToUpsert.push({
        uniqueId: uniqueId,
        name: item.name,
        department: item.department,
        title: item.title,
        company: item.company,
        evaluatorId: item.evaluatorId,
        roles: ['employee'],
      });
      
      const evaluatorId = String(item.evaluatorId || '');
      if (evaluatorId && !usersToUpsert.some(u => u.uniqueId === evaluatorId)) {
        // 기존 사용자 정보에서 평가자 이름을 찾아서 우선 사용
        const existingUser = userMap.get(evaluatorId);
        const evaluatorName = existingUser?.name || item.evaluatorName || `평가자(${evaluatorId})`;
        
        usersToUpsert.push({
          uniqueId: evaluatorId,
          name: evaluatorName,
          roles: ['evaluator'],
        });
      }
      
      const employeeId = `E${uniqueId}`;
      employeeData.push({
        id: employeeId,
        uniqueId: uniqueId,
        name: item.name || '',
        company: item.company || 'N/A',
        department: item.department || 'N/A',
        title: item.title || '팀원',
        position: item.title || '팀원',
        growthLevel: item.growthLevel || '',
        workRate: 1, // 엑셀 업로드한 근무율 무시하고 기본값 1로 설정
        evaluatorId: evaluatorId,
        baseAmount: item.baseAmount ?? 0,
      });
      
      evaluationData.push({
        id: `eval-${employeeId}-${year}-${month}`,
        employeeId,
        year,
        month,
        grade: item.grade || null,
        memo: item.memo || '',
      });
    });
    
    upsertUsers(usersToUpsert);
    setEmployees(prev => ({...prev, [key]: employeeData}));
    setEvaluations(prev => ({...prev, [key]: evaluationData}));
  }, [upsertUsers]);

  const handleClearEmployeeData = React.useCallback((year: number, month: number) => {
    const key = `${year}-${month}`;
    setEmployees(prev => { const newState = { ...prev }; delete newState[key]; return newState; });
    setEvaluations(prev => { const newState = { ...prev }; delete newState[key]; return newState; });
  }, []);

  const handleClearEvaluationData = React.useCallback((year: number, month: number) => {
    const key = `${year}-${month}`;
    setEvaluations(prev => {
      const currentEvalsForMonth = prev[key] || [];
      const resetEvals = currentEvalsForMonth.map(ev => ({ ...ev, grade: null, memo: '', }));
      return {...prev, [key]: resetEvals };
    });
  }, []);

  const handleWorkRateDataUpload = React.useCallback((year: number, month: number, type: keyof WorkRateInputs, newData: any[], isApproved: boolean) => {
    if (!isApproved) return;
    const key = `${year}-${month}`;
    setWorkRateInputs(prev => {
      const currentMonthInputs = prev[key] || { shortenedWorkHours: [], dailyAttendance: [] };

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
  }, []);

  const handleClearWorkRateData = React.useCallback((year: number, month: number, type: keyof WorkRateInputs | ShortenedWorkType) => {
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
  }, []);

  const handleClearMyEvaluations = React.useCallback((year: number, month: number, evaluatorId: string) => {
    const key = `${year}-${month}`;
    if (!evaluatorId) return;

    const myEmployeeUniqueIds = new Set(Array.from(userMap.values()).filter(u => u.evaluatorId === evaluatorId).map(u => u.uniqueId));

    setEvaluations(prev => {
      const updatedEvalsForMonth = (prev[key] || []).map(ev => {
        const empUniqueId = ev.employeeId.replace('E', '');
        if (myEmployeeUniqueIds.has(empUniqueId)) return { ...ev, grade: null, memo: '' };
        return ev;
      });
      return { ...prev, [key]: updatedEvalsForMonth };
    });
  }, [userMap]);

  const value = {
    // 상태
    gradingScale, setGradingScale,
    evaluations, setEvaluations,
    workRateInputs, setWorkRateInputs,
    attendanceTypes, setAttendanceTypes,
    holidays, setHolidays,
    evaluationStatus, setEvaluationStatus,
    
    // 데이터 처리 함수
    handleEmployeeUpload, handleEvaluationUpload, handleClearEmployeeData,
    handleClearEvaluationData, handleClearWorkRateData, handleWorkRateDataUpload,
    handleClearMyEvaluations,
    
    // 계산된 값들
    allEvaluationResults, monthlyEvaluationTargets,
    
    // 성능 최적화된 쿼리 함수들
    getEvaluationResultsByMonth, getEvaluationResultsByEvaluator, getEvaluationResultsByDepartment
  };

  return <OptimizedEvaluationContext.Provider value={value}>{children}</OptimizedEvaluationContext.Provider>;
}

export function useOptimizedEvaluation() {
  const context = React.useContext(OptimizedEvaluationContext);
  if (context === undefined) {
    throw new Error('useOptimizedEvaluation must be used within a OptimizedEvaluationProvider');
  }
  return context;
} 