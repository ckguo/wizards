// random integer between [min, max)

const DECK = ['L1', 'L2', 'L3', 'L4',
              '2d', '3d', '4d', '5d', '6d', '7d', '8d', '9d', 'Td', 'Jd', 'Qd', 'Kd', 'Ad',
              '2c', '3c', '4c', '5c', '6c', '7c', '8c', '9c', 'Tc', 'Jc', 'Qc', 'Kc', 'Ac',
              '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h', 'Th', 'Jh', 'Qh', 'Kh', 'Ah',
              '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', 'Ts', 'Js', 'Qs', 'Ks', 'As',
              'W1', 'W2', 'W3', 'W4'];

function randInt(min, max) {
  return num = Math.floor(Math.random()*(max-min)) + min;
}

function pickTrump() {
  var idx = randInt(0, 5)
  var suits = ['d', 'c', 'h', 's', 'NT'];
  return suits[idx];
};

function dealCards(numPlayers, numCards) {
  var deck = DECK.slice()
  var count = 0;
  var cards = [];
  for (p = 0; p < numPlayers; p++) {
    var hand = [];
    for (c = 0; c < numCards; c++) {
      var randIdx = randInt(count, deck.length);
      console.log(randIdx);
      var temp = deck[randIdx];
      console.log(temp);
      deck[randIdx] = deck[count];
      deck[count] = temp;
      count++;
      hand.push(temp);
    }
    hand.sort(function(a, b) {
      return DECK.indexOf(a) - DECK.indexOf(b);
    });
    cards.push(hand);
  }
  return cards;
};

var Room = function(numPlayers) {
  var that = Object.create(Room.prototype);
  var players = {};
  var usernameToClientId = {};
  var round = 3;
  var trumpSuit = '';
  var playOrder = [];
  var actionOn = '';
  var inBidPhase = true;

  that.playerReady = function(username, clientId) {
    console.log('player ready')
    console.log(username)
    if (players.length >= numPlayers) {
      console.log('shouldnt happen, too many people in room');
      return;
    }
    if (username in usernameToClientId) {
      console.log('user has already sent message');
      return;
    }
    var player = new Player(username, clientId);
    players[username] = player;
    usernameToClientId[username] = clientId;
    playOrder.push(username);
    console.log(players);
  }

  that.dealCards = function() {
    console.log('deal cards');
    cards = dealCards(numPlayers, round);
    trumpSuit = pickTrump();
    for (i=0; i<numPlayers; i++) {
      username = playOrder[i];
      player = players[username];
      player.hand = cards[i];
    }
    console.log(cards);
    actionOn = playOrder[0];
  }

  that.getActionRequest = function() {
    // either requesting a bid or a play
    if (inBidPhase) {
      var options = [];
      var currentSum = -1; // ignore current sum if not last player to bid
      if (actionOn === playOrder[-1]) {
        currentSum = 0;
        players.forEach(function(item, index) {
          currentSum += item.bid;
        })
      }
      for (i=0; i<round; i++) {
        if (i !== currentSum) {
          options.push(i);
        }
      }
      return {type: 'requestBid', player: actionOn, options: options};
    } else {
      return {type: 'requestPlay', player: actionOn, options: []};
    }
  }

  that.receiveAction = function(action) {
    if (action.type === 'bid') {

    }
  }

  that.hasGameStarted = function() {
    if (Object.keys(players).length === numPlayers) {
      return true;
    }
  }

  that.getPlayers = function() {
    return playOrder.slice();
  }

  that.getHand = function(username) {
    return players[username].hand;
  }

  that.getClientId = function(username) {
    return players[username].clientId;
  }

  that.getTrumpSuit= function(username) {
    return trumpSuit;
  }

  Object.freeze(that);
  return that;
}

var Player = function(username, clientId) {
  this.username = username;
  this.clientId = clientId;
  this.score = 0;
  this.hand = null;
  this.bid = 0;
}

module.exports = Room;
