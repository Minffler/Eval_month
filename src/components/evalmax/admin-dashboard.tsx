'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from './stats-card';
import { Users, FileCheck, AlertTriangle, CheckCircle, BarChart3, Bot } from 'lucide-react';
import { mockEvaluations, getFullEvaluationResults, gradingScale } from '@/lib/data';
import { GradeHistogram } from './grade-histogram';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ConsistencyValidator } from './consistency-validator';

export default function AdminDashboard() {
  const allResults = getFullEvaluationResults();
  const totalEmployees = allResults.length;
  const completedEvaluations = allResults.filter(r => r.grade !== null).length;
  const completionRate = totalEmployees > 0 ? (completedEvaluations / totalEmployees) * 100 : 0;
  const missingEvaluations = totalEmployees - completedEvaluations;

  const gradeDistribution = Object.keys(gradingScale).map(grade => ({
    name: grade,
    value: allResults.filter(r => r.grade === grade).length,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-headline tracking-tight">Admin Overview</h2>
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <LayoutDashboardIcon className="mr-2 h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="distributions">
            <BarChart3 className="mr-2 h-4 w-4" /> Distributions
          </TabsTrigger>
          <TabsTrigger value="results">
            <FileCheck className="mr-2 h-4 w-4" /> All Results
          </TabsTrigger>
          <TabsTrigger value="consistency">
            <Bot className="mr-2 h-4 w-4" /> AI Consistency Check
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Employees"
              value={totalEmployees}
              description="Total employees eligible for evaluation"
              icon={<Users className="h-4 w-4" />}
            />
            <StatsCard
              title="Completion Rate"
              value={`${completionRate.toFixed(1)}%`}
              description={`${completedEvaluations} of ${totalEmployees} completed`}
              icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            />
            <StatsCard
              title="Missing Submissions"
              value={missingEvaluations}
              description="Evaluations pending submission"
              icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
            />
            <StatsCard
              title="Total Payout"
              value={formatCurrency(allResults.reduce((acc, r) => acc + r.finalAmount, 0))}
              description="Estimated total performance payout"
              icon={<FileCheck className="h-4 w-4" />}
            />
          </div>
          <GradeHistogram data={gradeDistribution} />
        </TabsContent>
        <TabsContent value="distributions" className="pt-4">
          <GradeHistogram data={gradeDistribution} />
        </TabsContent>
        <TabsContent value="results" className="pt-4">
          <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Work Rate</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Final Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allResults.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell>{(r.workRate * 100).toFixed(1)}%</TableCell>
                  <TableCell><Badge variant={r.grade && r.grade.startsWith('S') || r.grade?.startsWith('A') ? 'default' : 'secondary'}>{r.grade || 'N/A'}</Badge></TableCell>
                  <TableCell>{r.score}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.finalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </TabsContent>
        <TabsContent value="consistency" className="pt-4">
          <ConsistencyValidator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LayoutDashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7"height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}
