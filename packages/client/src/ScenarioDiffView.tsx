import React from 'react';

interface Props {
  diffData: any;
}

export const ScenarioDiffView: React.FC<Props> = ({ diffData }) => {
  if (!diffData) return null;

  const { fromVersion, toVersion, diff } = diffData;
  const inputEntries = Object.entries(diff.inputDeltas) as [string, any][];
  const outcomeEntries = Object.entries(diff.outcomeDeltas) as [string, any][];

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
      <h3 className="text-lg font-semibold text-emerald-400 mb-3">
        Scenario Comparison (v{fromVersion} vs v{toVersion})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">Input Changes</h4>
          <div className="space-y-1 text-sm">
            {inputEntries.map(([key, val]) => {
              if (val.a === val.b) return null;
              const isPositive = val.delta !== undefined && val.delta > 0;
              return (
                <div key={key} className="flex justify-between bg-slate-900 p-2 rounded border border-slate-700">
                  <span className="text-slate-300 font-mono">{key}</span>
                  <div className="flex gap-2">
                    <span className="text-slate-400">{val.a}</span>
                    <span>→</span>
                    <span className={isPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {val.b}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">Outcome Deltas</h4>
          <div className="space-y-1 text-sm">
            {outcomeEntries.map(([key, val]) => {
              const delta = val.delta;
              const isGain = delta !== null && delta >= 0;
              return (
                <div key={key} className="flex justify-between bg-slate-900 p-2 rounded border border-slate-700">
                  <span className="text-slate-300 font-mono">{key}</span>
                  <div className="flex gap-2">
                    <span className="text-slate-400">${Math.round(val.a).toLocaleString()}</span>
                    <span>→</span>
                    <span className="text-slate-200">${Math.round(val.b).toLocaleString()}</span>
                    <span className={isGain ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      ({delta > 0 ? '+' : ''}${Math.round(delta).toLocaleString()})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
