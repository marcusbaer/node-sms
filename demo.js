var sendsms = require('./index');

sendsms({
    to: '0123456789',       // Recipient Phone Number
    text: 'Hello World!'    // Text to send
}, function(err, result) {
    // error message in String and result information in JSON
    if (err) {
        console.log(err);
    }
    console.log(result);
});