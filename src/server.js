var WebSocketServer = require('websocket').server;
var http = require('http');
var url = require('url');
var crypto = require('crypto');
var mysql = require('mysql');
//example of simple users database
var USERS = [];
var id=0;

var cat_dict = {
	'Computers':1,
	'Electronics':2,
	'Smart Home':3,
	'Other':0
}

var employee = function(con, id, username){
    this.connection=con;
    this.id=id;
	this.username=username;
	this.skin;
	this.room;
}

var user = function(con, id, username, skin, category){
    this.connection=con;
    this.id=id;
	this.username=username;
	this.skin=skin;
	this.category=category;
	this.room;
	this.ticket;
}

var waitingRoom = function(id){
	this.id = id;
	this.limit = 1;
	this.list_of_users = [];
	var that = this;
	this.len = function(){
		return that.list_of_users.length;
	}
	this.onNewUser = function(user){
		if(that.len() < 10){
			that.list_of_users.push(user);
		}
		else{
			console.log("limit exceeded");
		}
	}
	this.onUserLeaves = function(){
		return that.list_of_users.shift();
	}
	this.userTicket = function(){
		return that.list_of_users[0].ticket;
	}
}

var office = function(employee){
	this.id; // to do
	this.employee = employee;
	this.is_free = true;
	this.client;	
	var that = this;
	this.onNewClient = function(user){
		if(that.is_free == true){
			that.is_free = false;
			that.client = user;
		}
		else{
			console.log("Occupied office");
		}
	}
	this.onUserLeaves = function(user){
		that.client = null;
		that.is_free = true;
		return 1;
	}
	this.userTicket = function(){
		if(that.client)
			return that.client.ticket;
	}
}

var Database = function(){

	var that = this;
	this.list_of_cat = [];
	this.list_of_offices = [];
	
	this.new_wr = function(category){
		let id = that.list_of_cat[category].length;
		that.list_of_cat[category].push(new waitingRoom(id));
	}
	
	this.new_office = function(employee){
		that.list_of_offices.push(new office(employee));
	}
	
	this.init = function(num_of_categories){
		that.list_of_cat = [];
		for (i = 0; i < num_of_categories; i++)
			that.list_of_cat.push([new waitingRoom(0)]); 
	}
	
	this.add_user_to_wr = function(user){
		cat_index = cat_dict[user.category];
		//console.log(that.list_of_cat[cat_index]);
		let i=0;
		for (i = 0; i < that.list_of_cat[cat_index].length; i++) { 
			// if room is not full -> add user
			if(that.list_of_cat[cat_index][i].len() < that.list_of_cat[cat_index][i].limit){
				that.list_of_cat[cat_index][i].onNewUser(user);
				return(i);
			}
		}
		// if all rooms are full -> create new room & add user
		that.new_wr(cat_index);
		that.list_of_cat[cat_index][i].onNewUser(user);
		console.log(that.list_of_cat[cat_index]);
		return that.list_of_cat[cat_index].length;
	}
}

var DB = new Database();
DB.init(Object.keys(cat_dict).length);

function info_to_send(_user){
    this.username = _user.username;
    this.id = _user.id;
    this.posx = _user.posx;
    this.posy = _user.posy;
    this.direction = _user.direction;
    this.dx=_user.dx;
    this.dy=_user.dy;
    this.x_f= _user.x_f;
    this.y_f=_user.y_f;
	this.maxx=_user.maxx;
	this.maxy=_user.maxy;
	this.skin= _user.skin;
	this.room= _user.room;	
}

function onUserLogin( connection, info ){
	console.log("new login attempt.");
	var client = mysql.createConnection({  
		database:'ecv-2019', 
		user: 'ecv-user', 
		password: 'ecv-upf-2019',  
		host: '127.0.0.1'
	});
	
	let md5 = crypto.createHmac("md5","my_salt_2017*(D-R)");
	enc_password = md5.update(info.password).digest("hex");
	// Check username and password
	client.query( 'SELECT user_id, is_employee FROM Vinicius_users WHERE username=? AND password=? ',[info.username, enc_password],
		function selectUsuario(err, results, fields) {
	 
		if (err) {
			console.log("Error: " + err.message);
			throw err;
		}
	 	
		var msg = {
			type: "login",
			role: "error",
			id: -1,
			username: info.username
		};
		
		if(results.length==1){
			console.log("successful login!");
			msg.id = results[0].user_id;
			if(results[0].is_employee==1){
				msg.role = "employee";
				DB.new_office( new employee(connection, results[0].id, info.username) );
											
			}else if(results[0].is_employee==0){
				msg.role = "client";
			}
		}
		else{
			console.log("login error!");
		}	 
		connection.send(JSON.stringify(msg));
		client.end();
	});	
}

