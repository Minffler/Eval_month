'use server';

/**
 * @fileOverview 이 파일은 현재 애플리케이션 상태를 초기 목업 데이터 파일에 백업하기 위한 Genkit 플로우를 정의합니다.
 *
 * - backupData - 데이터 백업을 수행하는 함수.
 * - BackupDataInput - backupData 함수의 입력 타입.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fs from 'fs/promises';
import path from 'path';

const BackupDataInputSchema = z.object({
    users: z.string().describe('사용자 데이터의 JSON 문자열'),
    employees: z.string().describe('월별 직원 데이터의 JSON 문자열'),
    evaluations: z.string().describe('월별 평가 데이터의 JSON 문자열'),
    gradingScale: z.string().describe('등급 스케일 데이터의 JSON 문자열'),
    attendanceTypes: z.string().describe('근태 유형 데이터의 JSON 문자열'),
    holidays: z.string().describe('공휴일 데이터의 JSON 문자열'),
});

export type BackupDataInput = z.infer<typeof BackupDataInputSchema>;

export async function backupData(input: BackupDataInput): Promise<{ success: boolean; message: string }> {
    return backupDataFlow(input);
}

const backupDataFlow = ai.defineFlow(
    {
        name: 'backupDataFlow',
        inputSchema: BackupDataInputSchema,
        outputSchema: z.object({ success: z.boolean(), message: z.string() }),
    },
    async (input) => {
        try {
            const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'data.ts');
            let fileContent = await fs.readFile(dataFilePath, 'utf-8');

            const replacements = {
                mockUsers: input.users,
                mockEmployees: input.employees,
                mockEvaluations: input.evaluations,
                gradingScale: input.gradingScale,
                initialAttendanceTypes: input.attendanceTypes,
                initialHolidays: input.holidays,
            };

            for (const [key, value] of Object.entries(replacements)) {
                 // 배열과 객체를 모두 처리할 수 있는 정규식
                const regex = new RegExp(`(export const ${key}: [^=]+ = )(\\[[\\s\\S]*?\\]|{[\\s\\S]*?});`, 'm');
                
                // 데이터를 예쁘게 포맷팅
                const formattedValue = JSON.stringify(JSON.parse(value), null, 2);

                if (regex.test(fileContent)) {
                    fileContent = fileContent.replace(regex, `$1${formattedValue};`);
                } else {
                     // 만약 변수가 파일에 없다면 (예: initialHolidays), 새로 추가
                    if (key === 'initialHolidays') { // initialHolidays가 없을 경우를 대비한 예외 처리
                        fileContent += `\n\nexport const initialHolidays: Holiday[] = ${formattedValue};`;
                    } else {
                        console.warn(`변수 ${key}를 data.ts 파일에서 찾을 수 없어 건너뜁니다.`);
                    }
                }
            }

            await fs.writeFile(dataFilePath, fileContent, 'utf-8');

            return { success: true, message: '데이터가 성공적으로 백업되었습니다.' };
        } catch (error: any) {
            console.error('데이터 백업 실패:', error);
            throw new Error(`데이터 백업 중 오류가 발생했습니다: ${error.message}`);
        }
    }
);
