var argv = require('optimist').argv;
var sys = require('util');
var fs = require('fs');
var _ = require('underscore');
var dirty = require('dirty');
var sms = require('./lib/sms');
var models = require('./lib/models');

var verboseMode = argv.v || false;
//var runDir = (argv.d && !argv.demo) || process.cwd();
var runDir = process.cwd();

if (argv.v) {
    sys.log("Read smsd configuration from " + runDir + '/config.js');
}

try {
    var config = require(runDir + '/config');
} catch (e) {
    throw "No configuration file found. See documentation to add configuration to current working path!";
}

var db = dirty(runDir + '/listener.db');

var storageDir = '/tmp/.smsd/';


/*
	SMSD can be called with an optional register parameter, that allows a script to register as a service that likes to be informed about incoming messages.
	All registered services are called on updates.
*/

var nl = (process.platform === 'win32' ? '\r\n' : '\n');

var listener = [];
//var messages = new models.Messages();

db.on('load', function() {
	listener = db.get('listener') || [];

	if (argv.register) {

		// REGISTER LISTENER

		listener.push( argv.register );
		db.set("listener", listener, function listenerSaved (){
			console.log(listener);
		});

    } else if (argv.reset) {

        if (argv.reset =='listener') {
            db.set("listener", []);
        }

    } else if (argv.watch) {

        // WATCH MESSAGE INPUT AND NOTIFY REGISTERED LISTENER ON UPDATES
        startDaemon(true);

    } else if (argv.fetch) {

        // FETCH MESSAGES FROM GATEWAY AND RETURN DATA
        fetchMessages(function(newMessages){
            process.stdout.write(JSON.stringify(newMessages.toJSON()));
        });

    } else if (argv.read) {

        // FETCH MESSAGES FROM FILE AND RETURN DATA
        readAllMessagesFromFile(function(messagesAsStr){
            process.stdout.write(messagesAsStr || '');
        });

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

        // WATCH MESSAGE INPUT AND NOTIFY REGISTERED LISTENER ON UPDATES
		startDaemon(false);

	}

});

function readAllMessagesFromFile (next) {
    fs.readFile(storageDir+'messages.json', function(err, messagesAsStr){
        if (err) {
            throw err;
        } else if (next) {
            next(messagesAsStr);
        }
    });
}

function saveAllMessagesToFile (newMessages, next) {
    var messagesAsStr = JSON.stringify(newMessages.toJSON());
    if (verboseMode) {
        sys.log("save to file system...");
        sys.log(messagesAsStr);
    }
    fs.writeFile(storageDir+'messages.json', messagesAsStr, function(){
        if (next) {
            next(newMessages);
        }
    });
}

function writeMessagesToLog (newMessages) {
    if (verboseMode) {
        sys.log("write to log...");
    }
    var messagesAsStr = '';
    newMessages.forEach(function(message){
        messagesAsStr = messagesAsStr + JSON.stringify(message.attributes) + "\n";
        log(messagesAsStr);
    });
}

function log (text) {
    var d = new Date();
    fs.appendFile(storageDir+'log.txt', d.toJSON() + "\t" + text, function(){});
}

function startDaemon (watch) {
    getAllMessagesFromGateway();
    if (watch) {
        setTimeout(getAllMessagesFromGateway, config.timeout || 30000);
    }
}

function getAllMessagesFromGateway () {
    if (verboseMode) {
        sys.log("fetch all messages from gateway...");
    }
    fetchMessages(function(newMessages){
        saveAllMessagesToFile(newMessages, notifyListeners);
        writeMessagesToLog(newMessages);
        removeAllMessagesFromGateway();
    });
}

function removeAllMessagesFromGateway () {
    if (verboseMode) {
        sys.log("remove all messages from gateway...");
    }
    sms.deletesms(); // remove all messages
}

function notifyListeners () {
    if (verboseMode) {
        sys.log("notify listeners...");
    }
    listener = db.get('listener') || []; // read from data source, as listener could have been added while running
    if (listener && listener.length>0) {
        for (var i=0; i<listener.length; i++) {
            if (verboseMode) {
                sys.log("call listener: " + listener[i]);
            }
            log('notify listener ' + listener[i]);
            sms._command(listener[i]);
        }
    }
}

function fetchMessages (callback) {

	var getMessagesCallback = function(response){

//		if (verboseMode) {
//			sys.log(response);
//		}

        var newMessages = new models.Messages();
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

//				var matchingMessages = storedMessages.where({hash: message.hash});
//				if (_.isEmpty(matchingMessages)) {
					updatesFound = true;
//					storedMessages.add(message);
                    newMessages.add(message);
//				}
			}
		}

		if (updatesFound && callback) {
			callback(newMessages);
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
