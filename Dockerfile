FROM node:lts-alpine as client-build
WORKDIR /app/client
COPY client/package.json client/yarn.lock ./
RUN yarn install
COPY shared/ /app/shared/
COPY client/ ./
RUN yarn run build


FROM node:18.7 AS main-build
WORKDIR /app/bot
COPY --from=client-build /app/client/dist ./client/dist
COPY shared/ ./shared

WORKDIR /app/bot/server
COPY server/package.json server/yarn.lock ./
RUN yarn install
COPY server/ shared/ ./

ARG logLevel="debug"
ENV LOG_LEVEL=$logLevel
ARG version="develop"
ENV VERSION=$version
ARG client_token=""
ENV CLIENT_TOKEN=$client_token
ARG client_secret=""
ENV CLIENT_SECRET=$client_secret
ARG host="http://localhost:5000"
ENV HOST=$host
ARG port=4599
ENV PORT=$port
ARG prefixes="!"
ENV PREFIXES=$prefixes
ARG scope="identify"
ENV SCOPE=$scope
ARG database_name="willneverbefinishedbot"
ENV DATABASE_NAME=$database_name
ARG database_user="root"
ENV DATABASE_USER=$database_user
ARG database_password=""
ENV DATABASE_PASSWORD=$database_password
ARG webtoken_secret=""
ENV WEBTOKEN_SECRET=$webtoken_secret

RUN apt-get -y update\
    && apt-get -y upgrade\
    && apt-get install -y ffmpeg
RUN yarn run build
EXPOSE $port
CMD [ "yarn", "run", "start:production"]