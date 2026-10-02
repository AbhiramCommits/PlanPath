import React from 'react';
import { ProjectionResult } from '@planpath/shared';

interface Props {
  result: ProjectionResult | null;
  loading: boolean;
}

export const ResultsSummary: React.FC<Props> = ({ result, loading }) => {
  if (loading && !result) {
    return <div className="text-slate-400 p-4">Computing projection...</div>;
  }
  if (!result) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="text-sm text-slate-400">Balance at Retirement</div>
        <div className="text-2xl font-bold text-blue-400">${Math.round(result.balanceAtRetirement).toLocaleString()}</div>
        <div className="text-xs text-slate-500">Real: ${Math.round(result.realBalanceAtRetirement).toLocaleString()}</div>
      </div>
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="text-sm text-slate-400">Safe Annual Spend</div>
        <div className="text-2xl font-bold text-emerald-400">${result.safeAnnualSpend.toLocaleString()}</div>
        <div className="text-xs text-slate-500">Sustains through life expectancy</div>
      </div>
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="text-sm text-slate-400">Total Taxes Paid</div>
        <div className="text-2xl font-bold text-amber-400">${Math.round(result.totalTaxesPaid).toLocaleString()}</div>
        <div className="text-xs text-slate-500">Accumulation + Drawdown</div>
      </div>
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-between">
        <div className="text-sm text-slate-400">Plan Status</div>
        <div>
          {result.successfulThroughLifeExpectancy ? (
            <span className="px-3 py-1 bg-emerald-950 text-emerald-400 rounded-full text-sm font-medium border border-emerald-800">
              Successful 🟢
            </span>
          ) : (
            <span className="px-3 py-1 bg-rose-950 text-rose-400 rounded-full text-sm font-medium border border-rose-800">
              Depletes at Age {result.depletionAge} 🔴
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
