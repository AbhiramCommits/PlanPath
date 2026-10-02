import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { scenarioInputSchema, projectScenario, diffScenarios } from '@planpath/shared';

export const prisma = new PrismaClient();

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  // Health check
  app.get('/health', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'connected' };
    } catch (e: any) {
      return { status: 'degraded', db: 'disconnected', error: e.message };
    }
  });

  // Preview projection (stateless)
  app.post('/api/projections/preview', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = scenarioInputSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        error: 'Validation Error',
        details: parseResult.error.format(),
      });
    }
    const result = projectScenario(parseResult.data);
    return result;
  });

  // List scenarios
  app.get('/api/scenarios', async () => {
    const scenarios = await prisma.scenario.findMany({
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
        member: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return scenarios;
  });

  // Create scenario + version 1
  app.post('/api/scenarios', async (request: FastifyRequest, reply: FastifyReply) => {
    const body: any = request.body;
    const parseResult = scenarioInputSchema.safeParse(body.input);
    if (!parseResult.success) {
      return reply.code(400).send({
        error: 'Validation Error',
        details: parseResult.error.format(),
      });
    }

    const input = parseResult.data;
    const result = projectScenario(input);

    // Get or create default member
    let member = await prisma.member.findFirst();
    if (!member) {
      member = await prisma.member.create({
        data: { email: 'default@planpath.test', name: 'Default Member' },
      });
    }

    const scenario = await prisma.scenario.create({
      data: {
        name: body.name || 'Untitled Scenario',
        memberId: member.id,
        versions: {
          create: {
            version: 1,
            input: input as any,
            result: result as any,
            label: body.label || 'Initial Version',
          },
        },
      },
      include: { versions: true },
    });

    return reply.code(201).send(scenario);
  });

  // Get scenario with all versions
  app.get('/api/scenarios/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const scenario = await prisma.scenario.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: 'asc' } } },
    });

    if (!scenario) {
      return reply.code(404).send({ error: 'Scenario not found' });
    }

    return scenario;
  });

  // Append next version
  app.post('/api/scenarios/:id/versions', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body: any = request.body;

    const parseResult = scenarioInputSchema.safeParse(body.input);
    if (!parseResult.success) {
      return reply.code(400).send({
        error: 'Validation Error',
        details: parseResult.error.format(),
      });
    }

    const scenario = await prisma.scenario.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });

    if (!scenario) {
      return reply.code(404).send({ error: 'Scenario not found' });
    }

    const nextVersionNum = (scenario.versions[0]?.version || 0) + 1;
    const input = parseResult.data;
    const result = projectScenario(input);

    const newVersion = await prisma.scenarioVersion.create({
      data: {
        scenarioId: id,
        version: nextVersionNum,
        input: input as any,
        result: result as any,
        label: body.label || `Version ${nextVersionNum}`,
      },
    });

    return reply.code(201).send(newVersion);
  });

  // Diff between two versions
  app.get('/api/scenarios/:id/diff', async (request: FastifyRequest<{ Params: { id: string }; Querystring: { from?: string; to?: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const fromVer = parseInt(request.query.from || '1', 10);
    const toVer = parseInt(request.query.to || '2', 10);

    const versions = await prisma.scenarioVersion.findMany({
      where: {
        scenarioId: id,
        version: { in: [fromVer, toVer] },
      },
    });

    const vFrom = versions.find((v) => v.version === fromVer);
    const vTo = versions.find((v) => v.version === toVer);

    if (!vFrom || !vTo) {
      return reply.code(404).send({ error: 'One or both scenario versions not found' });
    }

    const diff = diffScenarios(vFrom.input as any, vFrom.result as any, vTo.input as any, vTo.result as any);

    return {
      fromVersion: fromVer,
      toVersion: toVer,
      diff,
    };
  });

  return app;
}
