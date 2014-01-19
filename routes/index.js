
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Unladen Follow' });

};

exports.scan = function(req, res){
  res.render('scan', { title: 'Unladen Follow' });

};

exports.single = function(req, res){

  var whitelist = require('validator').whitelist;
  var user = whitelist(req.params.user, validUsernameChars);

  res.render('single', { title: 'Unladen Follow', user: user });

};