# syntax=docker/dockerfile:1.15
FROM nginxinc/nginx-unprivileged:1.29.1-alpine

USER root
COPY --link ./nginx/conf.d/* /etc/nginx/conf.d/

EXPOSE 8000
