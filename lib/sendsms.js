var sys = require('util'),
    childProcess = require('child_process'),
    gammu;

/*
SUPPORTED COMMANDS:

gammu --identify
gammu --entersecuritycode PIN 1234
echo "Hallo! Ich bin ein Gammu-Test." | gammu --sendsms TEXT 0123456789
gammu --getallsms
gammu reset HARD
*/

var command = function (cmd, callback) {
    gammu = childProcess.exec(cmd, function (error, stdout, stderr) {
        if (error) {
            console.log(error.stack);
            console.log('Error code: '+error.code);
            console.log('Signal received: '+error.signal);
        }
        console.log('Child Process STDOUT: '+stdout);
        console.log('Child Process STDERR: '+stderr);
    });
    gammu.on('exit', function (code) {
        sys.log('Child process exited with exit code ' + code);
        if (callback) {
            callback();
        }
    });
};

var identify = function () {
    command('gammu --identify', function(response){
        console.log(response);
    });
};

var pin = function (pincode) {
    command('gammu --entersecuritycode PIN ' + pincode, function(response){
        console.log(response);
    });
};

var submit = function (phonereceipient, text) {
    command('echo "' + text + '" | gammu --sendsms TEXT ' + phonereceipient, function(response){
        console.log(response);
    });
};

var getsms = function () {
    command('gammu --getallsms', function(response){
        console.log(response);
    });
};

var reset = function () {
    command('gammu reset HARD', function(response){
        console.log(response);
    });
};

var sendSMS = function(input, callback) {

//    pin(1234);
    identify();

};

module.exports = sendSMS;