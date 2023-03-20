# syntax=docker/dockerfile:1.5
FROM node:16-slim as base
WORKDIR /app
ENV PATH "$PATH:/app/node_modules/.bin"
ENV NODE_ENV production
ENV NPM_CONFIG_UPDATE_NOTIFIER false


FROM base as build
COPY package*.json ./
RUN  npm ci --omit=dev --omit=optional --no-fund &&\
     npm version
COPY . ./
RUN  npm run build &&\
     mkdir -p dist &&\
     cp -r package* node_modules dist-server dist


FROM base as runtime
COPY --from=build /app/dist .
EXPOSE 8080
CMD ["npm", "run", "server"]
