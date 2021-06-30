FROM node:lts-alpine as client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN yarn install
COPY client/ ./
RUN yarn run build


FROM node:latest AS main-build
WORKDIR /app/bot
COPY --from=client-build /app/client/dist ./client/dist

WORKDIR /app/bot/server
COPY server/package*.json ./
RUN yarn install
COPY server/ ./

RUN apt-get -y update\
    && apt-get -y upgrade\
    && apt-get install -y ffmpeg
EXPOSE 4599
CMD [ "yarn", "run", "start"]