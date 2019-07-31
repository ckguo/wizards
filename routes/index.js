var express = require('express');
var router = express.Router();
var User = require('../models/user');
var bcrypt = require('bcryptjs');
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

function makeId(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var id = '';
  for (i=0; i<length; i++) {
    index = Math.floor(Math.random()*(characters.length));
    id += characters[index];
  }
  return id;
}

router.get('/createGame', function(req, res, next) {
  res.json({gameid: makeId(4)});
});

router.post('/signup', function(req, res, next) {
  if (req.body.username == "") {
    return res.status(400).json({errorMessage: 'username cannot be empty'});
  }
  if (req.body.password == "") {
    return res.status(400).json({errorMessage: 'password cannot be empty'});
  }
  User.findOne({username: req.body.username}).then(user => {
    if (user) {
      return res.status(400).json({errorMessage: 'username already exists'});
    } else {
      var newUser = new User({
        username: req.body.username,
        password: req.body.password
      });
      console.log(req.body.username);
      console.log(req.body.password);
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
          if (err) {
            throw err;
          }
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

router.post('/login', function(req, res, next) {
  if (req.body.username == "") {
    return res.status(400).json({errorMessage: 'username cannot be empty'});
  }
  if (req.body.password == "") {
    return res.status(400).json({errorMessage: 'password cannot be empty'});
  }
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      console.log(err);
      return next(err);
    }
    if (!user) {
      return res.status(400).json({errorMessage: info.errorMessage});
    }
    req.logIn(user, function(err) {
      if (err) { console.log(err); }
      console.log(req.session);
      return res.json(user);
    })
  })(req, res, next);
})

router.post('/logout', function(req, res, next) {
  req.logout();
  res.json({});
})

module.exports = router;
