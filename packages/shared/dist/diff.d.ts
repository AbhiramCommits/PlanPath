import { ProjectionResult, ScenarioInput } from './types.js';
export interface ScenarioDiff {
    inputDeltas: Record<keyof ScenarioInput, {
        a: any;
        b: any;
        delta?: number;
    }>;
    outcomeDeltas: {
        balanceAtRetirement: {
            a: number;
            b: number;
            delta: number;
        };
        totalTaxesPaid: {
            a: number;
            b: number;
            delta: number;
        };
        safeAnnualSpend: {
            a: number;
            b: number;
            delta: number;
        };
        depletionAge: {
            a: number | null;
            b: number | null;
            delta: number | null;
        };
    };
}
export declare function diffScenarios(aInput: ScenarioInput, aResult: ProjectionResult, bInput: ScenarioInput, bResult: ProjectionResult): ScenarioDiff;
//# sourceMappingURL=diff.d.ts.map