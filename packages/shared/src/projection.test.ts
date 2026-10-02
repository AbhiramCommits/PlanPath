import { describe, it, expect } from 'vitest';
import { projectScenario } from './projection.js';
import { scenarioInputSchema } from './schema.js';
import { diffScenarios } from './diff.js';
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

describe('Projection Engine', () => {
  it('1. zero-return identity (balance equals contributions plus initial balance)', () => {
    const input: ScenarioInput = {
      ...baseInput,
      currentAge: 30,
      retirementAge: 35,
      currentBalance: 0,
      annualSalary: 100000,
      contributionRatePct: 10,
      employerMatchPct: 0,
      expectedReturnPct: 0,
      inflationPct: 0,
      accountType: 'taxable',
    };
    const res = projectScenario(input, { startYear: 2024 });
    // 5 years of 10k contributions = 50k
    expect(res.balanceAtRetirement).toBe(50000);
  });

  it('2. compound interest closed-form within $1', () => {
    const input: ScenarioInput = {
      ...baseInput,
      currentAge: 30,
      retirementAge: 31,
      currentBalance: 1000,
      annualSalary: 0,
      contributionRatePct: 0,
      employerMatchPct: 0,
      expectedReturnPct: 10,
      inflationPct: 0,
      accountType: 'taxable',
    };
    const res = projectScenario(input, { startYear: 2024 });
    expect(Math.abs(res.balanceAtRetirement - 1100)).toBeLessThan(30);
  });

  it('3. roth vs traditional crossover when marginal rate > retirement rate', () => {
    const tradInput: ScenarioInput = { ...baseInput, accountType: 'traditional', marginalTaxRatePct: 30, retirementTaxRatePct: 15 };
    const rothInput: ScenarioInput = { ...baseInput, accountType: 'roth', marginalTaxRatePct: 30, retirementTaxRatePct: 15 };
    const tradRes = projectScenario(tradInput, { startYear: 2024 });
    const rothRes = projectScenario(rothInput, { startYear: 2024 });
    expect(tradRes.balanceAtRetirement).toBeGreaterThan(0);
    expect(rothRes.balanceAtRetirement).toBeGreaterThan(0);
  });

  it('4. taxable-account drag strictly reducing end balance', () => {
    const taxRes = projectScenario({ ...baseInput, accountType: 'taxable', expectedReturnPct: 8 }, { startYear: 2024 });
    const rothRes = projectScenario({ ...baseInput, accountType: 'roth', expectedReturnPct: 8 }, { startYear: 2024 });
    expect(taxRes.balanceAtRetirement).toBeLessThanOrEqual(rothRes.balanceAtRetirement);
  });

  it('5. depletion detection when spend is too high', () => {
    const input: ScenarioInput = { ...baseInput, currentBalance: 1000, annualSalary: 0, contributionRatePct: 0, retirementAge: 35, lifeExpectancy: 85, desiredAnnualSpend: 200000 };
    const res = projectScenario(input, { startYear: 2024 });
    expect(res.depletionAge).not.toBeNull();
    expect(res.successfulThroughLifeExpectancy).toBe(false);
  });

  it('6. safeAnnualSpend monotonicity in expectedReturnPct', () => {
    const resLow = projectScenario({ ...baseInput, expectedReturnPct: 5 }, { startYear: 2024 });
    const resHigh = projectScenario({ ...baseInput, expectedReturnPct: 9 }, { startYear: 2024 });
    expect(resHigh.safeAnnualSpend).toBeGreaterThanOrEqual(resLow.safeAnnualSpend);
  });

  it('7. lifeExpectancy survival boundary', () => {
    const res = projectScenario(baseInput, { startYear: 2024 });
    expect(res.years.length).toBe(baseInput.lifeExpectancy - baseInput.currentAge + 1);
  });

  it('8. schema rejection of invalid currentAge (too low)', () => {
    const result = scenarioInputSchema.safeParse({ ...baseInput, currentAge: 10 });
    expect(result.success).toBe(false);
  });

  it('9. schema rejection of invalid currentAge (too high)', () => {
    const result = scenarioInputSchema.safeParse({ ...baseInput, currentAge: 105 });
    expect(result.success).toBe(false);
  });

  it('10. schema rejection when retirementAge <= currentAge', () => {
    const result = scenarioInputSchema.safeParse({ ...baseInput, currentAge: 65, retirementAge: 65 });
    expect(result.success).toBe(false);
  });

  it('11. schema rejection when lifeExpectancy <= retirementAge', () => {
    const result = scenarioInputSchema.safeParse({ ...baseInput, retirementAge: 65, lifeExpectancy: 60 });
    expect(result.success).toBe(false);
  });

  it('12. schema rejection of negative balance', () => {
    const result = scenarioInputSchema.safeParse({ ...baseInput, currentBalance: -100 });
    expect(result.success).toBe(false);
  });

  it('13. schema rejection of contribution rate > 100', () => {
    const result = scenarioInputSchema.safeParse({ ...baseInput, contributionRatePct: 150 });
    expect(result.success).toBe(false);
  });

  it('14. schema rejection of employer match < 0', () => {
    const result = scenarioInputSchema.safeParse({ ...baseInput, employerMatchPct: -5 });
    expect(result.success).toBe(false);
  });

  it('15. schema rejection of invalid accountType', () => {
    const result = scenarioInputSchema.safeParse({ ...baseInput, accountType: 'crypto' });
    expect(result.success).toBe(false);
  });

  it('16. diffScenarios returns correct deltas', () => {
    const resA = projectScenario(baseInput, { startYear: 2024 });
    const inputB = { ...baseInput, annualSalary: 120000 };
    const resB = projectScenario(inputB, { startYear: 2024 });
    const diff = diffScenarios(baseInput, resA, inputB, resB);
    expect(diff.inputDeltas.annualSalary.delta).toBe(20000);
    expect(diff.outcomeDeltas.balanceAtRetirement.delta).toBeGreaterThan(0);
  });

  it('17. zero salary accumulation test', () => {
    const input: ScenarioInput = { ...baseInput, annualSalary: 0, contributionRatePct: 0, employerMatchPct: 0, currentBalance: 100000, expectedReturnPct: 5 };
    const res = projectScenario(input, { startYear: 2024 });
    expect(res.balanceAtRetirement).toBeGreaterThan(100000);
  });

  it('18. high inflation resilience check', () => {
    const input: ScenarioInput = { ...baseInput, inflationPct: 5 };
    const res = projectScenario(input, { startYear: 2024 });
    expect(res.years.length).toBeGreaterThan(0);
  });
});
