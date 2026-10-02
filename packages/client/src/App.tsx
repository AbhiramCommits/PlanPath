import React, { useState, useEffect, useCallback } from 'react';
import { ScenarioInput, ProjectionResult } from '@planpath/shared';
import {
  previewProjection,
  getScenarios,
  createScenario,
  appendVersion,
  getScenarioDiff,
} from './api';
import { ProjectionChart } from './ProjectionChart';
import { ResultsSummary } from './ResultsSummary';
import { VersionHistory } from './VersionHistory';
import { ScenarioDiffView } from './ScenarioDiffView';

const defaultInput: ScenarioInput = {
  currentAge: 30,
  retirementAge: 65,
  lifeExpectancy: 85,
  currentBalance: 25000,
  annualSalary: 110000,
  contributionRatePct: 15,
  employerMatchPct: 5,
  expectedReturnPct: 7.5,
  inflationPct: 2.5,
  marginalTaxRatePct: 24,
  retirementTaxRatePct: 15,
  desiredAnnualSpend: 70000,
  accountType: 'traditional',
};

export function App() {
  const [input, setInput] = useState<ScenarioInput>(defaultInput);
  const [result, setResult] = useState<ProjectionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<any>(null);

  const [scenarios, setScenarios] = useState<any[]>([]);
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  const [diffData, setDiffData] = useState<any>(null);
  const [diffFrom, setDiffFrom] = useState<number | null>(null);
  const [diffTo, setDiffTo] = useState<number | null>(null);

  // Debounced preview computation
  const computePreview = useCallback(
    async (currentInput: ScenarioInput) => {
      setLoading(true);
      setValidationErrors(null);
      try {
        const res = await previewProjection(currentInput);
        setResult(res);
      } catch (err: any) {
        if (err?.details) {
          setValidationErrors(err.details);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      computePreview(input);
    }, 250);
    return () => clearTimeout(timer);
  }, [input, computePreview]);

  // Load scenarios on mount
  useEffect(() => {
    getScenarios()
      .then((list) => {
        setScenarios(list);
        if (list.length > 0) {
          const first = list[0];
          setCurrentScenarioId(first.id);
          setVersions(first.versions);
          if (first.versions.length > 0) {
            setSelectedVersionId(first.versions[0].version);
            setInput(first.versions[0].input);
          }
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const handleChange = (field: keyof ScenarioInput, value: any) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveNewVersion = async () => {
    if (!currentScenarioId) {
      // Create new scenario
      try {
        const created = await createScenario('My Retirement Plan', input, 'Initial Plan');
        setCurrentScenarioId(created.id);
        setVersions(created.versions);
        setSelectedVersionId(1);
        setScenarios(await getScenarios());
      } catch (e: any) {
        alert('Validation error saving scenario');
      }
    } else {
      try {
        const newVer = await appendVersion(currentScenarioId, input, `Updated v${versions.length + 1}`);
        const updatedVersions = [...versions, newVer];
        setVersions(updatedVersions);
        setSelectedVersionId(newVer.version);
      } catch (e: any) {
        alert('Validation error saving version');
      }
    }
  };

  const handleSelectVersion = (verNum: number) => {
    setSelectedVersionId(verNum);
    const v = versions.find((item) => item.version === verNum);
    if (v) {
      setInput(v.input);
    }
  };

  const handleSelectDiff = async (from: number, to: number) => {
    setDiffFrom(from);
    setDiffTo(to);
    if (currentScenarioId) {
      try {
        const data = await getScenarioDiff(currentScenarioId, from, to);
        setDiffData(data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-400">PlanPath</h1>
          <p className="text-sm text-slate-400">Retirement & Tax Scenario Planner</p>
        </div>
        <div className="flex gap-4">
          <select
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            value={currentScenarioId || ''}
            onChange={(e) => {
              const id = e.target.value;
              setCurrentScenarioId(id);
              const sc = scenarios.find((s) => s.id === id);
              if (sc) {
                setVersions(sc.versions);
                if (sc.versions.length > 0) {
                  setSelectedVersionId(sc.versions[0].version);
                  setInput(sc.versions[0].input);
                }
              }
            }}
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Form Controls */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4">
          <h2 className="text-lg font-semibold text-emerald-400 border-b border-slate-700 pb-2">Parameters</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Current Age ({input.currentAge})</label>
              <input
                type="number"
                value={input.currentAge}
                onChange={(e) => handleChange('currentAge', parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
              />
              {validationErrors?.currentAge && <span className="text-xs text-rose-400">Invalid age</span>}
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Retirement Age ({input.retirementAge})</label>
              <input
                type="number"
                value={input.retirementAge}
                onChange={(e) => handleChange('retirementAge', parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Retirement Age Slider</label>
            <input
              type="range"
              min={input.currentAge + 1}
              max={90}
              value={input.retirementAge}
              onChange={(e) => handleChange('retirementAge', parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Current Balance ($)</label>
              <input
                type="number"
                value={input.currentBalance}
                onChange={(e) => handleChange('currentBalance', parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Annual Salary ($)</label>
              <input
                type="number"
                value={input.annualSalary}
                onChange={(e) => handleChange('annualSalary', parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Contribution Rate ({input.contributionRatePct}%)</label>
            <input
              type="range"
              min={0}
              max={50}
              value={input.contributionRatePct}
              onChange={(e) => handleChange('contributionRatePct', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Expected Return ({input.expectedReturnPct}%)</label>
              <input
                type="number"
                step="0.1"
                value={input.expectedReturnPct}
                onChange={(e) => handleChange('expectedReturnPct', parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Inflation ({input.inflationPct}%)</label>
              <input
                type="number"
                step="0.1"
                value={input.inflationPct}
                onChange={(e) => handleChange('inflationPct', parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Marginal Tax ({input.marginalTaxRatePct}%)</label>
              <input
                type="number"
                value={input.marginalTaxRatePct}
                onChange={(e) => handleChange('marginalTaxRatePct', parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Retirement Tax ({input.retirementTaxRatePct}%)</label>
              <input
                type="number"
                value={input.retirementTaxRatePct}
                onChange={(e) => handleChange('retirementTaxRatePct', parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Desired Annual Spend ($)</label>
            <input
              type="number"
              value={input.desiredAnnualSpend}
              onChange={(e) => handleChange('desiredAnnualSpend', parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Account Type</label>
            <select
              value={input.accountType}
              onChange={(e) => handleChange('accountType', e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
            >
              <option value="traditional">Traditional (Pre-tax)</option>
              <option value="roth">Roth (Post-tax)</option>
              <option value="taxable">Taxable Brokerage</option>
            </select>
          </div>
        </div>

        {/* Main Display & Charts */}
        <div className="lg:col-span-2 space-y-6">
          <ResultsSummary result={result} loading={loading} />

          {result && (
            <ProjectionChart
              years={result.years}
              retirementAge={input.retirementAge}
              depletionAge={result.depletionAge}
            />
          )}

          <VersionHistory
            versions={versions}
            selectedVersionId={selectedVersionId}
            onSelectVersion={handleSelectVersion}
            diffFrom={diffFrom}
            diffTo={diffTo}
            onSelectDiff={handleSelectDiff}
            onSaveVersion={handleSaveNewVersion}
          />

          {diffData && <ScenarioDiffView diffData={diffData} />}
        </div>
      </main>
    </div>
  );
}
export default App;
