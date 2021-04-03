var room_users_list=[];
var characters_list=[];
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
function clearChat(){};
function changeTitle(employee_username){};


//scene container
var scene = new RD.Scene();
var walk_area = new WalkArea();
walk_area.addRect([-1.8,0.1,-0.8],3.6,1.6);
var CHARACTERS_LAYER = 4; //4 is 100 in binary

var room_node_externo = new RD.SceneNode();
room_node_externo.name = "room";
room_node_externo.flags.two_sided = true;
room_node_externo.mesh = "resources/data/room.obj";
room_node_externo.scale(2);
room_node_externo.textures.color = "resources/data/fondo_bueno.jpg";
scene.root.addChild( room_node_externo );

var table = new RD.SceneNode();
table.name = "table";
table.mesh = "resources/data/table_sala/Wood_Table_obj.obj";
table.texture = "resources/data/table_sala/textures/Wood_Table_C.jpg";
table.position=[0.03,0,-0.65];
scene.root.addChild( table );

var book = new RD.SceneNode();
book.name = "book";
book.mesh = "resources/data/book/1984_book.obj";
book.texture = "resources/data/book/Texture/1984-book_A.jpg";
book.scale(0.1);
book.position=[0.03,0.5,-0.65];
scene.root.addChild( book );

var room_node = new RD.SceneNode();
room_node.name = "room";
room_node.flags.two_sided = true;
room_node.mesh = "resources/data/room.obj";
room_node.textures.color = "resources/data/room.png";
room_node.position=[0,0.01,0];
scene.root.addChild( room_node );


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
				//console.log("estamos");
				//console.log(room_users_list);
				for (var i=0; i<room_users_list.length;i++){
					var character = new RD.SceneNode();
					character.name = room_users_list[i].id;
					character.layers = CHARACTERS_LAYER; //layer 0b1 and 0b10 is for objects, layer 0b100 for characters
					character.is_character = true; //in case we want to know if an scene node is a character
					character.scale(0.01);
					character.position=room_users_list[i].pos;
					character.rotation=room_users_list[i].rot;
					character.mesh = "resources/data/girl.wbin";
					character.texture = "resources/data/girl_low.png";
					character.anim_name = "idle";
					scene.root.addChild( character );
					characters_list.push(character);
					//console.log(character.rotation);
				}
				
				break;
				
			case("new_user"):
				console.log("Nuevo usuario en la sala.");
				room_users_list.push(msg.content);
				var character = new RD.SceneNode();
				character.name = msg.content.id;
				character.layers = CHARACTERS_LAYER; //layer 0b1 and 0b10 is for objects, layer 0b100 for characters
				character.is_character = true; //in case we want to know if an scene node is a character
				character.scale(0.01);
				character.position=msg.content.pos;
				character.rotation=msg.content.rot;
				//character.rotate(msg.content.rot,[0,1,0]);
				character.mesh = "resources/data/girl.wbin";
				character.texture = "resources/data/girl_low.png";
				character.anim_name = "idle";
				scene.root.addChild( character );
				characters_list.push(character);				
				break;				
				
			case("move"):
				//send new position no neighbours
				for(var i = 0; i < room_users_list.length; i++){
					if(room_users_list[i].id==msg.id){
						//console.log(msg.fut_pos)
						room_users_list[i].pos = msg.pos;
						room_users_list[i].fut_pos = msg.fut_pos;
						room_users_list[i].dt = msg.dt;
					}
				}
				break;
				
			case("rotation"):
				//send new position no neighbours
				for(var i = 0; i < room_users_list.length; i++){
					if(room_users_list[i].id==msg.id){
						//console.log(msg.fut_pos)
						room_users_list[i].fut_rot_aux=msg.angle;
						room_users_list[i].fut_rot = msg.fut_rot;
						room_users_list[i].dt = msg.dt;
					}
				}
				break;
								
			case("disconnected"):				
				console.log("User "+msg.id+" has disconnected");
				
				for(var i = 0; i < room_users_list.length; i++){
					if(room_users_list[i].id==msg.id){
						console.log("deleted");
						room_users_list.splice(i,1);
						characters_list.splice(i,1);
						var node_to_delete=scene.root.getAllChildren();
						scene.root.removeChild(node_to_delete[i+4]);
					}
				}
				console.log(scene.root);
				break;
				
			case("office"):
				console.log("preparing office");
				clearChat();
				changeTitle( msg.content.username);

				// to do msg.id = idefied
				for(var i = 1; i < room_users_list.length; i++){
					if(room_users_list[i].id!=msg.id){
						room_users_list.splice(i,1);
						characters_list.splice(i,1);
						var node_to_delete=scene.root.getAllChildren();
						scene.root.removeChild(node_to_delete[i+4]);
					}
				}
				
				//console.log(msg.content);
				room_users_list.push(msg.content);
				var character = new RD.SceneNode();
				character.name = msg.content.id;
				character.layers = CHARACTERS_LAYER; //layer 0b1 and 0b10 is for objects, layer 0b100 for characters
				character.is_character = true; //in case we want to know if an scene node is a character
				character.scale(0.01);
				character.position=msg.content.pos;
				character.rotation=msg.content.rot;
				character.mesh = "resources/data/girl.wbin";
				character.texture = "resources/data/girl_low.png";
				character.anim_name = "idle";
				scene.root.addChild( character );
				characters_list.push(character);	
				
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

function nextClient(category){
	var msg = {
		type: "nextClient",
		category:category
	};
	socket.socket.send(JSON.stringify( msg ));
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
