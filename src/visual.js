var chat = document.querySelector("#chat");
var message_txt= document.querySelector("#sendMessage_txt");
var send_btn = document.querySelector("#sendMessage_btn");
var login_btn= document.querySelector("#login_btn");
var register_btn= document.querySelector("#register_btn");
var enterRoom_btn= document.querySelector("#enterRoom_btn");


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

function loginResponse(pass){
	if(pass == 1){
		console.log("Loged In!!");
		document.getElementById("popup-loginMenu").classList.toggle("active");	
		document.getElementById('popup-roomMenu').classList.toggle('active');
	}
	else{
		console.log("Loged IN FAILED!!");
		//try again
	}
}

send_btn.addEventListener("click",function(e){	
	msg_txt = message_txt.value;
	if(msg_txt != ""){
		sendMessage(msg_txt);
		text_input.value="";
	}
});

login_btn.addEventListener("click",function(e){
	my_uName = document.querySelector("#usernameLogin_txt").value;
	my_uPassword = document.querySelector("#passwordLogin_txt").value;
	
	if(my_uName != "" && my_uPassword  != ""){
		console.log("login try");
		loginUser(my_uName, my_uPassword);
	}
	document.querySelector("#passwordLogin_txt").value = "";
		
});

register_btn.addEventListener("click",function(e){
	my_uName = document.querySelector("#usernameRegister_txt").value;
	my_uPassword = document.querySelector("#passwordRegister_txt").value;
	if(my_uName != "" && my_uPassword  != ""){
		registerUser(my_uName, my_uPassword);
		// enviem credencials al server
	}
	document.querySelector("#passwordRegister_txt").value = "";
});

enterRoom_btn.addEventListener("click",function(e){
	room = document.getElementById("#room_txt").value;		
	if(room != ""){
		requestRoom(room);
		document.getElementById("popup-roomMenu").classList.toggle("active");	
		document.getElementById('content').classList.toggle('hidden');
		init()
	}
	
});

var active_box = "login_box";
function displayMenu(box){
	// switch between login & register box
	if(active_box != box){		
		document.getElementById(active_box).classList.toggle('selected');
		document.getElementById(box).classList.toggle('selected');
		active_box = box;
	}	
}
