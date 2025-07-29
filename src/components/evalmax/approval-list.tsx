'use client';

import * as React from 'react';
import type { Approval } from '@/lib/types';
import { StatusBadge } from './status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Clock, User, FileText, Eye } from 'lucide-react';

interface ApprovalListProps {
  approvals: Approval[];
  onViewApproval: (approval: Approval) => void;
  userRole: 'admin' | 'evaluator' | 'employee';
  currentUserId: string;
}

export function ApprovalList({
  approvals,
  onViewApproval,
  userRole,
  currentUserId
}: ApprovalListProps) {
  const filteredApprovals = React.useMemo(() => {
    return approvals.filter(approval => {
      // 관리자는 모든 결재를 볼 수 있음
      if (userRole === 'admin') return true;
      
      // 평가자는 자신이 결재자인 요청들을 볼 수 있음
      if (userRole === 'evaluator') {
        return approval.approverTeamId === currentUserId;
      }
      
      // 직원은 자신이 요청한 결재들을 볼 수 있음
      if (userRole === 'employee') {
        return approval.requesterId === currentUserId;
      }
      
      return false;
    });
  }, [approvals, userRole, currentUserId]);

  const getStatusPriority = (approval: Approval) => {
    // 우선순위: 반려 > 결재중 > 현업승인 > 최종승인
    if (approval.status === '반려' || approval.statusHR === '반려') return 0;
    if (approval.status === '결재중') return 1;
    if (approval.status === '현업승인' && approval.statusHR === '결재중') return 2;
    if (approval.statusHR === '최종승인') return 3;
    return 4;
  };

  const sortedApprovals = React.useMemo(() => {
    return [...filteredApprovals].sort((a, b) => {
      const priorityA = getStatusPriority(a);
      const priorityB = getStatusPriority(b);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 같은 우선순위면 최신순
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [filteredApprovals]);

  const getActionRequired = (approval: Approval) => {
    if (userRole === 'evaluator' && approval.approverTeamId === currentUserId) {
      return approval.status === '결재중' ? '1차 결재 필요' : null;
    }
    
    if (userRole === 'admin' && approval.approverHRId === currentUserId) {
      if (approval.status === '현업승인' && approval.statusHR === '결재중') {
        return '2차 결재 필요';
      }
      if (approval.status === '결재중' && approval.statusHR === '결재중') {
        return '1차 결재 생략 가능';
      }
    }
    
    return null;
  };

  const getPayloadSummary = (approval: Approval) => {
    const { payload } = approval;
    const dataTypeText = payload.dataType === 'shortenedWorkHours' ? '단축근로' : '일근태';
    const actionText = payload.action === 'add' ? '추가' : payload.action === 'edit' ? '수정' : '삭제';
    
    return `${dataTypeText} ${actionText}`;
  };

  if (sortedApprovals.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>처리할 결재가 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            결재 목록
            <Badge variant="secondary" className="ml-2">
              {sortedApprovals.length}건
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>요청자</TableHead>
                <TableHead>변경 내용</TableHead>
                <TableHead>요청일시</TableHead>
                <TableHead>1차 결재</TableHead>
                <TableHead>2차 결재</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedApprovals.map((approval) => {
                const actionRequired = getActionRequired(approval);
                
                return (
                  <TableRow key={approval.id} className={actionRequired ? 'bg-yellow-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{approval.requesterName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{getPayloadSummary(approval)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(approval.date), 'MM-dd HH:mm')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <StatusBadge status={approval.status} size="sm" />
                        {approval.approvedAtTeam && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(approval.approvedAtTeam), 'MM-dd HH:mm')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <StatusBadge status={approval.statusHR} size="sm" />
                        {approval.approvedAtHR && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(approval.approvedAtHR), 'MM-dd HH:mm')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {actionRequired && (
                          <Badge variant="destructive" className="text-xs">
                            {actionRequired}
                          </Badge>
                        )}
                        {(approval.status === '반려' || approval.statusHR === '반려') && (
                          <Badge variant="outline" className="text-xs">
                            반려됨
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewApproval(approval)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        상세보기
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 