'use client';

import * as React from 'react';
import { useEvaluation } from '@/contexts/evaluation-context';
import { useNotifications } from '@/contexts/notification-context';
import type { User, EvaluationResult, Approval, AppNotification, ShortenedWorkType } from '@/lib/types';
import AdminDashboardContent from './admin-dashboard-content';

interface AdminDashboardProps {
  activeView: string;
  selectedDate: { year: number; month: number };
  setSelectedDate: (date: { year: number; month: number }) => void;
  userMap: Map<string, User>;
  evaluationStatus: 'open' | 'closed';
  onEvaluationStatusChange: (year: number, month: number, status: 'open' | 'closed') => void;
}

export default function AdminDashboard({ 
  activeView,
  selectedDate,
  setSelectedDate,
  userMap,
  evaluationStatus,
  onEvaluationStatusChange,
}: AdminDashboardProps) {
  const { 
    gradingScale, setGradingScale,
    attendanceTypes, setAttendanceTypes,
    holidays, setHolidays,
    workRateInputs,
    monthlyEvaluationTargets
  } = useEvaluation();
  const { onApprovalAction, notifications, addNotification, deleteNotification, approvals } = useNotifications();

  const results = monthlyEvaluationTargets(selectedDate);
  
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <AdminDashboardContent
        activeView={activeView}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        userMap={userMap}
        evaluationStatus={evaluationStatus}
        onEvaluationStatusChange={onEvaluationStatusChange}
        results={results}
        gradingScale={gradingScale}
        setGradingScale={setGradingScale}
        attendanceTypes={attendanceTypes}
        setAttendanceTypes={setAttendanceTypes}
        holidays={holidays}
        setHolidays={setHolidays}
        workRateInputs={workRateInputs}
        onApprovalAction={onApprovalAction}
        notifications={notifications}
        addNotification={addNotification}
        deleteNotification={deleteNotification}
        approvals={approvals}
      />
    </div>
  );
}
