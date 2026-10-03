# AWS Deployment Guide for PlanPath

## Architecture Overview
- **Client**: Static SPA built with Vite + React, hosted on AWS S3 and distributed via Amazon CloudFront.
- **Server**: Node.js 20 Fastify REST API containerized with Docker and deployed on Amazon ECS (Fargate) behind an Application Load Balancer (ALB).
- **Database**: PostgreSQL hosted on Amazon RDS (PostgreSQL 16).
- **Secrets & Config**: Environment variables and database credentials stored securely in AWS Secrets Manager and passed to ECS tasks.

---

## 1. Server Dockerfile (`infra/Dockerfile`)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server
RUN npm install -g pnpm && pnpm install --shamefully-hoist --unsafe-perm
RUN pnpm --filter @planpath/shared build
RUN pnpm --filter server build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/node_modules ./node_modules
COPY --from=builder /app/packages/server/package.json ./package.json
COPY --from=builder /app/packages/server/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## 2. Deployment Steps
1. **Database**: Provision Amazon RDS PostgreSQL 16 instance in a private subnet. Run Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```
2. **Container Registry**: Build and push server image to Amazon ECR:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com
   docker build -f infra/Dockerfile -t planpath-server .
   docker tag planpath-server:latest <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/planpath-server:latest
   docker push <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/planpath-server:latest
   ```
3. **ECS Fargate**: Create an ECS Cluster and Task Definition referencing the ECR image, passing `DATABASE_URL` and `CLIENT_ORIGIN` from AWS Secrets Manager.
4. **Client S3 + CloudFront**: Build the client (`pnpm --filter client build`) and sync `packages/client/dist` to an S3 bucket fronted by CloudFront.
