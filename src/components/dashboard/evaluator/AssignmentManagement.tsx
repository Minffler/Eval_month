import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, User, Clock } from 'lucide-react';

interface Assignment {
  id: string;
  employeeName: string;
  department: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface AssignmentManagementProps {
  assignments: Assignment[];
  selectedMonth: string;
}

/**
 * 과제 관리 컴포넌트
 * 평가 과제 목록과 상태를 관리
 */
export const AssignmentManagement: React.FC<AssignmentManagementProps> = ({
  assignments,
  selectedMonth
}) => {
  const getStatusBadge = (status: Assignment['status']) => {
    const statusConfig = {
      pending: { label: '대기', variant: 'secondary' as const },
      in_progress: { label: '진행중', variant: 'default' as const },
      completed: { label: '완료', variant: 'default' as const }
    };
    
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: Assignment['priority']) => {
    const priorityConfig = {
      low: { label: '낮음', variant: 'secondary' as const },
      medium: { label: '보통', variant: 'default' as const },
      high: { label: '높음', variant: 'destructive' as const }
    };
    
    const config = priorityConfig[priority];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          과제 관리
          <Badge variant="outline" className="ml-auto">
            {assignments.length}개
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>이번 달 배정된 과제가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>직원</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>마감일</TableHead>
                  <TableHead>우선순위</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {assignment.employeeName}
                      </div>
                    </TableCell>
                    <TableCell>{assignment.department}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className={isOverdue(assignment.dueDate) ? 'text-red-600' : ''}>
                          {formatDate(assignment.dueDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(assignment.priority)}</TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={assignment.status === 'completed'}
                      >
                        {assignment.status === 'pending' ? '시작' : '계속'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 