/*

$$\    $$\                    $$\ $$\ $$\                 $$$$$$$\             $$\     
$$ |   $$ |                   \__|$$ |$$ |                $$  __$$\            $$ |    
$$ |   $$ |$$$$$$\  $$$$$$$\  $$\ $$ |$$ | $$$$$$\        $$ |  $$ | $$$$$$\ $$$$$$\   
\$$\  $$  |\____$$\ $$  __$$\ $$ |$$ |$$ | \____$$\       $$$$$$$\ |$$  __$$\\_$$  _|  
 \$$\$$  / $$$$$$$ |$$ |  $$ |$$ |$$ |$$ | $$$$$$$ |      $$  __$$\ $$ /  $$ | $$ |    
  \$$$  / $$  __$$ |$$ |  $$ |$$ |$$ |$$ |$$  __$$ |      $$ |  $$ |$$ |  $$ | $$ |$$\ 
   \$  /  \$$$$$$$ |$$ |  $$ |$$ |$$ |$$ |\$$$$$$$ |      $$$$$$$  |\$$$$$$  | \$$$$  |
    \_/    \_______|\__|  \__|\__|\__|\__| \_______|      \_______/  \______/   \____/ 
	
					https://steamcommunity.com/id/VanillaBot/
	
*/

var isJSON = true;
var validLoginKey = "";
var config = require("./config.json");
//var login_key = require("./loginkey.json");

var SteamCommunity = require("steamcommunity");
var fs = require('fs');
var fs2 = require('fs');
var steam = new SteamCommunity();
var SteamTotp = require('steam-totp');
var SteamUser = require('steam-user');
var client = new SteamUser();
var SteamID = SteamCommunity.SteamID;
var admin = config.admin;
var TradeOfferManager = require('steam-tradeoffer-manager');
var identitysecret = config.trade;
var decode = require('decode-html');
var manager = new TradeOfferManager({
	"steam": client,
	"community": steam,
	"domain": "example.com",
	"language": "en",
	"globalAssetCache": true
});

try {
	var rawdata = fs.readFileSync('loginkey.json');  
	var fileLoginKey = JSON.parse(rawdata);  
} catch (e) {
	isJSON = false;
}

if (isJSON == true){
	var login_key = require("./loginkey.json");
	validLoginKey = login_key.loginkey;
}
else {
	var jsonformat = '{ "loginkey" : "" }';
	fs.appendFile("loginkey.json", jsonformat,  {flag: 'w'}, function(err) {});
	validLoginKey = "";
}

var antispam;
var markedSteamID;
var unblockedSteamID;
var removefriendSteamID;
var blockSteamID;
var blocklistSteamID;
var donatorName;
var spammerSteamID;
var counterofferSteamID;

var cards;
var date;
var lastAdd = 0;

var lastOfferID;
var vanityname;

//fs.appendFile("log.txt", "",  {flag: 'w'}, function(err) {});
fs.appendFile("log.txt", "",  {flag: 'a'}, function(err) {});

function matchDescription() { 
    //return 'This item can no longer be bought or sold on the Community Market.';
	return 'Community Market';
}
function rolldice() {
	var x = Math.floor((Math.random() * 6) + 1);
	return (x);
}
function currentdate(){
	var date = new Date(); 
	var dateformat = (("0" +date.getDate()).slice(-2) + "/"
					+ (+date.getMonth()+1) + "/"
					+ ("0" +date.getFullYear()).slice(-2) + " - "
					+ ("0" +date.getHours()).slice(-2) + ":"
					+ ("0" +date.getMinutes()).slice(-2) + ":"
					+ ("0" +date.getSeconds()).slice(-2));
	return (dateformat);
}
function twofactor() {
	var tfa = SteamTotp.generateAuthCode(config.tfa);
	return (tfa);
}
function stmCommand(SteamID){
	
	var myType = [];
	var myAssetId = [];
	var myItemName = [];
	
	var theirType = [];
	var theirAssetId = [];
	var theirItemName = [];
	
	manager.getInventoryContents(753, 6, true, function(err, inventory, currencies){
		if (err){
			var log = (currentdate() + " - Unable to load my inventory - "+err);
			console.log(log);
			fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
			client.chatMessage(SteamID, err);
			setTimeout(function(){
				client.chatMessage(SteamID, "If this error keep happening, please contact my Owner or leave comment");
			}, 1500);
		}
		else {
			inventory.forEach(function(item) {
				myType.push(item.type);
				myAssetId.push(item.assetid);
				myItemName.push(item.name);
			});
			console.log(myType);
			console.log(myAssetId);
			console.log(myItemName);
		}
	});
};
function acceptConfirmation() {
	var time = Math.floor(Date.now() / 1000);
	var conf_key = SteamTotp.getConfirmationKey(config.trade, time, 'conf');
	var allowKey = SteamTotp.getConfirmationKey(config.trade, time, 'allow');
	
	setTimeout(function(){
		
		steam.getConfirmations(time, conf_key, function(err, confirmations){
			if (err){
				var log = (currentdate() + " - "+ err);
				fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
				console.log(log);
			}
			else if (confirmations.length == 0){
				var log = (currentdate() + " - Nothing to confirm");
				console.log(log);
				fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
			}
			else {
				steam.acceptAllConfirmations(time, conf_key, allowKey, function(err, conf) {
					if (err) {
						var log = (currentdate() + " - "+ err);
						fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
						console.log(log);
					}
					else {
						conf.forEach (function(item) {
							var log = (currentdate() + " - Confirmed Trade Offer #" +item.creator);
							console.log(log);
							fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
						});
					}
				});
			}
		});
	}, 1000);
}
function spamtimer() {
	antispam = 0;
	markedSteamID = 0;
}

