var chat = document.querySelector("#chat");
var message_txt= document.querySelector("#sendMessage_txt");
var send_btn = document.querySelector("#sendMessage_btn");
var login_btn= document.querySelector("#login_btn");
var register_btn= document.querySelector("#register_btn");
var enterRoom_btn= document.querySelector("#enterRoom_btn");
var unfoldChat_btn= document.querySelector("#imageChat");
var nextClient_btn= document.querySelector("#imageNext");
var resolve_btn= document.querySelector("#imageResolve");
var close_btn= document.querySelector("#imageClose");

var canvas = document.querySelector("#canvas");
//var ctx = canvas.getContext('2d');

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
	switch(pass){
		case("client"):
			console.log("Loged In as client!!");
			document.getElementById("popup-loginMenu").classList.toggle("active");	
			document.getElementById('popup-roomMenu').classList.toggle('active');

			break;
		case("employee"):
			console.log("Loged In as employee!!");
			document.getElementById("popup-loginMenu").classList.toggle("active");	
			document.getElementById('content').classList.toggle('hidden');
			document.getElementById('imageNext').classList.toggle('hidden');
			document.getElementById('imageResolve').classList.toggle('hidden');
			//document.getElementById('ticketContainer').classList.toggle('hidden');
			document.getElementById('products_dropDown').classList.toggle('hidden');
			document.getElementById('imageApply').classList.toggle('hidden');

			// Generate unique token for p2p call
			myProfile.uniqueToken = Math.random().toString(36).replace('.','');
			//console.log("creating peer");
			createRoom(myProfile.uniqueToken);
			init()
			break;
		 default:
			alert("Wrong username or password!");
			console.log("Loged IN FAILED!! response ",pass);

	}
}

function registerResponse(pass){
	if(pass == 1){
		console.log("Succesfful Register!");
		console.log("Loged In!!");
		document.getElementById("popup-loginMenu").classList.toggle("active");	
		document.getElementById('popup-roomMenu').classList.toggle('active');
	}
	else{
		alert("Username already exists!\nTry a different one.");
		console.log("Register IN FAILED!!");
		//try again
	}
}

function clearChat(){
	let msgs_container = document.getElementById("id_messages_container");
	/*while (msgs_container.firstChild) {
		msgs_container.removeChild(msgs_container.lastChild);
	  }*/
	msgs_container.textContent = '';
}

function changeTitle(employee_username){
	document.getElementById("canvasTitle").innerHTML = "Office";
	document.getElementById("chat_title").innerHTML = employee_username;
		
}

function updateTicket(ticket, type){
	if(type == "set")
		document.getElementById("ticket_txt").innerHTML = "Ticket: "+ticket;
	else if (type == "update")
		document.getElementById("ticket_txt").innerHTML = "Ticket: "+ticket + '/' + myProfile.ticket;
};

send_btn.addEventListener("click",function(e){	
	msg_txt = message_txt.value;
	if(msg_txt != ""){
		sendMessage(msg_txt);
		message_txt.value="";
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
	category = document.querySelector("#category_dropDown").value;
	requestRoom(category);
	document.getElementById("popup-roomMenu").classList.toggle("active");	
	document.getElementById('content').classList.toggle('hidden');

	init()
});

unfoldChat_btn.addEventListener("click",function(e){
	document.getElementById("id_chat_container").classList.toggle("hidden");
});

nextClient_btn.addEventListener("click",function(e){
	console.log("requesting next");
	nextClient('Computers');
});

resolve_btn.addEventListener("click",function(e){
	console.log("resolve");
	resolveClient();
});

close_btn.addEventListener("click",function(e){
	location.reload();
});

function selectSkin(skin){
	if(skin==0){
		document.getElementById("skin1").classList.remove('selected');
		document.getElementById("skin0").classList.add('selected');
	} else if(skin==1){
		document.getElementById("skin0").classList.remove('selected');
		document.getElementById("skin1").classList.add('selected');
	}
	
	myProfile.skin = skin;
}

var active_box = 'login_box';
function displayMenu(box){
	// switch between login & register box
	if(active_box != box){		
		document.getElementById(active_box).classList.toggle('selected');
		document.getElementById(box).classList.toggle('selected');
		active_box = box;
		document.getElementById('usernameLogin_txt').value = '';
		document.getElementById('passwordLogin_txt').value = '';
		document.getElementById('usernameRegister_txt').value = '';
		document.getElementById('passwordRegister_txt').value = '';
	}	
}

function setChatPosition(){
	canvas_y_coord = document.getElementById('canvas').getBoundingClientRect().y;
	canvas_x_coord = document.getElementById('canvas').getBoundingClientRect().x;
	canvas_width = document.getElementById('canvas').getBoundingClientRect().width;

	document.getElementById("imageChat").style.top = canvas_y_coord + 5;
	document.getElementById("imageChat").style.right = canvas_x_coord + 5;
	
	document.getElementById("id_chat_container").style.top = canvas_y_coord + 55;
	document.getElementById("id_chat_container").style.right = canvas_x_coord + 55;

	document.getElementById("imageNext").style.bottom = 10;
	document.getElementById("imageNext").style.right = canvas_x_coord + 10;
	document.getElementById("imageResolve").style.bottom = 55;
	document.getElementById("imageResolve").style.right = canvas_x_coord + 10;
	
	document.getElementById("imageClose").style.top = canvas_y_coord + 5;
	document.getElementById("imageClose").style.left = canvas_x_coord + 5;
	
	ticketContainer_width = document.getElementById('ticketContainer').getBoundingClientRect().width;
	document.getElementById("ticketContainer").style.top = canvas_y_coord;
	document.getElementById("ticketContainer").style.left = canvas_x_coord + canvas_width/2 - ticketContainer_width/2;
	
	document.getElementById("products_dropDown").style.bottom = 10;
	document.getElementById("products_dropDown").style.left = canvas_x_coord + 5;
	document.getElementById("imageApply").style.bottom = 20;
	document.getElementById("imageApply").style.left = canvas_x_coord + 170;

}

function sendProduct(){
	product = document.querySelector("#products_dropDown").value;
	console.log(product);
	let msg = {
		type:"displayProduct",
		content:product
	}
	socket.socket.send(JSON.stringify(msg));
	
	//console.log(node);
	applyProduct(product)
}


function applyProduct(product){
	let node = scene.getNodeById("panel");
	switch(product){
		case("HP 15S"):
			node.texture = products[1];
			break;
		case("MSI GL65"):
			node.texture = products[2];
			break;
		default:
			node.texture = products[0];
			break;
	}
}

function updateNoC(NoC){
	document.getElementById("ticket_txt").innerHTML = "Awaiting: "+NoC;
}


