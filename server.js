// ------------------SETUP-----------------------------

var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var session = require("express-session");
var cookieParser = require("cookie-parser")();
var RedisStore = require("connect-redis")(session);

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./static")));
app.use(session({secret: "ozziejetter", resave: true, saveUninitialized: true, name: "supersession", store: new RedisStore()}));
app.use(cookieParser);

app.set("views", path.join(__dirname, "./client/views"));
app.set("view engine", "ejs");




//--------------------------DB  SCHEMAS--------------------

// require("./server/config/mongoose.js");

// --------------------------------------------------------

require("./server/config/routes.js")(app);

//--------------------LISTEN-----------------
var server = app.listen(process.env.PORT || 8000);

//----------------------SOCKETS---------------------------

var io = require("socket.io").listen(server);
var clicks = 0;
var users = {};

io.use(function(socket, next){
	var req = socket.handshake;
	var res = {};
	cookieParser(req, res, function(err){
		if (err){return next(err)};
		session({secret: "ozziejetter", resave: true, saveUninitialized: true})(req, res, next);
	})
})

io.sockets.on('connection', function (socket) {
	console.log("Client/socket is connected!");
	console.log("Client/socket id is: ", socket.id);
	// all the server socket code goes in here
	socket.on("new_user", function(data){
		if(users[data.user] || data.user === ""){
			socket.emit("in_use");
		}
		else{
			socket.handshake.session.user = data.user;
			socket.handshake.session.save();
			socket.broadcast.emit("new_user", {user: data.user});
			socket.emit("logged_in", {users: users});
			users[data.user] = data.user;
		}
	})

	socket.on("chat_submitted", function(data){
		io.emit("chat_submitted", {chat: data.chat, user: socket.handshake.session.user})
	})

	socket.on("disconnect", function(){
		delete users[socket.handshake.session.user];
		io.emit("disconnect", {user: socket.handshake.session.user})
	})

	socket.on( "button_clicked", function (){
		clicks++;
		console.log(JSON.stringify(socket.handshake.session.user))
		io.emit( 'server_response', {clicks:  clicks});
	})

	socket.on( "reset_clicked", function (){
		clicks = 0;
		io.emit( 'server_response', {clicks:  clicks});
	})
})
