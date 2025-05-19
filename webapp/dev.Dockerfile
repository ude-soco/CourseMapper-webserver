# syntax=docker/dockerfile:1.5
FROM node:24-slim

WORKDIR /app
ENV PATH "$PATH:/app/node_modules/.bin"
ENV NODE_ENV development

# No files are added, source directory is expected to be mounted

EXPOSE 4200
CMD ["bash", "-c", "npm install --legacy-peer-deps && npm run watch"]
