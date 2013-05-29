module.exports = {
	"timeout": 10000,
    "pin": "1234",
	"datasource": "/tmp/messages.db",
    "messageSeparator": 'Speicherplatz ([0-9]{1,3}), Ordner "([a-zA-Z]{3,})", ([a-zA-Z\-]{3,}), ([a-zA-Z]{3,})',
    "separatorAttributes": ['messageId', 'folder', 'storage', 'folderName'],
	"bodyDefinition": 'SMS-Nachricht\r\nSMSC-Nummer[\s ]*: "([0-9\+]*)"\r\nGesendet[\s ]*: (.*)\r\nZeichenkodierung[\s ]*: (.*)\r\nNummer[\s ]*: "(.*)"\r\nStatus[\s ]*: (.*)\r\n\r\n(.*)',
	"bodyAttributes" : ["smsc", "sendDateStr", "encoding", "phoneNumber", "status", "message"]
}