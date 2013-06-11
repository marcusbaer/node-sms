var argv = require('optimist').argv;
var models = require('./lib/models');
var dirty = require('dirty');
var sms = require('./lib/sms');

var verbodeMode = argv.v || false;
var runDir = argv.d || process.cwd();
var config = require(runDir + '/config');
var db = dirty(runDir + '/messages.db');

var storedMessages = new models.Messages();

db.on('load', function() {
	storedMessages = new models.Messages(db.get('messages') || []);
});

var Library = {

	removeMessagesFromGateway: function (callback) {
		//sms.deletesms(callback);
	},

	removeMessagesFromDb: function (callback) {
		//not implemented yet
	},

	readMessagesFromDb: function (callback) {
        if (storedMessages && storedMessages.length>0) {
            callback(storedMessages);
        } else {
            db.on('load', function() {
                storedMessages = new models.Messages(db.get('messages') || []);
                callback(storedMessages);
            });
        }
	},

    fetchMessagesFromGateway: function (callback) {

        var getMessagesCallback = function(response){

            var headers = new RegExp(config.messageSeparator,'g');
            var matcher = response.match(headers);
            var updatesFound = false;
            if (matcher) {
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
                    message.hash = encode(message.sendDateStr + message.phoneNumber + 'smsd');

                    var matchingMessages = storedMessages.where({hash: message.hash});
                    if (_.isEmpty(matchingMessages)) {
                        storedMessages.add(message);
                    }
                }
            }

            if (callback) {
                callback(updatesFound);
            }

        };

        sms.getsms(getMessagesCallback);

    },

	registerCommand: function (command, callback) {
		db.on('load', function() {
			var listener = db.get("listener");
			listener.push( command );
			db.set("listener", listener, function listenerSaved (){
				if (callback) {
					callback();
				}
			});
		});
	},

	sendMessage: function (messageObj) {
        // messageObj has attributes: to (phone number), message (text), success (callback)
		sms.send({
			to: messageObj.to,       	// Recipient Phone Number, lead by +49...
			text: messageObj.message    // Text to send
		}, function(err, result) {
			// error message in String and result information in JSON
			if (err) {
				console.log(err);
			}
			messageObj.success(result);
		});
	}

};

module.exports = Library;
