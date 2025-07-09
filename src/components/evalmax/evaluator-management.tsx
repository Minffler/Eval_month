'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EvaluationResult, User } from '@/lib/types';
import { mockUsers } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface EvaluatorManagementProps {
  results: EvaluationResult[];
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
}

export default function EvaluatorManagement({
  results,
  handleResultsUpdate,
}: EvaluatorManagementProps) {
  const [filteredResults, setFilteredResults] = React.useState(results);
  const [companyFilter, setCompanyFilter] = React.useState('all');
  const [departmentFilter, setDepartmentFilter] = React.useState('all');
  const { toast } = useToast();

  React.useEffect(() => {
    setFilteredResults(results);
  }, [results]);

  const allCompanies = ['all', ...Array.from(new Set(results.map((r) => r.company)))];
  const allDepartments = ['all', ...Array.from(new Set(results.map((r) => r.department)))];

  React.useEffect(() => {
    let newFilteredResults = results;
    if (companyFilter !== 'all') {
      newFilteredResults = newFilteredResults.filter((r) => r.company === companyFilter);
    }
    if (departmentFilter !== 'all') {
      newFilteredResults = newFilteredResults.filter(
        (r) => r.department === departmentFilter
      );
    }
    setFilteredResults(newFilteredResults);
  }, [companyFilter, departmentFilter, results]);

  const evaluators = mockUsers.filter(u => u.roles.includes('evaluator'));

  const handleEvaluatorChange = (employeeId: string, newEvaluatorId: string) => {
    const updatedResults = results.map((r) => {
      if (r.id === employeeId) {
        const evaluator = mockUsers.find(u => u.id === newEvaluatorId);
        return { 
          ...r, 
          evaluatorId: newEvaluatorId,
          evaluatorName: evaluator?.name || 'N/A'
        };
      }
      return r;
    });
    // This will update the state in page.tsx
    handleResultsUpdate(updatedResults);
  };
  
  const handleSaveChanges = () => {
    // The changes are already applied via handleResultsUpdate when select changes.
    // This button can be for user feedback.
    toast({
        title: "저장 완료",
        description: "평가자 변경사항이 저장되었습니다.",
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>평가자 관리</CardTitle>
          <CardDescription>
            회사, 소속부서별로 직원의 평가자를 매칭하고 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="회사 선택" />
              </SelectTrigger>
              <SelectContent>
                {allCompanies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === 'all' ? '모든 회사' : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="소속부서 선택" />
              </SelectTrigger>
              <SelectContent>
                {allDepartments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d === 'all' ? '모든 부서' : d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>고유사번</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>회사</TableHead>
                  <TableHead>소속부서</TableHead>
                  <TableHead>평가자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>{result.uniqueId}</TableCell>
                    <TableCell>{result.name}</TableCell>
                    <TableCell>{result.company}</TableCell>
                    <TableCell>{result.department}</TableCell>
                    <TableCell>
                      <Select
                        value={result.evaluatorId}
                        onValueChange={(newEvaluatorId) =>
                          handleEvaluatorChange(result.id, newEvaluatorId)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="평가자 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {evaluators.map((evaluator) => (
                            <SelectItem key={evaluator.id} value={evaluator.id}>
                              {evaluator.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           <div className="flex justify-end mt-4">
              <Button onClick={handleSaveChanges}>
                변경사항 저장
              </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
