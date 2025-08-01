'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useEvaluation } from '@/contexts/evaluation-context';
import { useNotifications } from '@/contexts/notification-context';
import { useRouter } from 'next/navigation';
import { Loader2, LayoutDashboard, FileCheck, Eye, Database, Upload, Users, Settings, Bot, Edit2, ListChecks, Hourglass, Gauge, ListTodo, CalendarDays, CalendarClock, Settings2, Inbox, UserCog, Medal, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/components/evalmax/sidebar';
import { Sidebar } from '@/components/evalmax/sidebar';
import Header from '@/components/evalmax/header';
import AdminDashboard from '@/components/evalmax/admin-dashboard';
import EvaluatorDashboard from '@/components/evalmax/evaluator-dashboard';
import EmployeeDashboard from '@/components/evalmax/employee-dashboard';
import PersonalSettings from '@/components/evalmax/personal-settings';
import type { EmployeeView, EvaluatorView, User } from '@/lib/types';


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
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const year = lastMonthDate.getFullYear();
    const month = lastMonthDate.getMonth() + 1;
    return { year, month };
};

export default function Home() {
  const { user, userMap, loading: authLoading, logout, role, setRole, upsertUsers } = useAuth();
  const {
      monthlyEvaluationTargets,
      allEvaluationResults,
      evaluationStatus,
      setEvaluationStatus,
      workRateInputs
  } = useEvaluation();
  const router = useRouter();

  const {
      notifications, unreadNotificationCount, addNotification, deleteNotification, markNotificationsAsRead,
      approvals, unreadApprovalCount, handleApprovalAction, markApprovalsAsRead
  } = useNotifications();
  
  const [selectedDate, setSelectedDate] = React.useState(getInitialDate);
  
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = React.useState(true);
  const [adminActiveView, setAdminActiveView] = React.useState('dashboard');

  const [isEvaluatorSidebarOpen, setIsEvaluatorSidebarOpen] = React.useState(true);
  const [evaluatorActiveView, setEvaluatorActiveView] = React.useState<EvaluatorView>('evaluation-input');

  const [isEmployeeSidebarOpen, setIsEmployeeSidebarOpen] = React.useState(true);
  const [employeeActiveView, setEmployeeActiveView] = React.useState<EmployeeView>('my-review');


  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  const handleEvaluationStatusChange = (year: number, month: number, status: 'open' | 'closed') => {
    const key = `${year}-${month}`;
    setEvaluationStatus(prev => ({ ...prev, [key]: status }));

    if (status === 'closed') {
        const monthEmployees = monthlyEvaluationTargets(selectedDate);
        const evaluatorIds = new Set(monthEmployees.map(e => e.evaluatorId).filter(Boolean));
        const employeeIds = new Set(monthEmployees.map(e => e.uniqueId));
        const message = `${year}년 ${month}월 평가가 최종 마감되었습니다.`;
        evaluatorIds.forEach(id => addNotification({ recipientId: id!, message }));
        employeeIds.forEach(id => addNotification({ recipientId: id, message }));
    }
  };
  
  const handleUserUpdate = (userId: string, updatedData: Partial<User>) => {
    if (!updatedData.uniqueId) return;
    upsertUsers([{ ...updatedData, uniqueId: updatedData.uniqueId }]);
  };


  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        if (adminActiveView === 'personal-settings' && user) {
            return <PersonalSettings user={user} onUserUpdate={handleUserUpdate} />;
        }
        const currentMonthStatus = evaluationStatus[`${selectedDate.year}-${selectedDate.month}`] || 'open';
        return <AdminDashboard 
                  activeView={adminActiveView}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  userMap={userMap}
                  evaluationStatus={currentMonthStatus}
                  onEvaluationStatusChange={handleEvaluationStatusChange}
                />;
      case 'evaluator':
        if (evaluatorActiveView === 'personal-settings' && user) {
            return <PersonalSettings user={user} onUserUpdate={handleUserUpdate} />;
        }
        
        return <EvaluatorDashboard 
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate} 
                  activeView={evaluatorActiveView}
                  userMap={userMap}
                />;
      case 'employee':
        if (employeeActiveView === 'personal-settings' && user) {
            return <PersonalSettings user={user} onUserUpdate={handleUserUpdate} />;
        }
        const myEmployeeInfo = monthlyEvaluationTargets(selectedDate).find(e => e.uniqueId === user?.uniqueId);
        const myApprovals = approvals.filter(a => a.requesterId === user?.uniqueId);
        
        // 현재 사용자의 모든 평가 결과를 가져옴 (연도 제한 없이)
        const allMyResults = allEvaluationResults.filter(e => e.uniqueId === user?.uniqueId);
        
        // 실제 데이터가 있는 연도를 찾음
        const availableYears = [...new Set(allMyResults.map(r => r.year))].sort((a, b) => b - a);
        const targetYear = availableYears.length > 0 ? availableYears[0] : selectedDate.year;
        
        // 대상 연도의 데이터만 필터링하고, 등급이 있는 데이터만 포함
        const filteredResults = allMyResults.filter(e => e.year === targetYear && e.grade !== null);
        
        return <EmployeeDashboard 
                  employeeResults={myEmployeeInfo ? [myEmployeeInfo] : []}
                  allResultsForYear={filteredResults}
                  allResultsForMonth={monthlyEvaluationTargets(selectedDate)}
                  activeView={employeeActiveView}
                  workRateInputs={workRateInputs}
                  selectedDate={selectedDate}
                  onApprovalAction={handleApprovalAction}
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
      user={user}
      userMap={userMap}
      role={role}
      setRole={setRole}
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

  if (authLoading) {
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
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
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
