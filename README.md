# What does this Bot do?
The purpose of this Bot is, to serve as a sound board. In addition to this, the bot has it's own web interface (done with Angular), where you can login via Discord OAuth2.
Most of the features are implemented on the website and not as commands.

## Features:
- Upload and play sounds files (it should support all common audio-formats).
- Play Youtube videos (audio only; timestamps not supported).
- Set intros for your servers (if a user joins, the Bot will play the intro that is assigned to the server default or the user).
- Outros for your server (nobody wants it, but I made it anyway). Only configurable for server default and not per user.

## Admin-Features (users that are admin on the specified server)
- Change intros for every user on this server.
- See latest logs for servers (played, uploaded sound).
- Change server settings (like "enable intros" or "bot should leave/stay after sound ends").

## Power-Admin Features
- No restriction to server.

# Configuration
Environment Variables (.env file in root):
- CLIENT_TOKEN (required): Token for Discord bot.
- CLIENT_SECRET (required): Secret for Discord bot.
- HOST: URL for the website. Used for `list` command (reply url) and OAUTH2. Default `http://localhost:5000`.
- PORT: Port for webserver. Default: `4599`.
- OWNERS: "id1,id2,...". Super admins separated by `,`.
- PREFIXES: "!,-,...". Prefixes for bot commands in chat separated by `,`. Default: `!`.
- SCOPE: "identify,...". Scopes of the bot. Default: `identify`.
- WEBTOKEN_SECRET: Secret to encode webtoken.
- DATABASE_NAME: Main database name for mongodb.
- DATABASE_USER: Username for mongodb.
- DATABASE_PASSWORD: Password for mongodb.

Port is defined in .env and in Dockerfile (EXPOSE). These two must match.

# Run in production
- Run `docker-compose up --build`.
- Access website via `http://localhost:${PORT}`.

# Run in development
Run server & Database: `docker-compose --env-file ./.env.test -f ./docker-compose.dev.yml  up --build`.
- Here we use `.env.test` as environment file instead of `.env`
- Make sure the HOST environment variable is set to `http://localhost:5000` or just don't set it because it's the default value

Run client: `npm run start`.
Access web interface via `localhost:5000`