# VanillaBot
NodeJS Steam bot for 1:1 same set Trading Cards, Background, and Emoticon Trade

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

> How to change Online status?

A: Change setPersona number on [line 200](https://github.com/Vanilla72/VanillaBot/blob/master/bot.js#L200)

> Market Confirmation?

A: Market confirmation didn't works for some reason, I'm not sure why.

> Why bot can't do non-marketable card trade?

A: It's because the relevant code got removed and it's quite buggy.

So far VanillaBot use `if (item.marketable == false){ //do something about non marketable card }`, but Steam sometimes send wrong information about it, which makes bot think it's marketable card / cross-trade. I tried checking the "Marketable" tags or checking *This item can no longer be bought or sold on the Community Market* text, and it still doesn't works because Steam sending wrong information.

Workaround exist by checking is Market price exist or not *each card*, which takes a lot of time and have chance bot got rate-limited by Steam (also *might* break Steam Term of Service because Market bot is not allowed)

*will added more if needed*

## Add / change bot feature (developer only)

First of all, you need to know Java or JavaScript to change the code

Please visit relevant module wiki to add / change feature

- General: [steam-user](https://github.com/DoctorMcKay/node-steam-user/blob/master/README.md#contents)
- Trading: [steam-tradeoffer-manager](https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOffer#table-of-contents)
- Trade item information: [CEconItem](https://github.com/DoctorMcKay/node-steamcommunity/wiki/CEconItem)
