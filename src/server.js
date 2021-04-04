var WebSocketServer = require('websocket').server;
var http = require('http');
var url = require('url');
var crypto = require('crypto');
var mysql = require('mysql');

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
	this.room=id;
	this.category=1;
	var that = this;
	this.state = {
		pos:[0,0,0],
		fut_pos:[0,0,0],
		rot:[0,0,0,1],
		fut_rot:0,
		dt:1,
		fut_rot_aux:0
		
	};	
	this.updatePosition = function(msg, move){
		if(move){
			that.state.pos = msg.pos;
			that.state.fut_pos = msg.fut_pos;
		}else{
			that.state.rot = msg.angle;
		}
	}
}

var user = function(con, id, username, skin, category){
    this.connection=con;
    this.id=id;
	this.username=username;
	this.skin=skin;
	this.category=category;
	this.room;
	this.inOffice = false;
	this.ticket;
	var that = this;
	this.state = {
		pos:[0,0,0],
		fut_pos:[0,0,0],
		rot:[0,0,0,1],
		fut_rot:0,
		dt:1,
		fut_rot_aux:0		
	};	
	this.updatePosition = function(msg, move){
		if(move){
			that.state.pos = msg.pos;
			that.state.fut_pos = msg.fut_pos;
		}else{
			that.state.rot = msg.angle;
			that.fut_rot_aux=1;
		}
	}
}

var info_to_send = function(_user){
    this.username = _user.username;
    this.id = _user.id;
    this.pos = _user.state.pos;
    this.rot = _user.state.rot;
	this.fut_rot=_user.state.fut_rot;
	this.fut_rot_aux=_user.state.fut_rot_aux;
	this.fut_pos=_user.state.fut_pos;
	this.skin= _user.skin;
	this.dt=_user.state.dt;
}

var waitingRoom = function(id){
	this.id = id;
	this.limit = 3;
	this.list_of_users = [];
	var that = this;
	this.len = function(){
		return that.list_of_users.length;
	}
	this.onNewUser = function(newUser){
		if(that.len() < that.limit){
			that.list_of_users.push(newUser);
			let roommatesInfo=[];
			that.list_of_users.forEach( function initRoommatesInfo(id, index, array) {
				//if(id != newUser)					
				roommatesInfo.push(new info_to_send(DB.onlineClients[id]));
			});
			//console.log(roommatesInfo);
			var msg_need_user = {
				type: "user_list",
				content:roommatesInfo				
			};
			DB.onlineClients[newUser].connection.send( JSON.stringify( msg_need_user ) );

			// Send new user information to active users
			user_properties = new info_to_send(DB.onlineClients[newUser]);
			var msg_user_prop = {
				type: "new_user",
				content: user_properties
			};
			
			//console.log("sendig user_properties", user_properties);
			that.sendMessage(newUser, JSON.stringify( msg_user_prop ));
			
		}
		else{
			console.log("limit exceeded");
		}
	}
	this.onUserQuits = function(user_id){
		i = that.list_of_users.indexOf(user_id);
		
		var msg_user_prop = {
				type: "disconnected",
				id: user_id
			};
			
		that.sendMessage(user_id, JSON.stringify( msg_user_prop ));
		delete that.list_of_users.splice(i,1);
	}
	this.onUserDeparts = function(){
		
		let user_id=that.list_of_users[0];
		DB.onlineClients[user_id].inOffice = true;
		var msg_user_prop = {
				type: "disconnected",
				id: user_id
			};			
		that.sendMessage(user_id, JSON.stringify( msg_user_prop ));		// Inform roommates
		
		return that.list_of_users.shift();
	}
	this.userTicket = function(){
		if(that.list_of_users.length > 0)
			return DB.onlineClients[that.list_of_users[0]].ticket;
		else
			return Infinity
	}
	this.sendMessage = function(emisor_id, msg){
		that.list_of_users.forEach( function myFunction(id, index, array) {
			if(id != emisor_id)
				DB.onlineClients[id].connection.send(msg);
		});
	}
}

