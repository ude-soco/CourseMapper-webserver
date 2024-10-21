# syntax=docker/dockerfile:1.5
FROM node:23.0-slim as build

WORKDIR /app
ENV PATH "$PATH:/app/node_modules/.bin"
ENV NODE_ENV production
ENV NPM_CONFIG_UPDATE_NOTIFIER false
ENV NG_PERSISTENT_BUILD_CACHE 1

COPY package*.json .
RUN  --mount=type=cache,target=/app/.npm,rw \
     npm ci --cache=/app/.npm --prefer-offline --no-audit --legacy-peer-deps --omit=optional --no-fund

COPY . .
RUN  --mount=type=cache,target=/app/node_modules/.cache,rw \
     ng build --configuration production



FROM nginxinc/nginx-unprivileged:1.27.2-alpine

USER root
WORKDIR /usr/share/nginx/html
RUN chown -R nginx:nginx .

USER 101
COPY --link --from=build --chown=101 /app/dist/webapp/ ./
COPY --link ./nginx/conf.d/* /etc/nginx/conf.d/
COPY --link --chmod=0755 ./nginx/docker-entrypoint.d/* /docker-entrypoint.d/

ENV NGINX_ENTRYPOINT_QUIET_LOGS 1
EXPOSE 4200
