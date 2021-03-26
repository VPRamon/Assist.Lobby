var WebSocketServer = require('websocket').server;
var http = require('http');
var url = require('url');
var mysql = require('mysql');
//example of simple users database
var USERS = [];
var id=0;

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

function user(con,_id,info){
    this.connection=con;
    this.id=_id;
	this.username=info.username;
    this.posx= info.posx;
    this.posy= info.posy;
    this.direction=1;
    this.dx=0;
    this.dy=0;
    this.x_f= info.posx;
    this.y_f= info.posy;
	this.maxx= info.maxx;
	this.maxy= info.maxy;
	this.skin= info.skin;
	this.room= info.room;
}

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

// call this when somebody connects to your WebsocketServer
function onUserConnected( connection, info ){
	var cliente_en_database=0;
	var client = mysql.createConnection({  database:'ecv-2019', user: 'ecv-user',  password: 'ecv-upf-2019',  host: '127.0.0.1'});
	console.log(info.username);
	console.log(info.password);
	//fara la comprobacio si hi ha usuari i password 
	client.query( 'SELECT username FROM Vinicius_users WHERE username=? AND password=? ',[info.username, info.password],
		function selectUsuario(err, results, fields) {
	 
		if (err) {
			console.log("Error: " + err.message);
			throw err;
		}
	 
		console.log("Number of rows: "+results.length);
		console.log(results);
		if(results.length==1){
			cliente_en_database=1;
			console.log("llistaa");
			console.log(cliente_en_database);
			var msg_id = {
				type: "login",
				content: 1			
			};
			connection.send(JSON.stringify(msg_id));
			
		}
		else{
			console.log("llistaa2222");
			console.log(cliente_en_database);
			var msg_id = {
				type: "login",
				content: 0			
			};
			connection.send(JSON.stringify(msg_id));
		}
	 
		client.end();
	});
	
	
	
	
}

function enterRoom(connection, info){
	new_user = new user( connection, id, info);
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
	}
	
	
	
	
	
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

function User_Register( connection, msg ){
	
 
	var client = mysql.createConnection({  database:'ecv-2019', user: 'ecv-user',  password: 'ecv-upf-2019',  host: '127.0.0.1'});
	
	client.query( 'SELECT username FROM Vinicius_users WHERE username=?',[msg.username],
		function selectUsuario(err, results, fields) {
	 
		if (err) {
			console.log("Error: " + err.message);
			throw err;
		}
	 
		console.log("Number of rows: "+results.length);
		console.log(results);
		if(results.length==0){
			client.query(
			  'INSERT INTO Vinicius_users SET username = ?, password = ?',
			  [msg.username, msg.password]
			);
			console.log("llistaa");
			console.log(cliente_en_database);
			var msg_id = {
				type: "login",
				content: 1			
			};
			connection.send(JSON.stringify(msg_id));
			
		}
	 
		client.end();
	});
	
	
	

	
	
	
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


wsServer = new WebSocketServer({ httpServer: server });

// Add event handler when one user connects
wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
		
    //connection.sendUTF("hello");
    // This is the most important callback for us, we'll handle all messages from users here.
    connection.on('message', function(message) {
		//console.log(message);
        if (message.type === 'utf8') {		
			
			var msg = JSON.parse( message.utf8Data );	
			switch(msg.type){			
				case("text"):
					console.log("received Message",message);
					// process WebSocket message				
					onUserMessage( connection, msg );
					break;
					
				case("login"):
					onUserConnected( connection , msg  );
					break;
					
				case("update"):
					onUserUpdate( connection, msg );
					break;
				case("register"):
					console.log("llega");
					User_Register( connection, msg );
					break;
				case("room"):
					enterRoom( connection, msg );
					break;
			}   
        }
    });
    connection.on('close', function(connection) {
        // close user connection
		onUserDisconected(connection);
    });
});
