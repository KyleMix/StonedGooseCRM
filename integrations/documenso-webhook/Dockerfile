# Build context is ../integrations (the parent). We replicate the on-disk
# layout inside the image so the relative imports (../shared/...) just work.

FROM node:20-slim

WORKDIR /app
COPY shared/ ./shared/

WORKDIR /app/documenso-webhook
COPY documenso-webhook/package.json ./package.json
RUN npm install

COPY documenso-webhook/tsconfig.json ./tsconfig.json
COPY documenso-webhook/index.ts ./index.ts

EXPOSE 3003
CMD ["npx", "tsx", "index.ts"]
