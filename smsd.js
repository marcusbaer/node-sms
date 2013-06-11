var argv = require('optimist').argv;
var sys = require('util');
var fs = require('fs');
var _ = require('underscore');
var dirty = require('dirty');
var sms = require('./lib/sms');
var models = require('./lib/models');

var verbodeMode = argv.v || false;
var runDir = argv.d || process.cwd();
var config = require(runDir + '/config');
var db = dirty(runDir + '/messages.db');

/*
	SMSD can be called with an optional register parameter, that allows a script to register as a service that likes to be informed about incoming messages.
	All registered services are called on updates.
*/

var nl = (process.platform === 'win32' ? '\r\n' : '\n');

var listener = [];

storedMessages = new models.Messages();

db.on('load', function() {
	listener = db.get('listener') || [];
	storedMessages = new models.Messages(db.get('messages') || []);
//    db.forEach(function(key, val) { console.log('Found key: %s, val: %j', key, val); });

	if (argv.register) {

		// REGISTER LISTENER

		listener.push( argv.register );
		db.set("listener", listener, function listenerSaved (){
			console.log(listener);
		});
	
	} else if (argv.read) {

		// READ DATASOURCE

		//process.stdout.write(JSON.stringify(db.get('messages')));
		process.stdout.write(JSON.stringify(storedMessages.toJSON()));
	
	} else if (argv.send) {

		// SEND MESSAGE
		if (argv.v) {
			sys.log("sending message...");
		}

		// this is a workaround for bug in optimist, please give phone numbers by a leading plus sign including country code
		var to = new String(argv.to);
		to = (to.indexOf('+') !== 0) ? '+' + to : to;
		
		sms.send({
			to: to || '',
			text: argv.message || ''
		}, function messageSent (response) {
			if (argv.v) {
				console.log(response);
			}
		});

	} else {

		// START SMS READER
		getMessagesFromGateway();

	}


});

function getMessagesFromGateway () {
	if (verbodeMode) {
		sys.log("fetch messages from gateway...");
	}
	renderMessages(function(updatesFound){
		if (updatesFound) {
			if (verbodeMode) {
				sys.log("storing new messages...");
				console.log(storedMessages.toJSON());
			}
			db.set("messages", storedMessages.toJSON(), function messagesSaved (){
                //sms.deletesms(); // remove all messages
				listener = db.get('listener') || []; // read from data source, as listener could have been added while running
				if (listener && listener.length>0) {
					for (var i=0; i<listener.length; i++) {
						if (verbodeMode) {
							sys.log("call listener: " + listener[i]);
						}
						sms._command(listener[i]);
					}
				}
			});
		}
	});
	setTimeout(getMessagesFromGateway, config.timeout);
}

function renderMessages (callback) {

	var getMessagesCallback = function(response){

//		if (verbodeMode) {
//			sys.log(response);
//		}
	
		var pattern = config.patterns[config.patternLang];
	
		var headers = new RegExp(pattern.messageSeparator,'g');
		var matcher = response.match(headers);
		var updatesFound = false;
		if (matcher) {
			for (var i=0; i<matcher.length; i++) {
				var message = {};
				
				// get header
				
				var header = new RegExp(pattern.messageSeparator,'g');
				header.exec(matcher[i]); //console.log(RegExp.$2);
				for (var index in pattern.separatorAttributes) {
					var attribute = pattern.separatorAttributes[index];
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
				
				var messageExp = new RegExp(pattern.bodyDefinition.replace(/\\r\\n/g,nl),'g');
				messageExp.exec(msgextract);
				for (var index in pattern.bodyAttributes) {
					var attribute = pattern.bodyAttributes[index];
					var idx = new Number(index) + 1;
					message[attribute] = RegExp['$'+idx];
				}
				message.hash = encode(message.sendDateStr + message.phoneNumber + 'smsd');

				var matchingMessages = storedMessages.where({hash: message.hash});
				if (_.isEmpty(matchingMessages)) {
					updatesFound = true;
					storedMessages.add(message);
				}
			}
		}

		if (callback) {
			callback(updatesFound);
		}

	};

	if (argv.simulate) {
		fs.readFile(argv.simulate, 'utf8', function (error, response) {
			getMessagesCallback(response);
		});
	} else {
		sms.getsms(getMessagesCallback);
	}

}

function encode (txt) {
    return new Buffer(txt).toString('base64');
}

function decode (txt) {
    return new Buffer(txt, 'base64').toString('utf8');
}
