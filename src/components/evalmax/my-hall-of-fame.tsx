'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp, Medal, Trophy, Award } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import type { EvaluationResult } from '@/lib/types';
import { cn } from '@/lib/utils';

// 뱃지 정보 객체 정의: UI 구현의 핵심입니다.
// 등급별로 뱃지의 이름, 아이콘, 그리고 가장 중요한 '색상'을 tailwind 클래스로 정의합니다.
const badgeInfo: Record<string, {label: string, icon: React.ElementType, color: string}> = {
    'S': { label: 'Platinum', icon: Award, color: 'text-purple-500' },
    'A+': { label: 'Gold', icon: Award, color: 'text-yellow-500' },
    'A': { label: 'Silver', icon: Award, color: 'text-gray-500' },
    'B+': { label: 'Bronze', icon: Award, color: 'text-muted-foreground' },
    'B': { label: 'Standard', icon: Award, color: 'text-muted-foreground' },
    'B-': { label: 'Standard', icon: Award, color: 'text-muted-foreground' },
    'C': { label: 'Standard', icon: Award, color: 'text-orange-500' },
    'C-': { label: 'Standard', icon: Award, color: 'text-orange-500' },
    'D': { label: 'Standard', icon: Award, color: 'text-red-500' },
};

interface MyHallOfFameProps {
    allResultsForYear: EvaluationResult[];
}

export default function MyHallOfFame({ allResultsForYear }: MyHallOfFameProps) {
    // 상태 관리: 카드의 열림/닫힘 상태를 관리합니다.
    const [isHallOfFameOpen, setIsHallOfFameOpen] = React.useState(true);

    // 로직: 획득한 뱃지 내역 계산
    // 연간 평가 결과에서 S, A+, A 등급만 필터링합니다.
    // useMemo를 사용하여 성능을 최적화하고, 최신순으로 정렬합니다.
    const acquiredBadges = React.useMemo(() => 
        allResultsForYear
            .filter(r => r.grade && ['S', 'A+', 'A'].includes(r.grade)) // S, A+, A 등급만 필터링
            .map(r => ({ month: r.month, grade: r.grade! }))
            .sort((a,b) => b.month - a.month)
    , [allResultsForYear]);

    // 연간 트로피 (현재는 UI만 구현된 상태이며, 향후 로직 추가를 위한 확장성 확보)
    const trophy = null;

    return (
        // UI 구현: Collapsible 컴포넌트로 전체를 감싸 접고 펼치는 기능을 만듭니다.
        <Collapsible open={isHallOfFameOpen} onOpenChange={setIsHallOfFameOpen} asChild>
            <Card>
                <CollapsibleTrigger asChild>
                     <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                        <div>
                            <CardTitle>나의 명예의 전당</CardTitle>
                            <CardDescription>획득한 뱃지와 트로피를 확인하세요.</CardDescription>
                        </div>
                         <Button variant="ghost" size="icon">{isHallOfFameOpen ? <ChevronUp /> : <ChevronDown />}</Button>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    {/* 카드 내용은 2단 그리드로 구성 (md:grid-cols-2) */}
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 디지털 뱃지 섹션 */}
                        <div className="space-y-4">
                            {/* 섹션 제목: Medal 아이콘과 텍스트 */}
                            <h3 className="font-semibold flex items-center gap-2">
                                <Medal className="text-yellow-500" /> 디지털 뱃지
                            </h3>
                            {/* 뱃지 목록 영역: 테두리(border), 둥근 모서리(rounded-lg), 스크롤(overflow-y-auto) 적용 */}
                            <div className="p-4 border rounded-lg h-48 overflow-y-auto">
                                {acquiredBadges.length > 0 ? (
                                    <ul className="space-y-3">
                                        {/* 획득한 뱃지 목록 렌더링 */}
                                        {acquiredBadges.map(({ month, grade }) => {
                                            const badge = badgeInfo[grade];
                                            if (!badge) return null;
                                            const BadgeIcon = badge.icon;
                                            return (
                                            <li key={month} className="flex items-center gap-4">
                                                {/* 아이콘 배경: 둥글고(rounded-full) 연한 회색(bg-muted) 배경 */}
                                                <div className={cn("w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center bg-muted")}>
                                                     {/* 아이콘: badgeInfo에서 정의한 색상 클래스(badge.color) 적용 */}
                                                     <BadgeIcon className={cn("w-8 h-8", badge.color)} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{badge.label} 뱃지 획득!</p>
                                                    <p className="text-sm text-muted-foreground">{month}월 평가: {grade} 등급</p>
                                                </div>
                                            </li>
                                        )})}
                                    </ul>
                                ) : (
                                    // 뱃지가 없을 경우: 중앙 정렬된 안내 메시지 표시
                                    <p className="text-center text-muted-foreground pt-12">아직 획득한 뱃지가 없습니다.</p>
                                )}
                            </div>
                        </div>
                        {/* 연간 트로피 섹션 */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Trophy className="text-yellow-500" /> 연간 트로피
                            </h3>
                            <div className="p-4 border rounded-lg h-48 flex items-center justify-center">
                                {trophy ? (
                                    <div className="text-center">{/* 트로피 표시 로직 (향후 확장) */}</div>
                                ) : <p className="text-center text-muted-foreground">아직 획득한 트로피가 없습니다.</p>}
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
} 