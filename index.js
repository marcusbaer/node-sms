var argv = require('optimist').argv;
var models = require('./lib/models');
//var dirty = require('dirty');
var fs = require('fs');
var sms = require('./lib/sms');

//var runDir = argv.d || process.cwd();
var runDir = process.cwd();
var config = require(runDir + '/config');

var storageDir = '/tmp/.smsd/';

var nl = (process.platform === 'win32' ? '\r\n' : '\n');

function utf8 (txt) {
    // http://www.developershome.com/sms/gsmAlphabet.asp
    // http://spin.atomicobject.com/2011/09/08/converting-utf-8-to-the-7-bit-gsm-default-alphabet/
    return new Buffer(txt).toString('utf8');
}

var Library = {

    readNewMessagesAsModelFromFile: function (callback) {
        var newMessages = new models.Messages();
        this.readAllMessagesFromFile(function(messagesAsStr){
            newMessages = new models.Messages(JSON.parse(messagesAsStr));
            callback(newMessages);
        });
    },

    readAllMessagesFromFile: function (next) {
        fs.readFile(storageDir+'messages.json', function(err, messagesAsStr){
            messagesAsStr = utf8(messagesAsStr);
            if (err) {
                throw err;
            } else if (next) {
                next(messagesAsStr);
            }
        });
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
