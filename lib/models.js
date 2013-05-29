var Backbone = require('backbone');
var _ = require('underscore');

var Message = Backbone.Model.extend({
	defaults: {
		messageId: null,
		folder: null,
		storage: null,
		folderName: null,
		smsc: null,
		sendDateStr: null,
		encoding: null,
		phoneNumber: null,
		status: null,
		message: null,
		hash: null
	}
});

var Messages = Backbone.Collection.extend({
	model: Message
});

module.exports.Message = Message;
module.exports.Messages = Messages;
