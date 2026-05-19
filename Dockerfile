FROM node:26-alpine as pre-production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .

RUN npm ci

RUN npm run build

FROM --platform=linux/amd64 node:26-alpine as production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/appn

ENV NODE_ENV=production

COPY --from=pre-production /usr/src/app/build ./build

COPY package.json .
COPY package-lock.json .

RUN npm ci --omit dev

RUN mkdir -p ./config

RUN ln -s /usr/src/app/config /config

ENV PORT=9494
CMD [ "node", "build" ]
