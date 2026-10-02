import { PrismaClient } from '@prisma/client';
import { projectScenario } from '@planpath/shared';

const prisma = new PrismaClient();

async function main() {
  await prisma.scenarioVersion.deleteMany();
  await prisma.scenario.deleteMany();
  await prisma.member.deleteMany();

  const member = await prisma.member.create({
    data: {
      email: 'planner@planpath.test',
      name: 'Test Planner',
    },
  });

  // 1. Aggressive Saver Scenario
  const s1Input = {
    currentAge: 25,
    retirementAge: 55,
    lifeExpectancy: 90,
    currentBalance: 25000,
    annualSalary: 120000,
    contributionRatePct: 20,
    employerMatchPct: 6,
    expectedReturnPct: 8,
    inflationPct: 2.5,
    marginalTaxRatePct: 28,
    retirementTaxRatePct: 15,
    desiredAnnualSpend: 75000,
    accountType: 'traditional' as const,
  };
  const s1Result = projectScenario(s1Input);

  const scenario1 = await prisma.scenario.create({
    data: {
      memberId: member.id,
      name: 'Aggressive Saver',
      versions: {
        create: [
          {
            version: 1,
            input: s1Input,
            result: s1Result,
            label: 'Initial aggressive plan',
          },
          {
            version: 2,
            input: { ...s1Input, contributionRatePct: 25 },
            result: projectScenario({ ...s1Input, contributionRatePct: 25 }),
            label: 'Boosted contribution to 25%',
          },
        ],
      },
    },
  });

  // 2. Late Starter Scenario
  const s2Input = {
    currentAge: 45,
    retirementAge: 67,
    lifeExpectancy: 85,
    currentBalance: 50000,
    annualSalary: 95000,
    contributionRatePct: 15,
    employerMatchPct: 3,
    expectedReturnPct: 7,
    inflationPct: 2,
    marginalTaxRatePct: 24,
    retirementTaxRatePct: 20,
    desiredAnnualSpend: 60000,
    accountType: 'traditional' as const,
  };
  const s2Result = projectScenario(s2Input);

  await prisma.scenario.create({
    data: {
      memberId: member.id,
      name: 'Late Starter',
      versions: {
        create: [
          {
            version: 1,
            input: s2Input,
            result: s2Result,
            label: 'Standard late start',
          },
        ],
      },
    },
  });

  // 3. Roth vs Traditional Pair
  const s3InputTrad = {
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
    accountType: 'traditional' as const,
  };
  const s3InputRoth = { ...s3InputTrad, accountType: 'roth' as const };

  await prisma.scenario.create({
    data: {
      memberId: member.id,
      name: 'Roth vs Traditional Comparison',
      versions: {
        create: [
          {
            version: 1,
            input: s3InputTrad,
            result: projectScenario(s3InputTrad),
            label: 'Traditional Account version',
          },
          {
            version: 2,
            input: s3InputRoth,
            result: projectScenario(s3InputRoth),
            label: 'Roth Account version',
          },
        ],
      },
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
