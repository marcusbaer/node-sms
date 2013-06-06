node-sms
========

Send SMS from a connected device with 3G modem. This package requires Gammu to send text messages.

## Install and setup of Gammu ##

  1. Install Gammu: `sudo apt-get install gammu` (in case of trouble try `apt-get update` first)
  2. Plug in your modem (phone or use stick)
  3. Find your devices port: `dmesg | grep tty` (e.g. ttyUSB0)
  4. Configure Gammu: `gammu-config` (mainly configure port, e.g. /dev/ttyUSB0)
  5. Test device configuration: `gammu --identify`
  6. Setup PIN code for GSM card: `gammu --entersecuritycode PIN 1234` 

## Installation for Node.js ##

	npm install -g sms

## Setup ##

Adjust `gateway.config.js` to your system:

- timeout: time between two message fetches
- pin: PIN1 of your GSM card
- datasource: path to data source file
- messageSeparator: regular expression to detect each message and find some attributes
- separatorAttributes: ordered list of attribute keys, correspondig to "messageSeparator"
- bodyDefinition: regular expression to find a bunch of attributes from a message
- bodyAttributes: is the ordered list of attribute keys, corresponding to "bodyDefinition"

## SMS Reader ##

SMS reader has 3 different modes:

1. a register mode
2. a render mode
3. a read mode

Other command line applications can register to be informed by a call of some command line code:

	smsd --register=foo

Calling the reader without parameters is the render mode: after a given timeout SMS are called from gateway. If there is a new message, all registered applications are called to fetch messages by calling with read mode.

	smsd

Fetch messages with read mode:
	
	smsd --read

## SMS Sender ##

	sendsms --pin=1234 --to=010000000 --message="Hello World"

## Usage as library ##

	var sms = require('sms');

	sms.pin(1234);

	sms.send({
	  to: '01000000000',    // Recipient Phone Number
	  text: 'Hello World!'  // Text to send
	}, function(err, result) {
  	// error message in String and result information in JSON
	  if (err) {
	    console.log(err);
  	}
	  console.log(result);
	});

## More on Gammu ##

For further information on Gammu read [http://de.wammu.eu/docs/pdf/gammu.pdf](http://de.wammu.eu/docs/pdf/gammu.pdf)
