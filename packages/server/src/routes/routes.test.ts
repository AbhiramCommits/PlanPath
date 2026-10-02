import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp, prisma } from '../app.js';
import { FastifyInstance } from 'fastify';

describe('Server API Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    await prisma.scenarioVersion.deleteMany();
    await prisma.scenario.deleteMany();
    await prisma.member.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('GET /health returns status ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json.status).toBe('ok');
  });

  it('POST /api/projections/preview computes projection statelessly', async () => {
    const input = {
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 85,
      currentBalance: 10000,
      annualSalary: 100000,
      contributionRatePct: 10,
      employerMatchPct: 5,
      expectedReturnPct: 7,
      inflationPct: 2,
      marginalTaxRatePct: 25,
      retirementTaxRatePct: 15,
      desiredAnnualSpend: 60000,
      accountType: 'traditional',
    };
    const response = await app.inject({
      method: 'POST',
      url: '/api/projections/preview',
      payload: input,
    });
    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json.balanceAtRetirement).toBeGreaterThan(0);
  });

  it('POST /api/scenarios and GET /api/scenarios/:id work correctly', async () => {
    const input = {
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 85,
      currentBalance: 10000,
      annualSalary: 100000,
      contributionRatePct: 10,
      employerMatchPct: 5,
      expectedReturnPct: 7,
      inflationPct: 2,
      marginalTaxRatePct: 25,
      retirementTaxRatePct: 15,
      desiredAnnualSpend: 60000,
      accountType: 'traditional',
    };

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/scenarios',
      payload: { name: 'Test Scenario', input },
    });
    expect(createRes.statusCode).toBe(201);
    const scenario = createRes.json();
    expect(scenario.id).toBeDefined();
    expect(scenario.versions.length).toBe(1);

    const getRes = await app.inject({
      method: 'GET',
      url: `/api/scenarios/${scenario.id}`,
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().name).toBe('Test Scenario');
  });

  it('POST /api/scenarios/:id/versions appends a new version', async () => {
    const input1 = {
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 85,
      currentBalance: 10000,
      annualSalary: 100000,
      contributionRatePct: 10,
      employerMatchPct: 5,
      expectedReturnPct: 7,
      inflationPct: 2,
      marginalTaxRatePct: 25,
      retirementTaxRatePct: 15,
      desiredAnnualSpend: 60000,
      accountType: 'traditional',
    };

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/scenarios',
      payload: { name: 'Versioned Scenario', input: input1 },
    });
    const scenario = createRes.json();

    const input2 = { ...input1, contributionRatePct: 15 };
    const versionRes = await app.inject({
      method: 'POST',
      url: `/api/scenarios/${scenario.id}/versions`,
      payload: { input: input2, label: 'Higher contribution' },
    });
    expect(versionRes.statusCode).toBe(201);
    expect(versionRes.json().version).toBe(2);

    const diffRes = await app.inject({
      method: 'GET',
      url: `/api/scenarios/${scenario.id}/diff?from=1&to=2`,
    });
    expect(diffRes.statusCode).toBe(200);
    const diffJson = diffRes.json();
    expect(diffJson.diff.inputDeltas.contributionRatePct.delta).toBe(5);
  });

  it('returns 400 on validation failure', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/projections/preview',
      payload: { currentAge: 10 },
    });
    expect(response.statusCode).toBe(400);
  });

  it('returns 404 for unknown scenario id', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/scenarios/non-existent-id',
    });
    expect(response.statusCode).toBe(404);
  });
});
