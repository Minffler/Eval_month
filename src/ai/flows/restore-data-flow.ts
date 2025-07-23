'use server';

/**
 * @fileOverview 이 파일은 초기 목업 데이터 파일의 내용을 읽어 클라이언트로 전송하기 위한 Genkit 플로우를 정의합니다.
 *
 * - restoreData - 데이터 복원을 수행하는 함수.
 * - RestoreDataOutput - restoreData 함수의 반환 타입.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fs from 'fs/promises';
import path from 'path';

const RestoreDataOutputSchema = z.object({
    users: z.string(),
    employees: z.string(),
    evaluations: z.string(),
    gradingScale: z.string(),
    attendanceTypes: z.string(),
    holidays: z.string(),
});

export type RestoreDataOutput = z.infer<typeof RestoreDataOutputSchema>;

export async function restoreData(): Promise<RestoreDataOutput> {
    return restoreDataFlow();
}

const restoreDataFlow = ai.defineFlow(
    {
        name: 'restoreDataFlow',
        inputSchema: z.void(),
        outputSchema: RestoreDataOutputSchema,
    },
    async () => {
        try {
            const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'data.ts');
            const fileContent = await fs.readFile(dataFilePath, 'utf-8');

            const extractVariable = (variableName: string, content: string): string => {
                const regex = new RegExp(`export const ${variableName}: [^=]+ = ([\\s\\S]*?);`, 'm');
                const match = content.match(regex);
                if (match && match[1]) {
                    // This is a simplified parser. It assumes the variable is a JS object/array literal.
                    // It's not a full JS parser, so complex structures might fail.
                    // Let's try to evaluate it in a safe way.
                    try {
                       // A bit risky, but for this controlled environment it's a pragmatic way
                       // to convert the code string to a JSON string.
                       // A safer way would be a proper AST parser.
                       const evaluated = new Function(`return ${match[1].trim()}`)();
                       return JSON.stringify(evaluated);
                    } catch (e) {
                       console.error(`Failed to evaluate ${variableName}`, e);
                       // Fallback for simple JSON-like structures
                       return match[1].trim();
                    }
                }
                // Return default empty state if not found
                return variableName.includes('s') || variableName.includes('Types') ? '[]' : '{}';
            };
            
            return {
                users: extractVariable('mockUsers', fileContent),
                employees: extractVariable('mockEmployees', fileContent),
                evaluations: extractVariable('mockEvaluations', fileContent),
                gradingScale: extractVariable('gradingScale', fileContent),
                attendanceTypes: extractVariable('initialAttendanceTypes', fileContent),
                holidays: extractVariable('initialHolidays', fileContent),
            };

        } catch (error: any) {
            console.error('데이터 복원 실패:', error);
            throw new Error(`데이터 복원 중 오류가 발생했습니다: ${error.message}`);
        }
    }
);
