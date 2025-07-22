
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
import type { EvaluationResult } from '@/lib/types';
import { useEvaluation } from '@/contexts/evaluation-context';
import { getPositionSortValue } from '@/lib/data';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '../ui/input';

interface AssignmentManagementViewProps {
  myEmployees: EvaluationResult[];
  currentMonthResults: EvaluationResult[];
  evaluatorId: string;
  evaluatorName: string;
}

type SortConfig = {
  key: keyof EvaluationResult;
  direction: 'ascending' | 'descending';
} | null;

export default function AssignmentManagementView({ myEmployees, currentMonthResults, evaluatorId, evaluatorName }: AssignmentManagementViewProps) {
  const { handleEmployeeUpload } = useEvaluation();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'name', direction: 'ascending' });

  const filteredAndSortedEmployees = React.useMemo(() => {
    let employees = myEmployees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.uniqueId.includes(searchTerm)
    );

    if (sortConfig !== null) {
      employees.sort((a, b) => {
        if (sortConfig.key === 'title') {
          const orderA = getPositionSortValue(a.title);
          const orderB = getPositionSortValue(b.title);
          if (orderA !== orderB) {
            return sortConfig.direction === 'ascending' ? orderA - orderB : orderB - orderA;
          }
        }

        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return employees;
  }, [myEmployees, searchTerm, sortConfig]);

  const requestSort = (key: keyof EvaluationResult) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof EvaluationResult) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4 text-primary" /> : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>담당 소속 관리</CardTitle>
        <CardDescription>현재 내가 평가를 담당하고 있는 직원 목록입니다.</CardDescription>
        <div className="pt-2">
            <Input 
                placeholder="이름 또는 ID로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('uniqueId')}><div className="flex items-center justify-center">ID{getSortIcon('uniqueId')}</div></TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('name')}><div className="flex items-center justify-center">이름{getSortIcon('name')}</div></TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('department')}><div className="flex items-center justify-center">소속부서{getSortIcon('department')}</div></TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('title')}><div className="flex items-center justify-center">직책{getSortIcon('title')}</div></TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => requestSort('growthLevel')}><div className="flex items-center justify-center">성장레벨{getSortIcon('growthLevel')}</div></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="text-center">{employee.uniqueId}</TableCell>
                  <TableCell className="text-center">{employee.name}</TableCell>
                  <TableCell className="text-center">{employee.department}</TableCell>
                  <TableCell className="text-center">{employee.title}</TableCell>
                  <TableCell className="text-center">{employee.growthLevel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
