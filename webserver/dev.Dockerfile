# syntax=docker/dockerfile:1.15
FROM node:24-slim

WORKDIR /app
ENV PATH="$PATH:/app/node_modules/.bin"
ENV NODE_ENV=development

# No files are added, source directory is expected to be mounted

EXPOSE 8080
CMD ["bash", "-c", "npm install && npm run watch:dev"]
