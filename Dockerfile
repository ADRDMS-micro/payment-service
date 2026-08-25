FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /usr/src/app

# Assuming a monorepo setup or similar, copy package files first for caching
COPY backend/payment-service/package.json backend/payment-service/pnpm-lock.yaml* backend/payment-service/
COPY shared/ shared/

WORKDIR /usr/src/app/backend/payment-service
RUN pnpm install

# Now copy the rest of the source code
WORKDIR /usr/src/app
COPY backend/payment-service/ backend/payment-service/

# Build the shared library (if needed) and payment-service
WORKDIR /usr/src/app/backend/payment-service
RUN pnpm run build

FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/shared /usr/src/app/shared
COPY --from=builder /usr/src/app/backend/payment-service/package.json /usr/src/app/backend/payment-service/
COPY --from=builder /usr/src/app/backend/payment-service/node_modules /usr/src/app/backend/payment-service/node_modules
COPY --from=builder /usr/src/app/backend/payment-service/dist /usr/src/app/backend/payment-service/dist

WORKDIR /usr/src/app/backend/payment-service

CMD ["node", "dist/main.js"]
