var LocalStrategy = require('passport-local');
var User = require('../models/user');
var bcrypt = require('bcryptjs');

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new LocalStrategy(function(username, password, done) {
    User.findOne({username: username}, function(err, user) {
      if (err) throw err;
      if (!user) {
        return done(null, false, {errorMessage: 'invalid username'});
      }
      bcrypt.compare(password, user.password, function(err, isMatch) {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, {errorMessage: 'invalid password'});
        }
      });
    });
  }))
}