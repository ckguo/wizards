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
var MongoStore = require('connect-mongo')(session);

var indexRouter = require('./routes/index');

var Room = require('./gameutil');

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

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
  store: new MongoStore({ mongooseConnection: mongoose.connection })
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

if (process.env.NODE_ENV === 'production') {
  // set static folder
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  })
}
var server = require('http').Server(app);

const PORT = process.env.PORT || 3001;
server.listen(PORT);

var io = require('socket.io')(server);
app.set('socketio', io);

var rooms = {};
var hosts = {};

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
          socket.emit('joinFail', "You've already joined this room.");
          return;
        }
        currentNumPlayers = clients.length + 1;
      }
      if (data.gameid in rooms) {
        socket.emit('joinFail', "This game has already started, try joining a different room.");
        return;
      }
      socket.leave(socket.room);
      socket.join(data.gameid);
      socket.room = data.gameid;
      socket.username = user.username;
      if (currentNumPlayers === 1) {
        hosts[data.gameid] = socket.username;
        socket.emit('host');
      }
      io.in(data.gameid).emit('message', {sender: '', message: user.username + ' joined the room'});
      io.in(data.gameid).emit('currentNumPlayers', currentNumPlayers);
    });
  });

  socket.on('startGame', function(data) {
    if (socket.username === hosts[socket.room]) {
      var numPlayers = Object.keys(io.sockets.adapter.rooms[socket.room].sockets).length;

      rooms[socket.room] = Room(socket.room, numPlayers);
      io.in(socket.room).emit('gameStart');
    }
  })

  // helper function to send the next action request
  function sendNextRequest(room) {
    action = room.getActionRequest();
    if (action === undefined) {
      return;
    }
    clientSocket = io.sockets.connected[room.getClientId(action.player)];
    clientSocket.emit(action.type, action.options);
    var actionName = '';
    if (action.type === 'requestBid') {
      actionName = 'bid';
    } else if (action.type === 'requestPlay') {
      actionName = 'play';
    }
    clientSocket.broadcast.to(clientSocket.room).emit('waiting', {player: action.player, type: actionName});
  }

  function dealCards(room) {
    room.dealCards();
    players = room.getPlayers();
    players.forEach(function(item, index) {
      hand = room.getHand(item);
      var clientSocket = io.sockets.connected[room.getClientId(item)];
      clientSocket.emit('deal', {hand: hand,
                                 trumpSuit: room.getTrumpSuit(),
                                 players: players})
    })
  }

  // check if game should start
  socket.on('gameStart', function(data) {
    room = rooms[socket.room];
    room.playerReady(socket.username, socket.id);

    if (room.hasGameStarted()) {
      dealCards(room);
      sendNextRequest(room);
    }
  });


  socket.on('bid', function(data) {
    room = rooms[socket.room];

    responses = room.receiveAction({type:'bid', player:socket.username, value:data});
    responses.forEach(function(item, index) {
      io.in(socket.room).emit(item.type, {player:item.player, value: item.value});
    })

    sendNextRequest(room);
  })

  function cleanupRoom(roomId) {
    setTimeout(function() {
      delete rooms[roomId];
      delete hosts[roomId];
      if (io.sockets.adapter.rooms[roomId]) {
        var clients = Object.keys(io.sockets.adapter.rooms[roomId].sockets);
        clients.forEach(function(item) {
          if (io.sockets.connected[item]) {
            io.sockets.connected[item].disconnect();
          }
        })
      }
    }, 1000);
  }

  function emitResponsesWithTimeout(responses, room, callback) {
    if (responses.length === 0) {
      callback();
    } else {
      res = responses[0];
      io.in(room.getRoomId()).emit(res.type, res);
      setTimeout(function() {
        if (res.type === 'winTrick') {
          io.in(room.getRoomId()).emit('clearTable');
        }
        if (res.type === 'roundEnd' && !room.isGameOver()) {
          dealCards(room);
        }
        if (res.type === 'gameOver') {
          cleanupRoom(room.getRoomId());
        }
        emitResponsesWithTimeout(responses.slice(1,), room, callback);
      }, res.timeout)
    }
  }
    
  socket.on('play', function(data) {
    room = rooms[socket.room];

    responses = room.receiveAction({type:'play', player:socket.username, value:data});

    emitResponsesWithTimeout(responses, room, function() {
      sendNextRequest(room);
    })
  })

  socket.on('disconnecting', function() {
    var socketRooms = Object.keys(socket.rooms);
    socketRooms.forEach(function(item) {
      if (item in rooms) {
        io.in(item).emit('roomDisconnecting');
        cleanupRoom(item);
      } else {
        var clients = Object.keys(io.sockets.adapter.rooms[item].sockets);
        io.in(item).emit('currentNumPlayers', clients.length-1);

        // choose new game host
        for (clientId of clients) {
          if (clientId !== socket.id) {
            newHostSocket = io.sockets.connected[clientId];
            hosts[item] = newHostSocket.username;
            newHostSocket.emit('host');
            break;
          }
        }
      }
    });
  })

  socket.on('message', function(data) {
    io.in(socket.room).emit('message', data);
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
