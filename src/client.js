var room_users_list=[];
var characters_list=[];
var myProfile ={
	id:-1,
	username: "",
	category: "",
	room:"",
	skin:""
};

function loginResponse(){};
function registerResponse(){};
function showMessage(txt){};
function clearChat(){};
function changeTitle(employee_username){};
function updateTicket(ticket){};

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


var products = ["resources/comp1.png",
				"resources/comp2.png"];

var animations1 = {};
var animations2 = {};
var animations3 = {};



function loadAnimation( list, name, url )
{
    var anim = new RD.SkeletalAnimation();
    anim.load(url);
    list[ name ] = anim;
    return list;
}

animations1=loadAnimation(animations1,"idle", "resources/data/boy/animations_breathingidle.skanim");
animations1=loadAnimation(animations1,"walking", "resources/data/boy/animations_strutwalking.skanim");
animations1=loadAnimation(animations1,"dancing", "resources/data/boy/animations_snakehiphopdance.skanim");

animations2=loadAnimation(animations2,"idle", "resources/data/anims/girl_idle.skanim");
animations2=loadAnimation(animations2,"walking", "resources/data/anims/girl_walking.skanim");
animations2=loadAnimation(animations2,"dancing", "resources/data/anims/girl_dancing.skanim");

animations3=loadAnimation(animations3,"idle", "resources/data/doozy/animations_oldmanidle.skanim");
animations3=loadAnimation(animations3,"walking", "resources/data/doozy/animations_scaryclownwalk.skanim");
animations3=loadAnimation(animations3,"dancing", "resources/data/doozy/animations_twistdance.skanim");

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
				
			case("setTicket"):
				myProfile.ticket = msg.myTicket;
				updateTicket(msg.lastTicket+'/'+myProfile.ticket, "set");
				break;
			case("ticket"):
				let ticket = msg.content;
				updateTicket(ticket, "update");
				break;
				
			case("user_list"):
				room_users_list=msg.content;
				for (var i=0; i<room_users_list.length;i++){
					if(room_users_list[i].type==2){

                        room_users_list[i].animations=animations3;

                    }
                    else if(room_users_list[i].type==0){
                        console.log("entra type 0");
                        room_users_list[i].animations=animations1;

                    }
                    else if(room_users_list[i].type==1){
                        room_users_list[i].animations=animations2;
                    }
					var character = new RD.SceneNode();
					character.name = room_users_list[i].id;
					character.layers = CHARACTERS_LAYER; //layer 0b1 and 0b10 is for objects, layer 0b100 for characters
					character.is_character = true; //in case we want to know if an scene node is a character
					character.scale(0.01);
					character.position=room_users_list[i].pos;
					character.rotation=room_users_list[i].rot;
					character.mesh=room_users_list[i].skin;
                    character.texture=room_users_list[i].texture;
					character.anim_name = "idle";
					scene.root.addChild( character );
					characters_list.push(character);
					//console.log(character.rotation);
				}
				
				break;
				
			case("new_user"):
				console.log("Nuevo usuario en la sala.");
				room_users_list.push(msg.content);
				if(msg.content.type==2){
                        room_users_list[room_users_list.length-1].animations=animations3;

                }
                else if(msg.content.type==0){
                    room_users_list[room_users_list.length-1].animations=animations1;
                }
                else if(msg.content.type==1){
                    console.log("entra chica");
                    room_users_list[room_users_list.length-1].animations=animations2;
                }
				var character = new RD.SceneNode();
				character.name = msg.content.id;
				character.layers = CHARACTERS_LAYER; //layer 0b1 and 0b10 is for objects, layer 0b100 for characters
				character.is_character = true; //in case we want to know if an scene node is a character
				character.scale(0.01);
				character.position=msg.content.pos;
				character.rotation=msg.content.rot;
				//character.rotate(msg.content.rot,[0,1,0]);
				character.mesh = msg.content.skin;
                character.texture = msg.content.texture;
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
				
				let len = room_users_list.length;
				for(var i = 0; i < len; i++){
					if(room_users_list[i].id==msg.id){
						console.log("deleted");
						room_users_list.splice(i,1);
						characters_list.splice(i,1);
						var node_to_delete=scene.root.getAllChildren();
						scene.root.removeChild(node_to_delete[node_to_delete.length-len+i]);
						break;
					}
				}
				console.log(scene.root);
				break;
				
			case("office"):
				console.log("preparing office");
				clearChat();
				changeTitle( msg.content.username);
				console.log(myProfile.role);
				if (myProfile.role == "client"){
					document.getElementById('ticketContainer').classList.toggle('hidden');
					joinRoom(msg.callToken);
				}
				// to do msg.id = undefied
				for(var i = 1; i < room_users_list.length; i++){
					if(room_users_list[i].id!=msg.id){
						room_users_list.splice(i,1);
						characters_list.splice(i,1);
						var node_to_delete=scene.root.getAllChildren();
						scene.root.removeChild(node_to_delete[i+4]);
					}
				}
				var node_to_delete=scene.root.getAllChildren();
				// to do (David)
                for(var i =1;i<node_to_delete.length;i++){
                    scene.root.removeChild(node_to_delete[i]);
                }
				var room_node = new RD.SceneNode();
                room_node.name = "room";
                room_node.flags.two_sided = true;
                room_node.mesh = "resources/data/room.obj";
                room_node.textures.color = "resources/data/room.png";
                room_node.position=[0,0.01,0];
                scene.root.addChild( room_node );
				
				var panel = new RD.SceneNode();
				panel.id = "panel";
				panel.name = "panel";
				panel.mesh = "resources/panel.obj";
				panel.texture = "resources/comp1.png";
				panel.position=[-.75,1,-.9];
				panel.scale([1, .75, 1]);
				scene.root.addChild( panel );
				
                var table = new RD.SceneNode();
                table.name = "table";
                table.mesh = "resources/data/table_despatx/Vintage Desk.obj";
                table.texture = "resources/data/table_despatx/Texture/Desk/Wood_DeskMain.png";
                table.scale(0.8);
                table.position=[1.5,0,0.14];
                table.rotation=[0,-0.7,0,0.7];

                scene.root.addChild( table );
                scene.root.addChild( node_to_delete[node_to_delete.length-1] );
				
				//console.log(msg.content);
				room_users_list.push(msg.content);
				if(msg.content.type==2){
                    console.log("entra");
                    room_users_list[room_users_list.length-1].animations=animations3;
                    console.log(room_users_list[room_users_list.length-1].animations);

                }
                else if(msg.content.type==0){
                    room_users_list[room_users_list.length-1].animations=animations1;

                }
                else if(msg.content.type==1){
                    room_users_list[room_users_list.length-1].animations=animations2;

                }
				var character = new RD.SceneNode();
				character.name = msg.content.id;
				character.layers = CHARACTERS_LAYER; //layer 0b1 and 0b10 is for objects, layer 0b100 for characters
				character.is_character = true; //in case we want to know if an scene node is a character
				character.scale(0.01);
				character.position=msg.content.pos;
				character.rotation=msg.content.rot;
				character.mesh = msg.content.skin;
                character.texture = msg.content.texture;
				character.anim_name = "idle";
				scene.root.addChild( character );
				characters_list.push(character);	
				
				break;
			
				
			case("login"):				
				if(msg.id > 0){
					myProfile.id = msg.id;
					myProfile.username = msg.username;
				}
				loginResponse(msg.role);
				myProfile.role = msg.role;
				break;
			
			case("register"):
				registerResponse(msg.content);
				if(msg.id > 0){
					myProfile.id = msg.id;
					myProfile.username = msg.username;
				}
				break;
				
			case("session closed"):
				location.reload();
		}
			
	}

	this.socket.onerror = function(err){  
		console.log("error: ", err );
	}
	
}

socket = new Connection();

function loginUser(username, password){
	myProfile.username=username;
	var msg = {
			type:"login",
			username:username,
			password:password
	};				
	socket.socket.send(JSON.stringify(msg));
}

function registerUser(username, password){
	myProfile.username=username;
	var msg = {
			type:"register",
			username:username,
			password:password
	};				
	socket.socket.send(JSON.stringify(msg));
}

function requestRoom(category){
	myProfile.category=category;
	var msg = {
			type:"room",
			username:myProfile.username,
			category:category,
			skin:myProfile.skin
	};				
	socket.socket.send(JSON.stringify(msg));
}

function nextClient(category){
	var msg = {
		type: "nextClient",
		callToken: myProfile.uniqueToken
	};
	socket.socket.send(JSON.stringify( msg ));
}

function sendMessage(txt){
	var msg = {
		type: "text",
		content:txt,
		username:myProfile.username,
	};

	//console.log("Senidng message", JSON.stringify( msg ));
	showMessage(msg, "send");
	socket.socket.send(JSON.stringify( msg ));
}

function changeProduct(i){
	let node = scene.getNodeById("panel");
	//console.log(node);
	if(i>0 && i< products.length)
		node.texture = products[i];
}
