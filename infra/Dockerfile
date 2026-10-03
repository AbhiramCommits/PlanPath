FROM node:20-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server
RUN npm install -g pnpm typescript
RUN cd packages/shared && tsc
RUN cd packages/server && tsc

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/node_modules ./node_modules
COPY --from=builder /app/packages/server/package.json ./package.json
COPY --from=builder /app/packages/server/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/index.js"]
