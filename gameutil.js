// random integer between [min, max)

const JESTERS  = ['L1', 'L2', 'L3', 'L4'];
const DIAMONDS = ['2d', '3d', '4d', '5d', '6d', '7d', '8d', '9d', 'Td', 'Jd', 'Qd', 'Kd', 'Ad'];
const CLUBS    = ['2c', '3c', '4c', '5c', '6c', '7c', '8c', '9c', 'Tc', 'Jc', 'Qc', 'Kc', 'Ac'];
const HEARTS   = ['2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h', 'Th', 'Jh', 'Qh', 'Kh', 'Ah'];
const SPADES   = ['2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', 'Ts', 'Js', 'Qs', 'Ks', 'As'];
const WIZARDS  = ['W1', 'W2', 'W3', 'W4'];

const SUITED_CARDS = {'d': DIAMONDS,
                      'c': CLUBS,
                      'h': HEARTS,
                      's': SPADES}

const DECK = JESTERS.concat(DIAMONDS, CLUBS, HEARTS, SPADES, WIZARDS);

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
      var temp = deck[randIdx];
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

var Room = function(roomId, numPlayers) {
  var that = Object.create(Room.prototype);
  var players = {};
  var usernameToClientId = {};
  var round = 3;
  var trumpSuit = '';
  var playOrder = [];
  var actionOn = '';
  var inBidPhase = true;
  var starter = '';
  var cardsInTrick = [];

  // called for each player when they are ready to start
  that.playerReady = function(username, clientId) {
    console.log('player ready')
    console.log(username)
    if (Object.keys(players).length >= numPlayers) {
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

  // deals cards to the players in the room
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
    starter = playOrder[0];
    actionOn = starter;
  }

  // helper function to get the bid options of player actionOn
  function getBidOptions() {
    var options = [];
    var currentSum = -1; // ignore current sum if not last player to bid
    if (actionOn === playOrder[playOrder.length-1]) {
      currentSum = 0;
      Object.keys(players).forEach(function(key) {
        item = players[key];
        if (item.username != actionOn) {
          console.log(item.username)
          console.log(item.bid)
          currentSum += item.bid;
        }
      })
    }
    console.log('sum of bids so far');
    console.log(currentSum)
    for (i=0; i<=round; i++) {
      if (i !== round-currentSum) {
        options.push(i);
      }
    }
    return options;
  }

  // helper function to get the play options of player actionOn
  function getPlayOptions() {
    var ledSuit = '';
    cardsInTrick.forEach(function(item, index) {
      if (ledSuit === '') {
        if (!JESTERS.includes(item) && !WIZARDS.includes(item)) {
          ledSuit = item[1];
        }
      }
    })

    if (ledSuit === '') {
      return players[actionOn].hand.slice();
    }

    var hasSuit = false;
    players[actionOn].hand.forEach(function(item, index) {
      if (!JESTERS.includes(item) && !WIZARDS.includes(item)) {
        if (item[1] === ledSuit) {
          hasSuit = true;
        } 
      }
    })

    if (!hasSuit) {
      return players[actionOn].hand.slice();
    }

    // a suit was led and you're not out of that suit
    var options = [];
    players[actionOn].hand.forEach(function(item, index) {
      if (JESTERS.includes(item) || WIZARDS.includes(item)){
        options.push(item);
      } else if (item[1] === ledSuit) {
        options.push(item);
      }
    })
    return options;
  }

  function getTrickWinner() {
    var ledSuit = '';
    cardsInTrick.forEach(function(item, index) {
      if (ledSuit === '') {
        if (!JESTERS.includes(item) && !WIZARDS.includes(item)) {
          ledSuit = item[1];
        }
      }
    })

    var orderedDeck = DECK.slice();
    if (ledSuit !== '') {
      var ledSuitCards = SUITED_CARDS[ledSuit];
      var trumpSuitCards = [];
      var lowerSuitCards = [];

      for (suit of Object.keys(SUITED_CARDS)) {
        if (suit !== ledSuit && suit !== trumpSuit) {
          lowerSuitCards = lowerSuitCards.concat(SUITED_CARDS[suit]);
        }
      }

      if (trumpSuit !== 'NT' && trumpSuit !== ledSuit) {
        trumpSuitCards = SUITED_CARDS[trumpSuit];
      }

      orderedDeck = JESTERS.concat(lowerSuitCards, ledSuitCards, trumpSuitCards, WIZARDS);

    }
    
    var winnerCardIndex = 0;
    var winnerIndex;
    for (i=0; i<cardsInTrick.length; i++) {
      var card = cardsInTrick[i];
      if (WIZARDS.includes(card)) {
        winnerIndex = i;
        winnerCardIndex = orderedDeck[orderedDeck.length-1];
        break;
      }
      var cardIndex = orderedDeck.indexOf(card);
      if (cardIndex > winnerCardIndex) {
        winnerIndex = i;
        winnerCardIndex = cardIndex;
      }
    }

    // edge case: what if everyone plays a jester
    if (winnerCardIndex < JESTERS.length) {
      winnerIndex = cardsInTrick.length-1; // last person wins
    }

    return winnerIndex;
  }

  function updateScores() {
    for (player of Object.values(players)) {
      if (player.made === player.bid) {
        player.score = player.score + 2 + player.bid;
      } else {
        var difference = Math.abs(player.made - player.bid);
        player.score = player.score - difference;
      }
      player.made = 0;
      player.bid = 0;
    }
  }

  // returns a request for an action
  that.getActionRequest = function() {
    // either requesting a bid or a play
    if (inBidPhase) {
      options = getBidOptions();
      return {type: 'requestBid', player: actionOn, options: options};
    } else {
      options = getPlayOptions();
      return {type: 'requestPlay', player: actionOn, options: options};
    }
  }

  // this is called when a player makes an action
  that.receiveAction = function(action) {
    // action should be {type: bid/play, player: username, value: card or bid}
    var responses = [];
    if (action.player != actionOn) {
      console.log('not your turn');
      return [];
    }
    if (action.type === 'bid' && inBidPhase) {
      options = getBidOptions();
      if (!options.includes(action.value)) {
        console.log('not a valid bid option');
        return [];
      }
      players[action.player].bid = action.value;
      responses.push({type: 'bid', player: action.player, value: action.value, timeout:0});
      if (actionOn === playOrder[playOrder.length-1]) {
        inBidPhase = false;
        actionOn = playOrder[0];
      } else {
        actionOn = playOrder[playOrder.indexOf(actionOn)+1];
      }
    } else if (action.type === 'play' && !inBidPhase) {
      options = getPlayOptions();
      if (!options.includes(action.value)) {
        console.log('not a valid play option');
        return [];
      }
      // remove the card from player's hand
      var handCopy = players[action.player].hand.slice();
      handCopy.splice(handCopy.indexOf(action.value), 1);
      players[action.player].hand = handCopy;
      cardsInTrick.push(action.value);
      console.log('cards in trick');
      console.log(cardsInTrick);
      responses.push({type: 'play', player: action.player, value: action.value, timeout:0})

      // if last to play, must determine who won the trick
      if (actionOn === playOrder[playOrder.length-1]) {
        var winnerIndex = getTrickWinner();
        var winner = playOrder[winnerIndex];
        players[winner].made = players[winner].made + 1;
        responses.push({type: 'winTrick', player: winner, value: null, timeout:3000});
        cardsInTrick = [];

        // check if round is over
        if (players[winner].hand.length === 0) {
          updateScores();
          var scores = {};
          Object.keys(players).forEach(function(key) {
            scores[key] = players[key].score;
          })
          console.log('scores');
          console.log(scores);
          responses.push({type: 'roundEnd', scores: scores, timeout:1000}) //TODO: update scores
          // update actionOn and playOrder
          // TODO
          round ++;
          inBidPhase = true;

          if (room.isGameOver()) {
            var winningScore = Number.NEGATIVE_INFINITY;
            for (key of Object.keys(scores)) {
              if (scores[key] > winningScore) {
                winningScore = scores[key];
              }
            }
            var winners = [];
            for (key of Object.keys(scores)) {
              if (scores[key] === winningScore) {
                winners.push(key);
              }
            }
            responses.push({type: 'gameOver', scores: scores, winners: winners, timeout:1000})
          }
        } else {
          // round is not over but trick is over
          actionOn = winner;
          playOrder = playOrder.slice(winnerIndex, ).concat(playOrder.slice(0, winnerIndex));
          cardsInTrick = [];
        }
      } else {
        // trick is not over
        actionOn = playOrder[playOrder.indexOf(actionOn)+1];
      }
    }
    return responses;
  }

  that.hasGameStarted = function() {
    console.log(players)
    console.log(Object.keys(players))
    console.log(Object.keys(players).length)
    console.log(numPlayers)
    if (Object.keys(players).length === numPlayers) {
      console.log('yay true')
      return true;
    } else {
      return false;
    }
  }

  that.isGameOver = function() {
    if (round > 60/numPlayers) {
      return true;
    } else {
      return false;
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

  that.getRoomId = function() {
    return roomId;
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
  this.made = 0;

}

module.exports = Room;
