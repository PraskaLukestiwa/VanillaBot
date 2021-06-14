/*

$$\    $$\                    $$\ $$\ $$\                 $$$$$$$\             $$\
$$ |   $$ |                   \__|$$ |$$ |                $$  __$$\            $$ |
$$ |   $$ |$$$$$$\  $$$$$$$\  $$\ $$ |$$ | $$$$$$\        $$ |  $$ | $$$$$$\ $$$$$$\
\$$\  $$  |\____$$\ $$  __$$\ $$ |$$ |$$ | \____$$\       $$$$$$$\ |$$  __$$\\_$$  _|
 \$$\$$  / $$$$$$$ |$$ |  $$ |$$ |$$ |$$ | $$$$$$$ |      $$  __$$\ $$ /  $$ | $$ |
  \$$$  / $$  __$$ |$$ |  $$ |$$ |$$ |$$ |$$  __$$ |      $$ |  $$ |$$ |  $$ | $$ |$$\
   \$  /  \$$$$$$$ |$$ |  $$ |$$ |$$ |$$ |\$$$$$$$ |      $$$$$$$  |\$$$$$$  | \$$$$  |
    \_/    \_______|\__|  \__|\__|\__|\__| \_______|      \_______/  \______/   \____/

			https://github.com/PraskaLukestiwa/VanillaBot
				Apache-2.0 License

			       Sorry for this mess
*/

var isJSON = true;
var validLoginKey = "";
var config = require("./config.json");

var SteamCommunity = require("steamcommunity");
var fs = require('fs');
var steam = new SteamCommunity();
var SteamTotp = require('steam-totp');
var SteamUser = require('steam-user');
var client = new SteamUser();
var admin = config.admin;
var TradeOfferManager = require('steam-tradeoffer-manager');
var decode = require('decode-html');
var manager = new TradeOfferManager({
	"steam": client,
	"community": steam,
	"domain": "example.com",
	"language": "en",
	"globalAssetCache": true
});

function logToFile(str, filename){
	str = currentdate() + " - "+ str;
	console.log(str);
    fs.appendFile(filename || "log.txt", str + "\n",  {flag: 'a'}, function(err) {});
}
const BlocklistFileName= 'blocklist.txt';
const LoginkeyFileName = 'loginkey.json';
try {
	JSON.parse(fs.readFileSync(LoginkeyFileName));
} catch (e) {
	isJSON = false;
}

if (isJSON == true){
	var login_key = require("./"+LoginkeyFileName);
	validLoginKey = login_key.loginkey;
}
else {
	saveLoginKey('');
	validLoginKey = "";
}

function saveLoginKey(key){
	var jsonformat = '{ "loginkey" : "' +key+ '" }';
	fs.appendFile(LoginkeyFileName, jsonformat,  {flag: 'w'}, function(err) {});
}
// TODO replace by actual items names/ids
const blacklistedMyItemsTypes = [
	"NEKOPARA Vol. 0 Profile Background",
	"Shan Gui Emoticon",
];

function genItemObj(assetid, appid, contextid){
	return {
		appid:     appid || 753,
		contextid: contextid || 6,
		assetid:   assetid
	};
}


var lastOfferID;


function currentdate(){
	var date = new Date();
	var dateformat = (("0" +date.getDate()).slice(-2) + "/"
					+ (+date.getMonth()+1) + "/"
					+ ("0" +date.getFullYear()).slice(-2) + " - "
					+ ("0" +date.getHours()).slice(-2) + ":"
					+ ("0" +date.getMinutes()).slice(-2) + ":"
					+ ("0" +date.getSeconds()).slice(-2));
	return dateformat;
}
function twofactor() {
	var tfa = SteamTotp.generateAuthCode(config.tfa);
	return (tfa);
}


function acceptConfirmation() {
	var time = Math.floor(Date.now() / 1000);
	var conf_key = SteamTotp.getConfirmationKey(config.trade, time, 'conf');
	var allowKey = SteamTotp.getConfirmationKey(config.trade, time, 'allow');

	setTimeout(function(){

		steam.getConfirmations(time, conf_key, function(err, confirmations){
			if (err){
				logToFile(err);
			}
			else if (confirmations.length == 0){
				logToFile("Nothing to confirm");
			}
			else {
				steam.acceptAllConfirmations(time, conf_key, allowKey, function(err, conf) {
					if (err) {
						logToFile(err);
					}
					else {
						conf.forEach (function(item) {
							logToFile("Confirmed Trade Offer #" +item.creator);
						});
					}
				});
			}
		});
	}, 1000);
}


