# What does this Bot do?
The purpose of this Bot is, to serve as a sound board. In addition to this, the bot has it's own web interface (done with Vue.js), where you can login via Discord OAuth2.
Most of the features are realized on the website and not as commands. Up to now the bot needs a lot of refactoring and the json-database I currently have, should be changed because it is very limited (good luck trying to play a file via command with name, when you can't search case-insensitive in this database).

## Features:
- Upload and play sounds files (it should support all common audio-formats)
- Play Youtube videos (audio only; timestamps not supported)
- Set intros for your servers (if a user joins, the Bot will play the intro that is assigned to the server default or the user)
- Outros for your server (nobody wants it, but I made it anyway; only configurable for server default)

## Admin-Features (users that are admin on the specified server)
- Change intros for every user on this server
- See latest logs for this server (played, uploaded sound)
- Change server settings (like "enable intros" or "bot should leave/stay after sound ends")

## Power-Admin Features
- No restriction to server

# Configuration
Location: `./server/config/config.json`
```javascript
{
    "clientId": "CLIENT_ID",
    "token": "TOKEN",
    "clientSecret": "CLIENT_SECRET",
    "scope": "identify",
    "owners": ["FULL_ADMIN1_USER_ID", "FULL_ADMIN2_USER_ID"],
    "port": 4599
}
```
