var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
// var gameRouter = require('./routes/game');

var Room = require('./gameutil');

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())

const connectionString = 'mongodb+srv://picrazy:31415926@cluster0-npp0f.mongodb.net/test?retryWrites=true&w=majority';

mongoose
  .connect(connectionString, {useNewUrlParser: true})
  .then(() => console.log("MongoDB successfully connected"))
  .catch(err => console.log(err));

var sessionMiddleware = session({
  name: 'name',
  secret: 'secret',
  saveUninitialized: true,
  resave: true,
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

var server = require('http').Server(app);
var io = require('socket.io')(server);
app.set('socketio', io);

const port = 8000;
server.listen(port);

var users = 0;
var rooms = {};
var maxNumPlayers = 2;

io.use(function(socket, next) {
  sessionMiddleware(socket.request, {}, next); 
})
io.on('connection', (socket) => {
  console.log('connected')
  // here you can start emitting events to the client 
  socket.on('joinGame', function(data) {
    if (socket.request.session.passport == undefined || socket.request.session.passport.user == undefined) {
      socket.emit('joinFail', "You must be logged in to join a room.");
      return;
    }
    User.findById(socket.request.session.passport.user, function(err, user) {
      if (err) { throw err };
      var currentNumPlayers = 1;
      if (io.sockets.adapter.rooms[data.gameid]) {
        var clients = Object.keys(io.sockets.adapter.rooms[data.gameid].sockets);
        var usernames = clients.map((clientId) => (io.sockets.connected[clientId].username));
        if (usernames.includes(user.username)) {
          console.log('your username is ' + user.username);
          console.log(usernames);
          socket.emit('joinFail', "You've already joined this room.");
          return;
        }
        currentNumPlayers = Object.keys(clients).length + 1;
      }
      if (currentNumPlayers > maxNumPlayers) {
        socket.emit('joinFail', "This game has already started, try joining a different room.");
        return;
      }
      socket.leave(socket.room);
      socket.join(data.gameid);
      socket.room = data.gameid;
      socket.username = user.username;
      console.log('hello i joined')
      io.in(data.gameid).emit('message', {sender: '', message: user.username + ' joined the room'});
      io.in(data.gameid).emit('currentNumPlayers', currentNumPlayers);

      if (currentNumPlayers === maxNumPlayers) {
        rooms[data.gameid] = Room(maxNumPlayers);
        io.in(data.gameid).emit('gameStart');
      }
    });
  });
      // check if game should start
  socket.on('gameStart', function(data) {

    console.log('client game start');
    room = rooms[socket.room];
    room.playerReady(socket.username, socket.id);

    if (room.hasGameStarted()) {
      room.dealCards();
      players = room.getPlayers();
      players.forEach(function(item, index) {
        hand = room.getHand(item);
        var clientSocket = io.sockets.connected[room.getClientId(item)];
        clientSocket.emit('deal', {hand: hand,
                                   trumpSuit: room.getTrumpSuit(),
                                   players: players})
      })
      action = room.getActionRequest();
      clientSocket = io.sockets.connected[room.getClientId(action.player)];
      clientSocket.emit(action.type, action.options);
    }
    // userToSocketId = {};
    // order = [];
    // numCards = 1;
    // var clients = Object.keys(io.sockets.adapter.rooms[data.gameid].sockets);

    // if (currentNumPlayers === maxNumPlayers) {
    //   var trump = gameutil.pickTrump();
    //   var hands = gameutil.deal(currentNumPlayers, numCards);
    //   for (i = 0; i < clients.length; i++) {
    //     var clientId = clients[i];
    //     var clientSocket = io.sockets.connected[clientId];
    //     userToSocketId[clientSocket.username] = clientId;
    //     order.push(clientSocket.username);

    //     clientSocket.emit('deal', {hand: hands[i], trump: trump});
    // }
    // room = {level:1, numPlayers:order.length, scores:[0]*order.length, currentTrick: [], bids: [], order:order, userToSocketId:userToSocketId}
    // rooms[gameid] = room

    // firstSocket = io.sockets.connected[userToSocketId[order[0]]];
    // firstSocket.emit('requestBid', {options: [...Array(room.level+1).keys()]})
    // console.log('requested from ' + order[0])
    // }
  });
  socket.on('bid', function(data) {
    room = rooms[socket.room];

    responses = room.receiveAction({type:'bid', player:socket.username, value:data});
    responses.forEach(function(item, index) {
      io.in(socket.room).emit(item.type, item.data);
    })
  })
    

    // socket.emit('joinSuccess', usernames);

    

    // socket.broadcast.to(gameid).emit('playerJoined', {player: socket.username});

    // userToSocketId = {}
    // order = []

    // numClients = Object.keys(clients).length;
    // console.log(numClients);

    // if (numClients == 3) {
    //   console.log('at least 3');
    //   for (var clientId in clients ) {
    //     var clientSocket = io.sockets.connected[clientId];
    //     userToSocketId[clientSocket.username] = clientId
    //     order.push(clientSocket.username)
    //     clientSocket.emit('deal', {username: clientSocket.username, hand: ['7S'], trump: 'S'});
    //   }
    //   room = {level:1, numPlayers:order.length, scores:[0]*order.length, currentTrick: [], bids: [], order:order, userToSocketId:userToSocketId}
    //   rooms[gameid] = room

    //   firstSocket = io.sockets.connected[userToSocketId[order[0]]];
    //   firstSocket.emit('requestBid', {options: [...Array(room.level+1).keys()]})
    //   console.log('requested from ' + order[0])
    // }

  socket.on('disconnecting', function() {
    var rooms = Object.keys(socket.rooms);
    rooms.forEach(function(item) {
      var clients = io.sockets.adapter.rooms[item].sockets;
      io.in(item).emit('currentNumPlayers', Object.keys(clients).length-1);
    });
  })

  socket.on('message', function(data) {
    console.log(socket.room);
    io.in(socket.room).emit('message', data);
  })

  socket.on('bid', function(bid) {
    socket.broadcast.to(socket.room).emit('event', {player:socket.username, action:'bid', value:bid})
    room = rooms[socket.room]
    bids = room.bids.concat([bid])
    room.bids = bids
    console.log(bids); 
    rooms[socket.room] = room

    if (bids.length == room.numPlayers) {
      socket.emit('requestAction');
    }
    else {
      nextUsername = room.order[bids.length]
      nextSocket = io.sockets.connected[room.userToSocketId[nextUsername]]
      if (bids.length == room.numPlayers -1 ) {
        options = []
        bid_sum = bids.reduce((a,b) => a+b);
        for (var i = 0; i <= room.level; i++) {
          if (i == room.level - bid_sum) {
            continue
          }
          options.push(i)
        }
        nextSocket.emit('requestBid', {options: options})
      }
      else {
        nextSocket.emit('requestBid', {options: [...Array(room.level+1).keys()]})
      }
    } 
  })
  
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err.message);
  res.render('error');
});

module.exports = app;
