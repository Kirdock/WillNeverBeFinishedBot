FROM node:lts-alpine as client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:latest AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

FROM node:latest AS main-build
WORKDIR /app/bot
COPY --from=client-build /app/client/dist ./client/dist
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=client-build /app/client/node_modules ./client/node_modules
# COPY server/package*.json ./server/
# COPY client/package*.json ./client/
# RUN npm install --production -p ./client\
#     && npm install --production -p ./server # but this needs additional tools like python which is not available in alpine
RUN apt-get -y update\
    && apt-get -y upgrade\
    && apt-get install -y ffmpeg
EXPOSE 4599
CMD [ "node", "./server/dist/index.js"]