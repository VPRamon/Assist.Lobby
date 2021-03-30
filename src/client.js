var room_users_list=[];

var myPorfile ={
	username: "",
	room:"",
	id:0,
	skin:0
};

function loginResponse(){};
function registerResponse(){};
function showMessage(txt){};

function Connection(){
	
	//this.socket = new WebSocket("wss://ecv-etic.upf.edu/node/9022/ws/" );	
	this.socket = new WebSocket("ws://127.0.0.1:9022" );
	
	this.socket.onopen = function(){  
		console.log("Socket has been opened! :)");
		// say hello!
		/*var msg = {
				type: "login",
				username:my_uName,
				skin:my_skin,
				room:my_room,
				posx:x_0,
				posy:y_0,
				maxx:canvas.width,
				maxy:canvas.height
		};
		
		this.send(JSON.stringify( msg ));*/
	}

	this.socket.addEventListener("close", function(e) {
		// say goodbye!
		/*var msg = {
				type: "close_Server",
				username:my_uName					
		};
	
		this.send(JSON.stringify( msg ));*/
		
		console.log("Socket has been closed: ", e); 
	});

	this.socket.onmessage = function(message){  
		
		//console.log("Received: message");  
		//console.log(message);
		
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
				
			case("my_id"):
				myPorfile.id = msg.content;
				console.log("My ID is: ", myPorfile.id);
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
				loginResponse(msg.content);
				break;
			
			case("register"):
				registerResponse(msg.content);
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
		id:myPorfile.id
	};

	//console.log("Senidng message", JSON.stringify( msg ));
	showMessage(msg, "send");
	socket.socket.send(JSON.stringify( msg ));
}
