var argv = require('optimist').argv;
var sms = require('../lib/sms');
var fs = require('fs');
var config = require('../config/gateway.config');
var md5 = require('MD5');
var dirty = require('dirty');
var db = dirty('../data/messages.db');

var nl = (process.platform === 'win32' ? '\r\n' : '\n');

var listener = [];

db.on('load', function() {
	listener = db.get('listener') || [];
//    db.forEach(function(key, val) {
//      console.log('Found key: %s, val: %j', key, val);
//    });
	});

/*
	SMSREADER can be called with an optional register parameter, that allows a script to register as a service that likes to be informed about incoming messages.
	All registered services are called on updates.
*/

if (argv.register) {

	// REGISTER LISTENER

	listener.push( argv.register );
	db.set("listener", listener, function listenerSaved (){
		console.log(listener);
	});
	
} else if (argv.read) {

	// READ DATASOURCE

	db.on('load', function() {
		process.stdout.write(JSON.stringify(db.get('messages')));
	});
	
} else {

	// START SMS READER

//	if (config.pin) {
//		sms.pin(config.pin);
//	}

	renderMessages(function(messages){
		db.set("messages", messages, function messagesSaved (){});
		if (listener && listener.length>0) {
			for (var i=0; i<listener.length; i++) {
				sms._command(listener[i]);
			}
		}
	});
}

function renderMessages (callback) {

	//fs.readFile('../config/getallsms.txt', 'utf8', function(error, response){
	sms.getsms(function(response){
		
		var headers = new RegExp(config.messageSeparator,'g');
		var matcher = response.match(headers);
		var messages = [];
		for (var i=0; i<matcher.length; i++) {
			var message = {};
			
			// get header
			
			var header = new RegExp(config.messageSeparator,'g');
			header.exec(matcher[i]); //console.log(RegExp.$2);
			for (var index in config.separatorAttributes) {
				var attribute = config.separatorAttributes[index];
				var idx = new Number(index) + 1;
				message[attribute] = RegExp['$'+idx];
			}

			// get body
			
			var msgextract = response.split(matcher[i]);
			if (matcher[i+1]) {
				msgextract = msgextract[1].split(matcher[i+1]);
				msgextract = msgextract[0];
			} else {
				msgextract = msgextract[1];
			}
			
			var messageExp = new RegExp(config.bodyDefinition.replace(/\\r\\n/g,nl),'g');
			messageExp.exec(msgextract);
			for (var index in config.bodyAttributes) {
				var attribute = config.bodyAttributes[index];
				var idx = new Number(index) + 1;
				message[attribute] = RegExp['$'+idx];
			}

			message.hash = md5(message.sendDateStr + message.phoneNumber + 'smsreader');
			messages.push(message);
		}

		if (callback) {
			callback(messages);
		}

	});
}