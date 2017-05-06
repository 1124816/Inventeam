var express = require('express')
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017');

var db = mongoose.connection;
var BikeSchema = new mongoose.Schema({
  dir: Number,
  speed: Number,
  node: String,
  time: { type: Date, default: Date.now },
});
// Create a model based on the schema
var Bike = mongoose.model('Bike', BikeSchema);

app.use(express.static(path.join(__dirname, '/pub')));

app.get('/', function(req, res){
  res.render('index.ejs', {});
});

app.get('/about', function(req, res){
  res.render('index.ejs', {});
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
    Bike.create({dir: req.header("dir"), speed: req.header("speed"), node: req.header("node")}, function(err, bike){
    if(err) console.log(err);
    else console.log(bike);
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
  //socket.emit('load', base);
  //socket.on('time', function(msg){
  //console.log(msg);
  //
  //socket.broadcast.emit('upstart', base);
  //});
  socket.on('disconnect', function(){
  console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