setInterval(currentdate, 1000);
setInterval(twofactor, 1000);
setInterval(spamtimer, 2000);

String.prototype.insert = function (index, string) {
  if (index > 0)
    return this.substring(0, index) + string + this.substring(index, this.length);
  else
    return string + this;
};

// -------------- LOGIN DATA --------------

client.logOn({
	"accountName": config.username,
    "password": config.password,
    "twoFactorCode": SteamTotp.generateAuthCode(config.tfa),
	"rememberPassword" : config.rememberPassword,
	"loginKey": validLoginKey
});

client.on('loggedOn', function (details) {
	var log = (currentdate() + " - Sucesfully Logged in");
	fs.appendFile("log.txt", log+ "\n",  {flag: 'a'}, function(err) {});
	console.log(log);
	vanityname = client.vanityURL;
	client.setPersona(1); //"0": "Offline", "1": "Online", "2": "Busy", "3": "Away", "4": "Snooze", "5": "LookingToTrade", "6": "LookingToPlay"
	client.setUIMode(1);  //"None": 0, "BigPicture": 1, "Mobile": 2, "Web": 3
	
	//client.gamesPlayed("Custom Steam Game titles"); //63 characters - http://www.lettercount.com/
	//client.gamesPlayed(1121910);
});

client.on('error', function(err) {
	var log = (currentdate() + " - Logon Error: "+err);
	fs.appendFile("log.txt", log+ "\n",  {flag: 'a'}, function(err) {});
	console.log(log);
});

client.on('webSession', function(sessionID, cookies) {
    steam.setCookies(cookies);
    manager.setCookies(cookies);
	var log = (currentdate() + " - Got our cookies");
	fs.appendFile("log.txt", log+ "\n",  {flag: 'a'}, function(err) {});
	console.log(log);
	
	setTimeout(function(){
		steam.resetItemNotifications();
	}, 10000);
});

client.on('loginKey', function (key) {
	var jsonformat = '{ "loginkey" : "' +key+ '" }';
	fs.appendFile("loginkey.json", jsonformat,  {flag: 'w'}, function(err) {});
});

client.on('friendRelationship', function(steamID, relationship) {
    if (relationship == SteamUser.Steam.EFriendRelationship.RequestRecipient) {
		var log = (currentdate() + " - Incoming friend request from http://steamcommunity.com/profiles/" +steamID);
		fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
		console.log(log);
        client.addFriend(steamID);
		lastAdd == steamID;
		
		/*
		setTimeout(function(){
			client.chatMessage(steamID, "Hello, thanks for the add");
			setTimeout(function(){
				client.chatMessage(steamID, "Please check trade rules and send me trade offer");
			}, 1000);
		}, 2500);
		*/
    }
	else if (relationship == SteamUser.Steam.EFriendRelationship.None) {
		var log = (currentdate() + " - " +steamID+ " just removed from friend list");
		fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
		console.log(log);
	}
	else {
		
	}
});

