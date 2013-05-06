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

  npm install sms

## Usage ##

	var sendsms = require('sms');

	sendsms({
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