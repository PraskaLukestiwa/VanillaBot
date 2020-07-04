# VanillaBot
NodeJS code for 1:1 same set Trading Cards, Background, and Emoticon Steam Trading Bot

https://steamcommunity.com/id/VanillaBot/

If you have question, please leave a comment on [owner profile](https://steamcommunity.com/profiles/76561198078744223) instead on GitHub

## Instalation and Running bot

Install NodeJS: https://nodejs.org/

Install needed module via npm (`npm install *module*`) using cmd (Windows) or terminal (Linux):
- "steamcommunity"
- "steam-totp"
- "steam-user"
- "steam-tradeoffer-manager"
- "decode-html"

Download / Clone repository ([Download ZIP](https://github.com/Vanilla72/VanillaBot/archive/master.zip))

Put entire file inside node module directory (you can use command `npm root` or `npm root -g` to check it)

Change *config.json* value:
- username: your bot username
- password: your bot password
- admin: Owner Steam64ID (use https://steamid.io/lookup/)
- my64id: Bot Steam64ID (use https://steamid.io/lookup/)
- tfa: shared_secret code (in Android you can find it on `/data/data/com.valvesoftware.android.steam.community/files/Steamguard-YourSteamID64Code`)
- trade: identity_secret code (in Android you can find it on `/data/data/com.valvesoftware.android.steam.community/files/Steamguard-YourSteamID64Code`)
- apikey: Steam API key (https://steamcommunity.com/dev/apikey)
- rememberPassword: true

Run bot using `node bot.js`

## FAQ

Q: How to change online status?

A: Change setPersona number on [line 200](https://github.com/Vanilla72/VanillaBot/blob/master/bot.js#L200)

Q: Market Confirmation?

A: Market confirmation didn't works for some reason, I'm not sure why.

*will added more if needed*

## Add / change bot feature (developer only)

Please visit relevant module wiki to add / change feature

- General: [steam-user](https://github.com/DoctorMcKay/node-steam-user/blob/master/README.md#contents)
- Trading: [steam-tradeoffer-manager](https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOffer#table-of-contents)
- Trade item information: [CEconItem](https://github.com/DoctorMcKay/node-steamcommunity/wiki/CEconItem)
