var models = require('./lib/models');
var config = require('./config/gateway.config');
var dirty = require('dirty');
var db = dirty(config.datasource || './data/messages.db');
var sms = require('./lib/sms');

var storedMessages = new models.Messages();

db.on('load', function() {
	storedMessages = new models.Messages(db.get('messages') || []);
});

var Reader = module.exports.reader = {

	fetchMessages: function (callback) {
		sms.getsms(callback);
	},

	removeMessages: function (callback) {
		sms.deletesms(callback);
	},

	readMessages: function (callback) {
        if (storedMessages) {
            callback(storedMessages);
        } else {
            db.on('load', function() {
                storedMessages = new models.Messages(db.get('messages') || []);
                callback(storedMessages);
            });
        }
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
	}

};

var Sender = module.exports.sender = {

	sendMessage: function (messageObj) {
        // messageObj has attributes: to (phone number), message (text), success (callback)
		sms.send({
			to: messageObj.to,       	// Recipient Phone Number
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
