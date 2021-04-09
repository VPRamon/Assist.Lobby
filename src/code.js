
//setup context
var canvas = document.querySelector("canvas");
var gl = GL.create({canvas: canvas});
var freecam = false;

function setChatPosition(){};

gl.captureMouse();
gl.captureKeys();
gl.onmouse = onMouse;
gl.onkeydown = onKey;


//renderer of the scene
var renderer = new RD.Renderer(gl);

//we need an skeletonm if we plan to do blending
var skeleton = new RD.Skeleton(); //skeleton for blending

//draws the whole frame
function draw()
{
	canvas_coords = document.getElementById('content').clientHeight;
	
	//if(!freecam)
	//	camera.lookAt( camera.position, character.localToGlobal([0,70,0]), [0,1,0] );
	canvas.width = document.getElementById('canvas-container').clientWidth;//window.innerWidth;
	canvas.height = document.getElementById('canvas-container').clientHeight;//window.innerHeight;
	camera.perspective(camera.fov,canvas.width / canvas.height,0.1,1000); //to render in perspective mode
	setChatPosition()

	//clear
	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0,0,0,1 );
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	drawWorld( camera );
}

//draws the world from a camera point of view
function drawWorld( camera )
{
	renderer.render( scene, camera );
}
var i_aux=0;
//CONTROLLER
function update(dt)
{
	var t = getTime() * 0.001;
	
	for(var i = 0; i < room_users_list.length; i++){
		
		if(room_users_list[i].id==myProfile.id){
			i_aux=i;
		}
		else{
			var is_moving = vec3.length(room_users_list[i].fut_pos);
			var anim1 = room_users_list[i].animations[ characters_list[i].anim_name ];
			if(anim1 && anim1.duration)
			{
				anim1.assignTime( t, true );
				characters_list[i].assignSkeleton( anim1.skeleton );
				characters_list[i].shader = "texture_skinning";
				characters_list[i].skeleton = anim1.skeleton; //this could be useful
			}
			//move de cada character
			if(is_moving && room_users_list[i].id!=myProfile.id ){			
				characters_list[i].moveLocal( room_users_list[i].fut_pos );
				characters_list[i].anim_name = "walking";
				characters_list[i].dance = false;
				characters_list[i].position = walk_area.adjustPosition( characters_list[i].position );
				characters_list[i].position=room_users_list[i].pos;				
			}
			else if(room_users_list[i].id!=myProfile.id && is_moving==false){
				characters_list[i].anim_name = characters_list[i].dance ? "dancing" : "idle";
			}
			
			//rotation de cada character
			if(room_users_list[i].fut_rot!=0){
				characters_list[i].rotation=room_users_list[i].fut_rot_aux;
				room_users_list[i].rot=room_users_list[i].fut_rot_aux;
				room_users_list[i].fut_rot=0;
				
			}			
			
		}	
			
	}
	if(characters_list.length>0){
		var anim = room_users_list[i_aux].animations[ characters_list[i_aux].anim_name ];
		if(anim && anim.duration)
		{
			anim.assignTime( t, true );
			characters_list[i_aux].assignSkeleton( anim.skeleton );
			characters_list[i_aux].shader = "texture_skinning";
			characters_list[i_aux].skeleton = anim.skeleton; //this could be useful
		}

		userMovement( characters_list[i_aux], dt );

	}
}

function userMovement( character, dt )
{
	
	var delta = [0,0,0];
	if( gl.keys["W"] )
		delta[2] = 1;
	else if( gl.keys["S"] )
		delta[2] = -1;
	var delta_aux=delta;
	vec3.scale( delta, delta, dt );
	var is_moving = vec3.length(delta);
	if(is_moving) //if moving
	{
		character.moveLocal( delta );
		character.anim_name = "walking";
		character.dance = false;
	}
	else
		character.anim_name = "idle";
	
	var rotacion=false;
	var angle=0;
	if( gl.keys["A"] ){
		character.rotate(dt*1.5,[0,1,0]);
		angle=dt*1.5;
		rotacion=true;
		
	}
	else if( gl.keys["D"] ){
		character.rotate(dt*-1.5,[0,1,0]);
		angle=dt*-1.5;
		rotacion=true;
	}
		
	character.position = walk_area.adjustPosition( character.position );
	if(is_moving){
		var msg = {
			type: "move",
			id:myProfile.id ,
			pos:character.position,
			fut_pos:delta,
			dt:dt
		};

		socket.socket.send(JSON.stringify( msg ));
	}else{
			var msg = {
			type: "move",
			id:myProfile.id ,
			pos:character.position,
			fut_pos:[0,0,0],
			dt:dt
		};

		socket.socket.send(JSON.stringify( msg ));
	}
	if(rotacion){
		var msg = {
			type: "rotation",
			id:myProfile.id ,
			angle:character.rotation,
			fut_rot:angle,
			dt:dt
		};

		socket.socket.send(JSON.stringify( msg ));
	}
	
	
}

function onMouse(e)
{
	//console.log(e);

}

function onKey(e)
{
	
}


//last stores timestamp from previous frame
var last = performance.now();

function loop()
{
   draw();


   //to compute seconds since last loop
   var now = performance.now();
   //compute difference and convert to seconds
   var elapsed_time = (now - last) / 1000; 
   //store current time into last time
   last = now;

   //now we can execute our update method
   update( elapsed_time );

   //request to call loop() again before next frame
   requestAnimationFrame( loop );
}


function init()
{
	//start loop
	loop();
	setChatPosition();
}