function onUserRegister( connection, info ){
	console.log("new register attempt.");
	var client = mysql.createConnection({  database:'ecv-2019', user: 'ecv-user',  password: 'ecv-upf-2019',  host: '127.0.0.1'});
	
	
	client.query( 'SELECT username FROM Vinicius_users WHERE username=?',[info.username],
		function selectUsuario(err, results, fields) {	 
		if (err) {
			console.log("Error: " + err.message);
			throw err;
		}
	 	
		var msg = {
			type: "register",
			content: 0	
		};
		
		if(results.length==0){
			let md5 = crypto.createHmac("md5","my_salt_2017*(D-R)");
			enc_password = md5.update(info.password).digest("hex");
			client.query(
			  'INSERT INTO Vinicius_users SET username = ?, password = ?', [info.username, enc_password]
			);
			msg.content = 1;			
			console.log("successful register!");
		}
		else{
			console.log("username "+info.username+" already exists!");
		}
						
		connection.send(JSON.stringify(msg));
		client.end();
	});
}

function onEnterRoom(connection, info){
	//console.log("user: "+info.username+" requests room");
	//console.log(info.id, info.username, info.skin, info.category);
	let client = new user(connection, info.id, info.username, info.skin, info.category)
	//console.log(client);
	DB.add_user_to_wr(client);
	
	/*new_user = new user( connection, id, info);
	console.log(info);
	var msg_id = {
		type: "my_id",
		content: id			
	};
	connection.send(JSON.stringify(msg_id));
	id=id+1;
	USERS.push( new_user );
	
	// Send active users information to new user
	lista_aux=[];
	for(var i = 0; i < USERS.length; i++){
		if(USERS[i].connection != connection && USERS[i].room == info.room) 
			lista_aux.push(new info_to_send(USERS[i]));
	}	
	var msg_need_user = {
		type: "user_list",
		content:lista_aux				
	};
	connection.send( JSON.stringify( msg_need_user ) );
	
	// Send new user information to active users
	user_properties = new info_to_send(new_user);
	var msg_user_prop = {
		type: "new_user",
		content: user_properties
	};
	
	var user_properties_str = JSON.stringify( msg_user_prop );	
	//console.log("sendig user_properties", user_properties);
	for(var i = 0; i < USERS.length; i++){
		if(USERS[i].connection != connection && USERS[i].room == info.room) 
			USERS[i].connection.send(user_properties_str);
	}*/
}

// call when we receive a message from a WebSocket
function onUserMessage( connection, msg ){
	var msg_final = JSON.stringify(msg);
	console.log("Sending Message",msg_final);
	
	//for every user connected...
	var my_user;
	for(var i = 0; i < USERS.length; i++)
	{
		if(USERS[i].connection == connection) 
			my_user=USERS[i];
	}
	
	for(var i = 0; i < USERS.length; i++)
	{
		var user = USERS[i];
		// avoid feedback
		if(user.connection != connection  && user.room == my_user.room && (Math.sqrt( Math.pow( Math.abs(my_user.posx - user.posx )  ,2)+  Math.pow( Math.abs(my_user.posy - user.posy )  ,2) ) < 300) ) 
			user.connection.send( msg_final );
	}
}

// call when we a user updates its position
function onUserUpdate( connection, msg ){
	
	for(var i = 0; i < USERS.length; i++){		
		if(USERS[i].connection == connection){
			USERS[i].posx = msg.x_f;
			USERS[i].posy = msg.y_f;
			USERS[i].direction = msg.direction;			
		}
		else{			
			// Inform active users
			if(USERS[i].room == msg.room)
				USERS[i].connection.send( JSON.stringify(msg) );
		}
	}
}

// call when we a user disconnects
function onUserDisconected( connection ){
	var disconnected_user_id;
	//console.log("User disconnected",USERS); 
	for(var i = 0; i < USERS.length; i++){		
		if(USERS[i].connection.state == 'closed'){
			console.log("goodby ",USERS[i].username); 
			disconnected_user_id = USERS[i].id;
			USERS.splice(i,1);
		}
	}
	for(var i = 0; i < USERS.length; i++){			
		if(USERS[i].room == disconnected_user_id.room){
			// Inform active users
			var msg_disconnected = {
				type: "disconnected",
				id: disconnected_user_id
			};
			USERS[i].connection.send( JSON.stringify(msg_disconnected) );
		}		
	}
}

var server = http.createServer( function(request, response) {
    console.log("REQUEST: " + request.url );
    var url_info = url.parse( request.url, true ); //all the request info is here
    var pathname = url_info.pathname; //the address
    var params = url_info.query; //the parameters
    response.end("OK!"); //send a response
    if(request.url=="exit")
        process.exit(0);
});

server.listen(9022, function() {
    console.log("Server ready!" );
});

wsServer = new WebSocketServer({ httpServer: server });


// Add event handler when one user connects
wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
	
    // This is the most important callback for us, we'll handle all messages from users here.
    connection.on('message', function(message) {
        if (message.type === 'utf8') {		
			
			var msg = JSON.parse( message.utf8Data );	
			switch(msg.type){			
				case("text"):
					console.log("received Message",message);
					// process WebSocket message				
					onUserMessage( connection, msg );
					break;
					
				case("login"):
					onUserLogin( connection , msg  );
					break;
				
				case("register"):
					console.log("new registration");
					onUserRegister( connection, msg );
					break;
				
				case("room"):
					onEnterRoom( connection, msg );
					break;
					
				case("update"):
					onUserUpdate( connection, msg );
					break;
					
			}
        }
    });
	
    connection.on('close', function(connection) {
        // close user connection
		onUserDisconected(connection);
    });
});

