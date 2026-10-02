"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const diff_js_1 = require("./diff.js");
const projection_js_1 = require("./projection.js");
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
(0, vitest_1.describe)('Scenario Diff', () => {
    (0, vitest_1.it)('computes deltas correctly between two scenarios', () => {
        const resA = (0, projection_js_1.projectScenario)(baseInput, { startYear: 2024 });
        const inputB = { ...baseInput, annualSalary: 120000 };
        const resB = (0, projection_js_1.projectScenario)(inputB, { startYear: 2024 });
        const diff = (0, diff_js_1.diffScenarios)(baseInput, resA, inputB, resB);
        (0, vitest_1.expect)(diff.inputDeltas.annualSalary.delta).toBe(20000);
        (0, vitest_1.expect)(diff.outcomeDeltas.balanceAtRetirement.delta).toBeGreaterThan(0);
        (0, vitest_1.expect)(diff.outcomeDeltas.totalTaxesPaid.a).toBeDefined();
        (0, vitest_1.expect)(diff.outcomeDeltas.safeAnnualSpend.b).toBeDefined();
        (0, vitest_1.expect)(diff.outcomeDeltas.depletionAge.a).toBeDefined();
    });
});
//# sourceMappingURL=diff.test.js.map