var office = function(employee_id){
	this.id = employee_id;
	this.employee_id = employee_id;
	this.is_free = true;
	this.client_id;	
	var that = this;
	
	this.onUserLeaves = function(){
		//console.log("sending disconected");
		let msg = {
			type: "disconnected",
			id: that.client_id
		};
		DB.onlineEmployees[that.employee_id].connection.send(JSON.stringify(msg));
		that.client_id = null;
		that.is_free = true;
		return 1;
	}
	
	this.onNextClient = function(){
		
		if(that.is_free == true){	// to do (chech if ANY client in waiting rooms, ont just i first)			
			let next_cat = 0;			// Search next client
			let next_room = 0;			// Search next client
			let lower_ticket = Infinity; // DB.list_of_cat[category][0].userTicket();
			for (category = 0; category < Object.keys(cat_dict).length; category++){				
				for (room = 0; room < DB.list_of_cat[category].length; room++){
					ticket = DB.list_of_cat[category][room].userTicket();
					if(ticket < lower_ticket){
						lower_ticket = ticket;
						next_room = room;
						next_cat = category;
					}
				}
			}
			if(lower_ticket < Infinity){
				that.is_free = false;		// Set office as occupied
				that.client_id = DB.list_of_cat[next_cat][next_room].onUserDeparts();
				console.log("Client found! wellcome: ", that.client_id);
				DB.onlineClients[that.client_id].room = that.id;
				var msg_user_emplo = {
					type: "office",
					content: new info_to_send(DB.onlineEmployees[that.employee_id])
				};		
				DB.onlineClients[that.client_id].connection.send(JSON.stringify( msg_user_emplo ));	// Inform user of employees properties

				var msg_emplo_user = {
					type: "office",
					content: new info_to_send(DB.onlineClients[that.client_id])
				};			
				DB.onlineEmployees[that.employee_id].connection.send(JSON.stringify( msg_emplo_user ))	// Inform employee of user arrival
			}else{
				console.log("No clients available");
			}
		}else{
			console.log("Occupied office!");
		}
	}
	
	this.sendMessage = function(emisor_id, msg){
		if(!that.is_free){
			if(emisor_id in DB.onlineEmployees)
				DB.onlineClients[that.client_id].connection.send(msg);
			else if (emisor_id in DB.onlineClients)
				DB.onlineEmployees[that.employee_id].connection.send(msg);
			else
				console.log("unkown sender!");
		}
	}
}

var Database = function(){

	var that = this;
	this.onlineClients = {}
	this.onlineEmployees = {}
	this.list_of_cat = [];
	this.availableOffices = {};
	this.lastTicket = 1;
	
	this.new_wr = function(category){
		let id = that.list_of_cat[category].length;
		that.list_of_cat[category].push(new waitingRoom(id));
	}
	
	this.new_office = function(employee_id){
		that.availableOffices[employee_id] = new office(employee_id);
	}
	
	this.init = function(num_of_categories){
		that.list_of_cat = [];
		for (i = 0; i < num_of_categories; i++)
			that.list_of_cat.push([new waitingRoom(0)]); 
	}
	
	this.add_user_to_wr = function(user_id, category){
		let room=0;
		for (room = 0; room < that.list_of_cat[category].length; room++) { 
			// if room is not full -> add user
			if(that.list_of_cat[category][room].len() < that.list_of_cat[category][room].limit){
				that.list_of_cat[category][room].onNewUser(user_id);
				DB.onlineClients[user_id].room = room;
				return room;
			}
		}
		// if all rooms are full -> create new room & add user
		that.new_wr(category);
		that.list_of_cat[category][room].onNewUser(user_id);
		DB.onlineClients[user_id].room = room;
		return room;
	}

	this.onUserDisconnected = function(user_id){
		if(user_id in that.onlineClients){
			console.log("Goodbye "+that.onlineClients[user_id].username);
			category = that.onlineClients[user_id].category;
			room = that.onlineClients[user_id].room;
			if(that.onlineClients[user_id].inOffice)
				that.availableOffices[room].onUserLeaves();
			else
				that.list_of_cat[category][room].onUserQuits(user_id);	// Remove user from room
			delete that.onlineClients[user_id];							// Remove user from Database
			// to do (inform clients in room)
		}else if (user_id in that.onlineEmployees){
			console.log("Goodbye "+that.onlineEmployees[user_id].username);
			delete that.availableOffices[user_id];					// Remove office
			delete that.onlineEmployees[user_id];						// Remove user from Database
		}else{
			// to do (handle error user not found on disconected)
		}
	}
	
}

