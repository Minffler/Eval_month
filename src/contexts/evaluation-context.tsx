'use client';

import * as React from 'react';
import type { User, Employee, Grade, Evaluation, GradeInfo, WorkRateInputs, AttendanceType, Holiday, EvaluationResult, EvaluationUploadData, ShortenedWorkType, ShortenedWorkHourRecord, DailyAttendanceRecord, Role } from '@/lib/types';
import { mockEmployees, defaultGradingScale as initialGradingScale, mockEvaluations, calculateFinalAmount, getDetailedGroup1 } from '@/lib/data';
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
}

// 근무기준 목업 데이터
const MOCK_ATTENDANCE_TYPES = [
  { id: '1', name: '가족돌봄휴가', deductionDays: 1 },
  { id: '2', name: '결근', deductionDays: 1 },
  { id: '3', name: '공가', deductionDays: 1 },
  { id: '4', name: '연차(1년미만)', deductionDays: 1 },
  { id: '5', name: '연차휴가', deductionDays: 1 },
  { id: '6', name: '육아휴직', deductionDays: 1 },
  { id: '7', name: '반반차(오후)', deductionDays: 0.5 },
  { id: '8', name: '반차(오전)', deductionDays: 0.5 },
  { id: '9', name: '반차(오전)(1년미만)', deductionDays: 0.5 },
  { id: '10', name: '반차(오후)', deductionDays: 0.5 },
  { id: '11', name: '반차(오후)(1년미만)', deductionDays: 0.5 },
  { id: '12', name: '반반차(오전)', deductionDays: 0.25 },
  { id: '13', name: '반반차(오후)(1년미만)', deductionDays: 0.25 },
  { id: '14', name: '대체휴무(종일)', deductionDays: 0 },
  { id: '15', name: '외부교육', deductionDays: 0 },
];

// 공휴일 목업 데이터
const MOCK_HOLIDAYS = [
  { id: 'h1', date: '2025-01-01', name: '신정', type: '공휴일' as const },
  { id: 'h2', date: '2025-06-03', name: '대통령선거', type: '공휴일' as const },
  { id: 'h3', date: '2025-06-06', name: '현충일', type: '공휴일' as const },
];

interface EvaluationContextType {
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  setGradingScale: React.Dispatch<React.SetStateAction<Record<NonNullable<Grade>, GradeInfo>>>;
  evaluations: Record<string, Evaluation[]>;
  setEvaluations: React.Dispatch<React.SetStateAction<Record<string, Evaluation[]>>>;
  workRateInputs: Record<string, WorkRateInputs>;
  setWorkRateInputs: React.Dispatch<React.SetStateAction<Record<string, WorkRateInputs>>>;
  attendanceTypes: AttendanceType[];
  setAttendanceTypes: React.Dispatch<React.SetStateAction<AttendanceType[]>>;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  evaluationStatus: Record<string, 'open' | 'closed'>;
  setEvaluationStatus: React.Dispatch<React.SetStateAction<Record<string, 'open' | 'closed'>>>;
  
  handleEmployeeUpload: (year: number, month: number, data: Employee[]) => void;
  handleEvaluationUpload: (year: number, month: number, data: EvaluationUploadData[]) => void;
  handleClearEmployeeData: (year: number, month: number) => void;
  handleClearEvaluationData: (year: number, month: number) => void;
  handleClearWorkRateData: (year: number, month: number, type: keyof WorkRateInputs | ShortenedWorkType) => void;
  handleWorkRateDataUpload: (year: number, month: number, type: keyof WorkRateInputs, data: any[], isApproved: boolean) => void;
  handleClearMyEvaluations: (year: number, month: number, evaluatorId: string) => void;

  allEvaluationResults: EvaluationResult[];
  monthlyEvaluationTargets: (selectedDate: {year: number, month: number}) => EvaluationResult[];
}

const EvaluationContext = React.createContext<EvaluationContextType | undefined>(undefined);

