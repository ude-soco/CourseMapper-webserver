# syntax=docker/dockerfile:1.5
FROM node:16-slim as build

WORKDIR /app
ENV PATH "$PATH:/app/node_modules/.bin"

COPY package*.json ./
RUN  npm ci --omit=dev --omit=optional

COPY . ./

EXPOSE 8080
CMD ["npm", "run", "prod"]
