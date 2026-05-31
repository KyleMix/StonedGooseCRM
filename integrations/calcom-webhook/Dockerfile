# Build context is ../integrations (the parent). We replicate the on-disk
# layout inside the image so the relative imports (../shared/...) just work.

FROM node:20-slim

WORKDIR /app
COPY shared/ ./shared/

WORKDIR /app/calcom-webhook
COPY calcom-webhook/package.json ./package.json
RUN npm install

COPY calcom-webhook/tsconfig.json ./tsconfig.json
COPY calcom-webhook/index.ts ./index.ts

EXPOSE 3004
CMD ["npx", "tsx", "index.ts"]
