var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs'),
  url= require('url'),
  wpi = require("wiring-pi"),
  PwmDriver = require("adafruit-i2c-pwm-driver")


// ----------------------------------------------------------------------------
// server (pwm) driver hardware setup
// ----------------------------------------------------------------------------

pwm = new PwmDriver(0x40,'/dev/i2c-1');
var pwm_freq = 60;
var pwm_us_per_bit = 1000/pwm_freq/4096;

pwm.setPWMFreq(pwm_freq);

// https://learn.adafruit.com/adafruit-16-channel-servo-driver-with-raspberry-pi/library-reference
// want to vary pulse from 1ms [0.001sec] (0deg) to 2ms (180deg)
// ms_per_bit = (1000 ms per second) / (60Hz per period) / 4096 (bits)
// => 0.00406901041667 ms per bit
// angle = 45deg
// pulse_ms = (angle/180 + 1)
// pulse_bits = pulse_ms / ms_per_bit

// (  0/180+1)/0.00406901041667 = 245.8 bits
// ( 90/180+1)/0.00406901041667 = 368.6 bits
// (180/180+1)/0.00406901041667 = 491.5 bits

// 245.8/4096*(1/60)*1000 = 1.0 ms
// 368.6/4096*(1/60)*1000 = 1.5 ms
// 491.5/4096*(1/60)*1000 = 2.0 ms

setServoAngle = function(channel, angle) { //angle in deg 0 to 180
  var pulse = (angle/180+1)/pwm_us_per_bit;
  return pwm.setPWM(channel, 0, pulse);
};


setServoAngle(0,45);

setServoAngle(0,15);




// ----------------------------------------------------------------------------
// dc motor driver hardware setup
// ----------------------------------------------------------------------------
// GPIO4, 17
// GPIO14, 15

var pin1 = 4;
var pin2 = 17;
var pin3 = 14;
var pin4 = 15;

wpi.wiringPiSetupGpio();
wpi.pinMode(pin1, wpi.modes.OUTPUT);
wpi.pinMode(pin2, wpi.modes.OUTPUT);
wpi.pinMode(pin3, wpi.modes.OUTPUT);
wpi.pinMode(pin4, wpi.modes.OUTPUT);


// ----------------------------------------------------------------------------
// Start webserver
// ----------------------------------------------------------------------------
app.listen(8080);


// ----------------------------------------------------------------------------
function handler (req, res) {

  // Using URL to parse the requested URL
    var path = url.parse(req.url).pathname;

    // Managing the root route
    if (path == '/') {
        index = fs.readFile(__dirname+'/index.html', 
            function(error,data) {

                if (error) {
                    res.writeHead(500);
                    return res.end("Error: unable to load index.html");
                }

                res.writeHead(200,{'Content-Type': 'text/html'});
                res.end(data);
            });
    // Managing the route for the javascript files
    } else if( /\.(js)$/.test(path) ) {
        index = fs.readFile(__dirname+'/'+path, 
            function(error,data) {

                if (error) {
                    res.writeHead(500);
                    return res.end("Error: unable to load " + path);
                }

                res.writeHead(200,{'Content-Type': 'text/javascript'});
                res.end(data);
            });
    } else {
        res.writeHead(404);
        res.end("Error: 404 - File not found.");
    }

}



// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
io.sockets.on('connection', function (socket) {
  socket.on('button update event', function (data) {
	console.log(data.direction);
	console.log(data.speed);
	buf = new Buffer(2);
	if (data.direction=="left") {
		if (data.speed <= 5) {
			wpi.digitalWrite(pin1, 0);
			wpi.digitalWrite(pin2, 0);
			wpi.digitalWrite(pin3, 0);
			wpi.digitalWrite(pin4, 0);
		} else {
			wpi.digitalWrite(pin1, 1);
			wpi.digitalWrite(pin2, 0);
			wpi.digitalWrite(pin3, 0);
			wpi.digitalWrite(pin4, 1);
		}
	}
	if (data.direction=="right") {
			if (data.speed <= 5) {
			wpi.digitalWrite(pin1, 0);
			wpi.digitalWrite(pin2, 0);
			wpi.digitalWrite(pin3, 0);
			wpi.digitalWrite(pin4, 0);
		} else {
			wpi.digitalWrite(pin1, 0);
			wpi.digitalWrite(pin2, 1);
			wpi.digitalWrite(pin3, 1);
			wpi.digitalWrite(pin4, 0);
		}
	}
	if (data.direction=="forward") {
		if (data.speed <= 5) {
			setServoAngle(0,15);
			wpi.digitalWrite(pin1, 0);
			wpi.digitalWrite(pin2, 0);
			wpi.digitalWrite(pin3, 0);
			wpi.digitalWrite(pin4, 0);
		} else {
			setServoAngle(0,90);
			wpi.digitalWrite(pin1, 1);
			wpi.digitalWrite(pin2, 0);
			wpi.digitalWrite(pin3, 1);
			wpi.digitalWrite(pin4, 0);
		}
	}
	if (data.direction=="backward") {
		if (data.speed <= 5) {
			wpi.digitalWrite(pin1, 0);
			wpi.digitalWrite(pin2, 0);
			wpi.digitalWrite(pin3, 0);
			wpi.digitalWrite(pin4, 0);
		} else {
			wpi.digitalWrite(pin1, 0);
			wpi.digitalWrite(pin2, 1);
			wpi.digitalWrite(pin3, 0);
			wpi.digitalWrite(pin4, 1);
		}
	}
  });
});
