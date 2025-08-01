FROM node:24.4.1-alpine as pre-production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .

RUN npm i

RUN npm run build

FROM --platform=linux/amd64 node:24.4.1-alpine as production

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=pre-production /usr/src/app/build ./build

COPY package.json .

RUN npm ci --omit dev

RUN mkdir -p ./config

RUN ln -s /usr/src/app/config /config

CMD [ "npm", "run", "deploy" ]

FROM node:24.4.1 as development

ENV NODE_ENV=development

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json .

RUN npm i

RUN mkdir -p ./config

RUN ln -s /usr/src/app/config /config

CMD [ "npm", "run", "dev" ]
