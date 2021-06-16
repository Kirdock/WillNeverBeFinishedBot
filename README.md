# What does this Bot do?
The purpose of this Bot is, to serve as a sound board. In addition to this, the bot has it's own web interface (done with Vue.js), where you can login via Discord OAuth2.
Most of the features are realized on the website and not as commands. Up to now the bot needs a lot of refactoring and the json-database I currently have, should be changed because it is very limited (good luck trying to play a file via command with name, when you can't search case-insensitive in this database).

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
- TOKEN (required). Token for Discord bot.
- CLIENT_SECRET (required). Secret for Webtoken.
- PORT. Port for webserver. Default: 4599.
- OWNERS. "id1,id2,...". Super admins separated by ",".
- PREFIXES. "!,-,...". Prefixes for bot commands in chat separated by ",". Default: !.
- SCOPE. "identify,...". Scopes of the bot. Default: identify.
- WEBTOKEN_SECRET. Secret to encode webtoken.
- DATABASE_NAME. Main database name for mongodb.
- DATABASE_USER. Username for mongodb.
- DATABASE_PASSWORD. Password for mongodb.

Port is defined in .env and in Dockerfile (EXPOSE). These two must match.
