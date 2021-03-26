var chat = document.querySelector("#chat");
var send_button = document.querySelector("#send_button");
var text_input= document.querySelector("#message-to-send");
var login= document.querySelector("#login");
var register= document.querySelector("#register");
var enterRoom= document.querySelector("#enterRoom");


var canvas = document.querySelector("#canvas");
//var ctx = canvas.getContext('2d');

var list_of_skins=[];

var img_man1 = new Image();
var img_man2 = new Image();
var img_man3 = new Image();
var img_man4 = new Image();
var img_woman1 = new Image();
var img_woman2 = new Image();
var img_woman3 = new Image();
var img_woman4 = new Image();
img_man1.src = "resources/spritesheets/man1-spritesheet.png"	
img_man2.src = "resources/spritesheets/man2-spritesheet.png"	
img_man3.src = "resources/spritesheets/man3-spritesheet.png"	
img_man4.src = "resources/spritesheets/man4-spritesheet.png"	
img_woman1.src = "resources/spritesheets/woman1-spritesheet.png"	
img_woman2.src = "resources/spritesheets/woman2-spritesheet.png"	
img_woman3.src = "resources/spritesheets/woman3-spritesheet.png"	
img_woman4.src = "resources/spritesheets/woman4-spritesheet.png"	
list_of_skins.push(img_man1);
list_of_skins.push(img_man2);
list_of_skins.push(img_man3);
list_of_skins.push(img_man4);
list_of_skins.push(img_woman1);
list_of_skins.push(img_woman2);
list_of_skins.push(img_woman3);
list_of_skins.push(img_woman4);

var socket;

var my_skin = 0;//"man1";
var my_uName;
var my_room;
var my_id;
var room_users_list=[];

var x_0=0;//canvas.width/2;
var y_0=0;//canvas.height/2;
var x_f=x_0;
var y_f=y_0;

//last stores timestamp from previous frame
var mouse_pos = [0,0];
var dx = 0;
var dy = 0;

var walking = [2,3,4,5,6,7,8,9];
var standing = [0,1];
var moving = 0;
var speed = 100;
var direction = 1;  /* 0:right, 1:down, 2:left, 3:up */
var imgs = {};

function getImage(url) {
	//check if already loaded
	if(imgs[url])
		return imgs[url];


	//if no loaded, load and store
	var img = imgs[url] = new Image();
	img.src = url;
	return img;
}
var background_img = getImage("resources/myphoto.png");

//maps a value from one domain to another
function map_range( value, low1, high1, low2, high2) {
    var range1 = high1 - low1;
    var range2 = high2 - low2;
return low2 + range2 * (value - low1) / range1;
}

function scrollToEnd(){
	var chat = document.getElementById("id_messages_container");
	chat.scrollTop = chat.scrollHeight;
}

function showMessage(msg, type){
	//console.log("New Message");
	//console.log(msg);
	
	/* Create a Container for the new message */
	var mContainer = document.createElement("div");		
	mContainer.classList.add("messageGrid");
	if(type == "send"){	mContainer.classList.add("send");}

	/* Insert Username */
	var mUname = document.createElement("span");
	mUname.classList.add("username");
	mUname.innerText = msg.username;

	mContainer.appendChild(mUname);

	/* Insert Text */
	var mText = document.createElement("p");
	mText.innerText = msg.content;
	mContainer.appendChild(mText);

	/* Insert Date-Time */
	var mTime = document.createElement("span");
	var time_pos = type == "send" ? "time-right" : "time-left"; 
	mTime.classList.add(time_pos);
	
	date = new Date();
	mTime.innerText = date.getHours()+ ":" + date.getMinutes();
	mContainer.appendChild(mTime);	

	/* Append Message Container  to the chat Container */
	document.getElementById("id_messages_container").appendChild(mContainer);
	
	scrollToEnd();	
}

send_button.addEventListener("click",function(e){	
	txt = text_input.value;
	if(txt != ""){		
		var msg = {
			type: "text",
			content: txt,
			username: my_uName,
			id:my_id
		};
		
		var msg_str = JSON.stringify( msg );
		console.log("Senidng message", msg_str);
		
		console.log(socket);
		
		socket.socket.send(msg_str);
		showMessage(msg, "send");
		text_input.value="";
	}
});

function Connection(){
	
	this.socket = new WebSocket("wss://ecv-etic.upf.edu/node/9022/ws/" );	
	
	this.socket.onopen = function(){  
		console.log("Socket has been opened! :)");
		
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
				console.log("entra nuevo usuario");
				room_users_list.push(msg.content);
				break;				
				
			case("update"):
				for(var i = 0; i < room_users_list.length; i++){
					if(room_users_list[i].id==msg.id){
						room_users_list[i].moving = 1;
						room_users_list[i].x_f = msg.x_f;
						room_users_list[i].y_f = msg.y_f;
						room_users_list[i].dx = msg.dx;//room_users_list[i].x_f - room_users_list[i].x_0; 
						room_users_list[i].dy = msg.dy;//room_users_list[i].y_f - room_users_list[i].y_0;						
						room_users_list[i].direction = msg.direction;	
					}
				}
				break;
				
			case("my_id"):
				my_id = msg.content;
				console.log("My ID is: ",my_id);
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
				if(msg.content == 1){
					// accepted
					console.log("Loged In!!");
					document.getElementById("popup-loginMenu").classList.toggle("active");	
					document.getElementById('popup-roomMenu').classList.toggle('active');
				}else{
					//refuserd
					console.log("Loged IN FAILED!!");
				}
				break;
				
		}
			
	}

	this.socket.onerror = function(err){  
		console.log("error: ", err );
	}
	
}

socket = new Connection();

login.addEventListener("click",function(e){
	my_uName = document.querySelector("#username-loginInput").value;
	my_uPassword = document.querySelector("#password-loginInput").value;
	
	if(my_uName != "" && my_uPassword  != ""){
		
		var msg = {
				type:"login",
				username:my_uName,
				password:my_uPassword
		};				
		socket.socket.send(JSON.stringify(msg));
		
	}
	
});

register.addEventListener("click",function(e){
	my_uName = document.querySelector("#username-registerInput").value;
	my_uPassword = document.querySelector("#password-registerInput").value;
	
	if(my_uName != "" && my_uPassword  != ""){
		
		// enviem credencials al server
		var msg = {
				type:"register",
				username:my_uName,
				password:my_uPassword
			};
				
		socket.socket.send(JSON.stringify(msg));
		
	}
		
});

enterRoom.addEventListener("click",function(e){
	my_room = document.querySelector("#room-input").value;
	
	if(my_room != ""){
		
		var msg = {
				type:"room",
				username:my_uName,
				room:my_room
		};				
		socket.socket.send(JSON.stringify(msg));
		document.getElementById("popup-roomMenu").classList.toggle("active");	
		document.getElementById('content').classList.toggle('hidden');
		init()
	}
	
});

var active_box = "login_box";

