# syntax=docker/dockerfile:1.5
FROM nginxinc/nginx-unprivileged:1.27.5-alpine

USER root
COPY --link ./nginx/conf.d/* /etc/nginx/conf.d/

EXPOSE 8000
