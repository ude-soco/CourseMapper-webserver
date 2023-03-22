# syntax=docker/dockerfile:1.5
FROM node:16-slim as build

WORKDIR /app
ENV PATH "$PATH:/app/node_modules/.bin"
ENV NODE_ENV production
ENV NPM_CONFIG_UPDATE_NOTIFIER false

COPY package*.json .
RUN  npm ci --legacy-peer-deps --omit=optional --no-fund && npm version

COPY . .
RUN  npm run build



FROM nginxinc/nginx-unprivileged:1.23-alpine

USER root
WORKDIR /usr/share/nginx/html
RUN chown -R nginx:nginx .

USER 101
COPY --link --from=build --chown=101 /app/dist/webapp/ ./
COPY --link ./nginx/conf.d/* /etc/nginx/conf.d/
COPY --link ./nginx/docker-entrypoint.d/* /docker-entrypoint.d/

ENV NGINX_ENTRYPOINT_QUIET_LOGS 1
EXPOSE 4200
