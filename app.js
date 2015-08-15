var express = require('express')
  , routes = require('./routes')
  , path = require('path')
  , http = require('http');
var app = express();
var osc = require('node-osc')
  , oscClient1 = new osc.Client('127.0.0.1', 3002)
  // , oscClient2 = new osc.Client('127.0.0.1', 3003);
  , oscClient2 = new osc.Client('192.168.217.135', 3003);
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("test.db");
var d3 = require("d3");
var async = require('async');


app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get('/', routes.index);

var server = http.createServer(app);
var socketio = require('socket.io');
var io = socketio.listen(server);
io.set('log level', 1); 

var fps = 30;
var fpsFlag = false;

server.listen(app.get('port'), function(){
  console.log("server listening on port.... " + app.get('port'));
});



/* set the flag state changed to fps */
setInterval( function() {
  fpsFlag = true;
}, 1000 / fps);


/*
// assets functions
*/

function namedIs() {
  if(process.argv[3] == undefined) {
    console.log("data name not set.");
    process.exit();
  }
  return process.argv[3];
}

function degreeA(x1, y1, x2, y2, x3, y3, x4, y4) {
 return ( ( ( (x1 * y2) + (x2 * y3) + (x3 * y4) + (x4 * y1) ) - ( (x2 * y1) + (x3 * y2) + (x4 * y3) + (x1 * y4) ) ) / 2.0 )
}

function degreeI(leftX, rightX, absLeftX, absRightX) {
  return (rightX - leftX) / (absRightX - absLeftX)
}

function degreeO(upY, downY, absupY, absdownY) {
  return (upY - downY) / (absdownY - absupY)
}

function degreeWink(upY, downY) {
  return upY
  // return (upY / downY)
}

function degreeFaceMove(upY, downY) {
  // return upY
  return (upY / downY)
}

/*
// server console process
*/
if(process.argv[2] == "nocapture") {
  io.sockets.on("connection", function(socket) {
    console.log("connect..");
    var recordName;


    socket.on("startflag", function() {
      oscClient2.send('/control', 1);
      
    });

    socket.on("name", function(text) {
      console.log("name: " + text);
      recordName = text;
    });

    socket.on("senddata", function(facedata, emotiondata) {
      if(fpsFlag == true) {
        //
        // CHECK: 今きってます！！！！！
        //
        // oscClient2.send('/data', [emotiondata[0].value, emotiondata[1].value, emotiondata[2].value, emotiondata[3].value]);
        // if(facedata){
        //   oscClient2.send('/essence', [
        // //   // 44 60 50 57
        // //   degreeA(facedata[44][0], facedata[44][1], 
        // //     facedata[60][0], facedata[60][1], 
        // //     facedata[50][0], facedata[50][1], 
        // //     facedata[57][0], facedata[57][1]
        // //     ),
        // //   degreeI(facedata[44][0], facedata[50][0], facedata[2][0], facedata[12][0]),
        //    degreeWink(facedata[29][1], facedata[31][1]),
        //    degreeFaceMove(facedata[2][0], facedata[12][0])
        //   ]);
        // }
      }
      fpsFlag = false;
    });
  });

  server.listen(3000);
}


if(process.argv[2] == "capture") {
  io.sockets.on("connection", function(socket) {
    console.log("connect..");
    var recordName;

    socket.on("name", function(text) {
      console.log("name: " + text);
      recordName = text;
    });

    socket.on("senddata", function(tag, data) {
      // if(fpsFlag == true) {
      var stmt = db.prepare('INSERT INTO facedata (session_name, tag, start_time, end_time, score) VALUES (?, ?, ?, ?, ?)');
      stmt.run(
        recordName,
        tag,
        data[0],
        data[1],
        data[2]
      );
      stmt.finalize();
      // }
      // fpsFlag = false;
    });
  });

  socket.on("processing", function() {
    // TODO: ffmpeg process
  });

  server.listen(3000);
}

if(process.argv[2] == "create") {
  db.serialize(function () {
    db.run("CREATE TABLE facedata (id integer primary key autoincrement, session_name STRING, tag STRING, start_time REAL, end_time REAL, score REAL)");
    db.close();
  });
}