steam.on("sessionExpired", function(err) {
	if (err) {
		setTimeout(function(){
			var log = (currentdate() + " - Refreshing our session");
			fs.appendFile("log.txt", log+ "\n",  {flag: 'a'}, function(err) {});
			console.log(log);
		}, 500);
		
		client.webLogOn();
		
		setTimeout(function(){
			manager.getOffer(lastOfferID, function (err, offer){
				if (err){
					var log = (currentdate() + " - "+ err);
					fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
					console.log(log);
				}
				else {
					offer.accept();
					setTimeout(function(){
						acceptConfirmation(); 
					}, 3000);
				}
			});
		}, 3000);
	}
});

/*
setTimeout(function(){
	//for debugging purposes
	console.log("rip cookies :(");
	//steam.setCookies(["steamLogin=1||invalid", "steamLoginSecure=1||invalid"]);
	manager.setCookies(["steamLogin=1||invalid", "steamLoginSecure=1||invalid"]);
}, 10000);
*/

client.on("friendMessage", function(senderID, message) {
	
	var text = message;
	
	// ---------- LOG INCOMING CHAT TO CONSOLE AND FILE CHATBOG_LOG.TXT ---------- //
	var log = (currentdate() + " - Message from " + senderID+ " : " + message);
	fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
	console.log(log);
	
	// ---------- ADMIN COMMAND ----------
	
	if ((senderID == admin) && (text.includes("giveme") == true)){
		
		var offer = manager.createOffer(admin);
		var countitem = 0;
		var itemname = [];
		text = text.split(" ");
		
		text.forEach(function(item){
			if (item.includes("giveme")){
				
			}
			else {
				itemname.push(item);
			}
		});
		itemname = itemname.join(" ");
		
		manager.getInventoryContents(753, 6, true, function(err, inventory, currencies){
			client.chatMessage(senderID, "Loading Inventories");
			if (err){
				var log = (currentdate() + " - Unable to send item - "+err);
				console.log(log);
				fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
				client.chatMessage(senderID, "Done");
			}
			else {
				inventory.forEach(function(item) {
					if (item.type.includes(itemname) == true){
						offer.addMyItem(item);
						countitem++;
					}
				});
				if (countitem == 0){
					client.chatMessage(senderID, "There's no item called: '"+itemname+"'");
				}
				else {
					offer.send(function(err, status){
						if (err){
							var log = (currentdate() + " Unable to send Trade Offer - "+err);
							console.log(log);
							fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
							client.chatMessage(senderID, "Unable to send trade offer: "+err);
						}
						else {
							setTimeout(function(){
								acceptConfirmation();
								client.chatMessage(senderID, "Trade Offer sent");
							}, 2000);
						}
					});
				}
			}
		});
		
	}
	else if ((senderID == admin) && (text.includes("takemy") == true)){
		
		var offer = manager.createOffer(admin);
		var countitem = 0;
		var itemname = [];
		text = text.split(" ");
		
		text.forEach(function(item){
			if (item.includes("takemy")){
				
			}
			else {
				itemname.push(item);
			}
		});
		itemname = itemname.join(" ");
		
		manager.getUserInventoryContents(admin, 753, 6, true, function(err, inventory, currencies){
			if (err){
				var log = (currentdate() + " - Unable to send item - "+err);
				console.log(log);
				fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
				client.chatMessage(senderID, "Done");
			}
			else {
				inventory.forEach(function(item) {
					if (item.type.includes(itemname) == true){
						offer.addTheirItem(item);
						countitem++;
					}
				});
				if (countitem == 0){
					client.chatMessage(senderID, "There's no item called: '"+itemname+"'");
				}
				else {
					offer.send(function(err, status){
						if (err){
							var log = (currentdate() + " Unable to send Trade Offer - "+err);
							console.log(log);
							fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
							client.chatMessage(senderID, "Unable to send trade offer: "+err);
						}
						else {
							client.chatMessage(senderID, "Trade Offer sent");
						}
					});
				}
			}
		});
		
	}
	else if ((senderID == admin) && (text == "relog")){
		client.chatMessage(senderID, "ReLoggin");
		client.webLogOn();
	}
	else if ((senderID == admin) && (text == "!2faok Van")){
		client.chatMessage(senderID, "Lol, wrong bot");
	}
	else if ((senderID == admin) && (text.substring(0,6) == "rename")){
		var newname = text.substring(7,text.length);
		client.setPersona(1, newname);
	}
	else if ((senderID == admin) && (text == "confirm")){
		acceptConfirmation();
		client.chatMessage(senderID, "Checking ..");
	}
	else if ((senderID == admin) && (text == "apikey")){
		client.chatMessage(senderID, config.apikey);
	}
	else if ((senderID == admin) && (isNaN(text.substring(0,17)) == false )){
		client.chatMessage(senderID, "http://steamcommunity.com/profiles/"+text.substring(0,17));
	}
	else if ((senderID == admin) && (text.includes("http://steamcommunity.com/id/") == true)){
		var http = require("http");
		var customurl = text.substring(29,text.length-1);
		var webapi = "http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key="+config.apikey+"&vanityurl="+customurl;
		var request = http.get(webapi, function (response) {
		var buffer = "", 
			data,
			description;
			response.on("data", function (chunk) {
				buffer += chunk;
				
				response.on("end", function (err) {
					data = JSON.parse(buffer);
					success = data.response.success;
					
					if (success == 1){
						usersteamid = data.response.steamid;
						client.chatMessage(senderID, usersteamid);
					}
					else {
						usersteamid = "I can't find it";
						client.chatMessage(senderID, usersteamid);
					}
				});
			});
		}); 
	}
	else if ((senderID == admin) && (text.includes("addcomment") == true)){
		steam.postUserComment(config.my64id, text.substring(11,text.length));
		client.chatMessage(senderID, "Done");
	}
	else if ((senderID == admin) && (text.includes("blocklist") == true)){
		blocklistSteamID = (text.replace ( /[^\d]/g, '' ));
		var found = false;
		var fileread = fs.readFileSync('blocklist.txt').toString().split("\n");
		
		for(i in fileread) {
			if (fileread[i].includes(blocklistSteamID)){
				client.chatMessage(senderID, fileread[i]);
				found = true;
				break;
			}
			found = false;
		}
		if (found == false){
			client.chatMessage(senderID, "I can't found it on block list");
		}
	}
	else if ((senderID == admin) && (text.includes("unblock") == true)){
		unblockedSteamID = (text.replace ( /[^\d]/g, '' ));
		client.unblockUser(unblockedSteamID);
		client.chatMessage(senderID, unblockedSteamID+ " Unblocked");
	}
	else if ((senderID == admin) && (text.includes("removefriend") == true)){
		removefriendSteamID = (text.replace ( /[^\d]/g, '' ));
		client.removeFriend(removefriendSteamID);
		client.chatMessage(senderID, removefriendSteamID+ " Removed");
	}
	else if ((senderID == admin) && (text.includes("blockuser") == true)){
		blockSteamID = (text.replace ( /[^\d]/g, '' ));
		client.removeFriend(blockSteamID);
		client.blockUser(blockSteamID);
		client.chatMessage(senderID, blockSteamID+ " Blocked");
		var log = (currentdate() + " - Blocked " +blockSteamID+ ". Reason: Blocked by Owner");
		fs.appendFile("blocklist.txt", log + "\n",  {flag: 'a'}, function(err) {});
	}
	else if ((senderID == admin) && message == "2fa"){
		client.chatMessage(senderID, twofactor());
	}
	else if (spammerSteamID == senderID.getSteamID64()){
		//people who trying to spam will not receive any message from us
	}
	else if (text.match(/.....-.....-...../) && text.length == 17){
		
		client.chatMessage(senderID, "Hello, I can't take steam-key anymore. My owner told me to disable steam-key donation");
		setTimeout(function(){
			client.chatMessage(senderID, "Please write 'sendtoOwner' + your messages to send message to my owner for more info");
		}, 2000);
	}
	else if (text.match(/.....-.....-...../)){
		
		client.chatMessage(senderID, "Hello, I can't take steam-key anymore. My owner told me to disable steam-key donation");
		setTimeout(function(){
			client.chatMessage(senderID, "Please write 'sendtoOwner' + your messages to send message to my owner for more info");
		}, 2000);
		
		/*
		client.chatMessage(senderID, "Hmm? If you want to donate Steam Key, just send me chat with your Steam key, like: ABCDE-FGHIJ-12345");
		*/
	}
	else if (text.match(/sendtoOwner.*/i)) {
		client.chatMessage(admin, senderID + " replied: " + text.substring(13,text.length));
		client.chatMessage(senderID, "Done sending your messages");
	}
	else if (text == "ping"){
		client.chatMessage(senderID, "pong");
	}
	
	
	antispam = text;
	markedSteamID = senderID.getSteamID64();
	
})



