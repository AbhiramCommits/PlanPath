"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scenarioInputSchema = void 0;
const zod_1 = require("zod");
exports.scenarioInputSchema = zod_1.z.object({
    currentAge: zod_1.z.number().int().min(18).max(100),
    retirementAge: zod_1.z.number().int().min(18).max(100),
    lifeExpectancy: zod_1.z.number().int().min(18).max(120),
    currentBalance: zod_1.z.number().min(0),
    annualSalary: zod_1.z.number().min(0),
    contributionRatePct: zod_1.z.number().min(0).max(100),
    employerMatchPct: zod_1.z.number().min(0).max(100),
    expectedReturnPct: zod_1.z.number().min(-50).max(100),
    inflationPct: zod_1.z.number().min(-20).max(50),
    marginalTaxRatePct: zod_1.z.number().min(0).max(100),
    retirementTaxRatePct: zod_1.z.number().min(0).max(100),
    desiredAnnualSpend: zod_1.z.number().min(0),
    accountType: zod_1.z.enum(['traditional', 'roth', 'taxable']),
}).refine(data => data.retirementAge > data.currentAge, {
    message: "Retirement age must be greater than current age",
    path: ["retirementAge"],
}).refine(data => data.lifeExpectancy > data.retirementAge, {
    message: "Life expectancy must be greater than retirement age",
    path: ["lifeExpectancy"],
});
//# sourceMappingURL=schema.js.map