# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY api-contract.json ./

RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY scripts ./scripts
RUN npm run gen:contract

COPY src ./src
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S nodejs -g 1001 && \
    adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/src/contract/generated ./dist/contract/generated

USER nodejs

EXPOSE 8080

CMD ["node", "dist/main.js"]
