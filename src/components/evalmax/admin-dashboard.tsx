'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from './stats-card';
import { Users, FileCheck, AlertTriangle, CheckCircle, BarChart3, Bot, Upload } from 'lucide-react';
import { getFullEvaluationResults, gradingScale } from '@/lib/data';
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
import ManageData from './manage-data';

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
      <h2 className="text-3xl font-bold font-headline tracking-tight">관리자 개요</h2>
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <LayoutDashboardIcon className="mr-2 h-4 w-4" /> 개요
          </TabsTrigger>
          <TabsTrigger value="distributions">
            <BarChart3 className="mr-2 h-4 w-4" /> 등급 분포
          </TabsTrigger>
          <TabsTrigger value="results">
            <FileCheck className="mr-2 h-4 w-4" /> 전체 결과
          </TabsTrigger>
          <TabsTrigger value="consistency">
            <Bot className="mr-2 h-4 w-4" /> AI 일관성 검토
          </TabsTrigger>
          <TabsTrigger value="manage-data">
            <Upload className="mr-2 h-4 w-4" /> 데이터 관리
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="전체 직원"
              value={totalEmployees}
              description="평가 대상 전체 직원 수"
              icon={<Users className="h-4 w-4" />}
            />
            <StatsCard
              title="완료율"
              value={`${completionRate.toFixed(1)}%`}
              description={`${completedEvaluations} / ${totalEmployees} 명 완료`}
              icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            />
            <StatsCard
              title="미제출"
              value={missingEvaluations}
              description="제출 대기중인 평가"
              icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
            />
            <StatsCard
              title="총 지급액"
              value={formatCurrency(allResults.reduce((acc, r) => acc + r.finalAmount, 0))}
              description="예상 총 성과급 지급액"
              icon={<FileCheck className="h-4 w-4" />}
            />
          </div>
          <GradeHistogram data={gradeDistribution} title="전체 등급 분포" />
        </TabsContent>
        <TabsContent value="distributions" className="pt-4">
          <GradeHistogram data={gradeDistribution} title="전체 등급 분포" />
        </TabsContent>
        <TabsContent value="results" className="pt-4">
          <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>부서</TableHead>
                <TableHead>회사</TableHead>
                <TableHead>근무율</TableHead>
                <TableHead>등급</TableHead>
                <TableHead>점수</TableHead>
                <TableHead className="text-right">최종 지급액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allResults.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell>{r.company}</TableCell>
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
        <TabsContent value="manage-data" className="pt-4">
          <ManageData />
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
