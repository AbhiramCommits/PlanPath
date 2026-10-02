import React from 'react';

interface Props {
  versions: any[];
  selectedVersionId: number | null;
  onSelectVersion: (v: number) => void;
  diffFrom: number | null;
  diffTo: number | null;
  onSelectDiff: (from: number, to: number) => void;
  onSaveVersion: () => void;
}

export const VersionHistory: React.FC<Props> = ({
  versions,
  selectedVersionId,
  onSelectVersion,
  diffFrom,
  diffTo,
  onSelectDiff,
  onSaveVersion,
}) => {
  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-emerald-400">Version History</h3>
        <button
          onClick={onSaveVersion}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition"
        >
          Save New Version
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {versions.map((v) => (
          <button
            key={v.id || v.version}
            onClick={() => onSelectVersion(v.version)}
            className={`px-3 py-2 rounded-lg text-sm border transition ${
              selectedVersionId === v.version
                ? 'bg-emerald-900 border-emerald-500 text-emerald-200'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            v{v.version}: {v.label || `Version ${v.version}`}
          </button>
        ))}
      </div>

      {versions.length >= 2 && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-700 text-sm">
          <span className="text-slate-400">Compare:</span>
          <select
            value={diffFrom || ''}
            onChange={(e) => onSelectDiff(parseInt(e.target.value, 10), diffTo || versions[1]?.version || 2)}
            className="bg-slate-900 border border-slate-700 rounded p-1 text-slate-200"
          >
            {versions.map((v) => (
              <option key={v.version} value={v.version}>
                v{v.version}
              </option>
            ))}
          </select>
          <span className="text-slate-400">vs</span>
          <select
            value={diffTo || ''}
            onChange={(e) => onSelectDiff(diffFrom || 1, parseInt(e.target.value, 10))}
            className="bg-slate-900 border border-slate-700 rounded p-1 text-slate-200"
          >
            {versions.map((v) => (
              <option key={v.version} value={v.version}>
                v{v.version}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
