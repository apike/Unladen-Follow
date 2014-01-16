
var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , twitter = require('./routes/twitter')
  , http = require('http')
  , path = require('path');
 
var config = require('./config.js');
console.log(config.PORT);
 
 
var app = express();
 
// all environments
app.configure(function(){
  app.set('port', config.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({  secret: config.EXPRESS_SESSION_SECRET }));
  app.use(function(req, res, next){
      res.locals.user = req.session.user;
      next();
    });
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
 
 
app.get('/', routes.index);
app.get('/twitter/timeline', twitter.timeline); 
app.get('/twitter/connect', twitter.connect); 
app.get('/twitter/callback', twitter.callback); 
 

 
app.listen(parseInt(config.PORT || 3000));