import { describe, it, expect } from 'vitest';
import { diffScenarios } from './diff.js';
import { projectScenario } from './projection.js';
import { ScenarioInput } from './types.js';

const baseInput: ScenarioInput = {
  currentAge: 30,
  retirementAge: 65,
  lifeExpectancy: 85,
  currentBalance: 10000,
  annualSalary: 100000,
  contributionRatePct: 10,
  employerMatchPct: 5,
  expectedReturnPct: 7,
  inflationPct: 2,
  marginalTaxRatePct: 25,
  retirementTaxRatePct: 15,
  desiredAnnualSpend: 60000,
  accountType: 'traditional',
};

describe('Scenario Diff', () => {
  it('computes deltas correctly between two scenarios', () => {
    const resA = projectScenario(baseInput, { startYear: 2024 });
    const inputB: ScenarioInput = { ...baseInput, annualSalary: 120000 };
    const resB = projectScenario(inputB, { startYear: 2024 });
    const diff = diffScenarios(baseInput, resA, inputB, resB);
    expect(diff.inputDeltas.annualSalary.delta).toBe(20000);
    expect(diff.outcomeDeltas.balanceAtRetirement.delta).toBeGreaterThan(0);
    expect(diff.outcomeDeltas.totalTaxesPaid.a).toBeDefined();
    expect(diff.outcomeDeltas.safeAnnualSpend.b).toBeDefined();
    expect(diff.outcomeDeltas.depletionAge.a).toBeDefined();
  });
});
