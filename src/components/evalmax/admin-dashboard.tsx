'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  FileCheck, 
  Bot, 
  Upload, 
  LayoutDashboard, 
  Settings, 
  Download, 
  Bell, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  ClipboardX, 
  ChevronUp, 
  ChevronDown, 
  CheckCircle2, 
  ChevronsUpDown, 
  Save, 
  X, 
  ThumbsUp, 
  ThumbsDown, 
  Inbox, 
  FileText, 
  AlertTriangle, 
  UserCog, 
  Settings2, 
  Lock, 
  Unlock,
  TrendingUp,
  BarChart3,
  CheckCircle,
  Send
} from 'lucide-react';
import { useEvaluation } from '@/contexts/evaluation-context';
import { useNotifications } from '@/contexts/notification-context';
import { useAuth } from '@/contexts/auth-context';
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
  const { notifications, addNotification, deleteNotification, approvals } = useNotifications();

  const results = monthlyEvaluationTargets(selectedDate);

  return (
    <div className="space-y-4">
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
        onApprovalAction={() => {}}
        notifications={notifications}
        addNotification={addNotification}
        deleteNotification={deleteNotification}
        approvals={approvals}
      />
    </div>
  );
}
