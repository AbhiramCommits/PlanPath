"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectScenario = projectScenario;
function projectScenario(input, options = {}) {
    const startYear = options.startYear ?? new Date().getFullYear();
    const years = [];
    let balance = input.currentBalance;
    let salary = input.annualSalary;
    let totalTaxesPaid = 0;
    let totalContributions = 0;
    let depletionAge = null;
    // Accumulation Phase: currentAge to retirementAge - 1
    for (let age = input.currentAge; age < input.retirementAge; age++) {
        const year = startYear + (age - input.currentAge);
        const contribution = salary * (input.contributionRatePct / 100);
        const employerMatch = salary * (input.employerMatchPct / 100);
        const totalAdditions = contribution + employerMatch;
        totalContributions += contribution;
        let taxesPaidThisYear = 0;
        if (input.accountType === 'roth') {
            taxesPaidThisYear = contribution * (input.marginalTaxRatePct / 100);
        }
        totalTaxesPaid += taxesPaidThisYear;
        const startBalance = balance;
        const growthRate = input.expectedReturnPct / 100;
        let growth = (startBalance + totalAdditions / 2) * growthRate;
        if (input.accountType === 'taxable' && growth > 0) {
            const taxOnGrowth = growth * (input.marginalTaxRatePct / 100);
            taxesPaidThisYear += taxOnGrowth;
            totalTaxesPaid += taxOnGrowth;
            growth -= taxOnGrowth;
        }
        balance = startBalance + totalAdditions + growth - (input.accountType === 'roth' ? taxesPaidThisYear : 0);
        if (balance < 0)
            balance = 0;
        const cumulativeInflationFactor = Math.pow(1 + input.inflationPct / 100, age - input.currentAge);
        const realEndBalance = balance / cumulativeInflationFactor;
        years.push({
            age,
            year,
            startBalance,
            contribution,
            employerMatch,
            growth,
            taxesPaid: taxesPaidThisYear,
            withdrawal: 0,
            endBalance: balance,
            realEndBalance,
        });
        salary *= (1 + input.inflationPct / 100);
    }
    const balanceAtRetirement = balance;
    const cumulativeInflationAtRetirement = Math.pow(1 + input.inflationPct / 100, input.retirementAge - input.currentAge);
    const realBalanceAtRetirement = balanceAtRetirement / cumulativeInflationAtRetirement;
    // Drawdown Phase: retirementAge to lifeExpectancy
    for (let age = input.retirementAge; age <= input.lifeExpectancy; age++) {
        const year = startYear + (age - input.currentAge);
        const startBalance = balance;
        if (startBalance <= 0) {
            if (depletionAge === null)
                depletionAge = age;
            years.push({
                age,
                year,
                startBalance: 0,
                contribution: 0,
                employerMatch: 0,
                growth: 0,
                taxesPaid: 0,
                withdrawal: 0,
                endBalance: 0,
                realEndBalance: 0,
            });
            continue;
        }
        const yearsFromStart = age - input.currentAge;
        const inflationAdjustedSpend = input.desiredAnnualSpend * Math.pow(1 + input.inflationPct / 100, yearsFromStart);
        let grossWithdrawal = inflationAdjustedSpend;
        let taxOnWithdrawal = 0;
        if (input.accountType === 'traditional') {
            const taxRate = input.retirementTaxRatePct / 100;
            if (taxRate < 1) {
                grossWithdrawal = inflationAdjustedSpend / (1 - taxRate);
                taxOnWithdrawal = grossWithdrawal - inflationAdjustedSpend;
            }
        }
        else if (input.accountType === 'taxable') {
            taxOnWithdrawal = inflationAdjustedSpend * (input.retirementTaxRatePct / 100);
            grossWithdrawal = inflationAdjustedSpend + taxOnWithdrawal;
        }
        totalTaxesPaid += taxOnWithdrawal;
        const growthRate = input.expectedReturnPct / 100;
        let growth = (startBalance - grossWithdrawal / 2) * growthRate;
        if (input.accountType === 'taxable' && growth > 0) {
            const taxOnGrowth = growth * (input.marginalTaxRatePct / 100);
            totalTaxesPaid += taxOnGrowth;
            taxOnWithdrawal += taxOnGrowth;
            growth -= taxOnGrowth;
        }
        balance = startBalance + growth - grossWithdrawal;
        if (balance < 0) {
            if (depletionAge === null)
                depletionAge = age;
            balance = 0;
        }
        const cumulativeInflationFactor = Math.pow(1 + input.inflationPct / 100, yearsFromStart);
        const realEndBalance = balance / cumulativeInflationFactor;
        years.push({
            age,
            year,
            startBalance,
            contribution: 0,
            employerMatch: 0,
            growth,
            taxesPaid: taxOnWithdrawal,
            withdrawal: grossWithdrawal,
            endBalance: balance,
            realEndBalance,
        });
    }
    const successfulThroughLifeExpectancy = depletionAge === null && balance > 0;
    let low = 0;
    let high = Math.max(input.desiredAnnualSpend * 5, 10000000);
    let safeAnnualSpend = 0;
    for (let i = 0; i < 200; i++) {
        const mid = (low + high) / 2;
        const testInput = { ...input, desiredAnnualSpend: mid };
        const res = projectScenarioWithoutSafeSearch(testInput, options);
        if (res.successfulThroughLifeExpectancy) {
            safeAnnualSpend = mid;
            low = mid;
        }
        else {
            high = mid;
        }
        if (high - low < 1)
            break;
    }
    return {
        years,
        balanceAtRetirement,
        realBalanceAtRetirement,
        depletionAge,
        totalTaxesPaid,
        totalContributions,
        safeAnnualSpend: Math.floor(safeAnnualSpend),
        successfulThroughLifeExpectancy,
    };
}
function projectScenarioWithoutSafeSearch(input, options = {}) {
    const startYear = options.startYear ?? new Date().getFullYear();
    let balance = input.currentBalance;
    let salary = input.annualSalary;
    for (let age = input.currentAge; age < input.retirementAge; age++) {
        const contribution = salary * (input.contributionRatePct / 100);
        const employerMatch = salary * (input.employerMatchPct / 100);
        const totalAdditions = contribution + employerMatch;
        let taxesThisYear = input.accountType === 'roth' ? contribution * (input.marginalTaxRatePct / 100) : 0;
        let growth = (balance + totalAdditions / 2) * (input.expectedReturnPct / 100);
        if (input.accountType === 'taxable' && growth > 0) {
            taxesThisYear += growth * (input.marginalTaxRatePct / 100);
            growth -= growth * (input.marginalTaxRatePct / 100);
        }
        balance = balance + totalAdditions + growth - taxesThisYear;
        if (balance < 0)
            balance = 0;
        salary *= (1 + input.inflationPct / 100);
    }
    let depletionAge = null;
    for (let age = input.retirementAge; age <= input.lifeExpectancy; age++) {
        if (balance <= 0) {
            depletionAge = age;
            break;
        }
        const yearsFromStart = age - input.currentAge;
        const inflationAdjustedSpend = input.desiredAnnualSpend * Math.pow(1 + input.inflationPct / 100, yearsFromStart);
        let grossWithdrawal = inflationAdjustedSpend;
        if (input.accountType === 'traditional') {
            const taxRate = input.retirementTaxRatePct / 100;
            if (taxRate < 1)
                grossWithdrawal = inflationAdjustedSpend / (1 - taxRate);
        }
        else if (input.accountType === 'taxable') {
            grossWithdrawal = inflationAdjustedSpend * (1 + input.retirementTaxRatePct / 100);
        }
        let growth = (balance - grossWithdrawal / 2) * (input.expectedReturnPct / 100);
        if (input.accountType === 'taxable' && growth > 0) {
            growth -= growth * (input.marginalTaxRatePct / 100);
        }
        balance = balance + growth - grossWithdrawal;
        if (balance < 0) {
            depletionAge = age;
            break;
        }
    }
    return { successfulThroughLifeExpectancy: depletionAge === null && balance > 0 };
}
//# sourceMappingURL=projection.js.map