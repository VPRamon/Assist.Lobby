var room_users_list=[];

var myPorfile ={
	id:-1,
	username: "",
	category: "",
	room:"",
	skin:0
};

function loginResponse(){};
function registerResponse(){};
function showMessage(txt){};

function Connection(){
	that = this;
	//this.socket = new WebSocket("wss://ecv-etic.upf.edu/node/9022/ws/" );	
	this.socket = new WebSocket("ws://127.0.0.1:9022" );
	
	this.socket.onopen = function(){  
		console.log("Socket has been opened! :)");		
	}

	this.socket.addEventListener("close", function(e) {
			
		console.log("Socket has been closed: ", e); 
	});

	this.socket.onmessage = function(message){  
		
		console.log("Received: message");  
		console.log(message.data);
		
		var msg = JSON.parse(message.data);	
		switch(msg.type){			
			case("text"):
				showMessage(msg, "received");
				break;
				
			case("user_list"):
				room_users_list=msg.content;
				break;
				
			case("new_user"):
				console.log("Nuevo usuario en la sala.");
				room_users_list.push(msg.content);
				break;				
				
			case("update"):
				//send new position no neighbours
				for(var i = 0; i < room_users_list.length; i++){
					if(room_users_list[i].id==msg.id){
						room_users_list[i].moving = 1;
						room_users_list[i].x_f = msg.x_f;
						room_users_list[i].y_f = msg.y_f;
						//room_users_list[i].dx = msg.dx;//room_users_list[i].x_f - room_users_list[i].x_0; 
						//room_users_list[i].dy = msg.dy;//room_users_list[i].y_f - room_users_list[i].y_0;						
						room_users_list[i].direction = msg.direction;	
					}
				}
				break;
								
			case("disconnected"):				
				console.log("User "+msg.id+" has disconnected");
				for(var i = 0; i < room_users_list.length; i++){
					if(room_users_list[i].id==msg.id){
						console.log("deleted");
						room_users_list.splice(i,1);		
					}
				}
				break;
				
			case("login"):
				loginResponse(msg.role);
				if(msg.id > 0){
					myPorfile.id = msg.id;
					myPorfile.username = msg.username;
				}
				break;
			
			case("register"):
				registerResponse(msg.content);
				if(msg.id > 0){
					myPorfile.id = msg.id;
					myPorfile.username = msg.username;
				}
				break;
		}
			
	}

	this.socket.onerror = function(err){  
		console.log("error: ", err );
	}
	
}

socket = new Connection();

function loginUser(username, password){
	myPorfile.username=username;
	var msg = {
			type:"login",
			username:username,
			password:password
	};				
	socket.socket.send(JSON.stringify(msg));
}

function registerUser(username, password){
	myPorfile.username=username;
	var msg = {
			type:"register",
			username:username,
			password:password
	};				
	socket.socket.send(JSON.stringify(msg));
}

function requestRoom(category){
	myPorfile.category=category;
	var msg = {
			type:"room",
			username:myPorfile.username,
			category:category
	};				
	socket.socket.send(JSON.stringify(msg));
}

function sendMessage(txt){
	var msg = {
		type: "text",
		content:txt,
		username:myPorfile.username,
	};

	//console.log("Senidng message", JSON.stringify( msg ));
	showMessage(msg, "send");
	socket.socket.send(JSON.stringify( msg ));
}
