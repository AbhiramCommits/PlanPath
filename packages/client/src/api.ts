import { ScenarioInput, ProjectionResult } from '@planpath/shared';

export async function previewProjection(input: ScenarioInput): Promise<ProjectionResult> {
  const res = await fetch('/api/projections/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw err;
  }
  return res.json();
}

export async function getScenarios() {
  const res = await fetch('/api/scenarios');
  if (!res.ok) throw new Error('Failed to fetch scenarios');
  return res.json();
}

export async function getScenario(id: string) {
  const res = await fetch(`/api/scenarios/${id}`);
  if (!res.ok) throw new Error('Failed to fetch scenario');
  return res.json();
}

export async function createScenario(name: string, input: ScenarioInput, label: string) {
  const res = await fetch('/api/scenarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, input, label }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw err;
  }
  return res.json();
}

export async function appendVersion(scenarioId: string, input: ScenarioInput, label: string) {
  const res = await fetch(`/api/scenarios/${scenarioId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, label }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw err;
  }
  return res.json();
}

export async function getScenarioDiff(scenarioId: string, from: number, to: number) {
  const res = await fetch(`/api/scenarios/${scenarioId}/diff?from=${from}&to=${to}`);
  if (!res.ok) throw new Error('Failed to fetch diff');
  return res.json();
}
