"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffScenarios = diffScenarios;
function diffScenarios(aInput, aResult, bInput, bResult) {
    const inputKeys = Object.keys(aInput);
    const inputDeltas = {};
    for (const key of inputKeys) {
        const valA = aInput[key];
        const valB = bInput[key];
        if (typeof valA === 'number' && typeof valB === 'number') {
            inputDeltas[key] = { a: valA, b: valB, delta: valB - valA };
        }
        else {
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
//# sourceMappingURL=diff.js.map