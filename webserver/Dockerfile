# syntax=docker/dockerfile:1.15
FROM node:24.0-slim as base
WORKDIR /app
ENV PATH="$PATH:/app/node_modules/.bin"
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false


FROM base as build
COPY package*.json ./
RUN  --mount=type=cache,target=/app/.npm,rw \
     npm ci --cache=/app/.npm --prefer-offline --no-audit --omit=dev --omit=optional --no-fund

COPY . ./
RUN  npm run build &&\
     mkdir -p dist &&\
     cp -r package* node_modules dist-server dist


FROM base as runtime
COPY public/randomImgs ./public/randomImgs
COPY --from=build /app/dist .
EXPOSE 8080
CMD ["npm", "run", "server"]