manager.on('newOffer', function(offer) {
	
	var trademsg = offer.message;
	
	var copyOffer = offer;
	var itemBotGive = [];
	var itemBotReceive = [];
	var myassetid = [];
	var theirassetid = [];
	
	var givenlength = offer.itemsToGive.length;
	var receivelength = offer.itemsToReceive.length;
	var removedcards = 0;
	var unmarketablecards = false;
	var blacklisteditem = false;
	var blacklistedcount = 0;
	var instantreject = false;
	
	var skip = false;
	
	offer.itemsToReceive.forEach(function(item) {
		
		theirassetid.push(item.assetid);
		
		if((item.type.includes("Profile Background") == true) || (item.type.includes("Emoticon") == true)){
			var temp = item.type;
			var temp = temp.replace(/Uncommon /g,'');
			var temp = temp.replace(/Rare /g,'');
			itemBotReceive.push(temp);
		}
		else if (item.type.includes("Trading Card") == true) {
			itemBotReceive.push(item.type);
		}
		else {
			instantreject = true;
		}
	});
	
	offer.itemsToGive.forEach(function(item) {
		
		myassetid.push(item.assetid);
		var unmarketablecards = false;
		
		
		if ((item.type.includes("Trading Card") == true) && (unmarketablecards == true)){
			itemBotGive.push("Non-Marketable Trading Cards");
			unmarketablecards = false;
		}
		else if ((item.type.includes("Profile Background") == true) && (unmarketablecards == true)){
			itemBotGive.push("Non-Marketable Profile Background");
			unmarketablecards = false;
		}
		else if ((item.type.includes("Emoticon") == true) && (unmarketablecards == true)){
			itemBotGive.push("Non-Marketable Emoticon");
			unmarketablecards = false;
		}
		else if((item.type.includes("Profile Background") == true) || (item.type.includes("Emoticon") == true)){
			var temp = item.type;
			var temp = temp.replace(/Uncommon /g,'');
			var temp = temp.replace(/Rare /g,'');
			itemBotGive.push(temp);
		}
		else if (item.type.includes("Trading Card") == true) {
			itemBotGive.push(item.type);
		}
		else {
			instantreject = true;
		}
	});
		
	for(i = 0; i < givenlength;i++){
		for(j = 0; j < receivelength;j++){
			if (itemBotGive[i] == itemBotReceive[j]){
				if (itemBotGive[i] == "MyBackground"){
					removedcards++;
					blacklistedcount++;
					itemBotReceive.splice(j, 1);
					blacklisteditem = true;
					break;
				}
				else {
					myassetid.splice((i-removedcards), 1);
					theirassetid.splice(j, 1);
					removedcards++;
					itemBotReceive.splice(j, 1);
					break;
				}
			}
		}
	}
	
	//Trade logic start here
	if (offer.partner.getSteamID64() == admin){
		
		if (offer.itemsToGive.length == 0){
			var log = (currentdate() + " - Accepting Trade Offer #" +offer.id+ " from Owner: " +offer.partner.getSteamID64());
			fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
			console.log(log);
			lastOfferID = offer.id;
			offer.accept(function(err) {
				if (err) {
					var log = (currentdate() + " - "+ err);
					fs.appendFile("log.txt", log+ "\n",  {flag: 'a'}, function(err) {});
				}
			});
		}
		else {
			var log = (currentdate() + " - Accepting Trade Offer #" +offer.id+ " from Owner: " +offer.partner.getSteamID64());
			fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
			console.log(log);
			lastOfferID = offer.id;
			offer.accept(function(err) {
				if (err) {
					var log = (currentdate() + " - "+ err);
					fs.appendFile("log.txt", log+ "\n",  {flag: 'a'}, function(err) {});
				}
			});
			setTimeout(function(){
				acceptConfirmation(); 
			}, 3000);
		}
	}
	
	else if (instantreject == true){
		var log = (currentdate() + " - Rejecting Trade Offer from " +offer.partner.getSteamID64()+ " - Reason: Other item present");
		console.log(log);
		fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
		offer.decline();
	}
	else if (offer.isGlitched() == true){
		var log = (currentdate() + " - Glitched Trade Offer #" +offer.id+ ", we'll try again later");
	}
	else if (offer.itemsToReceive.length == 0){														// Bot receive 0 item  -- begging, blocked
		client.removeFriend(offer.partner.getSteamID64());
		client.blockUser(offer.partner.getSteamID64());
		var log = (currentdate() + " - Blocked " +offer.partner.getSteamID64()+ ". Reason: Begging");
		fs.appendFile("blocklist.txt", log + "\n",  {flag: 'a'}, function(err) {});
		console.log(log);
		offer.decline();
	}
	
	else if (offer.itemsToGive.length == 0){ 														// Bot give 0 item     -- donation
	
		var isDonation = true;
		offer.itemsToReceive.forEach(function(item) {
			if (item.type.includes("Profile Background") == true || item.type.includes("Emoticon") == true || item.type.includes("Trading Card") == true || item.type.includes("Booster Pack") == true){
				//We want this item as donation
			}
			else {
				isDonation = false;
			}
		});
		
		if (isDonation == true){
			setTimeout(function(){
				var id = offer.partner;
				steam.getSteamUser(id, function(err, user) {
					if (err) {
						console.log(err);
						fs.appendFile("log.txt", "DONATION ERROR" +err + " - Donation (" +offer.partner.getSteamID64()+ ") \n",  {flag: 'a'}, function(err) {});
						client.chatMessage(admin, "Someone donated but there's an error, please check log "+currentdate());
					}
					else {
						offer.accept(function(err) {
							if (err) {
								console.log(err);
								fs.appendFile("log.txt", "DONATION ERROR" +err + " (" +offer.partner.getSteamID64()+ ") \n",  {flag: 'a'}, function(err) {});
								client.chatMessage(admin, "Someone donated but there's an error, please check log "+currentdate());
							}
							else {
								var log = (currentdate() + " - Donation from " +offer.partner.getSteamID64()+ " - Receive "+offer.itemsToReceive.length+" new item");
								fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
								console.log(log);
								steam.postUserComment(offer.partner.getSteamID64(), "+rep, thanks for supporting VanillaBot :bite:", function (err){
									if (err){
										var log = (currentdate() + " - Unable to post profile comment, sending 'thanks' messages");
										console.log(log)
										fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
										client.chatMessage(offer.partner.getSteamID64(), "Hello, thanks for supporting VanillaBot. :bite:");
									}
									else {
										var log = (currentdate() + " - Done posting profile comment");
										console.log(log)
										fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
									}
								});
								client.chatMessage(admin, ""+offer.partner.getSteamID64()+" just send me donation. Receive "+offer.itemsToReceive.length+" new item(s)");								//Reminds me in case if it's fail
								
								setTimeout(function(){	
									donatorName = user.name;
									donatorName = decode(donatorName);
									donatorName = donatorName.replace(/"/g, "");
									donatorName = donatorName.split(" ");
									var filteredName = [];
									
									donatorName.forEach(function(item){
										if (item.includes(".com") || item.includes("csgo") || item.includes(".gg") || item.includes(".RU") || item.includes("CSGO")){
											
										}
										else {
											filteredName.push(item);
										}
									});
									filteredName = filteredName.join(" ");
									
									var notes = "Donation from " + filteredName + " ( http://steamcommunity.com/profiles/" +offer.partner.getSteamID64()+ " ) \n Received " +offer.itemsToReceive.length+ " new item. Thank you. :bite: \n \n [b]Item List:[/b]\n";
									offer.itemsToReceive.forEach(function(item, index) {
										if (index >= 10){
											
										}
										else {
												notes = notes + "- " +item.name+ " (" +item.type+ ")\n";
											}
										});
									if (offer.itemsToReceive.length >= 10){
										notes = notes + "\n and more..";
									}
									steam.postUserComment(config.my64id, notes);										// Bot will post detailed donation
									fs.appendFile("donation_backup.txt", notes,  {flag: 'w'}, function(err) {});
									//client.addFriend(offer.partner.getSteamID64());
									
								}, 2000);
							}
						});
					}
				});
			}, 1000);
		}
		else {
			var log = (currentdate() + " - Rejecting Donation from " +offer.partner.getSteamID64());
			console.log(log)
			fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
			offer.decline();
			client.chatMessage(offer.partner.getSteamID64(), "Hello, I'm sorry but I have to reject your donation. I only accept Trading Cards, Emoticon, and Background donation :doubt: ");
		}
	}
	
	else if((givenlength == removedcards) && (receivelength == removedcards)){
		
		if (blacklisteditem == true && removedcards == blacklistedcount){
			var log = (currentdate() + " - Rejecting Trade Offer from " +offer.partner.getSteamID64()+ " - Reason: Blacklisted Item");
			console.log(log)
			fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
			offer.decline();
		}
		else if (blacklisteditem == true){
			
			var log = (currentdate() + " - Countered ("+removedcards+ ":"+removedcards+") Trade Offer #" +offer.id+ " : " +offer.partner.getSteamID64()+ " - eason: Blacklisted Item");
			console.log(log);
			fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
			
			var counteroffer = offer.counter();
			offer.itemsToGive.forEach(function(item) {
				if (item.type == "NEKOPARA Vol. 0 Profile Background"){
					counteroffer.removeMyItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
				}
				if (item.type == "Shan Gui Emoticon"){
					counteroffer.removeMyItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
				}
			});
			offer.itemsToReceive.forEach(function(item) {
				if (item.type == "NEKOPARA Vol. 0 Profile Background"){
					counteroffer.removeTheirItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
				}
				if (item.type == "Shan Gui Emoticon"){
					counteroffer.removeTheirItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
				}
			});
			myassetid.forEach(function(item) {
				counteroffer.removeMyItem({"appid": 753, "contextid": 6, "assetid": item});
			});
			theirassetid.forEach(function(item) {
				counteroffer.removeTheirItem({"appid": 753, "contextid": 6, "assetid": item});
			});
			
			counteroffer.setMessage("Sorry, I'm not gonna trade my Shan Gui emoticon / my current Profile Background");
			counteroffer.send(function(err, status){
				if (err){
					var log = (currentdate() + " Unable to send Counter Offer - "+err);
					console.log(log);
					fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
					offer.decline();
				}
			});
			
			setTimeout(function(){
				acceptConfirmation(); 
			}, 3000);
		}
		
		else {
			var log = (currentdate() + " - Accepting ("+removedcards+ ":"+removedcards+") Trade Offer #" +offer.id+ " : " +offer.partner.getSteamID64());
			console.log(log);
			lastOfferID = offer.id;
			fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
			offer.accept(function(err) {
				if (err) {
					var log = (currentdate() + " - "+ err);
					fs.appendFile("log.txt", log+ "\n",  {flag: 'a'}, function(err) {});
					client.webLogOn();
				}
			});
			
			setTimeout(function(){
				acceptConfirmation(); 
			}, 3000);
		}
	}
	else if(removedcards == 0){
		var log = (currentdate() + " - Rejecting Trade Offer from " +offer.partner.getSteamID64()+ " - Reason: Cross-Set");
		console.log(log)
		fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
		offer.decline();
	}
	
	else if ((offer.itemsToGive.length > offer.itemsToReceive.length) && removedcards > 0){
		var log = (currentdate() + " - Countered ("+offer.itemsToGive.length+ ":"+offer.itemsToReceive.length+") Trade Offer #" +offer.id+ " : " +offer.partner.getSteamID64()+ " - Reason: Not same ammount");
		console.log(log);
		fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
		var counteroffer = offer.counter();
		
		offer.itemsToGive.forEach(function(item) {
			if (item.type == "NEKOPARA Vol. 0 Profile Background"){
				counteroffer.removeMyItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
			}
			if (item.type == "Shan Gui Emoticon"){
				counteroffer.removeMyItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
			}
		});
		offer.itemsToReceive.forEach(function(item) {
			if (item.type == "NEKOPARA Vol. 0 Profile Background"){
				counteroffer.removeTheirItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
			}
			if (item.type == "Shan Gui Emoticon"){
				counteroffer.removeTheirItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
			}
		});
		
		myassetid.forEach(function(item) {
			counteroffer.removeMyItem({"appid": 753, "contextid": 6, "assetid": item});
		});
		theirassetid.forEach(function(item) {
			counteroffer.removeTheirItem({"appid": 753, "contextid": 6, "assetid": item});
		});
		
		if (counterofferSteamID == offer.partner.getSteamID64()){
			counteroffer.setMessage("I'm not doing charity here");
		}
		else if (offer.itemsToReceive.length == 1){
			counteroffer.setMessage("Soo.. begging huh? That's not nice");
		}
		else {
			counteroffer.setMessage(offer.itemsToReceive.length+ " : "+offer.itemsToReceive.length+" please. Read trade rules and don't be greedy");
		}
		
		counteroffer.send(function(err, status){
			if (err){
				var log = (currentdate() + " - Unable to send Counter Offer - "+err);
				console.log(log);
				fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
				offer.decline();
			}
		});
		counterofferSteamID = offer.partner.getSteamID64();
		
		setTimeout(function(){
			acceptConfirmation(); 
		}, 3000);
	}
	else if ((offer.itemsToGive.length < offer.itemsToReceive.length) && removedcards > 0){
		var log = (currentdate() + " - Countered ("+offer.itemsToGive.length+ ":"+offer.itemsToReceive.length+") Trade Offer #" +offer.id+ " : " +offer.partner.getSteamID64()+ " - Reason: Too much item");
		console.log(log);
		fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
		var counteroffer = offer.counter();
		
		offer.itemsToGive.forEach(function(item) {
			if (item.type == "NEKOPARA Vol. 0 Profile Background"){
				counteroffer.removeMyItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
			}
			if (item.type == "Shan Gui Emoticon"){
				counteroffer.removeMyItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
			}
		});
		offer.itemsToReceive.forEach(function(item) {
			if (item.type == "NEKOPARA Vol. 0 Profile Background"){
				counteroffer.removeTheirItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
			}
			if (item.type == "Shan Gui Emoticon"){
				counteroffer.removeTheirItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
			}
		});
		
		myassetid.forEach(function(item) {
			counteroffer.removeMyItem({"appid": 753, "contextid": 6, "assetid": item});
		});
		theirassetid.forEach(function(item) {
			counteroffer.removeTheirItem({"appid": 753, "contextid": 6, "assetid": item});
		});
		
		counteroffer.setMessage("Hello, VanillaBot here... You put too many item in your trade offer.");
		counteroffer.send(function(err, status){
			if (err){
				var log = (currentdate() + " - Unable to send Counter Offer - "+err);
				console.log(log);
				fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
				offer.decline();
			}
		});
		counterofferSteamID = offer.partner.getSteamID64();
		
		setTimeout(function(){
			acceptConfirmation(); 
		}, 3000);
	}
	else if ((offer.itemsToGive.length == offer.itemsToReceive.length) && removedcards > 0){
		var log = (currentdate() + " - Countered ("+offer.itemsToGive.length+ ":"+offer.itemsToReceive.length+") Trade Offer #" +offer.id+ " : " +offer.partner.getSteamID64()+ " - Reason: Trying cross-set");
		console.log(log);
		fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
		var counteroffer = offer.counter();
		
		offer.itemsToGive.forEach(function(item) {
			if (item.type == "NEKOPARA Vol. 0 Profile Background"){
				counteroffer.removeMyItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
			}
			if (item.type == "Shan Gui Emoticon"){
				counteroffer.removeMyItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
			}
		});
		offer.itemsToReceive.forEach(function(item) {
			if (item.type == "NEKOPARA Vol. 0 Profile Background"){
				counteroffer.removeTheirItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
			}
			if (item.type == "Shan Gui Emoticon"){
				counteroffer.removeTheirItem({"appid": item.appid, "contextid": item.contextid, "assetid": item.assetid});
			}
		});
		
		myassetid.forEach(function(item) {
			counteroffer.removeMyItem({"appid": 753, "contextid": 6, "assetid": item});
		});
		theirassetid.forEach(function(item) {
			counteroffer.removeTheirItem({"appid": 753, "contextid": 6, "assetid": item});
		});
		
		counteroffer.setMessage("Hello, VanillaBot here... No cross-set please.");
		counteroffer.send(function(err, status){
			if (err){
				var log = (currentdate() + " - Unable to send Counter Offer - "+err);
				console.log(log);
				fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
				offer.decline();
			}
		});
		counterofferSteamID = offer.partner.getSteamID64();
		
		setTimeout(function(){
			acceptConfirmation(); 
		}, 3000);
	}
	
	else {
		//Decline other trade offer
		var log = (currentdate() + " - Rejecting Trade Offer from " +offer.partner.getSteamID64()+ " - Reason: Else");
		console.log(log);
		fs.appendFile("log.txt", log + "\n",  {flag: 'a'}, function(err) {});
		
		offer.decline();
	}
});
