var express = require('express');
var router = express.Router();

var io = req.app.get('socketio');


/* GET users listing. */
router.post('/:gameid', function(req, res, next) {
  io.emit('hi!');
});

router.get('/create', function(req, res, next) {
  res.json({gameid: 1234});
});

module.exports = router;


