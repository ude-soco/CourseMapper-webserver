FROM node:16-slim

EXPOSE 8080

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

CMD ["npm", "run", "watch:dev"]