
var express = require('express')
  , routes = require('./routes')
  , twitter = require('./routes/twitter')
  , http = require('http')
  , path = require('path');
 
var config = require('./config.js');
console.log(config.PORT);
 
var engine = require('ejs-locals');
 
var app = express();
 
// all environments
app.configure(function(){
  app.set('port', config.PORT || 3000);
  app.set('views', __dirname + '/views');
  
  app.engine('ejs', engine);
  app.set('view engine', 'ejs');

  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({  secret: config.EXPRESS_SESSION_SECRET }));
  app.use(function(req, res, next){
      res.locals.user = req.session.user; // just boilerplate?
      res.locals.isLoggedIn = !!(req.session.oauthVerifier);
      next();
    });
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

var isLoggedIn = true; // todo: this is wrong
 
app.get('/', routes.index );
app.get('/scan', routes.scan);
app.get('/u/:user', routes.single); 
app.get('/twitter/timeline', twitter.timeline); 
app.get('/twitter/timeline/:page', twitter.timeline); 
app.get('/twitter/user/:user', twitter.user); 
app.get('/twitter/connect', twitter.connect); 
app.get('/twitter/callback', twitter.callback); 
 

app.get('/about', routes.about); 
app.get('/anatomy', routes.anatomy); 
 
app.listen(parseInt(config.PORT || 3000));