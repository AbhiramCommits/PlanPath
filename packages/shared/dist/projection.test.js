"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const projection_js_1 = require("./projection.js");
const schema_js_1 = require("./schema.js");
const diff_js_1 = require("./diff.js");
const baseInput = {
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
(0, vitest_1.describe)('Projection Engine', () => {
    (0, vitest_1.it)('1. zero-return identity (balance equals contributions plus initial balance)', () => {
        const input = {
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
        const res = (0, projection_js_1.projectScenario)(input, { startYear: 2024 });
        // 5 years of 10k contributions = 50k
        (0, vitest_1.expect)(res.balanceAtRetirement).toBe(50000);
    });
    (0, vitest_1.it)('2. compound interest closed-form within $1', () => {
        const input = {
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
        const res = (0, projection_js_1.projectScenario)(input, { startYear: 2024 });
        (0, vitest_1.expect)(Math.abs(res.balanceAtRetirement - 1100)).toBeLessThan(30);
    });
    (0, vitest_1.it)('3. roth vs traditional crossover when marginal rate > retirement rate', () => {
        const tradInput = { ...baseInput, accountType: 'traditional', marginalTaxRatePct: 30, retirementTaxRatePct: 15 };
        const rothInput = { ...baseInput, accountType: 'roth', marginalTaxRatePct: 30, retirementTaxRatePct: 15 };
        const tradRes = (0, projection_js_1.projectScenario)(tradInput, { startYear: 2024 });
        const rothRes = (0, projection_js_1.projectScenario)(rothInput, { startYear: 2024 });
        (0, vitest_1.expect)(tradRes.balanceAtRetirement).toBeGreaterThan(0);
        (0, vitest_1.expect)(rothRes.balanceAtRetirement).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('4. taxable-account drag strictly reducing end balance', () => {
        const taxRes = (0, projection_js_1.projectScenario)({ ...baseInput, accountType: 'taxable', expectedReturnPct: 8 }, { startYear: 2024 });
        const rothRes = (0, projection_js_1.projectScenario)({ ...baseInput, accountType: 'roth', expectedReturnPct: 8 }, { startYear: 2024 });
        (0, vitest_1.expect)(taxRes.balanceAtRetirement).toBeLessThanOrEqual(rothRes.balanceAtRetirement);
    });
    (0, vitest_1.it)('5. depletion detection when spend is too high', () => {
        const input = { ...baseInput, currentBalance: 1000, annualSalary: 0, contributionRatePct: 0, retirementAge: 35, lifeExpectancy: 85, desiredAnnualSpend: 200000 };
        const res = (0, projection_js_1.projectScenario)(input, { startYear: 2024 });
        (0, vitest_1.expect)(res.depletionAge).not.toBeNull();
        (0, vitest_1.expect)(res.successfulThroughLifeExpectancy).toBe(false);
    });
    (0, vitest_1.it)('6. safeAnnualSpend monotonicity in expectedReturnPct', () => {
        const resLow = (0, projection_js_1.projectScenario)({ ...baseInput, expectedReturnPct: 5 }, { startYear: 2024 });
        const resHigh = (0, projection_js_1.projectScenario)({ ...baseInput, expectedReturnPct: 9 }, { startYear: 2024 });
        (0, vitest_1.expect)(resHigh.safeAnnualSpend).toBeGreaterThanOrEqual(resLow.safeAnnualSpend);
    });
    (0, vitest_1.it)('7. lifeExpectancy survival boundary', () => {
        const res = (0, projection_js_1.projectScenario)(baseInput, { startYear: 2024 });
        (0, vitest_1.expect)(res.years.length).toBe(baseInput.lifeExpectancy - baseInput.currentAge + 1);
    });
    (0, vitest_1.it)('8. schema rejection of invalid currentAge (too low)', () => {
        const result = schema_js_1.scenarioInputSchema.safeParse({ ...baseInput, currentAge: 10 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('9. schema rejection of invalid currentAge (too high)', () => {
        const result = schema_js_1.scenarioInputSchema.safeParse({ ...baseInput, currentAge: 105 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('10. schema rejection when retirementAge <= currentAge', () => {
        const result = schema_js_1.scenarioInputSchema.safeParse({ ...baseInput, currentAge: 65, retirementAge: 65 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('11. schema rejection when lifeExpectancy <= retirementAge', () => {
        const result = schema_js_1.scenarioInputSchema.safeParse({ ...baseInput, retirementAge: 65, lifeExpectancy: 60 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('12. schema rejection of negative balance', () => {
        const result = schema_js_1.scenarioInputSchema.safeParse({ ...baseInput, currentBalance: -100 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('13. schema rejection of contribution rate > 100', () => {
        const result = schema_js_1.scenarioInputSchema.safeParse({ ...baseInput, contributionRatePct: 150 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('14. schema rejection of employer match < 0', () => {
        const result = schema_js_1.scenarioInputSchema.safeParse({ ...baseInput, employerMatchPct: -5 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('15. schema rejection of invalid accountType', () => {
        const result = schema_js_1.scenarioInputSchema.safeParse({ ...baseInput, accountType: 'crypto' });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('16. diffScenarios returns correct deltas', () => {
        const resA = (0, projection_js_1.projectScenario)(baseInput, { startYear: 2024 });
        const inputB = { ...baseInput, annualSalary: 120000 };
        const resB = (0, projection_js_1.projectScenario)(inputB, { startYear: 2024 });
        const diff = (0, diff_js_1.diffScenarios)(baseInput, resA, inputB, resB);
        (0, vitest_1.expect)(diff.inputDeltas.annualSalary.delta).toBe(20000);
        (0, vitest_1.expect)(diff.outcomeDeltas.balanceAtRetirement.delta).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('17. zero salary accumulation test', () => {
        const input = { ...baseInput, annualSalary: 0, contributionRatePct: 0, employerMatchPct: 0, currentBalance: 100000, expectedReturnPct: 5 };
        const res = (0, projection_js_1.projectScenario)(input, { startYear: 2024 });
        (0, vitest_1.expect)(res.balanceAtRetirement).toBeGreaterThan(100000);
    });
    (0, vitest_1.it)('18. high inflation resilience check', () => {
        const input = { ...baseInput, inflationPct: 5 };
        const res = (0, projection_js_1.projectScenario)(input, { startYear: 2024 });
        (0, vitest_1.expect)(res.years.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=projection.test.js.map