var DB = new Database();
DB.init(Object.keys(cat_dict).length);

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
			user_id = results[0].user_id;
			if( (user_id in DB.onlineEmployees) || (user_id in DB.onlineClients) ){
			   console.log("User already logged");
			}else{
				console.log("successful login!");
				msg.id = user_id;
				connection['id'] = results[0].user_id;
				if(results[0].is_employee){
					msg.role = "employee";
					DB.onlineEmployees[user_id] = new employee(connection, user_id, info.username);
					DB.new_office(user_id);	
					var msg2 = {
						type: "office",
						content: new info_to_send(DB.onlineEmployees[user_id])
						
					};
					connection.send(JSON.stringify(msg2));
					//DB.availableOffices[user_id].onNextClient(1);	// to do (employee iteraction with nextClient method)
				}else{
					msg.role = "client";
					DB.onlineClients[user_id] = new user(connection, user_id, info.username);
				}
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
			role: "client",
			id: -1,
			username: info.username
		};
		
		if(results.length==0){
			let md5 = crypto.createHmac("md5","my_salt_2017*(D-R)");
			enc_password = md5.update(info.password).digest("hex");
			client.query(
			  'INSERT INTO Vinicius_users SET username = ?, password = ?', [info.username, enc_password]
			);
			msg.content = 1;			
			console.log("successful register!");
			client.query( 'SELECT user_id FROM Vinicius_users WHERE username=? AND password=? ',[info.username, enc_password],
				function selectUsuario(err, results, fields){
	 
				if (err) {
					console.log("Error: " + err.message);
					throw err;
				}

				if(results.length==1){
					msg.id = results[0].user_id;
					connection['id'] = results[0].user_id;
					DB.onlineClients[results[0].user_id] = new user(connection, results[0].user_id, info.username);
				}
				else{
					console.log("login error after register!");
				}	 
			});	
			
		}
		else{
			console.log("username "+info.username+" already exists!");
			// to do (send error to client)
		}
						
		connection.send(JSON.stringify(msg));
		client.end();
	});
}

function onEnterRoom(connection, info){
	DB.onlineClients[connection.id].category = cat_dict[info.category]; // Specify category to user
	DB.onlineClients[connection.id].ticket = DB.lastTicket;				// Specify ticket to user
	DB.lastTicket += 1;													// increment ticket
	DB.add_user_to_wr(connection.id, cat_dict[info.category]);			// Put user in room
}

// call when we receive a message from a WebSocket
function onUserMessage( connection, msg ){
	sender_id = connection.id;
	
	if(sender_id in DB.onlineClients){
		room = DB.onlineClients[sender_id].room;
		category = DB.onlineClients[sender_id].category;
		if(DB.onlineClients[sender_id].inOffice)
			DB.availableOffices[room].sendMessage(sender_id, msg);
		else
			DB.list_of_cat[category][room].sendMessage(sender_id, msg);

	}else if(sender_id in DB.onlineEmployees){
		room = DB.onlineEmployees[sender_id].room;
		DB.availableOffices[room].sendMessage(sender_id, msg);

	}else
		console.log("unkown sender");
}

function onNextClient(connection){
	let employee_id = connection.id;
	DB.availableOffices[employee_id].onNextClient();	// to do (employee iteraction with nextClient method)
}

// call when we a user updates its position
function onUserUpdate( connection, msg ,move){
	user_id = connection.id;
	if(user_id in DB.onlineClients){
		user_category = DB.onlineClients[user_id].category;
		user_room = DB.onlineClients[user_id].room;
		DB.onlineClients[user_id].updatePosition(msg, move);									// Update sender position

		if(DB.onlineClients[user_id].inOffice)
			DB.availableOffices[user_room].sendMessage(user_id, JSON.stringify(msg));			// Inform active users in same room
		else
			DB.list_of_cat[user_category][user_room].sendMessage(user_id, JSON.stringify(msg));	// Inform active users in same room		
	}
	else if (user_id in DB.onlineEmployees){
		DB.onlineEmployees[user_id].updatePosition(msg, move);									// Update sender position
		DB.availableOffices[user_id].sendMessage(user_id, JSON.stringify(msg));					// Inform active users in same room	
	}
	
}

// call when we a user disconnects
function onUserDisconected( connection ){	
	console.log("A user has been disconected");
	user_id = connection['id'];
	if(user_id)
		DB.onUserDisconnected(user_id);
	
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
	
    connection.on('message', function(message) {
        if (message.type === 'utf8') {		
			
			var msg = JSON.parse( message.utf8Data );	
			switch(msg.type){			
				case("text"):		
					onUserMessage( connection, message.utf8Data );
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
					
				case("move"):
					onUserUpdate( connection, msg,true );
					break;
					
				case("rotation"):
					onUserUpdate( connection, msg,false );
					break;
					
				case("nextClient"):
					onNextClient( connection);
					break;
			}
        }
    });
	
    connection.on('close', function(e) {
        // close user connection and clear user data
		onUserDisconected(connection);
		
    });
	
});

