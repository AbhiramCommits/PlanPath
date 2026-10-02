import { ProjectionResult, ScenarioInput } from './types.js';

export interface ScenarioDiff {
  inputDeltas: Record<keyof ScenarioInput, { a: any; b: any; delta?: number }>;
  outcomeDeltas: {
    balanceAtRetirement: { a: number; b: number; delta: number };
    totalTaxesPaid: { a: number; b: number; delta: number };
    safeAnnualSpend: { a: number; b: number; delta: number };
    depletionAge: { a: number | null; b: number | null; delta: number | null };
  };
}

export function diffScenarios(aInput: ScenarioInput, aResult: ProjectionResult, bInput: ScenarioInput, bResult: ProjectionResult): ScenarioDiff {
  const inputKeys = Object.keys(aInput) as (keyof ScenarioInput)[];
  const inputDeltas: any = {};

  for (const key of inputKeys) {
    const valA = aInput[key];
    const valB = bInput[key];
    if (typeof valA === 'number' && typeof valB === 'number') {
      inputDeltas[key] = { a: valA, b: valB, delta: valB - valA };
    } else {
      inputDeltas[key] = { a: valA, b: valB };
    }
  }

  return {
    inputDeltas,
    outcomeDeltas: {
      balanceAtRetirement: {
        a: aResult.balanceAtRetirement,
        b: bResult.balanceAtRetirement,
        delta: bResult.balanceAtRetirement - aResult.balanceAtRetirement,
      },
      totalTaxesPaid: {
        a: aResult.totalTaxesPaid,
        b: bResult.totalTaxesPaid,
        delta: bResult.totalTaxesPaid - aResult.totalTaxesPaid,
      },
      safeAnnualSpend: {
        a: aResult.safeAnnualSpend,
        b: bResult.safeAnnualSpend,
        delta: bResult.safeAnnualSpend - aResult.safeAnnualSpend,
      },
      depletionAge: {
        a: aResult.depletionAge,
        b: bResult.depletionAge,
        delta: (bResult.depletionAge !== null && aResult.depletionAge !== null) ? bResult.depletionAge - aResult.depletionAge : null,
      },
    },
  };
}
