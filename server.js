var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
//var mongo = require('mongojs');
var mongoose = require('mongoose');
var nodes = {"40003b000e51353532343635":"jim"};

//Database setup
if(process.env.LOGNAME==='meis1124816') {
    var port = 3000;
    //var databaseUrl = "local";
    mongoose.connect('mongodb://localhost/test');
} else {
    var port = 12174;
    mongoose.connect('mongodb://'+process.env.DBUSER+':'+process.env.DBPWD+'@mongodb.cloudno.de:27017/bikes');
    //var databaseUrl = "mongodb://"+process.env.DBUSER+":"+process.env.DBPWD+"@mongodb.cloudno.de:27017/bikes";
};
//var collections = ["bike"]
//var db = mongo(databaseUrl, collections);
//console.log(db);

var db = mongoose.connection;
var BikeSchema = new mongoose.Schema({
  dir: Number,
  speed: Number,
  node: String,
  time: { type: Date, default: Date.now },
});
// Create a model based on the schema
var Bike = mongoose.model('Bike', BikeSchema);

//express setup
app.use(express.static(path.join(__dirname, '/pub')));

//routes
app.get('/', function(req, res){
  res.render('index.ejs', {});
});

app.get('/about', function(req, res){
  res.render('about.ejs', {});
});

app.get('/data', function(req, res){
  res.render('data.ejs', {});
});

//api input
app.get('/input', function(req, res){
  console.log(req.header("dir"));
  console.log(req.header("speed"));
  console.log(req.header("node"));
  if(req.header("dir")!=undefined&&req.header("speed")!=undefined&&nodes[req.header("node")]!=undefined) {
    console.log({dir: req.header("dir"), speed: req.header("speed"), node: nodes[req.header("node")]});
    Bike.create({dir: req.header("dir"), speed: req.header("speed"), node: nodes[req.header("node")]}, function(err, saved) {
    if( err || !saved ) console.log("bike not saved");
    else console.log("bike saved");
    });
    Bike.find(function (err, bike) {
    if (err) return console.error(err);
      //console.log(bikeCount());
      bikeCount(function(length, lasttime) {io.emit('bike', {dir: req.header("dir"), speed: req.header("speed"), node: nodes[req.header("node")], last: bike.slice(bike.length-5), length:length, lasttime: lasttime})});
    })
    res.status(202);
    res.send('');
  }else {
    res.status(400);
    res.send('');
  };
});

function bikeCount(fun) {
  var length = [];
  var lasttime = [];
  Bike.find({node:'40003b000e51353532343635'}, function (err, bike) {
  if (err) return console.error(err);
  length[0] = bike.length;
  lasttime[0] = bike[bike.length-1].time;
  Bike.find({node:'tim'}, function (err, bike) {
  if (err) return console.error(err);
  length[1] = bike.length;
  lasttime[1] = bike[bike.length-1].time;
  Bike.find({node:'herb'}, function (err, bike) {
  if (err) return console.error(err);
  length[2]= bike.length;
  lasttime[2] = bike[bike.length-1].time;
  fun(length, lasttime);
  });
  });
  });
};

io.on('connection', function(socket){
  //on connect
  console.log('a user connected');
  Bike.find(function (err, bike) {
  if (err) return console.error(err);
  bikeCount(function(length, lasttime) {socket.emit('load', {last: bike.slice(bike.length-5), length:length, lasttime: lasttime})});
  console.log(bike.slice(bike.length-5));
  })

  socket.on('disconnect', function(){
  console.log('user disconnected');
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
