var sys = require('util'),
    childProcess = require('child_process'),
    gammu;

var SMS = {

    _command: function (cmd, callback) {
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
    },

    identify: function () {
        this._command('gammu --identify', function(response){
            console.log(response);
        });
    },

    pin: function (pincode) {
        this._command('gammu --entersecuritycode PIN ' + pincode, function(response){
            console.log(response);
        });
    },

    send: function (input, callback) {
        this._command('echo "' + input.text + '" | gammu --sendsms TEXT ' + input.to, function(response){
            console.log(response);
        });
    },

    getsms: function () {
        this._command('gammu --getallsms', function(response){
            console.log(response);
        });
    },

    reset: function () {
        this._command('gammu reset HARD', function(response){
            console.log(response);
        });
    }

};

module.exports = SMS;