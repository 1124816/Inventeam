var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var mongo = require('mongojs');
//var mongoose = require('mongoose');
//mongoose.connect('mongodb://e.e.basler:LMr5wadtYM@mongodb.cloudno.de:27017');
var databaseUrl = "mymongodb://"+process.env.DBUSER+":"+process.env.DBPWD+"@mongodb.cloudno.de:27017db";
var collections = ["bikes"]
var db = mongo(databaseUrl, collections);

//var db = mongoose.connection;
//var BikeSchema = new mongoose.Schema({
//  dir: Number,
//  speed: Number,
//  node: String,
//  time: { type: Date, default: Date.now },
//});

// Create a model based on the schema
//var Bike = mongoose.model('Bike', BikeSchema);

app.use(express.static(path.join(__dirname, '/pub')));
app.disable('etag');
app.get('/', function(req, res){
  res.render('index.ejs', {});
});

app.get('/about', function(req, res){
  res.render('about.ejs', {});
});

app.get('/data', function(req, res){
  res.render('data.ejs', {});
});

app.get('/input', function(req, res){
  console.log(req.header("dir"));
  console.log(req.header("speed"));
  console.log(req.header("node"));
  if(req.header("dir")!=undefined&&req.header("speed")!=undefined&&req.header("node")!=undefined) {
    console.log({dir: req.header("dir"), speed: req.header("speed"), node: req.header("node")});
    db.bikes.save({dir: req.header("dir"), speed: req.header("speed"), node: req.header("node"), time: Date.now}, function(err, saved) {
    if( err || !saved ) console.log("bike not saved");
    else console.log("bike saved");
    });
    io.emit('bike', {dir: req.header("dir"), speed: req.header("speed"), node: req.header("node")});
    res.status(202);
    res.send('');
  }else {
    res.status(400);
    res.send('');
  };
});

io.on('connection', function(socket){
  console.log('a user connected');
  var length = [];
  db.bikes.find({node:'jim'}, function (err, bikes) {
  if (err) return console.error(err);
  length[0] = bikes.length;
  })

  db.bikes.find({node:'tim'}, function (err, bikes) {
  if (err) return console.error(err);
  length[1] = bikes.length;
  })

  db.bikes.find({node:'herb'}, function (err, bikes) {
  if (err) return console.error(err);
  length[2] = bikes.length;
  })

  db.bikes.find(function (err, bikes) {
  if (err) return console.error(err);
  socket.emit('load', {last: bikes.slice(bikes.length-5), length:length});
  console.log(bikes.slice(bikes.length-5));
  })
  socket.on('time', function(msg){
  console.log(msg);

  socket.broadcast.emit('upstart', base);
  });
  socket.on('disconnect', function(){
  console.log('user disconnected');
  });
});

http.listen(12174, function(){
  console.log('listening on *:3000');
});
