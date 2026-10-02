export type AccountType = 'traditional' | 'roth' | 'taxable';
export interface ScenarioInput {
    currentAge: number;
    retirementAge: number;
    lifeExpectancy: number;
    currentBalance: number;
    annualSalary: number;
    contributionRatePct: number;
    employerMatchPct: number;
    expectedReturnPct: number;
    inflationPct: number;
    marginalTaxRatePct: number;
    retirementTaxRatePct: number;
    desiredAnnualSpend: number;
    accountType: AccountType;
}
export interface YearProjection {
    age: number;
    year: number;
    startBalance: number;
    contribution: number;
    employerMatch: number;
    growth: number;
    taxesPaid: number;
    withdrawal: number;
    endBalance: number;
    realEndBalance: number;
}
export interface ProjectionResult {
    years: YearProjection[];
    balanceAtRetirement: number;
    realBalanceAtRetirement: number;
    depletionAge: number | null;
    totalTaxesPaid: number;
    totalContributions: number;
    safeAnnualSpend: number;
    successfulThroughLifeExpectancy: boolean;
}
//# sourceMappingURL=types.d.ts.map