export function EvaluationProvider({ children }: { children: React.ReactNode }) {
  const { userMap, upsertUsers } = useAuth();
  
  const [employees, setEmployees] = React.useState<Record<string, Employee[]>>(() => getFromLocalStorage('employees', mockEmployees ));
  const [evaluations, setEvaluations] = React.useState<Record<string, Evaluation[]>>(() => getFromLocalStorage('evaluations', mockEvaluations ));
  const [gradingScale, setGradingScale] = React.useState<Record<NonNullable<Grade>, GradeInfo>>(() => getFromLocalStorage('gradingScale', initialGradingScale));
  
  // 디버깅용: gradingScale 값 확인
  console.log('=== useEvaluation Debug ===');
  console.log('gradingScale from localStorage:', getFromLocalStorage('gradingScale', initialGradingScale));
  console.log('current gradingScale state:', gradingScale);
  console.log('gradingScale type:', typeof gradingScale);
  console.log('gradingScale keys:', Object.keys(gradingScale || {}));
  console.log('gradingScale length:', Object.keys(gradingScale || {}).length);
  console.log('initialGradingScale:', initialGradingScale);
  console.log('==========================');
  const [workRateInputs, setWorkRateInputs] = React.useState<Record<string, WorkRateInputs>>(() => getFromLocalStorage('workRateInputs', {}));
  const [attendanceTypes, setAttendanceTypes] = React.useState<AttendanceType[]>(() => MOCK_ATTENDANCE_TYPES);
  const [holidays, setHolidays] = React.useState<Holiday[]>(() => MOCK_HOLIDAYS);
  const [evaluationStatus, setEvaluationStatus] = React.useState<Record<string, 'open' | 'closed'>>(() => getFromLocalStorage('evaluationStatus', {}));

  useDebouncedEffect(() => localStorage.setItem('employees', JSON.stringify(employees)), [employees], 500);
  useDebouncedEffect(() => localStorage.setItem('evaluations', JSON.stringify(evaluations)), [evaluations], 500);
  useDebouncedEffect(() => localStorage.setItem('gradingScale', JSON.stringify(gradingScale)), [gradingScale], 500);
  useDebouncedEffect(() => localStorage.setItem('workRateInputs', JSON.stringify(workRateInputs)), [workRateInputs], 500);
  useDebouncedEffect(() => localStorage.setItem('attendanceTypes', JSON.stringify(attendanceTypes)), [attendanceTypes], 500);
  useDebouncedEffect(() => localStorage.setItem('holidays', JSON.stringify(holidays)), [holidays], 500);
  useDebouncedEffect(() => localStorage.setItem('evaluationStatus', JSON.stringify(evaluationStatus)), [evaluationStatus], 500);
  
  const handleEmployeeUpload = (year: number, month: number, newEmployees: Employee[]) => {
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
  };

  const handleEvaluationUpload = (year: number, month: number, uploadedData: EvaluationUploadData[]) => {
      const key = `${year}-${month}`;
      
      const usersToUpsert: Partial<User>[] = [];
      const employeeData: Employee[] = [];
      const evaluationData: Evaluation[] = [];

      uploadedData.forEach(item => {
        const uniqueId = String(item.uniqueId || '');
        if (!uniqueId) return;

        // Add employee to users list
        usersToUpsert.push({
          uniqueId: uniqueId,
          name: item.name,
          department: item.department,
          title: item.title,
          company: item.company,
          evaluatorId: item.evaluatorId, // This will just update the field, not create a user from it
          roles: ['employee'],
        });
        
        // Add evaluator to users list if they exist in the upload
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

  const handleWorkRateDataUpload = (year: number, month: number, type: keyof WorkRateInputs, newData: any[], isApproved: boolean) => {
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

  const handleClearMyEvaluations = (year: number, month: number, evaluatorId: string) => {
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
  };
  
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

  const getMonthlyEvaluationTargets = React.useCallback((selectedDate: {year: number, month: number}) => {
    const monthKey = `${selectedDate.year}-${selectedDate.month}`;
    const monthlyEmployeeList = employees[monthKey] || [];
    
    if (!Array.isArray(monthlyEmployeeList)) return [];

    const monthlyEmployeeIds = new Set(monthlyEmployeeList.map(e => e.uniqueId));
    return allEvaluationResults.filter(r => r.year === selectedDate.year && r.month === selectedDate.month && monthlyEmployeeIds.has(r.uniqueId));
  }, [allEvaluationResults, employees]);


  const value = {
    gradingScale, setGradingScale,
    evaluations, setEvaluations,
    workRateInputs, setWorkRateInputs,
    attendanceTypes, setAttendanceTypes,
    holidays, setHolidays,
    evaluationStatus, setEvaluationStatus,
    handleEmployeeUpload, handleEvaluationUpload, handleClearEmployeeData,
    handleClearEvaluationData, handleClearWorkRateData, handleWorkRateDataUpload,
    handleClearMyEvaluations,
    allEvaluationResults, monthlyEvaluationTargets: getMonthlyEvaluationTargets
  };

  return <EvaluationContext.Provider value={value}>{children}</EvaluationContext.Provider>;
}

export function useEvaluation() {
  const context = React.useContext(EvaluationContext);
  if (context === undefined) {
    throw new Error('useEvaluation must be used within a EvaluationProvider');
  }
  return context;
}
