FROM node:24.17.0-alpine AS base
WORKDIR /workspace
COPY package.json package-lock*.json ./
COPY tsconfig.base.json ./tsconfig.base.json
COPY api/package.json ./api/package.json
COPY sdk/package.json ./sdk/package.json
COPY app/package.json ./app/package.json
RUN HUSKY=0 npm ci

FROM base AS api-dev
COPY api ./api
COPY sdk ./sdk
WORKDIR /workspace
EXPOSE 3000
CMD ["npm", "--workspace", "@astrix/api", "run", "dev"]

FROM base AS sdk-dev
COPY sdk ./sdk
WORKDIR /workspace
CMD ["npm", "--workspace", "@astrix/sdk", "run", "dev"]

FROM base AS app-dev
COPY app ./app
COPY sdk ./sdk
WORKDIR /workspace
EXPOSE 3001
CMD ["npm", "--workspace", "@astrix/app", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3001"]

FROM base AS build
COPY . .
RUN npm run build

FROM build AS production-dependencies
RUN HUSKY=0 npm prune --omit=dev

FROM node:24.17.0-alpine AS astrix
WORKDIR /workspace
ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=8333
COPY --chown=node:node --from=build /workspace/package.json ./package.json
COPY --chown=node:node --from=production-dependencies /workspace/node_modules ./node_modules
COPY --chown=node:node --from=build /workspace/api/package.json ./api/package.json
COPY --chown=node:node --from=build /workspace/api/dist ./api/dist
COPY --chown=node:node --from=build /workspace/api/migrations ./api/migrations
COPY --chown=node:node --from=build /workspace/app/build ./app/build
WORKDIR /workspace/api
USER node
EXPOSE 8333
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8333/health >/dev/null 2>&1 || exit 1
CMD ["node", "dist/server.js"]
