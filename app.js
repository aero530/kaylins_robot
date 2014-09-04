var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , url= require('url')
  , wpi = require("wiring-pi")



var pin1 = 4;
var pin2 = 17;
var pin3 = 14;
var pin4 = 15;

wpi.wiringPiSetupGpio();
wpi.pinMode(pin1, wpi.modes.OUTPUT);
wpi.pinMode(pin2, wpi.modes.OUTPUT);
wpi.pinMode(pin3, wpi.modes.OUTPUT);
wpi.pinMode(pin4, wpi.modes.OUTPUT);
// GPIO4, 17 = 
// GPIO14, 15

// Start webserver
app.listen(8080);


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
			wpi.digitalWrite(pin1, 0);
			wpi.digitalWrite(pin2, 0);
			wpi.digitalWrite(pin3, 0);
			wpi.digitalWrite(pin4, 0);
		} else {
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
