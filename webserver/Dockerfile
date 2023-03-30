# syntax=docker/dockerfile:1.5
FROM node:19.8-slim as base
WORKDIR /app
ENV PATH "$PATH:/app/node_modules/.bin"
ENV NODE_ENV production
ENV NPM_CONFIG_UPDATE_NOTIFIER false


FROM base as build
COPY package*.json ./
RUN  --mount=type=cache,target=/app/.npm,rw \
     npm ci --cache=/app/.npm --prefer-offline --no-audit --omit=dev --omit=optional --no-fund

COPY . ./
RUN  npm run build &&\
     mkdir -p dist &&\
     cp -r package* node_modules dist-server dist


FROM base as runtime
COPY --from=build /app/dist .
EXPOSE 8080
CMD ["npm", "run", "server"]
