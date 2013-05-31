var models = require('./lib/models');
var config = require('./config/gateway.config');
var dirty = require('dirty');
var db = dirty(config.datasource || './data/messages.db');

var storedMessages = new models.Messages();

db.on('load', function() {
	storedMessages = new models.Messages(db.get('messages') || []);
});

var Reader = module.exports.reader = {

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
