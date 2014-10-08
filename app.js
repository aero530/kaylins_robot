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

var enable_pin = 25;
var reset_pin = 8;
var sleep_pin = 24;
var step_pin = 18;
var direction_pin = 23;
var ms1_pin = 10;
var ms2_pin = 9;
var ms3_pin = 11;

wpi.pinMode(enable_pin, wpi.modes.OUTPUT);
wpi.pinMode(reset_pin, wpi.modes.OUTPUT);
wpi.pinMode(sleep_pin, wpi.modes.OUTPUT);
wpi.pinMode(step_pin, wpi.modes.OUTPUT);
wpi.pinMode(direction_pin, wpi.modes.OUTPUT);
wpi.pinMode(ms1_pin, wpi.modes.OUTPUT);
wpi.pinMode(ms2_pin, wpi.modes.OUTPUT);
wpi.pinMode(ms3_pin, wpi.modes.OUTPUT);

var microstep = {1:[0,0,0], 2:[1,0,0], 4:[0,1,0], 8:[1,1,0], 16:[1,1,1]};

var step_resolution = 16; // may be 1, 2, 4, 8, 16

wpi.digitalWrite(ms1_pin,microstep[step_resolution][0]);
wpi.digitalWrite(ms2_pin,microstep[step_resolution][1]);
wpi.digitalWrite(ms3_pin,microstep[step_resolution][2]);

wpi.digitalWrite(enable_pin,1);

wpi.digitalWrite(reset_pin,1);
wpi.digitalWrite(sleep_pin,1);
wpi.digitalWrite(direction_pin,1);

var pwm_top = 128;
var pwm_div = 31;

wpi.pinMode(step_pin,2);
wpi.pwmSetMode(0); //0=mark:space 1=balanced
wpi.pwmSetRange(pwm_top); // set pwm top to 1024
wpi.pwmSetClock(pwm_div); //set clock divisor to 
wpi.pwmWrite(step_pin,pwm_top/2); // set pwm to 50%


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
			wpi.digitalWrite(enable_pin,1);
		} else {
			setServoAngle(0,90);
			wpi.digitalWrite(pin1, 1);
			wpi.digitalWrite(pin2, 0);
			wpi.digitalWrite(pin3, 1);
			wpi.digitalWrite(pin4, 0);
			wpi.digitalWrite(direction_pin,1);
			wpi.digitalWrite(enable_pin,0);
		}
	}
	if (data.direction=="backward") {
		if (data.speed <= 5) {
			wpi.digitalWrite(pin1, 0);
			wpi.digitalWrite(pin2, 0);
			wpi.digitalWrite(pin3, 0);
			wpi.digitalWrite(pin4, 0);
			wpi.digitalWrite(enable_pin,1);
		} else {
			wpi.digitalWrite(pin1, 0);
			wpi.digitalWrite(pin2, 1);
			wpi.digitalWrite(pin3, 0);
			wpi.digitalWrite(pin4, 1);
			wpi.digitalWrite(direction_pin,0);
			wpi.digitalWrite(enable_pin,0);
		}
	}
  });

});
