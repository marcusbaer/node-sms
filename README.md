node-sms
========

Send SMS from a connected device with 3G modem. This package requires Gammu to send text messages.

## Install and setup of Gammu ##

  1. Install Gammu: `sudo apt-get install gammu` (in case of trouble try `apt-get update` first)
  2. Plug in your modem (phone or use stick)
  3. Find your devices port: `dmesg | grep tty` (e.g. ttyUSB0)
  4. Configure Gammu: `gammu-config` or see below (mainly configure port, e.g. /dev/ttyUSB0)
  5. Test device configuration: `gammu --identify`
  6. Setup PIN code for GSM card: `gammu --entersecuritycode PIN 1234`

## Installation for Node.js ##

	npm install sms -g

## Setup and Run ##

Setup your SMS environment in a folder of your choice. 

Create `config.js` and set up like this:

	module.exports = {
		"timeout": 30000,
		"patternLang": "en",
		"patterns": {
			"de": {
    			"messageSeparator": 'Speicherplatz ([0-9]{1,3}), Ordner "([a-zA-Z]{3,})", ([a-zA-Z\-]{3,}), ([a-zA-Z]{3,})',
    			"separatorAttributes": ['messageId', 'folder', 'storage', 'folderName'],
				"bodyDefinition": 'SMS-Nachricht\r\nSMSC-Nummer[\s ]*: "([0-9\+]*)"\r\nGesendet[\s ]*: (.*)\r\nZeichenkodierung[\s ]*: (.*)\r\nNummer[\s ]*: "(.*)"\r\nStatus[\s ]*: (.*)\r\n\r\n(.*)',
				"bodyAttributes" : ["smsc", "sendDateStr", "encoding", "phoneNumber", "status", "message"]
			},
			"en": {
				"messageSeparator": 'Location ([0-9]{1,3}), folder "([a-zA-Z]{3,})", ([a-zA-Z\- ]{3,}), ([a-zA-Z ]{3,})',
				"separatorAttributes": ['messageId', 'folder', 'storage', 'folderName'],
				"bodyDefinition": 'SMS message\r\nSMSC number[\s ]*: "([0-9\+]*)"\r\nSent[\s ]*: (.*)\r\nCoding[\s ]*: (.*)\r\nRemote number[\s ]*: "(.*)"\r\nStatus[\s ]*: (.*)\r\n\r\n(.*)',
				"bodyAttributes" : ["smsc", "sendDateStr", "encoding", "phoneNumber", "status", "message"]
			}
		}
	}

where is..

- timeout: time between two message fetches
- messageSeparator: regular expression to detect each message and find some attributes
- separatorAttributes: ordered list of attribute keys, correspondig to "messageSeparator"
- bodyDefinition: regular expression to find a bunch of attributes from a message
- bodyAttributes: is the ordered list of attribute keys, corresponding to "bodyDefinition"

Now run smsd in that folder.

## Run smsd ##

smsd has 4 different modes:

1. a register mode
2. a render mode
3. a read mode
4. a send mode

Calling the reader without parameters is the render mode: after a given timeout SMS are called from gateway. If there is a new message, all registered applications are called to fetch messages by calling with read mode.

	smsd

Other command line applications can register to be informed by a call of some command line code:

	smsd --register=foo

Fetch messages with read mode:
	
	smsd --read

Send a message with send mode:

	smsd --send --to=+491234567 --message="Hello World"

Phone number has to be led by country code with a leading plus sign, e.g. +42123454389 !

## Usage as library ##

Documentation will come soon...

## More on Gammu ##

For further information on Gammu read [http://de.wammu.eu/docs/pdf/gammu.pdf](http://de.wammu.eu/docs/pdf/gammu.pdf)

### Gammu config example ###

This is an example for a Gammu configuration. On Windows use port with COM example, adjusted to your system.
How you can detect your modem is here [https://drupal.org/node/1804598](https://drupal.org/node/1804598).

Create `gammurc` file on Linux like:

1. ~/.gammurc
2. /etc/gammurc

On Windows `gammurc` file is in the same directory as gammu.exe is or in the same directory where you will call gammu. Read more about configuration [here](http://wammu.eu/docs/manual/config/).

	[gammu]
	port = /dev/ttyS0
	;port= com10:
	connection = at115200
	;synchronizetime = yes
	;logfile = /home/says/gammulog
	;logformat = textall
	;use_locking = yes
	;gammuloc = locfile
	;startinfo = yes
	;gammucoding = utf8
	;rsslevel = teststable
	;usephonedb = yes

Test connection with:

	gammu --identify
	
Send a message manually:	
	
	gammu sendsms TEXT 0123456789 -text "Hello Foo"

