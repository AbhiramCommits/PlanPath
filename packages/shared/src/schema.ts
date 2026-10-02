import { z } from 'zod';

export const scenarioInputSchema = z.object({
  currentAge: z.number().int().min(18).max(100),
  retirementAge: z.number().int().min(18).max(100),
  lifeExpectancy: z.number().int().min(18).max(120),
  currentBalance: z.number().min(0),
  annualSalary: z.number().min(0),
  contributionRatePct: z.number().min(0).max(100),
  employerMatchPct: z.number().min(0).max(100),
  expectedReturnPct: z.number().min(-50).max(100),
  inflationPct: z.number().min(-20).max(50),
  marginalTaxRatePct: z.number().min(0).max(100),
  retirementTaxRatePct: z.number().min(0).max(100),
  desiredAnnualSpend: z.number().min(0),
  accountType: z.enum(['traditional', 'roth', 'taxable']),
}).refine(data => data.retirementAge > data.currentAge, {
  message: "Retirement age must be greater than current age",
  path: ["retirementAge"],
}).refine(data => data.lifeExpectancy > data.retirementAge, {
  message: "Life expectancy must be greater than retirement age",
  path: ["lifeExpectancy"],
});

export type ScenarioInputParsed = z.infer<typeof scenarioInputSchema>;
