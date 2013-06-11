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
            //console.log('Child Process STDOUT: '+stdout);
            //console.log('Child Process STDERR: '+stderr);
            if (callback) {
    		  callback(stdout);
    	    }
        });
        gammu.on('exit', function (code) {
            sys.log('Child process exited with exit code ' + code);
        });
    },

    identify: function (callback) {
        this._command('gammu --identify', function(response){
            if (callback) callback(response);
        });
    },

    pin: function (pincode, callback) {
        this._command('gammu --entersecuritycode PIN ' + pincode, function(response){
            if (callback) callback(response);
        });
    },

    send: function (input, callback) {
//        this._command('echo "' + input.text + '" | gammu --sendsms TEXT ' + input.to, function(response){
        this._command('gammu sendsms TEXT ' + input.to + ' -text "' + input.text + '"', function(response){
            if (callback) callback(response);
        });
    },

    getsms: function (callback) {
        this._command('gammu --getallsms', function(response){
	        if (callback) callback(response);
        });
    },

    deletesms: function (callback) {
        this._command('gammu --deleteallsms', function(response){
                if (callback) callback(response);
        });
    },

    reset: function (callback) {
        //this._command('gammu reset HARD', function(response){
        //    if (callback) callback(response);
        //});
    }

};

module.exports = SMS;
