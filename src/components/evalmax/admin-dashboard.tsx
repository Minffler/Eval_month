'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from './stats-card';
import { Users, FileCheck, AlertTriangle, CheckCircle, BarChart3, Bot, Upload, LayoutDashboard, UserCheckIcon } from 'lucide-react';
import { getFullEvaluationResults, gradingScale, calculateFinalAmount, mockEvaluationGroups } from '@/lib/data';
import { GradeHistogram } from './grade-histogram';
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
import { ConsistencyValidator } from './consistency-validator';
import ManageData from './manage-data';
import type { EvaluationResult, Grade, EvaluationGroup } from '@/lib/types';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const [results, setResults] = React.useState<EvaluationResult[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    setResults(getFullEvaluationResults());
  }, []);
  
  const employeeGroupMap = React.useMemo(() => {
    const map = new Map<string, EvaluationGroup>();
    mockEvaluationGroups.forEach(group => {
        group.memberIds.forEach(memberId => {
            map.set(memberId, group);
        });
    });
    return map;
  }, []);

  const totalEmployees = results.length;
  const completedEvaluations = results.filter(r => r.grade !== null).length;
  const completionRate = totalEmployees > 0 ? (completedEvaluations / totalEmployees) * 100 : 0;
  const missingEvaluations = totalEmployees - completedEvaluations;

  const gradeDistribution = Object.keys(gradingScale).map(grade => ({
    name: grade,
    value: results.filter(r => r.grade === grade).length,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  const handleBaseAmountChange = (employeeId: string, newAmountStr: string) => {
    const newAmount = Number(newAmountStr);
    if (isNaN(newAmount)) return;

    setResults(prevResults => prevResults.map(r => {
      if (r.id === employeeId) {
        const payoutRate = r.grade ? gradingScale[r.grade].payoutRate : 0;
        const newGradeAmount = newAmount * payoutRate;
        const newFinalAmount = calculateFinalAmount(newGradeAmount, r.workRate);
        return { 
          ...r, 
          baseAmount: newAmount,
          gradeAmount: newGradeAmount,
          finalAmount: newFinalAmount,
        };
      }
      return r;
    }));
  };

  const handleGradeChange = (employeeId: string, newGradeStr: string) => {
    const newGrade = newGradeStr as Grade;
    setResults(prevResults => prevResults.map(r => {
      if (r.id === employeeId) {
        const score = newGrade ? gradingScale[newGrade].score : 0;
        const payoutRate = newGrade ? gradingScale[newGrade].payoutRate : 0;
        const gradeAmount = r.baseAmount * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, r.workRate);
        return { 
          ...r,
          grade: newGrade,
          score,
          gradeAmount,
          finalAmount,
        };
      }
      return r;
    }));
  };
  
  const handleSaveChanges = () => {
    // In a real app, you would send this data to a server.
    console.log("Saving updated results:", results);
    toast({
      title: "변경사항 저장됨",
      description: "기준금액 및 등급 변경사항이 성공적으로 저장되었습니다."
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-headline tracking-tight">관리자 개요</h2>
      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" /> 대시보드
          </TabsTrigger>
          <TabsTrigger value="results">
            <FileCheck className="mr-2 h-4 w-4" /> 전체 결과
          </TabsTrigger>
           <TabsTrigger value="manage-data">
            <Upload className="mr-2 h-4 w-4" /> 데이터 관리
          </TabsTrigger>
          <TabsTrigger value="matcher">
            <UserCheckIcon className="mr-2 h-4 w-4" /> 평가자 매칭
          </TabsTrigger>
          <TabsTrigger value="consistency">
            <Bot className="mr-2 h-4 w-4" /> AI 일관성 검토
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-4 pt-4">
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
              value={`${formatCurrency(results.reduce((acc, r) => acc + r.finalAmount, 0))} 원`}
              description="예상 총 성과급 지급액"
              icon={<FileCheck className="h-4 w-4" />}
            />
          </div>
          <GradeHistogram data={gradeDistribution} title="전체 등급 분포" />
        </TabsContent>
        <TabsContent value="results" className="pt-4">
          <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>고유사번</TableHead>
                <TableHead>사번</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>직책/레벨</TableHead>
                <TableHead>근무율</TableHead>
                <TableHead>그룹 총점</TableHead>
                <TableHead>점수</TableHead>
                <TableHead>등급</TableHead>
                <TableHead>기준금액</TableHead>
                <TableHead>등급금액</TableHead>
                <TableHead>최종금액</TableHead>
                <TableHead>평가자</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map(r => {
                const group = employeeGroupMap.get(r.id);
                return (
                  <TableRow key={r.id}>
                    <TableCell>{r.uniqueId}</TableCell>
                    <TableCell>{r.id}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{`${r.title} / ${r.growthLevel}`}</TableCell>
                    <TableCell>{(r.workRate * 100).toFixed(1)}%</TableCell>
                    <TableCell>{group ? group.totalScore : 'N/A'}</TableCell>
                    <TableCell>{r.score}</TableCell>
                    <TableCell>
                      <Select value={r.grade || ''} onValueChange={(g) => handleGradeChange(r.id, g)}>
                          <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="선택" />
                          </SelectTrigger>
                          <SelectContent>
                          {Object.keys(gradingScale).map(grade => (
                              <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        value={r.baseAmount}
                        onChange={(e) => handleBaseAmountChange(r.id, e.target.value)}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(r.gradeAmount)}</TableCell>
                    <TableCell>{formatCurrency(r.finalAmount)}</TableCell>
                    <TableCell>{r.evaluatorName}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveChanges}>변경사항 저장</Button>
          </div>
        </TabsContent>
        <TabsContent value="manage-data" className="pt-4">
          <ManageData />
        </TabsContent>
         <TabsContent value="matcher" className="pt-4">
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">평가자 매칭</h3>
            <p className="text-muted-foreground mt-2">이곳에서 피평가자와 평가자를 연결하고 관리할 수 있습니다. (기능 구현 예정)</p>
          </div>
        </TabsContent>
        <TabsContent value="consistency" className="pt-4">
          <ConsistencyValidator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
