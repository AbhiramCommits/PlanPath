import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { YearProjection } from '@planpath/shared';

interface Props {
  years: YearProjection[];
  retirementAge: number;
  depletionAge: number | null;
}

export const ProjectionChart: React.FC<Props> = ({ years, retirementAge, depletionAge }) => {
  const data = years.map((y) => ({
    age: y.age,
    Nominal: Math.round(y.endBalance),
    Real: Math.round(y.realEndBalance),
  }));

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
      <h3 className="text-lg font-semibold mb-3 text-emerald-400">Wealth Trajectory by Age</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="age" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k'}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
              formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
            />
            <ReferenceLine x={retirementAge} stroke="#34d399" strokeWidth={2} label={{ value: 'Retirement', fill: '#34d399', position: 'top' }} />
            {depletionAge && (
              <ReferenceLine x={depletionAge} stroke="#f87171" strokeWidth={2} label={{ value: 'Depletion', fill: '#f87171', position: 'top' }} />
            )}
            <Line type="monotone" dataKey="Nominal" stroke="#60a5fa" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Real" stroke="#34d399" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
