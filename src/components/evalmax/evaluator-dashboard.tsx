'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  mockEvaluationGroups,
  mockEmployees,
  gradingScale,
  baseCompensationAmount,
  calculateFinalAmount,
  mockEvaluations,
} from '@/lib/data';
import type { EvaluationGroup, EvaluationResult, Grade } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GradeHistogram } from './grade-histogram';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Check, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export default function EvaluatorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [evaluations, setEvaluations] = React.useState<Record<string, Grade>>(() => {
    const initialState: Record<string, Grade> = {};
    mockEvaluations.forEach(ev => {
      initialState[ev.employeeId] = ev.grade;
    });
    return initialState;
  });

  const evaluatorGroups = React.useMemo(() => {
    if (!user) return [];
    return mockEvaluationGroups.filter(g => g.evaluatorId === user.id);
  }, [user]);

  const handleGradeChange = (employeeId: string, grade: Grade) => {
    setEvaluations(prev => ({ ...prev, [employeeId]: grade }));
  };

  const summary = React.useMemo(() => {
    return evaluatorGroups.map(group => {
      const currentScore = group.memberIds.reduce((acc, memberId) => {
        const grade = evaluations[memberId];
        return acc + (grade ? gradingScale[grade].score : 0);
      }, 0);
      return {
        ...group,
        memberCount: group.memberIds.length,
        completedCount: group.memberIds.filter(id => evaluations[id] !== null).length,
        currentScore,
        remainingScore: group.totalScore - currentScore,
        isOverScore: currentScore > group.totalScore,
      };
    });
  }, [evaluatorGroups, evaluations]);

  const isSaveDisabled = summary.some(s => s.isOverScore);
  
  const handleSave = () => {
    if (isSaveDisabled) {
      toast({
        variant: 'destructive',
        title: 'Error: Score Exceeded',
        description: 'One or more groups have exceeded their total score limit. Please adjust grades before saving.',
      });
      return;
    }
    console.log('Saving evaluations:', evaluations);
    toast({
      title: 'Success!',
      description: 'Your evaluations have been saved successfully.',
      action: <Check className="text-green-500" />,
    });
  };

  const getGroupMembers = (groupId: string): EvaluationResult[] => {
    const group = evaluatorGroups.find(g => g.id === groupId);
    if (!group) return [];
    return group.memberIds.map(id => {
      const employee = mockEmployees.find(e => e.id === id)!;
      const grade = evaluations[id] || null;
      const score = grade ? gradingScale[grade].score : 0;
      const payoutRate = grade ? gradingScale[grade].payoutRate : 0;
      const gradeAmount = baseCompensationAmount * payoutRate;
      const finalAmount = calculateFinalAmount(gradeAmount, employee.workRate);
      
      return {
        ...employee,
        grade,
        score,
        baseAmount: baseCompensationAmount,
        gradeAmount,
        finalAmount,
        evaluatorName: user?.name || 'N/A',
      }
    });
  };
  
  const assignedEmployeesCount = evaluatorGroups.reduce((acc, g) => acc + g.memberIds.length, 0);

  const gradeDistribution = Object.keys(gradingScale)
    .map(grade => ({
      name: grade,
      value: Object.values(evaluations).filter(g => g === grade).length,
    }))
    .filter(item => item.value > 0);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-headline tracking-tight">Evaluation Hub</h2>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Users />Evaluation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Total Score</TableHead>
                <TableHead>Current Score</TableHead>
                <TableHead>Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map(s => (
                <TableRow key={s.id} className={s.isOverScore ? 'bg-destructive/10' : ''}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.memberCount}</TableCell>
                  <TableCell>{s.completedCount}</TableCell>
                  <TableCell>{s.totalScore}</TableCell>
                  <TableCell className={s.isOverScore ? 'font-bold text-destructive' : ''}>{s.currentScore}</TableCell>
                  <TableCell className={s.isOverScore ? 'font-bold text-destructive' : ''}>{s.remainingScore}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {isSaveDisabled && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Total Score Exceeded</AlertTitle>
              <AlertDescription>
                You cannot save until the "Current Score" is less than or equal to the "Total Score" for all groups.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {evaluatorGroups.map(group => (
                 <Card key={group.id}>
                    <CardHeader><CardTitle className="font-headline">{group.name} - Evaluation Sheet</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                        <TableHeader><TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Work Rate</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead className="text-right">Final Amount</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {getGroupMembers(group.id).map(emp => (
                                <TableRow key={emp.id}>
                                    <TableCell className="font-medium">{emp.name}</TableCell>
                                    <TableCell>{(emp.workRate * 100).toFixed(1)}%</TableCell>
                                    <TableCell>
                                    <Select value={evaluations[emp.id] || ''} onValueChange={(g: Grade) => handleGradeChange(emp.id, g)}>
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder="Select Grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                        {Object.keys(gradingScale).map(grade => (
                                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    </TableCell>
                                    <TableCell>{emp.score}</TableCell>
                                    <TableCell className="text-right">{new Intl.NumberFormat('ko-KR').format(emp.finalAmount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
            ))}
          </div>
          <div className="space-y-6">
            <GradeHistogram data={gradeDistribution} title="My Grade Distribution" />
            <Button onClick={handleSave} disabled={isSaveDisabled} className="w-full" size="lg">
                <Check className="mr-2"/> Save All Evaluations
            </Button>
          </div>
      </div>
    </div>
  );
}