// TODO check if actuall need this
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
	logToFile( "Sucesfully Logged in");
	client.setPersona(1); //"0": "Offline", "1": "Online", "2": "Busy", "3": "Away", "4": "Snooze", "5": "LookingToTrade", "6": "LookingToPlay"
	client.setUIMode(1);  //"None": 0, "BigPicture": 1, "Mobile": 2, "Web": 3

	//client.gamesPlayed("Custom Steam Game titles"); //63 characters
	//client.gamesPlayed(1121910);
});

client.on('error', function(err) {
	logToFile("Logon Error: "+err);
});

client.on('webSession', function(sessionID, cookies) {
    steam.setCookies(cookies);
    manager.setCookies(cookies);
	logToFile("Got our cookies");

	setTimeout(function(){
		steam.resetItemNotifications();
	}, 10000);
});

client.on('loginKey', function (key) {
	saveLoginKey(key);
});

client.on('friendRelationship', function(steamID, relationship) {
    if (relationship == SteamUser.Steam.EFriendRelationship.RequestRecipient) {
		logToFile("Incoming friend request from http://steamcommunity.com/profiles/" +steamID);
        client.addFriend(steamID);

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
		logToFile(steamID+ " just removed from friend list");
	}
});

steam.on("sessionExpired", function(err) {
	if (err) {
		setTimeout(function(){
			logToFile("Refreshing our session");
		}, 500);

		client.webLogOn();

		setTimeout(function(){
			manager.getOffer(lastOfferID, function (err, offer){
				if (err){
					logToFile(err);
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
	logToFile("Message from " + senderID+ " : " + message);

	// ---------- ADMIN COMMAND ----------

	if ((senderID == admin) && (text.includes("giveme") == true)){

		var offer = manager.createOffer(admin);
		var countitem = 0;
		var itemname = [];
		text = text.split(" ");

		text.forEach(function(item){ // TODO optimize
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
				logToFile("Unable to send item - "+err);
				client.chatMessage(senderID, "Done");
			}
			else {
				inventory.forEach(function(item) {
					if (item.type.includes(itemname) == true){ // `type` is not `name`
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
							var str = "Unable to send Trade Offer - "+err;
							logToFile(str);
							client.chatMessage(senderID, str);
						}
						else {
							setTimeout(function(){
								acceptConfirmation(); // TODO specify offerid
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

		text.forEach(function(item){ // TODO optimize
			if (item.includes("takemy")){

			}
			else {
				itemname.push(item);
			}
		});
		itemname = itemname.join(" ");

		manager.getUserInventoryContents(admin, 753, 6, true, function(err, inventory, currencies){
			if (err){
				logToFile("Unable to send item - "+err);
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
							var str = "Unable to send Trade Offer - "+err;
							logToFile(str);
							client.chatMessage(senderID, str);
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
	else if ((senderID == admin) && text.includes("addcomment") ) {
		steam.postUserComment(config.my64id, text.substring(11,text.length));
		client.chatMessage(senderID, "Done");
	}
	else if ((senderID == admin) && text.includes("blocklist") ) {
		var blocklistSteamID = text.replace ( /\D/g, '' );
		var found = false;
		var fileread = fs.readFileSync(BlocklistFileName).toString().split("\n");

		for(i in fileread) {
			if (fileread[i].includes(blocklistSteamID)){
				client.chatMessage(senderID, fileread[i]);
				found = true;
				break;
			}
			found = false;
		}
		if (!found){
			client.chatMessage(senderID, "I can't found it on block list");
		}
	}
	else if ((senderID == admin) && text.includes("unblock") ){
		var unblockedSteamID = text.replace ( /\D/g, '' );
		client.unblockUser(unblockedSteamID);
		client.chatMessage(senderID, unblockedSteamID+ " Unblocked");
	}
	else if ((senderID == admin) && text.includes("removefriend") ){
		var removefriendSteamID = text.replace ( /\D/g, '' );
		client.removeFriend(removefriendSteamID);
		client.chatMessage(senderID, removefriendSteamID+ " Removed");
	}
	else if ((senderID == admin) && text.includes("blockuser") ){
		var blockSteamID = text.replace ( /\D/g, '' );
		client.removeFriend(blockSteamID);
		client.blockUser(blockSteamID);
		client.chatMessage(senderID, blockSteamID+ " Blocked");
		logToFile("Blocked " +blockSteamID+ ". Reason: Blocked by Owner", BlocklistFileName);
	}
	else if ((senderID == admin) && message == "2fa"){
		client.chatMessage(senderID, twofactor());
	}
	else if (text == "ping"){
		client.chatMessage(senderID, "pong");
	}

})



manager.on('newOffer', function(offer) {

	var itemBotGive = [];
	var itemBotReceive = [];
	var myassetid = [];
	var theirassetid = [];

	var givenlength = offer.itemsToGive.length;
	var receivelength = offer.itemsToReceive.length;
	var removedcards = 0;
	var blacklisteditem = false;
	var blacklistedcount = 0;
	var instantreject = false;

	var counterofferSteamID;

	function parseItem(item, arrayA, arrayB) {

		arrayA.push(item.assetid);
		if ( item.type.includes("Profile Background") || item.type.includes("Emoticon") ) {
			var temp = item.type;
			temp = temp.replace('Uncommon ', '');
			temp = temp.replace('Rare ', '');
			arrayB.push(temp);
		}
		else if (item.type.includes("Trading Card")) {
			arrayB.push(item.type);
		}
		else {
			instantreject = true;
			// TODO break forEach
		}
	}

	offer.itemsToReceive.forEach(function(item) {
		parseItem(item, theirassetid, itemBotReceive);
	});

	offer.itemsToGive.forEach(function(item) {
		parseItem(item, myassetid, itemBotGive);
	});

	for(i = 0; i < givenlength;i++){
		for(j = 0; j < receivelength;j++){
			if (itemBotGive[i] == itemBotReceive[j]){
				// TODO fix; "MYBACKGROUND" never will be in itemBotGive
				if (itemBotGive[i] == "MYBACKGROUND"){
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
	var partnerSteamID64 = offer.partner.getSteamID64();
	if (partnerSteamID64 == admin){

		logToFile("Accepting Trade Offer #" +offer.id+ " from Owner: " +partnerSteamID64);
		lastOfferID = offer.id;
		offer.accept(function(err) {
			if (err) {
				logToFile(err);
			} else if (offer.itemsToGive.length > 0){
				setTimeout(function(){
					acceptConfirmation();
				}, 3000);
			}
		});

	} else if (instantreject){
		logToFile("Rejecting Trade Offer from " +partnerSteamID64+ " - Reason: Other item present");
		offer.decline();
	}
	else if (offer.isGlitched()){
		logToFile("Glitched Trade Offer #" +offer.id+ ", we'll try again later");
	}
	else if (offer.itemsToReceive.length == 0){														// Bot receive 0 item  -- begging, blocked
		client.removeFriend(partnerSteamID64);
		client.blockUser(partnerSteamID64);
		logToFile("Blocked " +partnerSteamID64+ ". Reason: Begging", BlocklistFileName);
		offer.decline();

	} else if (offer.itemsToGive.length == 0){ 														// Bot give 0 item     -- donation

		var isDonation = true;
		offer.itemsToReceive.forEach(function(item) {
			if (item.type.includes("Profile Background") == true || item.type.includes("Emoticon") == true || item.type.includes("Trading Card") == true || item.type.includes("Booster Pack") == true){
				//We want this item as donation
			}
			else {
				isDonation = false;
			}
		});

		if (isDonation){
			setTimeout(function(){
				var id = offer.partner;
				steam.getSteamUser(id, function(err, user) {
					if (err) {
						logToFile("DONATION ERROR" +err + " - Donation (" +partnerSteamID64+ ")");
						client.chatMessage(admin, "Someone donated but there's an error, please check log "+currentdate());
					}
					else {
						offer.accept(function(err) {
							if (err) {
								logToFile("DONATION ERROR" +err + " - Donation (" +partnerSteamID64+ ")");
								client.chatMessage(admin, "Someone donated but there's an error, please check log "+currentdate());
							}
							else {
								logToFile("Donation from " +partnerSteamID64+ " - Receive "+offer.itemsToReceive.length+" new item");
								steam.postUserComment(partnerSteamID64, "+rep, thanks for supporting VanillaBot :bite:", function (err){
									if (err){
										logToFile("Unable to post profile comment, sending 'thanks' messages");
										client.chatMessage(partnerSteamID64, "Hello, thanks for supporting VanillaBot. :bite:");
									}
									else {
										logToFile("Done posting profile comment");
									}
								});
								client.chatMessage(admin, ""+partnerSteamID64+" just send me donation. Receive "+offer.itemsToReceive.length+" new item(s)");								//Reminds me in case if it's fail

								setTimeout(function(){
									var filteredName = decode(user.name).replace(/"/g, "").split(" ").filter(function(item){
										return !item.match(/\.com|csgo|\.gg|\.ru"/i);
									}).join(" ");

									var notes = "Donation from " + filteredName + " ( http://steamcommunity.com/profiles/" +partnerSteamID64+ " ) \n Received " +offer.itemsToReceive.length+ " new item. Thank you. :bite: \n \n [b]Item List:[/b]\n";

									var itemsCountForNotes = 10;
									for (var i=0, n=Math.min(itemsCountForNotes, offer.itemsToReceive.length); i<n; i++) {
										notes += "- " +item.name+ " (" +item.type+ ")\n";
									}

									if (offer.itemsToReceive.length >= itemsCountForNotes) {
										notes += "\n and more..";
									}
									steam.postUserComment(config.my64id, notes); // Bot will post detailed donation
									fs.appendFile("donation_backup.txt", notes,  {flag: 'w'}, function(err) {});
									//client.addFriend(partnerSteamID64);

								}, 2000);
							}
						});
					}
				});
			}, 1000);
		}
		else {
			logToFile("Rejecting Donation from " +partnerSteamID64);
			offer.decline();
			client.chatMessage(partnerSteamID64, "Hello, I'm sorry but I have to reject your donation. I only accept Trading Cards, Emoticon, and Background donation :doubt: ");
		}

	} else if((givenlength == removedcards) && (receivelength == removedcards)){

		if (blacklisteditem == true && removedcards == blacklistedcount){
			logToFile("Rejecting Trade Offer from " +partnerSteamID64+ " - Reason: Blacklisted Item");
			offer.decline();
		}
		else if (blacklisteditem == true){

			logToFile("Countered ("+removedcards+ ":"+removedcards+") Trade Offer #" +offer.id+ " : " +partnerSteamID64+ " - eason: Blacklisted Item");

			var counteroffer = offer.counter();
			offer.itemsToGive.forEach(function(item) {
				if(blacklistedMyItemsTypes.includes(item.type)){
					counteroffer.removeMyItem(genItemObj(item.assetid, item.appid, item.contextid));
				}
			});
			offer.itemsToReceive.forEach(function(item) {
				if(blacklistedMyItemsTypes.includes(item.type)){
					counteroffer.removeTheirItem(genItemObj(item.assetid, item.appid, item.contextid));
				}
			});
			myassetid.forEach(function(assetid) {
				counteroffer.removeMyItem(genItemObj(assetid));
			});
			theirassetid.forEach(function(assetid) {
				counteroffer.removeTheirItem(genItemObj(assetid));
			});
			counteroffer.setMessage("Sorry, I'm not gonna trade my MYBACKGROUND emoticon / my current Profile Background");
			counteroffer.send(function(err, status){
				if (err){
					logToFile("Unable to send Counter Offer - "+err);
					offer.decline();
				}
			});

			setTimeout(function(){
				acceptConfirmation();
			}, 3000);

		} else {
			lastOfferID = offer.id;
			logToFile("Accepting ("+removedcards+ ":"+removedcards+") Trade Offer #" +offer.id+ " : " +partnerSteamID64);
			offer.accept(function(err) {
				if (err) {
					logToFile(err);
					client.webLogOn();
				}
			});

			setTimeout(function(){
				acceptConfirmation();
			}, 3000);
		}
	}
	else if(removedcards == 0){
		logToFile("Rejecting Trade Offer from " +partnerSteamID64+ " - Reason: Cross-Set");
		offer.decline();
	}

	else if ((offer.itemsToGive.length > offer.itemsToReceive.length) && removedcards > 0){
		logToFile("Countered ("+offer.itemsToGive.length+ ":"+offer.itemsToReceive.length+") Trade Offer #" +offer.id+ " : " +partnerSteamID64+ " - Reason: Not same ammount");

		var counteroffer = offer.counter();

		offer.itemsToGive.forEach(function(item) {
			if(blacklistedMyItemsTypes.includes(item.type)){
				counteroffer.removeMyItem(genItemObj(item.assetid, item.appid, item.contextid));
			}
		});
		offer.itemsToReceive.forEach(function(item) {
			if(blacklistedMyItemsTypes.includes(item.type)){
				counteroffer.removeTheirItem(genItemObj(item.assetid, item.appid, item.contextid));
			}
		});

		myassetid.forEach(function(assetid) {
			counteroffer.removeMyItem(genItemObj(assetid));
		});
		theirassetid.forEach(function(assetid) {
			counteroffer.removeTheirItem(genItemObj(assetid));
		});

		if (counterofferSteamID == partnerSteamID64){
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
				logToFile("Unable to send Counter Offer - "+err);
				offer.decline();
			}
		});
		counterofferSteamID = partnerSteamID64;

		setTimeout(function(){
			acceptConfirmation();
		}, 3000);
	}
	else if ((offer.itemsToGive.length < offer.itemsToReceive.length) && removedcards > 0){
		logToFile("Countered ("+offer.itemsToGive.length+ ":"+offer.itemsToReceive.length+") Trade Offer #" +offer.id+ " : " +partnerSteamID64+ " - Reason: Too much item");
		var counteroffer = offer.counter();

		offer.itemsToGive.forEach(function(item) {
			if(blacklistedMyItemsTypes.includes(item.type)){
				counteroffer.removeMyItem(genItemObj(item.assetid, item.appid, item.contextid));
			}
		});
		offer.itemsToReceive.forEach(function(item) {
			if(blacklistedMyItemsTypes.includes(item.type)){
				counteroffer.removeTheirItem(genItemObj(item.assetid, item.appid, item.contextid));
			}
		});

		myassetid.forEach(function(assetid) {
			counteroffer.removeMyItem(genItemObj(assetid));
		});
		theirassetid.forEach(function(assetid) {
			counteroffer.removeTheirItem(genItemObj(assetid));
		});

		counteroffer.setMessage("Hello, VanillaBot here... You put too many item in your trade offer.");
		counteroffer.send(function(err, status){
			if (err){
				logToFile("Unable to send Counter Offer - "+err);
				offer.decline();
			}
		});
		counterofferSteamID = partnerSteamID64;

		setTimeout(function(){
			acceptConfirmation();
		}, 3000);
	}
	else if ((offer.itemsToGive.length == offer.itemsToReceive.length) && removedcards > 0){
		logToFile("Countered ("+offer.itemsToGive.length+ ":"+offer.itemsToReceive.length+") Trade Offer #" +offer.id+ " : " +partnerSteamID64+ " - Reason: Trying cross-set");
		var counteroffer = offer.counter();

		offer.itemsToGive.forEach(function(item) {
			if(blacklistedMyItemsTypes.includes(item.type)){
				counteroffer.removeMyItem(genItemObj(item.assetid, item.appid, item.contextid));
			}
		});
		offer.itemsToReceive.forEach(function(item) {
			if(blacklistedMyItemsTypes.includes(item.type)){
				counteroffer.removeTheirItem(genItemObj(item.assetid, item.appid, item.contextid));
			}
		});

		myassetid.forEach(function(assetid) {
			counteroffer.removeMyItem(genItemObj(assetid));
		});
		theirassetid.forEach(function(assetid) {
			counteroffer.removeTheirItem(genItemObj(assetid));
		});

		counteroffer.setMessage("Hello, VanillaBot here... No cross-set please.");
		counteroffer.send(function(err, status){
			if (err){
				logToFile("Unable to send Counter Offer - "+err);
				offer.decline();
			}
		});
		counterofferSteamID = partnerSteamID64;

		setTimeout(function(){
			acceptConfirmation();
		}, 3000);

	} else {
		//Decline other trade offer
		logToFile("Rejecting Trade Offer from " +partnerSteamID64+ " - Reason: Else");

		offer.decline();
	}
});
