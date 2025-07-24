import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, User, Star } from 'lucide-react';

interface PendingAssignment {
  id: string;
  employeeName: string;
  department: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

interface EvaluationInputProps {
  pendingAssignments: PendingAssignment[];
  selectedMonth: string;
}

/**
 * 평가 입력 컴포넌트
 * 대기 중인 과제에 대한 평가를 입력
 */
export const EvaluationInput: React.FC<EvaluationInputProps> = ({
  pendingAssignments,
  selectedMonth
}) => {
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [evaluationData, setEvaluationData] = useState({
    score: '',
    comment: '',
    strengths: '',
    improvements: ''
  });

  const selectedAssignmentData = pendingAssignments.find(
    assignment => assignment.id === selectedAssignment
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 평가 데이터 저장 로직
    console.log('평가 제출:', { assignmentId: selectedAssignment, ...evaluationData });
    
    // 폼 초기화
    setSelectedAssignment('');
    setEvaluationData({
      score: '',
      comment: '',
      strengths: '',
      improvements: ''
    });
  };

  const getPriorityBadge = (priority: PendingAssignment['priority']) => {
    const priorityConfig = {
      low: { label: '낮음', variant: 'secondary' as const },
      medium: { label: '보통', variant: 'default' as const },
      high: { label: '높음', variant: 'destructive' as const }
    };
    
    const config = priorityConfig[priority];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          평가 입력
          <Badge variant="outline" className="ml-auto">
            {pendingAssignments.length}개 대기
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingAssignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>평가할 과제가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 과제 선택 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                평가할 과제 선택
              </label>
              <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                <SelectTrigger>
                  <SelectValue placeholder="과제를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {pendingAssignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{assignment.employeeName}</span>
                        {getPriorityBadge(assignment.priority)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 평가 입력 폼 */}
            {selectedAssignmentData && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{selectedAssignmentData.employeeName}</span>
                    <span className="text-gray-500">({selectedAssignmentData.department})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(selectedAssignmentData.priority)}
                    <span className="text-sm text-gray-500">
                      마감일: {new Date(selectedAssignmentData.dueDate).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>

                {/* 점수 입력 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    <Star className="h-4 w-4 inline mr-1" />
                    평가 점수
                  </label>
                  <Select 
                    value={evaluationData.score} 
                    onValueChange={(value) => setEvaluationData(prev => ({ ...prev, score: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="점수를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score}점
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 종합 의견 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    종합 의견
                  </label>
                  <Textarea
                    placeholder="전반적인 평가 의견을 작성하세요"
                    value={evaluationData.comment}
                    onChange={(e) => setEvaluationData(prev => ({ ...prev, comment: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* 강점 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    주요 강점
                  </label>
                  <Textarea
                    placeholder="직원의 주요 강점을 작성하세요"
                    value={evaluationData.strengths}
                    onChange={(e) => setEvaluationData(prev => ({ ...prev, strengths: e.target.value }))}
                    rows={2}
                  />
                </div>

                {/* 개선점 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    개선점
                  </label>
                  <Textarea
                    placeholder="개선이 필요한 부분을 작성하세요"
                    value={evaluationData.improvements}
                    onChange={(e) => setEvaluationData(prev => ({ ...prev, improvements: e.target.value }))}
                    rows={2}
                  />
                </div>

                {/* 제출 버튼 */}
                <Button type="submit" className="w-full" disabled={!evaluationData.score}>
                  평가 제출
                </Button>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 