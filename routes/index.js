
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Unladen Follow' });

};


exports.about = function(req, res){
  res.render('about', { title: 'About Unladen Follow' });

};

exports.anatomy = function(req, res){
  res.render('anatomy', { title: 'Anatomy of an Annoying Tweet' });

};

exports.scan = function(req, res){
  res.render('scan', { title: 'Unladen Follow' });

};

exports.single = function(req, res){

  var whitelist = require('validator').whitelist;
  var user = require('./twitter').sanitizeUsername(req.params.user);

  res.render('single', { title: 'Unladen Follow profile for ' + user, user: user });

};