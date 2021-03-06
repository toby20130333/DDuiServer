
/**
 * Module dependencies.
 */
var config = require('./config');
var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , movie = require('./routes/movie')
  , cities = require("./routes/cities")
  , http = require('http')
  , path = require('path')
  , ejs = require('ejs')
  , SessionStore = require("session-mongoose")(express);

var store = new SessionStore({
    url: "mongodb://localhost/session",
    interval: 120000 // expiration check worker run interval in millisec (default: 60000)
});

var app = express();

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.engine('.html', ejs.__express);
app.set('view engine', 'html');// app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
//app.use(express.cookieParser());
//app.use(express.cookieSession({secret : 'blog.qtclub.me'}));
//app.use(express.session({
//  	secret : 'blog.qtclub.me',
//    store: store,
//    cookie: { maxAge: 100000 } // expire session in 15 min or 900 seconds
//}));

app.use(require('cookie-parser')(config.session_secret));
app.use(express.session({
    secret : config.session_secret,
    store : store,
    resave : true,
    saveUninitialized : true,
    cookie: { maxAge: 100000 } // expire session in 15 min or 900 seconds
}));

app.use(function(req, res, next){
  res.locals.user = req.session.user;
  var err = req.session.error;
  delete req.session.error;
  res.locals.message = '';
  if (err) res.locals.message = '<div class="alert alert-error">' + err + '</div>';
  next();
});
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//basic
app.get('/', routes.index);

app.all('/login', notAuthentication);
app.get('/login', routes.login);


app.get('/logout', authentication);
app.get('/logout', routes.logout);

app.get('/home', authentication);
app.get('/home', routes.home);


app.post('/register',user.register);
app.get('/register',user.getregister);
app.post('/login', user.onLogin);
app.get('/active_account',user.active_account);


//mongo
app.get('/movie/add',movie.movieAdd);
app.post('/movie/add',movie.doMovieAdd);
app.get('/movie/:name',movie.movieAdd);
app.get('/movie/json/:name',movie.movieJSON);

app.post("/cities",cities.addCities);
app.post("/findcity",cities.findCities);

app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


function authentication(req, res, next) {
  if (!req.session.user) {
    req.session.error='请先登陆';
    return res.redirect('/login');
  }
  next();
}

function notAuthentication(req, res, next) {
    console.log("用户登陆....notAuthentication.............");
	if (req.session.user) {
    	req.session.error='已登陆';
    	return res.redirect('/');
  	}
  next();
}